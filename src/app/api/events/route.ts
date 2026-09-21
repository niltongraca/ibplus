import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { buildSearch, parseBool, parsePagination } from "@/lib/utils";
import { toNumber } from "@/lib/money";
import { logAction } from "@/lib/audit";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { eventCreateSchema } from "@/lib/validations/events";
import { parseEventDateTime } from "@/lib/events";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireFeature(user, "eventos");
    if (denied) return denied;

    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url.searchParams);
    const all = url.searchParams.get("all") === "true";
    const search = buildSearch(["title", "venue", "address"], url.searchParams.get("search"));
    const status = url.searchParams.get("status");
    const upcoming = parseBool(url.searchParams.get("upcoming"));

    const where = {
      companyId: user.companyId,
      ...(search ?? {}),
      ...(status ? { status } : {}),
      ...(upcoming ? { startDate: { gte: new Date() } } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startDate: "desc" },
        include: {
          ticketTypes: { select: { price: true, quantity: true } },
          _count: { select: { tickets: true, ticketTypes: true } },
        },
        ...(all ? {} : { skip, take: limit }),
      }),
      prisma.event.count({ where }),
    ]);

    const ids = events.map((e) => e.id);
    const checked = ids.length
      ? await prisma.eventTicket.groupBy({
          by: ["eventId"],
          where: { eventId: { in: ids }, checkedIn: true },
          _count: { _all: true },
        })
      : [];
    const checkedMap = new Map(checked.map((c) => [c.eventId, c._count._all]));

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        venue: e.venue,
        startDate: e.startDate,
        endDate: e.endDate,
        status: e.status,
        published: e.published,
        coverImage: e.coverImage,
        localPurchaseValue: toNumber(e.localPurchaseValue),
        totalTickets: e.totalTickets,
        ticketTypesCount: e._count.ticketTypes,
        ticketsIssued: e._count.tickets,
        ticketsCheckedIn: checkedMap.get(e.id) ?? 0,
        revenuePotential: e.ticketTypes.reduce((sum, t) => sum + toNumber(t.price) * t.quantity, 0),
        createdAt: e.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao listar eventos." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireWrite(user, "eventos");
    if (denied) return denied;

    const parsed = await parseBody(request, eventCreateSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;

    const startDate = parseEventDateTime(data.startDate);
    if (!startDate) {
      return NextResponse.json({ error: "Data de início inválida." }, { status: 400 });
    }
    const endDate = data.endDate ? parseEventDateTime(data.endDate) : null;
    if (data.endDate && !endDate) {
      return NextResponse.json({ error: "Data de fim inválida." }, { status: 400 });
    }
    if (endDate && endDate < startDate) {
      return NextResponse.json(
        { error: "A data de fim não pode ser anterior à data de início." },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        companyId: user.companyId,
        title: data.title,
        description: data.description ?? null,
        category: data.category ?? null,
        venue: data.venue ?? null,
        address: data.address ?? null,
        province: data.province ?? null,
        municipality: data.municipality ?? null,
        startDate,
        endDate,
        coverImage: data.coverImage ?? null,
        localPurchaseValue: data.localPurchaseValue ?? 0,
        totalTickets: data.totalTickets ?? 0,
        status: data.status ?? "RASCUNHO",
        published: data.published ?? false,
        notes: data.notes ?? null,
      },
    });

    await logAction("create", "event", event.id, `Evento "${event.title}" criado`, user);

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar evento." }, { status: 500 });
  }
}
