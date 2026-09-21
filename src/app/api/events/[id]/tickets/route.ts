import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { buildSearch, parseBool, parsePagination } from "@/lib/utils";
import { toNumber } from "@/lib/money";
import { logAction } from "@/lib/audit";
import { requireFeature, requireWrite } from "@/lib/permissions";
import { parseBody } from "@/lib/validations/helpers";
import { ticketIssueSchema } from "@/lib/validations/events";
import { generateTicketCode } from "@/lib/events";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireFeature(user, "eventos");
    if (denied) return denied;

    const event = await prisma.event.findFirst({ where: { id, companyId: user.companyId } });
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url.searchParams);
    const search = buildSearch(["code", "holderName", "holderEmail", "holderPhone"], url.searchParams.get("search"));
    const status = url.searchParams.get("status");
    const ticketTypeId = url.searchParams.get("ticketTypeId");
    const checkedIn = parseBool(url.searchParams.get("checkedIn"));

    const where = {
      eventId: id,
      ...(search ?? {}),
      ...(status ? { status } : {}),
      ...(ticketTypeId ? { ticketTypeId } : {}),
      ...(checkedIn !== undefined ? { checkedIn } : {}),
    };

    const [tickets, total] = await Promise.all([
      prisma.eventTicket.findMany({
        where,
        orderBy: { issuedAt: "desc" },
        skip,
        take: limit,
        include: { ticketType: { select: { name: true, kind: true } } },
      }),
      prisma.eventTicket.count({ where }),
    ]);

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        code: t.code,
        holderName: t.holderName,
        holderEmail: t.holderEmail,
        holderPhone: t.holderPhone,
        price: toNumber(t.price),
        status: t.status,
        checkedIn: t.checkedIn,
        checkedInAt: t.checkedInAt,
        issuedAt: t.issuedAt,
        notes: t.notes,
        ticketTypeId: t.ticketTypeId,
        ticketTypeName: t.ticketType?.name ?? null,
        ticketTypeKind: t.ticketType?.kind ?? null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao listar bilhetes." }, { status: 500 });
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

    const parsed = await parseBody(request, ticketIssueSchema);
    if ("error" in parsed) return parsed.error;
    const data = parsed.data;
    const quantity = data.quantity ?? 1;

    const ticketType = await prisma.eventTicketType.findFirst({
      where: { id: data.ticketTypeId, eventId: id },
    });
    if (!ticketType) {
      return NextResponse.json({ error: "Tipo de bilhete não encontrado." }, { status: 404 });
    }
    if (!ticketType.active) {
      return NextResponse.json({ error: "Este tipo de bilhete está inactivo." }, { status: 409 });
    }

    const issued = await prisma.eventTicket.count({ where: { ticketTypeId: ticketType.id } });
    if (ticketType.quantity > 0 && issued + quantity > ticketType.quantity) {
      const available = Math.max(0, ticketType.quantity - issued);
      return NextResponse.json(
        {
          error: `Quantidade indisponível: restam ${available} de ${ticketType.quantity} bilhete(s) deste tipo.`,
        },
        { status: 409 }
      );
    }

    const codes = new Set<string>();
    while (codes.size < quantity) codes.add(generateTicketCode());

    const tickets = await prisma.eventTicket.createManyAndReturn({
      data: [...codes].map((code) => ({
        eventId: id,
        ticketTypeId: ticketType.id,
        code,
        holderName: data.holderName ?? null,
        holderEmail: data.holderEmail ?? null,
        holderPhone: data.holderPhone ?? null,
        price: ticketType.price,
        notes: data.notes ?? null,
      })),
    });

    await logAction(
      "create",
      "event_ticket",
      event.id,
      `${quantity} bilhete(s) "${ticketType.name}" emitido(s) para o evento "${event.title}"`,
      user
    );

    return NextResponse.json(
      {
        tickets: tickets.map((t) => ({ ...t, price: toNumber(t.price) })),
        created: tickets.length,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Erro ao emitir bilhetes." }, { status: 500 });
  }
}
