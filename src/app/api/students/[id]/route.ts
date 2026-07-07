import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  nif: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  enrollmentDate: z.string().optional().nullable(),
  active: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

async function getStudent(id: string, companyId: string) {
  return prisma.student.findFirst({
    where: { id, companyId },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const student = await getStudent(id, user.companyId);
  if (!student) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });

  return NextResponse.json({ student });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const student = await getStudent(id, user.companyId);
  if (!student) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });

  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const data: Record<string, unknown> = {};
    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.email !== undefined) data.email = parsed.email || null;
    if (parsed.phone !== undefined) data.phone = parsed.phone || null;
    if (parsed.nif !== undefined) data.nif = parsed.nif || null;
    if (parsed.address !== undefined) data.address = parsed.address || null;
    if (parsed.birthDate !== undefined) data.birthDate = parsed.birthDate ? new Date(parsed.birthDate) : null;
    if (parsed.grade !== undefined) data.grade = parsed.grade || null;
    if (parsed.enrollmentDate !== undefined) data.enrollmentDate = parsed.enrollmentDate ? new Date(parsed.enrollmentDate) : undefined;
    if (parsed.active !== undefined) data.active = parsed.active;
    if (parsed.notes !== undefined) data.notes = parsed.notes || null;

    const updated = await prisma.student.update({
      where: { id },
      data,
    });

    return NextResponse.json({ student: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao actualizar aluno." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const student = await getStudent(id, user.companyId);
  if (!student) return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });

  await prisma.student.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
