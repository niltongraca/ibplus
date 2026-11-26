import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { validateSchema } from "@/lib/validations/helpers";
import { publicRegistrationSchema } from "@/lib/validations/events";
import { generateRegistrationCode, registrationPaymentReference } from "@/lib/events";
import {
  deleteRegistrationProof,
  getReservedByTicketType,
  remainingTickets,
  storeRegistrationProof,
} from "@/lib/eventRegistrations";
import { isPdfBuffer, resolveProofUpload } from "@/lib/upload";
import { toNumber } from "@/lib/money";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  eventRegistrationOrganizerNotice,
  eventRegistrationSubmittedEmail,
  sendEmail,
  type EventRegistrationMailData,
} from "@/lib/email";

export const dynamic = "force-dynamic";

class RegistrationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function hasFile(value: FormDataEntryValue | null): value is File {
  return Boolean(value && typeof value === "object" && "arrayBuffer" in value);
}

/** Submissão pública: sem sessão, protegida por token opaco + rate limit. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(request);
  const limit = await checkRateLimit(`event-registration:${ip}`, "strict");
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter!);

  // Defesa contra submissões cross-site (não há cookie/sessão neste fluxo).
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
    }
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "Formato de submissão inválido." }, { status: 415 });
  }

  const { token } = await params;
  if (!token || token.length < 16 || token.length > 200) {
    return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { registrationToken: token },
      select: {
        id: true,
        title: true,
        startDate: true,
        published: true,
        status: true,
        company: { select: { email: true } },
      },
    });
    if (!event || !event.published || event.status !== "PUBLICADO") {
      return NextResponse.json({ error: "Este link não está disponível." }, { status: 404 });
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json({ error: "Formato de submissão inválido." }, { status: 400 });
    }

    let rawItems: unknown;
    try {
      rawItems = JSON.parse(String(form.get("items") ?? "[]"));
    } catch {
      return NextResponse.json({ error: "Bilhetes inválidos." }, { status: 400 });
    }

    const parsed = validateSchema(publicRegistrationSchema, {
      // O participante vê esta referência antes de pagar; o servidor aceita o
      // formato gerado no browser e usa-o na transferência e nos emails.
      reference: form.get("reference") || undefined,
      holderName: form.get("holderName"),
      holderEmail: form.get("holderEmail"),
      holderPhone: form.get("holderPhone"),
      consent: form.get("consent") === "true" || form.get("consent") === "on",
      items: rawItems,
      notes: form.get("notes") || null,
    });
    if ("error" in parsed) return parsed.error;

    const proofFile = form.get("proof");
    if (!hasFile(proofFile)) {
      return NextResponse.json({ error: "Envie o comprovativo de pagamento." }, { status: 400 });
    }
    const resolved = resolveProofUpload({
      name: proofFile.name,
      size: proofFile.size,
      type: proofFile.type,
    });
    if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 });

    const buffer = Buffer.from(await proofFile.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json({ error: "O comprovativo está vazio." }, { status: 400 });
    }
    if (resolved.ext === ".pdf" && !isPdfBuffer(buffer)) {
      return NextResponse.json({ error: "O PDF do comprovativo é inválido." }, { status: 400 });
    }

    const stored = await storeRegistrationProof(buffer, proofFile.name, resolved.mime);
    let registration: {
      id: string;
      code: string;
      paymentRef: string;
      amount: Prisma.Decimal;
      createdAt: Date;
      items: Array<{ quantity: number; ticketType: { name: string } }>;
    };

    try {
      registration = await prisma.$transaction(
        async (tx) => {
          const typeIds = [...new Set(parsed.data.items.map((i) => i.ticketTypeId))];
          const types = await tx.eventTicketType.findMany({
            where: { id: { in: typeIds }, eventId: event.id, active: true },
          });
          if (types.length !== typeIds.length) {
            throw new RegistrationError("Um dos tipos de bilhete não está disponível.", 409);
          }

          // Recontagem dentro da transação serializável: duas submissões
          // concorrentes não podem reservar o mesmo último bilhete.
          const reserved = await getReservedByTicketType(event.id, typeIds, { client: tx });
          for (const item of parsed.data.items) {
            const type = types.find((t) => t.id === item.ticketTypeId)!;
            const left = remainingTickets(type.quantity, reserved.get(type.id) ?? 0);
            if (left !== null && item.quantity > left) {
              throw new RegistrationError(
                `Já não há ${left} bilhete(s) disponíveis de "${type.name}".`,
                409
              );
            }
          }

          const amount = parsed.data.items.reduce((sum, item) => {
            const type = types.find((t) => t.id === item.ticketTypeId)!;
            return sum + toNumber(type.price) * item.quantity;
          }, 0);
          const code = generateRegistrationCode();

          const created = await tx.eventRegistration.create({
            data: {
              eventId: event.id,
              code,
              holderName: parsed.data.holderName,
              holderEmail: parsed.data.holderEmail,
              holderPhone: parsed.data.holderPhone,
              consent: true,
              amount,
              paymentRef: parsed.data.reference ?? registrationPaymentReference(code),
              proofUrl: stored.url,
              proofMime: resolved.mime,
              proofName: proofFile.name.slice(0, 200),
              notes: parsed.data.notes ?? null,
              items: {
                create: parsed.data.items.map((item) => {
                  const type = types.find((t) => t.id === item.ticketTypeId)!;
                  const unitPrice = toNumber(type.price);
                  return {
                    ticketTypeId: type.id,
                    quantity: item.quantity,
                    unitPrice,
                    subtotal: unitPrice * item.quantity,
                  };
                }),
              },
            },
            select: {
              id: true,
              code: true,
              paymentRef: true,
              amount: true,
              createdAt: true,
              items: { select: { quantity: true, ticketType: { select: { name: true } } } },
            },
          });
          return created;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (err) {
      await deleteRegistrationProof(stored.url);
      if (err instanceof RegistrationError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      throw err;
    }

    const mailData: EventRegistrationMailData = {
      name: parsed.data.holderName,
      eventTitle: event.title,
      eventDate: formatDateTime(event.startDate),
      reference: registration.paymentRef,
      amount: formatCurrency(toNumber(registration.amount)),
      tickets: registration.items
        .map((item) => `${item.quantity} × ${item.ticketType.name}`)
        .join(", "),
    };

    // Não bloqueiam a resposta: falha de SMTP nunca invalida uma inscrição.
    void Promise.allSettled([
      sendEmail(
        parsed.data.holderEmail,
        eventRegistrationSubmittedEmail(mailData).subject,
        eventRegistrationSubmittedEmail(mailData).html
      ),
      event.company.email
        ? sendEmail(
            event.company.email,
            eventRegistrationOrganizerNotice(
              mailData,
              `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/eventos/${event.id}`
            ).subject,
            eventRegistrationOrganizerNotice(
              mailData,
              `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/eventos/${event.id}`
            ).html
          )
        : Promise.resolve(),
    ]);

    return NextResponse.json(
      {
        registration: {
          id: registration.id,
          code: registration.code,
          reference: registration.paymentRef,
          amount: toNumber(registration.amount),
          status: "PENDENTE",
          createdAt: registration.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[event-registration] erro ao submeter:", err);
    return NextResponse.json({ error: "Erro ao submeter a inscrição." }, { status: 500 });
  }
}
