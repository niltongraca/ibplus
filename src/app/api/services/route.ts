import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const services = await prisma.service.findMany({
      where: { companyId: user.companyId! },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
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

    return NextResponse.json({ service });
  } catch {
    return NextResponse.json({ error: "Erro ao criar serviço." }, { status: 500 });
  }
}
