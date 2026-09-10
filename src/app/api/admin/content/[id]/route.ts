import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import type { ContentType } from "@prisma/client";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    const { id } = await params;
    await prisma.content.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar conteúdo." }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data: {
      title?: string;
      type?: ContentType;
      url?: string;
      description?: string | null;
      thumbnail?: string | null;
      author?: string | null;
      tags?: string | null;
      featured?: boolean;
      published?: boolean;
    } = {};

    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (typeof body.type === "string" && body.type.trim()) data.type = body.type.trim().toUpperCase() as ContentType;
    if (typeof body.url === "string" && body.url.trim()) data.url = body.url.trim();
    if (body.description !== undefined) data.description = body.description ? String(body.description).trim() : null;
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail ? String(body.thumbnail).trim() : null;
    if (body.author !== undefined) data.author = body.author ? String(body.author).trim() : null;
    if (body.tags !== undefined) data.tags = body.tags ? String(body.tags).trim() : null;
    if (body.featured !== undefined) data.featured = body.featured === true;
    if (body.published !== undefined) data.published = body.published === true;

    const content = await prisma.content.update({ where: { id }, data });
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar conteúdo." }, { status: 400 });
  }
}
