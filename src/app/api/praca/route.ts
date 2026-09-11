import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/money";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

export async function GET(request: Request) {
  // Endpoint público: protege contra scraping-abuso e devolve apenas dados públicos.
  const ip = getClientIp(request);
  const check = checkRateLimit(`praca:${ip}`, "relaxed");
  if (!check.allowed) return rateLimitResponse(check.retryAfter!);

  const companies = await prisma.company.findMany({
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
        take: 8,
      },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  return NextResponse.json({
    companies: companies.map((c) => ({
      ...c,
      products: c.products.map((p) => ({ ...p, price: toNumber(p.price) })),
    })),
  });
}