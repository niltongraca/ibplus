import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { logAction } from "@/lib/audit";
import { requireDelete, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { ticketUpdateSchema } from "@/lib/validations/events";

async function getScopedTicket(eventId: string, ticketId: string, companyId: string) {
  return prisma.eventTicket.findFirst({
    where: { id: ticketId, eventId, event: { companyId } },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  try {
    const { id, ticketId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });

    const ticket = await prisma.eventTicket.findFirst({
      where: { id: ticketId, eventId: id, event: { companyId: user.companyId } },
      include: {
        ticketType: { select: { name: true, kind: true } },
        event: {
          select: {
            id: true,
            title: true,
            venue: true,
            address: true,
            startDate: true,
            endDate: true,
            coverImage: true,
          },
        },
      },
    });
    if (!ticket) return NextResponse.json({ error: "Bilhete não encontrado." }, { status: 404 });

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        code: ticket.code,
        holderName: ticket.holderName,
        holderEmail: ticket.holderEmail,
        holderPhone: ticket.holderPhone,
        price: toNumber(ticket.price),
        status: ticket.status,
        checkedIn: ticket.checkedIn,
        checkedInAt: ticket.checkedInAt,
        issuedAt: ticket.issuedAt,
        notes: ticket.notes,
        ticketTypeName: ticket.ticketType?.name ?? null,
        ticketTypeKind: ticket.ticketType?.kind ?? null,
        event: ticket.event,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao obter bilhete." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  try {
    const { id, ticketId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireWrite(user, "eventos");
    if (denied) return denied;

    const existing = await getScopedTicket(id, ticketId, user.companyId);
    if (!existing) return NextResponse.json({ error: "Bilhete não encontrado." }, { status: 404 });

    const parsed = await parseBody(request, ticketUpdateSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    // Deriva checkedIn/checkedInAt/status de forma consistente.
    let status = existing.status;
    let checkedIn = existing.checkedIn;
    let checkedInAt: Date | null = existing.checkedInAt;

    if (data.status !== undefined) {
      status = data.status;
      if (status === "USADO") {
        checkedIn = true;
        checkedInAt = existing.checkedInAt ?? new Date();
      } else {
        checkedIn = false;
        checkedInAt = null;
      }
    }
    if (data.checkedIn !== undefined) {
      checkedIn = data.checkedIn;
      if (checkedIn) {
        status = "USADO";
        checkedInAt = existing.checkedInAt ?? new Date();
      } else {
        checkedInAt = null;
        if (status === "USADO") status = "VALIDO";
      }
    }

    const ticket = await prisma.eventTicket.update({
      where: { id: ticketId },
      data: {
        ...(data.holderName !== undefined ? { holderName: data.holderName ?? null } : {}),
        ...(data.holderEmail !== undefined ? { holderEmail: data.holderEmail ?? null } : {}),
        ...(data.holderPhone !== undefined ? { holderPhone: data.holderPhone ?? null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
        status,
        checkedIn,
        checkedInAt,
      },
    });

    await logAction("update", "event_ticket", ticket.id, `Bilhete ${ticket.code} atualizado`, user);

    return NextResponse.json({ ticket: { ...ticket, price: toNumber(ticket.price) } });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar bilhete." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  try {
    const { id, ticketId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireDelete(user, "eventos");
    if (denied) return denied;

    const existing = await getScopedTicket(id, ticketId, user.companyId);
    if (!existing) return NextResponse.json({ error: "Bilhete não encontrado." }, { status: 404 });

    await prisma.eventTicket.delete({ where: { id: ticketId } });
    await logAction("delete", "event_ticket", ticketId, `Bilhete ${existing.code} eliminado`, user);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar bilhete." }, { status: 500 });
  }
}
