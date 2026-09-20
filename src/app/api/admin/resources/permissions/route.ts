import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parseBody } from "@/lib/validations/helpers";
import { resourcePermissionToggleSchema } from "@/lib/validations/admin";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const permissions = await prisma.resourcePermission.findMany({
    include: { resource: { select: { key: true, label: true } } },
    orderBy: [{ resourceId: "asc" }, { accountType: "asc" }],
  });

  return NextResponse.json({ permissions });
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  try {
    const parsed = await parseBody(request, resourcePermissionToggleSchema);
    if ("error" in parsed) return parsed.error;
    const { id, allowed } = parsed.data;
    await prisma.resourcePermission.update({ where: { id }, data: { allowed } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar permissão." }, { status: 500 });
  }
}
