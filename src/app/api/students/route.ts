import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";
import { parseDateOnly, parsePagination } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().optional().nullable(),
  nif: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const { page, limit, skip } = parsePagination(url.searchParams);
  const where = { companyId: user.companyId };

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({ students, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createSchema.parse(body);

    const student = await prisma.student.create({
      data: {
        name: parsed.name,
        email: parsed.email || null,
        phone: parsed.phone || null,
        nif: parsed.nif || null,
        address: parsed.address || null,
        birthDate: parsed.birthDate ? (parseDateOnly(parsed.birthDate) ?? new Date(parsed.birthDate)) : null,
        grade: parsed.grade || null,
        notes: parsed.notes || null,
        companyId: user.companyId,
      },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar aluno." }, { status: 400 });
  }
}
