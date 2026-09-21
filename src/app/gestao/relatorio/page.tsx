"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Download, Printer, ShoppingCart, ReceiptText, FileDown, Wallet, BarChart3, Users, Package, ChevronDown, ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { jsonToCsv, downloadCsv } from "@/lib/csv";
import { ChartsWidget } from "@/dashboard/widgets/ChartsWidget";
import { buildReportHtml } from "@/lib/reportDocument";
import { getCspNonce } from "@/lib/cspNonce";

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
  monthIncome: number;
  monthExpense: number;
  balance: number;
}

interface ItemStat {
  name: string;
  kind: string;
  times: number;
  quantity: number;
  revenue: number;
  customerCount: number;
  customers: string[];
}

interface CustomerStat {
  label: string;
  spent: number;
  orders: number;
  itemCount: number;
  items: { name: string; quantity: number; revenue: number }[];
}

export default function RelatorioPage() {
  const [data, setData] = useState<ReportPageData | null>(null);
  const [analytics, setAnalytics] = useState<{ items: ItemStat[]; customers: CustomerStat[] } | null>(null);
  const [company, setCompany] = useState<{ name: string; nif?: string | null; email?: string | null; phone?: string | null; address?: string | null; logo?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (name: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  useEffect(() => {
    Promise.all([fetch("/api/dashboard").then((r) => r.json()), fetch("/api/reports/analytics").then((r) => r.json()), fetch("/api/company").then((r) => r.json()).catch(() => ({ company: null }))])
      .then(([d, a, c]) => {
        setData(d);
        setAnalytics({ items: a.items || [], customers: a.customers || [] });
        setCompany(c.company);
      })
      .catch((err) => console.error("Erro ao carregar relatório:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;
  if (!data) return <div className="p-12 text-center text-ib-muted">Não foi possível carregar o relatório.</div>;

  const d = data;
  const netProfit = d.totalRevenue - d.totalExpenses;
  const profitMargin = d.totalRevenue > 0 ? (netProfit / d.totalRevenue) * 100 : 0;
  const prevFundsBalance = d.balance - d.monthIncome + d.monthExpense;

  function exportCsv() {
    const csv =
      jsonToCsv(
        [
          { metric: "Receita Total", value: formatCurrency(d.totalRevenue) },
          { metric: "Total Vendas", value: String(d.totalSales) },
          { metric: "Vendas de Hoje", value: formatCurrency(d.todaySales) },
          { metric: "Despesas Totais", value: formatCurrency(d.totalExpenses) },
          { metric: "Lucro Líquido", value: formatCurrency(netProfit) },
          { metric: "Fundos Entradas", value: formatCurrency(d.monthIncome) },
          { metric: "Fundos Saídas", value: formatCurrency(d.monthExpense) },
          { metric: "Saldo de Fundos", value: formatCurrency(d.balance) },
          { metric: "Saldo Início do Mês", value: formatCurrency(prevFundsBalance) },
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
      ) +
      "\r\n\r\n" +
      jsonToCsv(
        (analytics?.items || []).map((i) => ({ name: i.name, kind: i.kind, times: i.times, quantity: i.quantity, revenue: i.revenue, customers: i.customerCount, customerList: i.customers.join("; ") })),
        { name: "Produto/Serviço", kind: "Tipo", times: "N.º Vezes", quantity: "Quantidade", revenue: "Receita (Kz)", customers: "N.º Clientes", customerList: "Clientes" }
      ) +
      "\r\n\r\n" +
      jsonToCsv(
        (analytics?.customers || []).map((c) => ({ label: c.label, spent: c.spent, orders: c.orders, items: c.itemCount, details: c.items.map((i) => `${i.name} (x${i.quantity})`).join("; ") })),
        { label: "Cliente", spent: "Total Gasto", orders: "N.º Compras", items: "Itens Distintos", details: "Produtos/Serviços" }
      );
    downloadCsv(csv, `relatorio-${new Date().toISOString().slice(0, 10)}`);
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win || !data) return;
    const tone = (v: number, positive = true) => (positive ? (v >= 0 ? "green" : "red") : "neutral");

    win.document.write(
      buildReportHtml({
        title: "Relatório de Gestão",
        subtitle: "Visão geral do desempenho do negócio",
        company,
        sections: [
          {
            heading: "Indicadores Gerais",
            metrics: [
              { label: "Receita Total", value: formatCurrency(d.totalRevenue), tone: "green" },
              { label: "Total de Vendas", value: String(d.totalSales) },
              { label: "Vendas de Hoje", value: formatCurrency(d.todaySales) },
              { label: "Despesas Totais", value: formatCurrency(d.totalExpenses), tone: "red" },
              { label: "Lucro Líquido", value: formatCurrency(netProfit), tone: tone(netProfit) },
              { label: "Margem de Lucro", value: `${profitMargin.toFixed(1)}%` },
              { label: "Faturas Pendentes", value: `${d.pendingInvoices} (${formatCurrency(d.pendingInvoicesTotal)})` },
              { label: "Clientes", value: String(d.totalCustomers) },
              { label: "Produtos", value: String(d.totalProducts) },
            ],
          },
          {
            heading: "Fundo de Caixa da Empresa",
            metrics: [
              { label: "Saldo Actual", value: formatCurrency(d.balance), tone: tone(d.balance) },
              { label: "Início do Mês", value: formatCurrency(prevFundsBalance) },
              { label: "Entradas no Mês", value: formatCurrency(d.monthIncome), tone: "green" },
              { label: "Saídas no Mês", value: formatCurrency(d.monthExpense), tone: "red" },
            ],
          },
          ...(d.monthlySales?.length ? [{
            heading: "Vendas por Mês (últimos 6 meses)",
            table: {
              headers: ["Mês", "Vendas (Kz)", "N.º Vendas"],
              rows: d.monthlySales.map((m) => [m.month, formatCurrency(m.total), String(m.count)]),
            },
          }] : []),
          ...(d.recentSales.length ? [{
            heading: "Últimas Vendas",
            table: {
              headers: ["Data", "Cliente", "Total"],
              rows: d.recentSales.map((s) => [formatDate(s.date), s.customer?.name || "—", formatCurrency(s.total)]),
            },
          }] : []),
          ...(d.recentExpenses.length ? [{
            heading: "Últimas Despesas",
            table: {
              headers: ["Descrição", "Categoria", "Data", "Valor"],
              rows: d.recentExpenses.map((e) => [e.description, e.category || "—", formatDate(e.date), formatCurrency(e.amount)]),
            },
          }] : []),
          ...(d.topProducts.length ? [{
            heading: "Top Produtos",
            table: {
              headers: ["Produto", "Quantidade", "Total"],
              rows: d.topProducts.map((p) => [p.name, String(p.quantity), formatCurrency(p.total)]),
            },
          }] : []),
          ...(analytics && analytics.items.length ? [{
            heading: "Produtos e Serviços mais Rentáveis",
            table: {
              headers: ["Produto/Serviço", "Tipo", "N.º Vezes", "Quantidade", "Receita", "N.º Clientes"],
              rows: analytics.items.map((i) => [i.name, i.kind, String(i.times), String(i.quantity), formatCurrency(i.revenue), String(i.customerCount)]),
            },
          }] : []),
          ...(analytics && analytics.customers.length ? [{
            heading: "Clientes de Maior Valor",
            table: {
              headers: ["Cliente", "Total Gasto", "Compras", "Itens Distintos"],
              rows: analytics.customers.map((c) => [c.label, formatCurrency(c.spent), String(c.orders), String(c.itemCount)]),
            },
          }] : []),
        ],
      },
      getCspNonce()
    ));
    win.document.close();
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 no-print">
        <div>
          <h1 className="page-title">Relatório</h1>
          <p className="text-ib-muted text-sm">Visão geral do desempenho do seu negócio</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-ib-muted hover:bg-gray-50 transition-colors">
            <FileDown className="w-4 h-4" /> Exportar CSV
          </button>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={DollarSign} label="Receita Total" value={formatCurrency(data.totalRevenue)} color="green" sub={`${formatCurrency(data.todaySales)} hoje`} />
        <SummaryCard icon={TrendingDown} label="Despesas" value={formatCurrency(data.totalExpenses)} color="red" sub={`${formatCurrency(data.monthExpenses)} este mês`} />
        <SummaryCard icon={TrendingUp} label="Lucro Líquido" value={formatCurrency(netProfit)} color={netProfit >= 0 ? "blue" : "red"} sub={`${profitMargin.toFixed(1)}% margem`} />
        <div className="card p-5 print:break-inside-avoid">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><Wallet className="w-4 h-4" /></div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Caixa da Empresa</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ib-muted">Saldo actual</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(data.balance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ib-muted">Início do mês</span>
              <span className="text-sm text-gray-700">{formatCurrency(prevFundsBalance)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-600 font-medium">+ Entradas</span>
              <span className="text-sm font-semibold text-green-600">{formatCurrency(data.monthIncome)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-500 font-medium">- Saídas</span>
              <span className="text-sm font-semibold text-red-500">{formatCurrency(data.monthExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      <ChartsWidget data={data} />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5 print:break-inside-avoid">
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

        <div className="card p-5 print:break-inside-avoid">
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

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5 print:break-inside-avoid">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Serviços / Produtos Mais Solicitados
            </h3>
          </div>
          {!analytics || analytics.items.length === 0 ? (
            <p className="text-sm text-ib-muted py-8 text-center">Sem dados de vendas ou faturas.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {analytics.items.map((item, idx) => {
                const isOpen = expandedItems.has(item.name);
                return (
                  <div key={idx} className="rounded-lg border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg font-semibold text-sm text-gray-600 bg-gray-100">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <span className={`shrink-0 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full font-semibold ${
                            item.kind === "serviço" ? "bg-purple-50 text-purple-700"
                            : item.kind === "produto" ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                          }`}>
                            {item.kind}
                          </span>
                        </div>
                        <p className="text-xs text-ib-muted">
                          {item.times} {item.times === 1 ? "solicitação" : "solicitações"} • {item.customerCount} {item.customerCount === 1 ? "cliente" : "clientes"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-600">{formatCurrency(item.revenue)}</p>
                        <button onClick={() => toggleItem(item.name)} className="mt-1 inline-flex items-center gap-0.5 text-[11px] text-ib-accent hover:underline">
                          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isOpen ? "Fechar" : "Quem pediu"}
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-4 pt-3 pb-3 border-t border-gray-50 bg-gray-50/40">
                        <p className="text-[11px] text-ib-muted mb-2">Quem solicitou ({item.customerCount}):</p>
                        {item.customers.length === 0 ? (
                          <p className="text-xs text-ib-muted">Sem clientes registados.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.customers.map((c, ci) => (
                              <span key={ci} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700">
                                <Users className="w-3 h-3 text-ib-muted" /> {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5 print:break-inside-avoid">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Gasto por Cliente
            </h3>
          </div>
          {!analytics || analytics.customers.length === 0 ? (
            <p className="text-sm text-ib-muted py-8 text-center">Sem dados de vendas ou faturas.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {analytics.customers.map((c, ci) => {
                const isOpen = expandedItems.has(c.label);
                return (
                  <div key={ci} className="rounded-lg border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.label}</p>
                        <p className="text-xs text-ib-muted">{c.orders} {c.orders === 1 ? "compra" : "compras"} • {c.itemCount} {c.itemCount === 1 ? "serviço/produto" : "serviços/produtos"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-green-600">{formatCurrency(c.spent)}</p>
                        <button onClick={() => toggleItem(c.label)} className="mt-1 inline-flex items-center gap-0.5 text-[11px] text-ib-accent hover:underline">
                          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isOpen ? "Fechar" : "O que pediu"}
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-4 pt-3 pb-3 border-t border-gray-50 bg-gray-50/40">
                        <p className="text-[11px] text-ib-muted mb-2">Serviços / produtos (para {formatCurrency(c.spent)}):</p>
                        {c.items.length === 0 ? (
                          <p className="text-xs text-ib-muted">Sem itens registados.</p>
                        ) : (
                          <ul className="space-y-1">
                            {c.items.map((it, ii) => (
                              <li key={ii} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">{it.name} <span className="text-ib-muted">x{it.quantity}</span></span>
                                <span className="font-semibold text-gray-800">{formatCurrency(it.revenue)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {data.topProducts && data.topProducts.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              Produtos Mais Vendidos
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl min-w-[480px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-ib-muted text-xs uppercase tracking-wider">
                  <th className="tbl-th">Produto</th>
                  <th className="tbl-th text-right">Quantidade</th>
                  <th className="tbl-th text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="tbl-td font-medium">{p.name}</td>
                    <td className="tbl-td text-right">{p.quantity}</td>
                    <td className="tbl-td text-right">{formatCurrency(p.total)}</td>
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

function SummaryCard({ icon: Icon, label, value, color, sub }: { icon: LucideIcon; label: string; value: string; color: string; sub?: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="card p-5 print:break-inside-avoid">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
        <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-ib-muted mt-1">{sub}</p>}
    </div>
  );
}