"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, TrendingUp, DollarSign, ShoppingCart, CreditCard, PieChart as PieIcon, RefreshCw, FileSpreadsheet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { jsonToCsv, downloadCsv } from "@/lib/csv";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { buildReportHtml } from "@/lib/reportDocument";
import { getCspNonce } from "@/lib/cspNonce";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface ReportData {
  totalRevenue: number;
  totalSales: number;
  totalExpenses: number;
  totalPurchases: number;
  pendingInvoices: number;
  pendingInvoicesTotal: number;
  totalIncome: number;
  totalExpense: number;
  monthIncome?: number;
  monthExpense?: number;
  balance: number;
  pendingQuotes?: number;
  pendingQuotesTotal?: number;
  recentSales: { id: string; total: number; date: string; customer: { name: string } | null }[];
  monthlySales?: { month: string; total: number; count: number }[];
  categorySales?: { name: string; value: number }[];
  totalExpensesData?: number;
  recentExpenses?: { id: string; description: string; amount: number; date: string; category: string }[];
}

interface GeneratedReport {
  id: string;
  period: string;
  periodKey: string;
  label: string;
  totalRevenue: number;
  totalExpenses: number;
  netResult: number;
  totalSales: number;
  invoicesPaid: number;
  invoicesPaidTotal: number;
  createdAt: string;
  data?: { recentSales?: { id: string; date: string; total: number; customer: string | null }[]; recentExpenses?: { id: string; description: string; amount: number; date: string; category: string }[] } | null;
}

