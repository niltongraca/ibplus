import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { logAction } from "@/lib/audit";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { ticketTypeCreateSchema } from "@/lib/validations/events";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireFeature(user, "eventos");
    if (denied) return denied;

    const event = await prisma.event.findFirst({ where: { id, companyId: user.companyId } });
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const ticketTypes = await prisma.eventTicketType.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { tickets: true } } },
    });

    return NextResponse.json({
      ticketTypes: ticketTypes.map((t) => ({
        id: t.id,
        name: t.name,
        kind: t.kind,
        description: t.description,
        price: toNumber(t.price),
        quantity: t.quantity,
        active: t.active,
        ticketsIssued: t._count.tickets,
        createdAt: t.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao listar tipos de bilhete." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireWrite(user, "eventos");
    if (denied) return denied;

    const event = await prisma.event.findFirst({ where: { id, companyId: user.companyId } });
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const parsed = await parseBody(request, ticketTypeCreateSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    const ticketType = await prisma.eventTicketType.create({
      data: {
        eventId: id,
        name: data.name,
        kind: data.kind ?? "INGRESSO",
        description: data.description ?? null,
        price: data.price ?? 0,
        quantity: data.quantity ?? 0,
        active: data.active ?? true,
      },
    });

    await logAction(
      "create",
      "event_ticket_type",
      ticketType.id,
      `Tipo de bilhete "${ticketType.name}" criado no evento "${event.title}"`,
      user
    );

    return NextResponse.json(
      { ticketType: { ...ticketType, price: toNumber(ticketType.price) } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Erro ao criar tipo de bilhete." }, { status: 500 });
  }
}
