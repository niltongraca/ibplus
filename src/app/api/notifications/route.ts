import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { parseBody } from "@/lib/validations/helpers";
import { notificationCreateSchema, notificationUpdateSchema } from "@/lib/validations/admin";

export async function GET() {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { companyId: user.companyId, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const parsed = await parseBody(request, notificationCreateSchema);
    if ("error" in parsed) return parsed.error;
    const { type, title, message, link, requiresUpdate } = parsed.data;
    const notification = await prisma.notification.create({
      data: {
        companyId: user.companyId,
        type: type || "info",
        title,
        message: message || null,
        link: link || null,
        requiresUpdate: requiresUpdate === true,
      },
    });
    return NextResponse.json({ notification }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar notificação." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const parsed = await parseBody(request, notificationUpdateSchema);
    if ("error" in parsed) return parsed.error;
    const { id, readAll } = parsed.data;

    if (readAll) {
      await prisma.notification.updateMany({
        where: { companyId: user.companyId, read: false },
        data: { read: true },
      });
    } else if (id) {
      await prisma.notification.updateMany({
        where: { id, companyId: user.companyId },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar notificação." }, { status: 400 });
  }
}
