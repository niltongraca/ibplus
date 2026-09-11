import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parsePagination } from "@/lib/utils";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
}
