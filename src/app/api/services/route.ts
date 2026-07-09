import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where: { companyId: user.companyId! },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.service.count({ where: { companyId: user.companyId! } }),
    ]);

    return NextResponse.json({ services, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar serviços." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const { name, description, price, duration } = await request.json();

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Nome e preço são obrigatórios." }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: { name, description, price: parseFloat(price), duration, companyId: user.companyId! },
    });

    await logAction("create", "service", service.id, `Serviço "${service.name}" criado`);
    return NextResponse.json({ service });
  } catch {
    return NextResponse.json({ error: "Erro ao criar serviço." }, { status: 500 });
  }
}
