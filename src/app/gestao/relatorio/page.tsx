"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Download, Printer, ShoppingCart, ReceiptText, FileDown, Wallet, BarChart3 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { jsonToCsv, downloadCsv } from "@/lib/csv";
import { ChartsWidget } from "@/dashboard/widgets/ChartsWidget";

interface ReportPageData {
  totalRevenue: number;
  todaySales: number;
  totalCustomers: number;
  totalProducts: number;
  pendingInvoices: number;
  pendingInvoicesTotal: number;
  productsLowStock: number;
  recentSales: { id: string; total: number; date: string; customer: { name: string } | null }[];
  totalSales: number;
  monthlySales?: { month: string; total: number; count: number }[];
  monthlyFunds?: { month: string; income: number; expense: number; balance: number }[];
  categorySales?: { name: string; value: number }[];
  totalExpenses: number;
  monthExpenses: number;
  pendingQuotes: number;
  pendingQuotesTotal: number;
  recentExpenses: { id: string; description: string; amount: number; date: string; category: string }[];
  topProducts: { name: string; quantity: number; total: number }[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function RelatorioPage() {
  const [data, setData] = useState<ReportPageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch((err) => console.error("Erro ao carregar relatório:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;
  if (!data) return <div className="p-12 text-center text-ib-muted">Não foi possível carregar o relatório.</div>;

  const d = data;
  const netProfit = d.totalRevenue - d.totalExpenses;
  const profitMargin = d.totalRevenue > 0 ? (netProfit / d.totalRevenue) * 100 : 0;

  function exportCsv() {
    const csv =
      jsonToCsv(
        [
          { metric: "Receita Total", value: formatCurrency(d.totalRevenue) },
          { metric: "Total Vendas", value: String(d.totalSales) },
          { metric: "Vendas de Hoje", value: formatCurrency(d.todaySales) },
          { metric: "Despesas Totais", value: formatCurrency(d.totalExpenses) },
          { metric: "Lucro Líquido", value: formatCurrency(netProfit) },
          { metric: "Fundos Entradas", value: formatCurrency(d.totalIncome) },
          { metric: "Fundos Saídas", value: formatCurrency(d.totalExpense) },
          { metric: "Saldo de Fundos", value: formatCurrency(d.balance) },
          { metric: "Clientes", value: String(d.totalCustomers) },
          { metric: "Produtos", value: String(d.totalProducts) },
        ],
        { metric: "Indicador", value: "Valor" }
      ) +
      "\r\n\r\n" +
      jsonToCsv(
        (d.monthlySales || []).map((m) => ({ month: m.month, sales: m.total, count: m.count })),
        { month: "Mês", sales: "Vendas (Kz)", count: "N.º Vendas" }
      ) +
      "\r\n\r\n" +
      jsonToCsv(
        (d.recentSales || []).map((s) => ({ customer: s.customer?.name || "—", date: formatDate(s.date), total: s.total })),
        { customer: "Cliente", date: "Data", total: "Total" }
      ) +
      "\r\n\r\n" +
      jsonToCsv(
        (d.recentExpenses || []).map((e) => ({ description: e.description, category: e.category, date: formatDate(e.date), amount: e.amount })),
        { description: "Descrição", category: "Categoria", date: "Data", amount: "Valor" }
      );
    downloadCsv(csv, `relatorio-${new Date().toISOString().slice(0, 10)}`);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Relatório</h1>
          <p className="text-ib-muted text-sm">Visão geral do desempenho do seu negócio</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-ib-muted hover:bg-gray-50 transition-colors">
            <FileDown className="w-4 h-4" /> Exportar CSV
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={DollarSign} label="Receita Total" value={formatCurrency(data.totalRevenue)} color="green" sub={`${formatCurrency(data.todaySales)} hoje`} />
        <SummaryCard icon={TrendingDown} label="Despesas" value={formatCurrency(data.totalExpenses)} color="red" sub={`${formatCurrency(data.monthExpenses)} este mês`} />
        <SummaryCard icon={TrendingUp} label="Lucro Líquido" value={formatCurrency(netProfit)} color={netProfit >= 0 ? "blue" : "red"} sub={`${profitMargin.toFixed(1)}% margem`} />
        <SummaryCard icon={Wallet} label="Saldo de Fundos" value={formatCurrency(data.balance)} color={data.balance >= 0 ? "purple" : "red"} sub="Entradas vs Saídas" />
      </div>

      <ChartsWidget data={data} />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 print:break-inside-avoid">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              Últimas Vendas
            </h3>
            <Download className="w-4 h-4 text-ib-muted" />
          </div>
          {data.recentSales.length === 0 ? (
            <p className="text-sm text-ib-muted py-8 text-center">Sem vendas registadas.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.recentSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.customer?.name || "Cliente"}</p>
                    <p className="text-xs text-ib-muted">{formatDate(s.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(s.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 print:break-inside-avoid">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-red-500" />
              Últimas Despesas
            </h3>
            <Download className="w-4 h-4 text-ib-muted" />
          </div>
          {data.recentExpenses.length === 0 ? (
            <p className="text-sm text-ib-muted py-8 text-center">Sem despesas registadas.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.recentExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.description}</p>
                    <p className="text-xs text-ib-muted">{formatDate(e.date)} • {e.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-500">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.topProducts && data.topProducts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              Produtos Mais Vendidos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-100 text-ib-muted text-xs uppercase tracking-wider">
                  <th className="text-left p-3 font-medium">Produto</th>
                  <th className="text-right p-3 font-medium">Quantidade</th>
                  <th className="text-right p-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-3 font-medium text-gray-800">{p.name}</td>
                    <td className="p-3 text-right text-gray-600">{p.quantity}</td>
                    <td className="p-3 text-right text-gray-800">{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string; color: string; sub?: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 print:break-inside-avoid">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
        <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-ib-muted mt-1">{sub}</p>}
    </div>
  );
}