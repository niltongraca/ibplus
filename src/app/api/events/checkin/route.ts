import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { logAction } from "@/lib/audit";
import { requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { checkinSchema } from "@/lib/validations/events";

/**
 * POST /api/events/checkin — valida e marca um bilhete como usado pelo código.
 * O operador pode validar sem conhecer o evento; o código é único globalmente e
 * a verificação de empresa impede acesso cruzado entre organizações.
 */
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireWrite(user, "eventos");
    if (denied) return denied;

    const parsed = await parseBody(request, checkinSchema);
    if ("error" in parsed) return parsed.error;
    const code = parsed.data.code.toUpperCase();

    const ticket = await prisma.eventTicket.findFirst({
      where: { code, event: { companyId: user.companyId } },
      include: {
        ticketType: { select: { name: true } },
        event: { select: { id: true, title: true, venue: true, startDate: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Bilhete não encontrado." }, { status: 404 });
    }
    if (ticket.status === "CANCELADO") {
      return NextResponse.json({ error: "Bilhete cancelado — entrada não permitida." }, { status: 409 });
    }
    if (ticket.checkedIn) {
      return NextResponse.json(
        {
          error: "Bilhete já utilizado.",
          alreadyCheckedIn: true,
          ticket: {
            code: ticket.code,
            holderName: ticket.holderName,
            ticketTypeName: ticket.ticketType?.name ?? null,
            checkedInAt: ticket.checkedInAt,
            event: ticket.event,
          },
        },
        { status: 409 }
      );
    }

    const updated = await prisma.eventTicket.update({
      where: { id: ticket.id },
      data: { checkedIn: true, checkedInAt: new Date(), status: "USADO" },
    });

    await logAction(
      "checkin",
      "event_ticket",
      updated.id,
      `Check-in do bilhete ${updated.code} (${ticket.event.title})`,
      user
    );

    return NextResponse.json({
      success: true,
      ticket: {
        id: updated.id,
        code: updated.code,
        holderName: updated.holderName,
        price: toNumber(updated.price),
        ticketTypeName: ticket.ticketType?.name ?? null,
        checkedInAt: updated.checkedInAt,
        event: ticket.event,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao validar bilhete." }, { status: 500 });
  }
}
