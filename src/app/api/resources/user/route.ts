import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const isAdmin = user.role === "admin";

  const resources = await prisma.resource.findMany({
    include: {
      permissions: {
        where: { accountType: user.accountType },
        select: { allowed: true },
      },
    },
    orderBy: { key: "asc" },
  });

  const result = resources.map((r) => ({
    key: r.key,
    enabled: isAdmin ? true : r.enabled,
    allowed: isAdmin ? true : (r.permissions[0]?.allowed ?? false),
  }));

  const allowedKeys = result.filter((r) => r.enabled && r.allowed).map((r) => r.key);

  return NextResponse.json({ resources: result, allowedKeys });
}
