import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { registrationDecisionSchema } from "@/lib/validations/events";
import { generateTicketCode } from "@/lib/events";
import {
  deleteRegistrationProof,
  getReservedByTicketType,
  remainingTickets,
} from "@/lib/eventRegistrations";
import { toNumber } from "@/lib/money";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  eventRegistrationApprovedEmail,
  eventRegistrationRejectedEmail,
  sendEmail,
  type EventRegistrationMailData,
} from "@/lib/email";

class DecisionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const ACTION_LABELS = {
  APROVAR: "aprovada",
  REJEITAR: "rejeitada",
  CANCELAR: "cancelada",
} as const;

/** Ações da decisão → estados persistidos em EventRegistration.status. */
const ACTION_STATUS = {
  APROVAR: "PAGA",
  REJEITAR: "REJEITADA",
  CANCELAR: "CANCELADA",
} as const;

/** Validação manual do comprovativo; na aprovação, emite os bilhetes. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    const { id, registrationId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireWrite(user, "eventos");
    if (denied) return denied;

    const event = await prisma.event.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true, title: true, startDate: true },
    });
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const parsed = await parseBody(request, registrationDecisionSchema);
    if ("error" in parsed) return parsed.error;
    const { action, reason } = parsed.data;

    const registration = await prisma.eventRegistration.findFirst({
      where: { id: registrationId, eventId: event.id },
      include: { items: { include: { ticketType: { select: { name: true } } } } },
    });
    if (!registration) {
      return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
    }
    if (registration.status !== "PENDENTE") {
      return NextResponse.json(
        { error: "Esta inscrição já foi analisada." },
        { status: 409 }
      );
    }

    const now = new Date();
    let ticketsCreated = 0;

    try {
      await prisma.$transaction(
        async (tx) => {
          if (action === "APROVAR") {
            const typeIds = registration.items.map((item) => item.ticketTypeId);
            const [types, reserved] = await Promise.all([
              tx.eventTicketType.findMany({
                where: { id: { in: typeIds }, eventId: event.id, active: true },
              }),
              // A reserva desta inscrição sai da contagem: é substituída pelos
              // bilhetes que estamos a emitir.
              getReservedByTicketType(event.id, typeIds, {
                client: tx,
                excludeRegistrationId: registration.id,
              }),
            ]);
            if (types.length !== typeIds.length) {
              throw new DecisionError(
                "Um dos tipos de bilhete deixou de estar disponível.",
                409
              );
            }

            for (const item of registration.items) {
              const type = types.find((t) => t.id === item.ticketTypeId)!;
              const left = remainingTickets(type.quantity, reserved.get(type.id) ?? 0);
              if (left !== null && item.quantity > left) {
                throw new DecisionError(
                  `Já não há ${left} bilhete(s) disponíveis de "${type.name}".`,
                  409
                );
              }
            }

            const total = registration.items.reduce((sum, item) => sum + item.quantity, 0);
            const codes = new Set<string>();
            while (codes.size < total) codes.add(generateTicketCode());
            const queue = [...codes];

            const ticketData = registration.items.flatMap((item) =>
              Array.from({ length: item.quantity }, () => ({
                eventId: event.id,
                ticketTypeId: item.ticketTypeId,
                registrationId: registration.id,
                code: queue.shift()!,
                holderName: registration.holderName,
                holderEmail: registration.holderEmail,
                holderPhone: registration.holderPhone,
                price: item.unitPrice,
                notes: registration.notes,
              }))
            );

            const created = await tx.eventTicket.createManyAndReturn({ data: ticketData });
            ticketsCreated = created.length;
          }

          await tx.eventRegistration.update({
            where: { id: registration.id },
            data: {
              status: ACTION_STATUS[action],
              rejectionReason: action === "REJEITAR" ? reason!.trim() : null,
              reviewedAt: now,
              reviewedBy: user.id,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      if (err instanceof DecisionError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    if (action === "REJEITAR") {
      await deleteRegistrationProof(registration.proofUrl);
    }

    const mailData: EventRegistrationMailData = {
      name: registration.holderName,
      eventTitle: event.title,
      eventDate: formatDateTime(event.startDate),
      reference: registration.paymentRef,
      amount: formatCurrency(toNumber(registration.amount)),
      tickets: registration.items
        .map((item) => `${item.quantity} × ${item.ticketType.name}`)
        .join(", "),
    };
    const mail =
      action === "APROVAR"
        ? eventRegistrationApprovedEmail(mailData)
        : eventRegistrationRejectedEmail(mailData, reason);
    void sendEmail(registration.holderEmail, mail.subject, mail.html);

    await logAction(
      action === "APROVAR" ? "approve" : action === "REJEITAR" ? "reject" : "cancel",
      "event_registration",
      registration.id,
      `Inscrição ${registration.code} ${ACTION_LABELS[action]} — ${event.title}`,
      user
    );

    return NextResponse.json({
      registration: {
        id: registration.id,
        code: registration.code,
        status: ACTION_STATUS[action],
        reviewedAt: now,
        ticketsCreated,
      },
    });
  } catch (err) {
    console.error("[event-registration] erro na decisão:", err);
    return NextResponse.json({ error: "Erro ao analisar a inscrição." }, { status: 500 });
  }
}
