import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { sales: true } } },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where: { companyId: user.companyId } }),
  ]);

  return NextResponse.json({ customers, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user?.companyId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "O nome é obrigatório." }, { status: 400 });

    const email = body.email ? String(body.email).trim() : "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "O email não é válido." }, { status: 400 });
    }

    const type = body.type === "empresa" ? "empresa" : "particular";

    const customer = await prisma.customer.create({
      data: {
        name,
        companyId: user.companyId,
        email: email || null,
        phone: body.phone ? String(body.phone).trim() : null,
        nif: body.nif ? String(body.nif).trim() : null,
        address: body.address ? String(body.address).trim() : null,
        type,
        notes: body.notes ? String(body.notes).trim() : null,
      },
    });
    await logAction("create", "customer", customer.id, `Cliente "${customer.name}" criado`);
    await createNotification(user.companyId, "customer", `Novo cliente: ${customer.name}`, undefined, "/gestao/clientes");
    return NextResponse.json({ customer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 400 });
  }
}
