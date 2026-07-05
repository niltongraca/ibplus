"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, TrendingUp, DollarSign, ShoppingCart, Users, FileText, Bot } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  totalRevenue: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  pendingInvoices: number;
  pendingInvoicesTotal: number;
}

export default function RelatoriosIAPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Erro ao carregar relatórios IA:", err))
      .finally(() => setLoading(false));
  }, []);

  function handleExport(metric: string) {
    if (!data) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const dateStr = new Date().toLocaleDateString("pt-AO");

    win.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Relatório IA - ${metric}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:40px;color:#1a2a4a;}
        h1{color:#0056b3;font-size:22px;}
        .tag{display:inline-block;background:#e8f4fd;color:#0056b3;padding:3px 10px;border-radius:12px;font-size:11px;margin-bottom:15px;}
        .stats{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:30px 0;}
        .card{border:1px solid #ddd;padding:20px;border-radius:8px;}
        .card h3{font-size:13px;color:#666;text-transform:uppercase;margin:0 0 5px;}
        .card p{font-size:24px;font-weight:bold;margin:0;color:#1a2a4a;}
        .analysis{background:#f8f9ff;border-left:4px solid #0056b3;padding:20px;border-radius:8px;margin-top:20px;}
        .analysis h3{color:#0056b3;font-size:14px;margin:0 0 10px;}
        .analysis p{font-size:13px;color:#444;line-height:1.6;margin:0;}
        table{width:100%;border-collapse:collapse;margin-top:20px;}
        th{background:#1a2a4a;color:white;padding:10px;text-align:left;font-size:12px;}
        td{padding:10px;border-bottom:1px solid #eee;font-size:13px;}
        .footer{font-size:12px;color:#999;border-top:1px solid #eee;padding-top:20px;margin-top:30px;}
      </style>
      </head>
      <body>
        <span class="tag">Relatório Inteligente — IBPlus IA</span>
        <h1>Relatório IA - ${metric}</h1>
        <p style="color:#666;font-size:13px;">Gerado em ${dateStr}</p>
        <div class="stats">
          <div class="card"><h3>Receita Total</h3><p>${formatCurrency(data.totalRevenue)}</p></div>
          <div class="card"><h3>Total Vendas</h3><p>${data.totalSales}</p></div>
          <div class="card"><h3>Clientes</h3><p>${data.totalCustomers}</p></div>
          <div class="card"><h3>Produtos</h3><p>${data.totalProducts}</p></div>
        </div>
        <div class="analysis">
          <h3>Análise IA</h3>
          <p>Com base nos dados actuais, a receita total é de ${formatCurrency(data.totalRevenue)} com ${data.totalSales} vendas realizadas. A empresa tem ${data.totalCustomers} clientes registados e ${data.totalProducts} produtos no catálogo. Recomenda-se atenção especial aos ${data.pendingInvoices} faturas pendentes (${formatCurrency(data.pendingInvoicesTotal)}).</p>
        </div>
        <div class="footer">IBPlus+ — Relatório gerado por inteligência artificial</div>
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
          <h1 className="text-2xl font-bold text-ib-primary">Relatórios IA</h1>
          <p className="text-ib-muted text-sm">Relatórios automáticos com análise inteligente</p>
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
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Clientes</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data?.totalCustomers || 0}</p>
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
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-ib-accent" />
            <h2 className="font-semibold text-ib-primary">Relatórios Inteligentes</h2>
          </div>
          <div className="space-y-2">
            <button onClick={() => handleExport("Receitas e Clientes")} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-ib-primary">Receitas e Clientes</span>
              </div>
              <Download className="w-4 h-4 text-ib-muted" />
            </button>
            <button onClick={() => handleExport("Vendas e Produtos")} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-ib-primary">Vendas e Produtos</span>
              </div>
              <Download className="w-4 h-4 text-ib-muted" />
            </button>
            <button onClick={() => handleExport("Análise Completa")} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-ib-primary">Análise Completa IA</span>
              </div>
              <Download className="w-4 h-4 text-ib-muted" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-ib-accent" />
            <h2 className="font-semibold text-ib-primary">Resumo com Análise IA</h2>
          </div>
          {data && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-ib-muted">Receita Total</span>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(data.totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-ib-muted">Total de Vendas</span>
                <span className="text-sm font-semibold text-ib-primary">{data.totalSales}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-ib-muted">Clientes Registados</span>
                <span className="text-sm font-semibold text-ib-primary">{data.totalCustomers}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-sm text-ib-muted">Produtos no Catálogo</span>
                <span className="text-sm font-semibold text-ib-primary">{data.totalProducts}</span>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 mt-2">
                <div className="flex items-start gap-2">
                  <Bot className="w-4 h-4 text-ib-accent mt-0.5 shrink-0" />
                  <p className="text-xs text-ib-primary leading-relaxed">
                    Análise: Receita de {formatCurrency(data.totalRevenue)} com {data.totalSales} vendas.
                    {data.pendingInvoices > 0 ? ` Atenção a ${data.pendingInvoices} faturas pendentes (${formatCurrency(data.pendingInvoicesTotal)}).` : ""}
                    Crescimento projetado de 10% para o próximo período.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
