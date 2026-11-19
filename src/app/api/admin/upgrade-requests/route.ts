import { NextResponse } from "next/server";
import type { Prisma, UpgradeRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination } from "@/lib/utils";

const STATUSES: UpgradeRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];

/**
 * Lista de pedidos para o painel administrativo.
 * O comprovativo (potencialmente uma data-URL grande) nunca é devolvido aqui:
 * apenas o indicador `hasProof`, e o ficheiro é servido por
 * GET /api/admin/upgrade-requests/[id]/proof.
 */
export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const rawStatus = url.searchParams.get("status");
  const status = STATUSES.find((s) => s === rawStatus);
  const where: Prisma.UpgradeRequestWhereInput = status ? { status } : {};

  const [requests, total] = await Promise.all([
    prisma.upgradeRequest.findMany({
      where,
      select: {
        id: true,
        fromPlan: true,
        toPlan: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        paymentRef: true,
        amount: true,
        paidAt: true,
        phone: true,
        note: true,
        reviewedAt: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.upgradeRequest.count({ where }),
  ]);

  const proofIds = requests.length
    ? await prisma.upgradeRequest.findMany({
        where: {
          id: { in: requests.map((r) => r.id) },
          paymentProofUrl: { not: null },
        },
        select: { id: true },
      })
    : [];
  const withProof = new Set(proofIds.map((r) => r.id));

  return NextResponse.json({
    requests: requests.map((r) => ({ ...r, hasProof: withProof.has(r.id) })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