export default function RelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [company, setCompany] = useState<{ name: string; nif?: string | null; email?: string | null; phone?: string | null; address?: string | null; logo?: string | null } | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  function loadReports() {
    fetch("/api/reports?page=1&limit=100")
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .catch((err) => console.error("Erro ao carregar relatórios gerados:", err));
  }

  useEffect(() => {
    Promise.all([fetch("/api/dashboard").then((r) => r.json()), fetch("/api/reports?page=1&limit=100").then((r) => r.json()), fetch("/api/company").then((r) => r.json()).catch(() => ({ company: null }))])
      .then(([d, rep, c]) => {
        setData(d);
        setReports(rep.reports || []);
        setCompany(c.company);
      })
      .catch((err) => console.error("Erro ao carregar relatórios financeiros:", err))
      .finally(() => setLoading(false));
  }, []);

  async function generateReport(kind: string) {
    setGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: kind }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      loadReports();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao gerar relatório.");
    } finally {
      setGenerating(false);
    }
  }

  function exportReportCsv(r: GeneratedReport) {
    const sales = r.data?.recentSales || [];
    const expenses = r.data?.recentExpenses || [];
    const csv = jsonToCsv(
      [
        { label: "Relatório", value: `${r.period} ${r.label}` },
        { label: "Total Vendas", value: formatCurrency(r.totalRevenue) },
        { label: "N.º Vendas", value: String(r.totalSales) },
        { label: "Faturas Pagas", value: String(r.invoicesPaid) },
        { label: "Valor Faturas Pagas", value: formatCurrency(r.invoicesPaidTotal) },
        { label: "Despesas", value: formatCurrency(r.totalExpenses) },
        { label: "Resultado Líquido", value: formatCurrency(r.netResult) },
      ],
      { label: "Indicador", value: "Valor" }
    ) + "\r\n\r\n" + jsonToCsv(
      sales.map((s) => ({ type: "Venda", description: s.customer || "—", date: formatDate(s.date), amount: formatCurrency(s.total) })),
      { type: "Tipo", description: "Descrição", date: "Data", amount: "Valor" }
    ) + "\r\n\r\n" + jsonToCsv(
      expenses.map((e) => ({ type: "Despesa", description: e.description, date: formatDate(e.date), amount: formatCurrency(e.amount), category: e.category })),
      { type: "Tipo", description: "Descrição", date: "Data", amount: "Valor", category: "Categoria" }
    );
    downloadCsv(csv, `relatorio-${r.period.toLowerCase()}-${r.periodKey}`);
  }

  const netProfit = data ? data.totalRevenue - data.totalExpenses : 0;
  const profitMargin = data && data.totalRevenue > 0 ? ((netProfit / data.totalRevenue) * 100) : 0;

  function handleExport(metric: string) {
    if (!data) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const tone = (v: number) => (v >= 0 ? "green" : "red");

    const periodLabel: Record<string, string> = {
      week: "Semana actual",
      month: "Mês actual",
      quarter: "Trimestre actual",
      year: "Ano actual",
    };

    win.document.write(
      buildReportHtml({
        title: "Relatório Financeiro",
        subtitle: metric,
        period: periodLabel[period] || "Mês actual",
        company,
        sections: [
          {
            heading: "Resultados",
            metrics: [
              { label: "Receita Total", value: formatCurrency(data.totalRevenue), tone: "green" },
              { label: "Total de Vendas", value: String(data.totalSales) },
              { label: "Total de Compras", value: formatCurrency(data.totalPurchases) },
              { label: "Total de Despesas", value: formatCurrency(data.totalExpenses), tone: "red" },
              { label: "Lucro Líquido", value: formatCurrency(netProfit), tone: tone(netProfit) },
              { label: "Margem de Lucro", value: `${profitMargin.toFixed(1)}%` },
            ],
          },
          {
            heading: "Carteira e Fundos",
            metrics: [
              { label: "Faturas Pendentes", value: `${data.pendingInvoices} (${formatCurrency(data.pendingInvoicesTotal)})` },
              { label: "Fundos Ganhos (faturas pagas)", value: formatCurrency(data.totalIncome || 0), tone: "green" },
              { label: "Entradas no Mês", value: formatCurrency(data.monthIncome || 0), tone: "green" },
              { label: "Saídas no Mês", value: formatCurrency(data.monthExpense || 0), tone: "red" },
              { label: "Saldo Contábil", value: formatCurrency(data.balance || 0), tone: tone(data.balance || 0) },
              { label: "Orçamentos Pendentes", value: `${data.pendingQuotes || 0} (${formatCurrency(data.pendingQuotesTotal || 0)})` },
            ],
          },
          ...(data.recentSales.length ? [{
            heading: "Últimas Vendas",
            table: {
              headers: ["Data", "Cliente", "Total"],
              rows: data.recentSales.map((s) => [formatDate(s.date), s.customer?.name || "—", formatCurrency(s.total)]),
            },
          }] : []),
          ...(data.recentExpenses?.length ? [{
            heading: "Últimas Despesas",
            table: {
              headers: ["Descrição", "Categoria", "Data", "Valor"],
              rows: data.recentExpenses.map((e) => [e.description, e.category || "—", formatDate(e.date), formatCurrency(e.amount)]),
            },
          }] : []),
        ],
      },
      getCspNonce()
    ));
    win.document.close();
  }

  if (loading) return <div className="p-12 text-center text-gray-400">A carregar...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="text-gray-500 text-sm">Análise financeira completa do seu negócio</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="week">Esta Semana</option>
          <option value="month">Este Mês</option>
          <option value="quarter">Este Trimestre</option>
          <option value="year">Este Ano</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={TrendingUp} label="Receita Total" value={formatCurrency(data?.totalRevenue || 0)} color="green" />
        <SummaryCard icon={CreditCard} label="Despesas" value={formatCurrency(data?.totalExpenses || 0)} color="red" />
        <SummaryCard icon={DollarSign} label="Lucro Líquido" value={formatCurrency(netProfit)} color={netProfit >= 0 ? "blue" : "red"} />
        <SummaryCard icon={BarChart3} label="Margem" value={`${profitMargin.toFixed(1)}%`} color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Total Vendas</p>
          <p className="text-2xl font-bold text-gray-900">{data?.totalSales || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Compras</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data?.totalPurchases || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Faturas Pendentes</p>
          <p className="text-2xl font-bold text-gray-900">{data?.pendingInvoices || 0}</p>
          <p className="text-xs text-orange-500">{formatCurrency(data?.pendingInvoicesTotal || 0)}</p>
        </div>
      </div>

      {data?.monthlySales && data.monthlySales.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tendência de Vendas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} Kz`, "Total"]} />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: "#2563eb", r: 4 }} name="Vendas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {data?.monthlySales && data.monthlySales.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Vendas Mensais</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} Kz`, "Total"]} />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} name="Total (Kz)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {data?.categorySales && data.categorySales.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Vendas por Categoria</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.categorySales} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {data.categorySales.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} Kz`, "Total"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-semibold text-gray-900">Relatórios Automáticos</h2>
            <p className="text-sm text-gray-500">Gerados mensalmente, no fim de cada trimestre e no fim do ano.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => generateReport("monthly")} disabled={generating} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <RefreshCw className="w-4 h-4" /> Gerar Mensal
            </button>
            <button onClick={() => generateReport("quarterly")} disabled={generating} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              <RefreshCw className="w-4 h-4" /> Gerar Trimestral
            </button>
            <button onClick={() => generateReport("annual")} disabled={generating} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50">
              <RefreshCw className="w-4 h-4" /> Gerar Anual
            </button>
          </div>
        </div>

        {reports.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Nenhum relatório gerado ainda. Os relatórios são criados automaticamente ou via botões acima.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left p-3 font-medium">Período</th>
                  <th className="text-left p-3 font-medium">Mês / Período</th>
                  <th className="text-right p-3 font-medium">Vendas</th>
                  <th className="text-right p-3 font-medium">Faturas Pagas</th>
                  <th className="text-right p-3 font-medium">Despesas</th>
                  <th className="text-right p-3 font-medium">Resultado</th>
                  <th className="text-right p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.period === "MENSAL" ? "bg-blue-50 text-blue-700" : r.period === "TRIMESTRAL" ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-700"
                      }`}>{r.period}</span>
                    </td>
                    <td className="p-3 font-medium text-gray-900">{r.label}</td>
                    <td className="p-3 text-right text-gray-700">{r.totalSales} ({formatCurrency(r.totalRevenue)})</td>
                    <td className="p-3 text-right text-green-600">{r.invoicesPaid} ({formatCurrency(r.invoicesPaidTotal)})</td>
                    <td className="p-3 text-right text-red-500">{formatCurrency(r.totalExpenses)}</td>
                    <td className={`p-3 text-right font-semibold ${r.netResult >= 0 ? "text-green-600" : "text-red-500"}`}>{formatCurrency(r.netResult)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => exportReportCsv(r)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Exportar Relatórios</h2>
          <div className="space-y-2">
            <ExportButton icon={DollarSign} label="Receitas e Despesas" color="green" onClick={() => handleExport("Receitas e Despesas")} />
            <ExportButton icon={ShoppingCart} label="Vendas por Período" color="blue" onClick={() => handleExport("Vendas por Período")} />
            <ExportButton icon={BarChart3} label="Relatório Completo" color="purple" onClick={() => handleExport("Relatório Completo")} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Resumo</h2>
          {data && (
            <div className="space-y-3">
              <SummaryRow label="Receita Total (Vendas)" value={formatCurrency(data.totalRevenue)} color="green" />
              <SummaryRow label="Total de Despesas" value={formatCurrency(data.totalExpenses)} color="red" />
              <SummaryRow label="Total de Compras" value={formatCurrency(data.totalPurchases)} color="gray" />
              <div className="border-t border-gray-100 pt-3">
                <SummaryRow label="Fundos / Ganhos Contabilizados (faturas pagas)" value={formatCurrency(data.totalIncome || 0)} color="green" bold />
                <p className="text-[11px] text-gray-400 mt-1">Valor das faturas marcadas como pagas, movimentado nos fundos da empresa.</p>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <SummaryRow label="Saldo Líquido" value={formatCurrency(netProfit)} color={netProfit >= 0 ? "green" : "red"} bold />
                <SummaryRow label="Saldo Contábil (entradas - pagamentos)" value={formatCurrency(data.balance || 0)} color={data.balance >= 0 ? "green" : "red"} bold />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  const colors: Record<string, string> = { green: "text-green-600", red: "text-red-500", gray: "text-gray-900" };
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : "font-semibold"} ${colors[color] || "text-gray-900"}`}>{value}</span>
    </div>
  );
}

function ExportButton({ icon: Icon, label, color, onClick }: { icon: LucideIcon; label: string; color: string; onClick: () => void }) {
  const colors: Record<string, string> = { green: "text-green-600", blue: "text-blue-600", purple: "text-purple-600" };
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${colors[color]}`} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <Download className="w-4 h-4 text-gray-400" />
    </button>
  );
}
