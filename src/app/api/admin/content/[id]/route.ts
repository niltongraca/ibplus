import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import type { ContentType } from "@prisma/client";
import { parseBody } from "@/lib/validations/helpers";
import { contentUpdateSchema } from "@/lib/validations/admin";

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
    const parsed = await parseBody(request, contentUpdateSchema);
    if ("error" in parsed) return parsed.error;
    const body = parsed.data;
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

    if (body.title !== undefined) data.title = body.title;
    if (body.type !== undefined) data.type = body.type;
    if (body.url !== undefined) data.url = body.url;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail || null;
    if (body.author !== undefined) data.author = body.author || null;
    if (body.tags !== undefined) data.tags = body.tags || null;
    if (body.featured !== undefined) data.featured = body.featured === true;
    if (body.published !== undefined) data.published = body.published === true;

    const content = await prisma.content.update({ where: { id }, data });
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Erro ao actualizar conteúdo." }, { status: 400 });
  }
}
