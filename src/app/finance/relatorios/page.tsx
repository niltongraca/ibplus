"use client";

import { useState, useEffect } from "react";
import { BarChart3, Download, TrendingUp, DollarSign, ShoppingCart, CreditCard, PieChart as PieIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface ReportData {
  totalRevenue: number;
  totalSales: number;
  totalExpenses: number;
  totalPurchases: number;
  pendingInvoices: number;
  pendingInvoicesTotal: number;
  recentSales: { id: string; total: number; date: string; customer: { name: string } | null }[];
  monthlySales?: { month: string; total: number; count: number }[];
  categorySales?: { name: string; value: number }[];
  totalExpensesData?: number;
  recentExpenses?: { id: string; description: string; amount: number; date: string; category: string }[];
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

  const netProfit = data ? data.totalRevenue - data.totalExpenses : 0;
  const profitMargin = data && data.totalRevenue > 0 ? ((netProfit / data.totalRevenue) * 100) : 0;

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
          <div class="card"><h3>Lucro Líquido</h3><p>${formatCurrency(netProfit)}</p></div>
          <div class="card"><h3>Faturas Pendentes</h3><p>${data.pendingInvoices} (${formatCurrency(data.pendingInvoicesTotal)})</p></div>
          <div class="card"><h3>Margem de Lucro</h3><p>${profitMargin.toFixed(1)}%</p></div>
        </div>
        ${data.recentSales.length > 0 ? `
        <h2>Últimas Vendas</h2>
        <table>
          <tr><th>Data</th><th>Cliente</th><th>Total</th></tr>
          ${data.recentSales.map(s => `<tr><td>${new Date(s.date).toLocaleDateString("pt-AO")}</td><td>${s.customer?.name || "—"}</td><td>${formatCurrency(s.total)}</td></tr>`).join("")}
        </table>` : ""}
        <div class="footer">IBPlus+ — Plataforma de Gestão Empresarial | Relatório gerado automaticamente</div>
        <script>window.print();<\/script>
      </body>
      </html>
    `);
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
              <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} Kz`, "Total"]} />
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
                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} Kz`, "Total"]} />
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
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {data.categorySales.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} Kz`, "Total"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
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
              <SummaryRow label="Receita Total" value={formatCurrency(data.totalRevenue)} color="green" />
              <SummaryRow label="Total de Despesas" value={formatCurrency(data.totalExpenses)} color="red" />
              <SummaryRow label="Total de Compras" value={formatCurrency(data.totalPurchases)} color="gray" />
              <div className="border-t border-gray-100 pt-3">
                <SummaryRow label="Saldo Líquido" value={formatCurrency(netProfit)} color={netProfit >= 0 ? "green" : "red"} bold />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
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

function ExportButton({ icon: Icon, label, color, onClick }: { icon: any; label: string; color: string; onClick: () => void }) {
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
