import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { logAction } from "@/lib/audit";
import { requireDelete, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { ticketTypeUpdateSchema } from "@/lib/validations/events";

async function getScopedTicketType(eventId: string, typeId: string, companyId: string) {
  return prisma.eventTicketType.findFirst({
    where: { id: typeId, eventId, event: { companyId } },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { id, typeId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireWrite(user, "eventos");
    if (denied) return denied;

    const existing = await getScopedTicketType(id, typeId, user.companyId);
    if (!existing) return NextResponse.json({ error: "Tipo de bilhete não encontrado." }, { status: 404 });

    const parsed = await parseBody(request, ticketTypeUpdateSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    const ticketType = await prisma.eventTicketType.update({
      where: { id: typeId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.kind !== undefined ? { kind: data.kind } : {}),
        ...(data.description !== undefined ? { description: data.description ?? null } : {}),
        ...(data.price !== undefined ? { price: data.price } : {}),
        ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
    });

    await logAction(
      "update",
      "event_ticket_type",
      ticketType.id,
      `Tipo de bilhete "${ticketType.name}" atualizado`,
      user
    );

    return NextResponse.json({ ticketType: { ...ticketType, price: toNumber(ticketType.price) } });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar tipo de bilhete." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { id, typeId } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireDelete(user, "eventos");
    if (denied) return denied;

    const existing = await getScopedTicketType(id, typeId, user.companyId);
    if (!existing) return NextResponse.json({ error: "Tipo de bilhete não encontrado." }, { status: 404 });

    const issued = await prisma.eventTicket.count({ where: { ticketTypeId: typeId } });
    if (issued > 0) {
      return NextResponse.json(
        { error: `Não é possível eliminar: existem ${issued} bilhete(s) emitido(s) deste tipo.` },
        { status: 409 }
      );
    }

    await prisma.eventTicketType.delete({ where: { id: typeId } });
    await logAction(
      "delete",
      "event_ticket_type",
      typeId,
      `Tipo de bilhete "${existing.name}" eliminado`,
      user
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar tipo de bilhete." }, { status: 500 });
  }
}
