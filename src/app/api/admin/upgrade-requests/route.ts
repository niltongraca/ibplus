import { NextResponse } from "next/server";
import type { Prisma, UpgradeRequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination } from "@/lib/utils";

const STATUSES: UpgradeRequestStatus[] = ["PENDING", "APPROVED", "REJECTED"];

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
      include: {
        user: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.upgradeRequest.count({ where }),
  ]);

  return NextResponse.json({ requests, total, page, totalPages: Math.ceil(total / limit) });
}
