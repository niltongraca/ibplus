import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { buildSearch, parsePagination } from "@/lib/utils";
import { toNumber } from "@/lib/money";
import { requireFeature } from "@/lib/permissions";
import { REGISTRATION_STATUSES } from "@/config/events";

async function getScopedEvent(id: string, companyId: string) {
  return prisma.event.findFirst({
    where: { id, companyId },
    select: { id: true, title: true, registrationToken: true },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });
    const denied = await requireFeature(user, "eventos");
    if (denied) return denied;

    const event = await getScopedEvent(id, user.companyId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    const url = new URL(request.url);
    const { page, limit, skip } = parsePagination(url.searchParams);
    const rawStatus = url.searchParams.get("status");
    const status = REGISTRATION_STATUSES.find((s) => s === rawStatus);
    const search = buildSearch(["code", "holderName", "holderEmail", "holderPhone"], url.searchParams.get("search"));

    const where = {
      eventId: event.id,
      ...(status ? { status } : {}),
      ...(search ?? {}),
    };
    const [registrations, total, counts] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              ticketType: { select: { id: true, name: true, kind: true } },
            },
          },
        },
      }),
      prisma.eventRegistration.count({ where }),
      prisma.eventRegistration.groupBy({
        by: ["status"],
        where: { eventId: event.id },
        _count: { _all: true },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      REGISTRATION_STATUSES.map((s) => [s, 0])
    ) as Record<string, number>;
    for (const row of counts) statusCounts[row.status] = row._count._all;

    return NextResponse.json({
      event: { id: event.id, title: event.title, registrationToken: event.registrationToken },
      registrations: registrations.map((r) => ({
        id: r.id,
        code: r.code,
        holderName: r.holderName,
        holderEmail: r.holderEmail,
        holderPhone: r.holderPhone,
        status: r.status,
        amount: toNumber(r.amount),
        paymentRef: r.paymentRef,
        proofUrl: r.proofUrl,
        proofMime: r.proofMime,
        proofName: r.proofName,
        notes: r.notes,
        rejectionReason: r.rejectionReason,
        reviewedAt: r.reviewedAt,
        createdAt: r.createdAt,
        items: r.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: toNumber(item.unitPrice),
          subtotal: toNumber(item.subtotal),
          ticketType: item.ticketType,
        })),
      })),
      statusCounts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Erro ao listar inscrições." }, { status: 500 });
  }
}
