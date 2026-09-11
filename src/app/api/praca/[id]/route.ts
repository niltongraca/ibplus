import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIp(request);
  const check = checkRateLimit(`praca:${ip}`, "relaxed");
  if (!check.allowed) return rateLimitResponse(check.retryAfter!);

  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      logo: true,
      provinciaOperacao: true,
      descricaoLoja: true,
      sobreNos: true,
      horarioFuncionamento: true,
      whatsappNumber: true,
      corPrincipal: true,
      email: true,
      phone: true,
      address: true,
      products: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          unit: true,
          category: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!company) return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  return NextResponse.json({
    company: {
      ...company,
      products: company.products.map((p) => ({ ...p, price: toNumber(p.price) })),
    },
  });
}