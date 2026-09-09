import { NextResponse } from "next/server";
import { generateReportsForAllCompanies } from "@/lib/reports";

const SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  const auth = request.headers.get("Authorization");
  if (!SECRET || auth !== `Bearer ${SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get("period") === "annual" ? "annual" : url.searchParams.get("period") === "quarterly" ? "quarterly" : "monthly";
  const now = new Date();

  try {
    const results = await generateReportsForAllCompanies(period, now);
    return NextResponse.json({
      success: true,
      period,
      generatedAt: now.toISOString(),
      companies: results.length,
    });
  } catch (err) {
    console.error("Erro ao gerar relatórios automáticos:", err);
    return NextResponse.json({ error: "Erro ao gerar relatórios." }, { status: 500 });
  }
}