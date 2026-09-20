import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { parseBody } from "@/lib/validations/helpers";
import { announcementCreateSchema } from "@/lib/validations/admin";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ announcements });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  try {
    const parsed = await parseBody(request, announcementCreateSchema);
    if ("error" in parsed) return parsed.error;
    const { title, message, link, requiresUpdate } = parsed.data;

    const companies = await prisma.company.findMany({ select: { id: true } });

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message: message || null,
        link: link || null,
        requiresUpdate,
        createdBy: user.id,
      },
    });

    if (companies.length > 0) {
      await prisma.notification.createMany({
        data: companies.map((company) => ({
          companyId: company.id,
          type: requiresUpdate ? "update" : "system",
          title,
          message: message || null,
          link: link || null,
          requiresUpdate,
        })),
      });
    }

    logAction("create", "announcement", announcement.id, title);

    return NextResponse.json({ announcement, broadcast: companies.length }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao enviar anúncio." }, { status: 500 });
  }
}