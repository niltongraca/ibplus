import { Prisma } from "@prisma/client";
import { del, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { buildInlineDataUrl } from "@/lib/upload";

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

type DbClient = typeof prisma | Prisma.TransactionClient;

interface ReservedOptions {
  /** Cliente de transação, para que a recontagem e a escrita vejam o mesmo snapshot. */
  client?: DbClient;
  /** Inscrição que está a ser aprovada: a sua reserva é substituída pelos bilhetes emitidos. */
  excludeRegistrationId?: string;
}

/**
 * Bilhetes já emitidos + bilhetes reservados por inscrições pendentes, por tipo.
 * Usado tanto na página pública (stock disponível) como na submissão (para
 * impedir overbooking antes da aprovação).
 */
export async function getReservedByTicketType(
  eventId: string,
  ticketTypeIds: string[],
  options: ReservedOptions = {}
): Promise<Map<string, number>> {
  const reserved = new Map<string, number>();
  if (!ticketTypeIds.length) return reserved;

  const db = options.client ?? prisma;
  const [tickets, pending] = await Promise.all([
    db.eventTicket.groupBy({
      by: ["ticketTypeId"],
      where: {
        eventId,
        ticketTypeId: { in: ticketTypeIds },
        status: { not: "CANCELADO" },
      },
      _count: { _all: true },
    }),
    db.eventRegistrationItem.groupBy({
      by: ["ticketTypeId"],
      where: {
        ticketTypeId: { in: ticketTypeIds },
        registration: {
          eventId,
          status: "PENDENTE",
          ...(options.excludeRegistrationId
            ? { id: { not: options.excludeRegistrationId } }
            : {}),
        },
      },
      _sum: { quantity: true },
    }),
  ]);

  for (const row of tickets) {
    if (row.ticketTypeId) reserved.set(row.ticketTypeId, (reserved.get(row.ticketTypeId) ?? 0) + row._count._all);
  }
  for (const row of pending) {
    reserved.set(row.ticketTypeId, (reserved.get(row.ticketTypeId) ?? 0) + (row._sum.quantity ?? 0));
  }
  return reserved;
}

/** Quantidade restante; `null` quando o tipo é ilimitado (quantity = 0). */
export function remainingTickets(quantity: number, reserved: number): number | null {
  if (quantity <= 0) return null;
  return Math.max(0, quantity - reserved);
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "").replace(/\.{2,}/g, ".") || "comprovativo";
}

/** Guarda o comprovativo no Blob (quando configurado) ou como data-URL legada. */
export async function storeRegistrationProof(
  buffer: Buffer,
  fileName: string,
  mime: string
): Promise<{ url: string; storage: "blob" | "inline" }> {
  if (BLOB_TOKEN) {
    try {
      const blob = await put(
        `event-proofs/${Date.now()}-${sanitizeFileName(fileName)}`,
        buffer,
        {
          // Comprovativos são dados pessoais: nunca devem ser servidos por URL pública.
          access: "private",
          contentType: mime,
          token: BLOB_TOKEN,
          addRandomSuffix: true,
        }
      );
      return { url: blob.url, storage: "blob" };
    } catch (err) {
      console.error("[event-registration] falha no Blob, a usar data-URL:", err);
    }
  }
  return { url: buildInlineDataUrl(mime, buffer), storage: "inline" };
}

/** Elimina o comprovativo do Blob ao rejeitar/cancelar (melhor esforço). */
export async function deleteRegistrationProof(url: string): Promise<void> {
  if (!BLOB_TOKEN || !/^https:\/\//i.test(url)) return;
  try {
    await del(url, { token: BLOB_TOKEN });
  } catch (err) {
    console.error("[event-registration] falha ao eliminar comprovativo:", err);
  }
}
