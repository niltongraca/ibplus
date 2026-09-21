import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const webVitalSchema = z.object({
  name: z.string().min(1).max(64),
  value: z.number().finite().min(0).max(300_000),
  rating: z.string().min(1).max(32).optional(),
  delta: z.number().finite().min(0).max(300_000).optional(),
  path: z.string().min(1).max(500).optional(),
});

/**
 * POST /api/vitals — Core Web Vitals recebidos do browser via beacon
 * (`useReportWebVitals` + navigator.sendBeacon). Rota pública de baixo nível
 * (sem sessão/CSRF): apenas validação zod + gravação na tabela WebVital.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = webVitalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valores de CWV inválidos." }, { status: 400 });
    }
    const { name, value, rating, delta, path } = parsed.data;
    await prisma.webVital.create({
      data: { name, rating: rating ?? "unknown", value, delta: delta ?? null, path: path ?? null },
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Falha ao registar métrica." }, { status: 500 });
  }
}

/**
 * GET /api/vitals — relatório agregado (contagem + média por métrica/rating)
 * das janelas de 30 e 7 dias. Base para um futuro painel de performance.
 */
export async function GET() {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [thirty, seven] = await Promise.all([
    prisma.webVital.groupBy({
      by: ["name", "rating"],
      where: { createdAt: { gte: since30 } },
      _count: { _all: true },
      _avg: { value: true },
    }),
    prisma.webVital.groupBy({
      by: ["name"],
      where: { createdAt: { gte: since7 } },
      _count: { _all: true },
      _avg: { value: true },
    }),
  ]);

  return NextResponse.json({
    since: { last30: since30.toISOString(), last7: since7.toISOString() },
    byMetric30d: thirty.map((r) => ({
      name: r.name,
      rating: r.rating,
      count: r._count._all,
      avgValue: r._avg.value,
    })),
    byMetric7d: seven.map((r) => ({
      name: r.name,
      count: r._count._all,
      avgValue: r._avg.value,
    })),
  });
}