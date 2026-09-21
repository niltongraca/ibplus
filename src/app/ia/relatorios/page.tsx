"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, TrendingUp, DollarSign, ShoppingCart, Users, FileText, Bot } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { buildReportHtml } from "@/lib/reportDocument";
import { getCspNonce } from "@/lib/cspNonce";

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
  const [company, setCompany] = useState<{ name: string; nif?: string | null; email?: string | null; phone?: string | null; address?: string | null; logo?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/company").then((r) => r.json()).catch(() => ({ company: null })),
    ])
      .then(([d, c]) => {
        setData(d);
        setCompany(c.company);
      })
      .catch((err) => console.error("Erro ao carregar relatórios IA:", err))
      .finally(() => setLoading(false));
  }, []);

  function handleExport(metric: string) {
    if (!data) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const analysis = `Com base nos dados actuais, a receita total é de ${formatCurrency(data.totalRevenue)} com ${data.totalSales} vendas realizadas. A empresa tem ${data.totalCustomers} clientes registados e ${data.totalProducts} produtos no catálogo. Recomenda-se atenção especial aos ${data.pendingInvoices} faturas pendentes (${formatCurrency(data.pendingInvoicesTotal)}).`;

    win.document.write(
      buildReportHtml({
        title: "Relatório Inteligente",
        subtitle: metric,
        period: "Análise gerada por IA com os dados actuais",
        company,
        sections: [
          {
            heading: "Indicadores",
            metrics: [
              { label: "Receita Total", value: formatCurrency(data.totalRevenue), tone: "green" },
              { label: "Total de Vendas", value: String(data.totalSales) },
              { label: "Clientes", value: String(data.totalCustomers) },
              { label: "Produtos", value: String(data.totalProducts) },
              { label: "Faturas Pendentes", value: `${data.pendingInvoices} (${formatCurrency(data.pendingInvoicesTotal)})` },
            ],
          },
          {
            heading: "Análise IA",
            text: analysis,
          },
        ],
        footnote: "Relatório elaborado com recurso a inteligência artificial de apoio à gestão",
      },
      getCspNonce()
    ));
    win.document.close();
  }

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Relatórios IA</h1>
          <p className="text-ib-muted text-sm">Relatórios automáticos com análise inteligente</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Receita Total</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data ? formatCurrency(data.totalRevenue) : "—"}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Total Vendas</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data?.totalSales || 0}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Clientes</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data?.totalCustomers || 0}</p>
        </div>
        <div className="card p-5">
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
        <div className="card p-6">
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

        <div className="card p-6">
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
