import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
    const { type, title, message, link } = await request.json();
    const notification = await prisma.notification.create({
      data: { companyId: user.companyId, type, title, message, link },
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
    const { id, readAll } = await request.json();

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
