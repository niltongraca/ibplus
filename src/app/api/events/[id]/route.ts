import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { toNumber } from "@/lib/money";
import { logAction } from "@/lib/audit";
import { requireDelete, requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { eventUpdateSchema } from "@/lib/validations/events";
import { parseEventDateTime } from "@/lib/events";

async function getCompanyEvent(id: string, companyId: string) {
  return prisma.event.findFirst({ where: { id, companyId } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireFeature(user, "eventos");
    if (denied) return denied;

    const event = await prisma.event.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        ticketTypes: {
          orderBy: { createdAt: "asc" },
          include: { _count: { select: { tickets: true } } },
        },
      },
    });
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const [ticketsIssued, ticketsCheckedIn, ticketsCancelled, revenueAgg] = await Promise.all([
      prisma.eventTicket.count({ where: { eventId: id } }),
      prisma.eventTicket.count({ where: { eventId: id, checkedIn: true } }),
      prisma.eventTicket.count({ where: { eventId: id, status: "CANCELADO" } }),
      prisma.eventTicket.aggregate({ where: { eventId: id }, _sum: { price: true } }),
    ]);

    const ticketTypes = event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      kind: t.kind,
      description: t.description,
      price: toNumber(t.price),
      quantity: t.quantity,
      active: t.active,
      ticketsIssued: t._count.tickets,
      createdAt: t.createdAt,
    }));

    const typesPlanned = ticketTypes.reduce((sum, t) => sum + t.quantity, 0);
    const revenuePotential = ticketTypes.reduce((sum, t) => sum + t.price * t.quantity, 0);
    const revenueIssued = toNumber(revenueAgg._sum.price);
    const costLocal = toNumber(event.localPurchaseValue);

    return NextResponse.json({
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.category,
        venue: event.venue,
        address: event.address,
        province: event.province,
        municipality: event.municipality,
        startDate: event.startDate,
        endDate: event.endDate,
        coverImage: event.coverImage,
        localPurchaseValue: costLocal,
        totalTickets: event.totalTickets,
        status: event.status,
        published: event.published,
        notes: event.notes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        ticketTypes,
        stats: {
          totalPlanned: event.totalTickets,
          typesPlanned,
          ticketsIssued,
          ticketsCheckedIn,
          ticketsCancelled,
          ticketsValid: Math.max(0, ticketsIssued - ticketsCancelled),
          revenuePotential,
          revenueIssued,
          costLocal,
          marginPotential: revenuePotential - costLocal,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Erro ao obter evento." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireWrite(user, "eventos");
    if (denied) return denied;

    const existing = await getCompanyEvent(id, user.companyId);
    if (!existing) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const parsed = await parseBody(request, eventUpdateSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    let startDate: Date | undefined;
    if (data.startDate !== undefined) {
      const parsedStart = parseEventDateTime(data.startDate);
      if (!parsedStart) return NextResponse.json({ error: "Data de início inválida." }, { status: 400 });
      startDate = parsedStart;
    }

    let endDate: Date | null | undefined;
    if (data.endDate !== undefined) {
      if (!data.endDate) {
        endDate = null;
      } else {
        const parsedEnd = parseEventDateTime(data.endDate);
        if (!parsedEnd) return NextResponse.json({ error: "Data de fim inválida." }, { status: 400 });
        endDate = parsedEnd;
      }
    }

    const finalStart = startDate ?? existing.startDate;
    const finalEnd = endDate !== undefined ? endDate : existing.endDate;
    if (finalEnd && finalEnd < finalStart) {
      return NextResponse.json(
        { error: "A data de fim não pode ser anterior à data de início." },
        { status: 400 }
      );
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description ?? null } : {}),
        ...(data.category !== undefined ? { category: data.category ?? null } : {}),
        ...(data.venue !== undefined ? { venue: data.venue ?? null } : {}),
        ...(data.address !== undefined ? { address: data.address ?? null } : {}),
        ...(data.province !== undefined ? { province: data.province ?? null } : {}),
        ...(data.municipality !== undefined ? { municipality: data.municipality ?? null } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
        ...(data.coverImage !== undefined ? { coverImage: data.coverImage ?? null } : {}),
        ...(data.localPurchaseValue !== undefined ? { localPurchaseValue: data.localPurchaseValue } : {}),
        ...(data.totalTickets !== undefined ? { totalTickets: data.totalTickets } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.published !== undefined ? { published: data.published } : {}),
        ...(data.notes !== undefined ? { notes: data.notes ?? null } : {}),
      },
    });

    await logAction("update", "event", event.id, `Evento "${event.title}" atualizado`, user);

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar evento." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireDelete(user, "eventos");
    if (denied) return denied;

    const existing = await getCompanyEvent(id, user.companyId);
    if (!existing) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    await prisma.event.delete({ where: { id } });
    await logAction("delete", "event", id, `Evento "${existing.title}" eliminado`, user);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar evento." }, { status: 500 });
  }
}
