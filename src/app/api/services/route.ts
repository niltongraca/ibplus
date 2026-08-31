import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.service.count({ where: { companyId: user.companyId } }),
    ]);

    return NextResponse.json({ services, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: "Erro ao carregar serviços." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.companyId) return NextResponse.json({ error: "Sem empresa associada." }, { status: 400 });

  try {
    const body = await request.json();
    const { name, description, price, duration } = body;

    const nameTrimmed = typeof name === "string" ? name.trim() : "";
    if (!nameTrimmed || price === undefined || price === null || price === "") {
      return NextResponse.json({ error: "Nome e preço são obrigatórios." }, { status: 400 });
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: "O preço deve ser um número positivo." }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        name: nameTrimmed,
        description: description ? String(description).trim() : null,
        price: priceNum,
        duration: duration ? String(duration).trim() : null,
        companyId: user.companyId,
      },
    });

    await logAction("create", "service", service.id, `Serviço "${service.name}" criado`);
    return NextResponse.json({ service }, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar serviço:", err);
    return NextResponse.json({ error: "Erro ao criar serviço." }, { status: 500 });
  }
}
