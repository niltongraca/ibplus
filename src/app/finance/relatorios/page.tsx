"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, TrendingUp, DollarSign, ShoppingCart, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  totalRevenue: number;
  totalSales: number;
  totalExpenses: number;
  totalPurchases: number;
  pendingInvoices: number;
  pendingInvoicesTotal: number;
  recentSales: { id: string; total: number; date: string; customer: { name: string } | null }[];
}

export default function RelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Erro ao carregar relatórios financeiros:", err))
      .finally(() => setLoading(false));
  }, []);

  function handleExport(metric: string) {
    if (!data) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const dateStr = new Date().toLocaleDateString("pt-AO");

    win.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Relatório - ${metric}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:40px;color:#1a2a4a;}
        h1{color:#0056b3;font-size:22px;}
        .stats{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:30px 0;}
        .card{border:1px solid #ddd;padding:20px;border-radius:8px;}
        .card h3{font-size:13px;color:#666;text-transform:uppercase;margin:0 0 5px;}
        .card p{font-size:24px;font-weight:bold;margin:0;color:#1a2a4a;}
        table{width:100%;border-collapse:collapse;margin-top:20px;}
        th{background:#1a2a4a;color:white;padding:10px;text-align:left;font-size:12px;}
        td{padding:10px;border-bottom:1px solid #eee;font-size:13px;}
        .footer{font-size:12px;color:#999;border-top:1px solid #eee;padding-top:20px;margin-top:30px;}
      </style>
      </head>
      <body>
        <h1>Relatório - ${metric}</h1>
        <p style="color:#666;font-size:13px;">Gerado em ${dateStr}</p>
        <div class="stats">
          <div class="card"><h3>Receita Total</h3><p>${formatCurrency(data.totalRevenue)}</p></div>
          <div class="card"><h3>Total Vendas</h3><p>${data.totalSales}</p></div>
          <div class="card"><h3>Despesas</h3><p>${formatCurrency(data.totalExpenses)}</p></div>
          <div class="card"><h3>Faturas Pendentes</h3><p>${data.pendingInvoices} (${formatCurrency(data.pendingInvoicesTotal)})</p></div>
        </div>
        <div class="footer">IBPlus+ — Plataforma de Gestão Empresarial | Relatório gerado automaticamente</div>
        <script>window.print();<\/script>
      </body>
      </html>
    `);
    win.document.close();
  }

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Relatórios</h1>
          <p className="text-ib-muted text-sm">Relatórios financeiros e de vendas</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Ano</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Receita Total</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data ? formatCurrency(data.totalRevenue) : "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Total Vendas</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data?.totalSales || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data ? formatCurrency(data.totalExpenses) : "—"}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Faturas Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">
            {data ? `${data.pendingInvoices} (${formatCurrency(data.pendingInvoicesTotal)})` : "—"}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ib-primary">Relatórios Financeiros</h2>
          </div>
          <div className="space-y-2">
            <button onClick={() => handleExport("Receitas e Despesas")} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-ib-primary">Receitas e Despesas</span>
              </div>
              <Download className="w-4 h-4 text-ib-muted" />
            </button>
            <button onClick={() => handleExport("Vendas por Período")} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-ib-primary">Vendas por Período</span>
              </div>
              <Download className="w-4 h-4 text-ib-muted" />
            </button>
            <button onClick={() => handleExport("Faturas Pendentes")} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-ib-primary">Faturas Pendentes</span>
              </div>
              <Download className="w-4 h-4 text-ib-muted" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ib-primary">Resumo Financeiro</h2>
          </div>
          {data && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-ib-muted">Receita Total</span>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(data.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-ib-muted">Total de Despesas</span>
                <span className="text-sm font-semibold text-red-600">{formatCurrency(data.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-ib-muted">Total de Compras</span>
                <span className="text-sm font-semibold text-ib-primary">{formatCurrency(data.totalPurchases)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-medium text-ib-primary">Saldo Líquido</span>
                <span className={`text-sm font-bold ${data.totalRevenue - data.totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(data.totalRevenue - data.totalExpenses)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
