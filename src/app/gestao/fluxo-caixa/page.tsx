"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CashFlowItem {
  id: string;
  type: "receita" | "despesa";
  description: string;
  amount: number;
  date: string;
}

export default function FluxoCaixaPage() {
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [items, setItems] = useState<CashFlowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/sales").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ]).then(([salesData, expensesData]) => {
      const sales = salesData.sales || [];
      const exps = expensesData.expenses || [];
      const totalRevenue = sales.reduce((s: number, sale: any) => s + sale.total, 0);
      const totalExpenses = exps.reduce((s: number, exp: any) => s + exp.amount, 0);
      setRevenue(totalRevenue);
      setExpenses(totalExpenses);

      const mapped: CashFlowItem[] = [
        ...sales.map((s: any) => ({ id: s.id, type: "receita" as const, description: `Venda - ${s.customer?.name || "Cliente"}`, amount: s.total, date: s.date })),
        ...exps.map((e: any) => ({ id: e.id, type: "despesa" as const, description: e.description, amount: e.amount, date: e.date })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setItems(mapped);
    }).catch((err) => console.error("Erro ao carregar fluxo de caixa:", err)).finally(() => setLoading(false));
  }, []);

  const balance = revenue - expenses;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-ib-accent" />
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Fluxo de Caixa</h1>
          <p className="text-ib-muted text-sm">Acompanhe as entradas e saídas financeiras</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Entradas</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(revenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Saídas</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Saldo</span>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-ib-primary" : "text-red-600"}`}>{formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-ib-primary">Movimentações</h2>
        </div>
        {loading ? <div className="p-12 text-center text-ib-muted">A carregar...</div>
        : items.length === 0 ? (
          <div className="p-12 text-center"><BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-ib-muted">Nenhum movimento registado.</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.type === "receita" ? "bg-green-50" : "bg-red-50"}`}>
                    {item.type === "receita" ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ib-primary">{item.description}</p>
                    <p className="text-xs text-ib-muted">{formatDate(item.date)}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${item.type === "receita" ? "text-green-600" : "text-red-600"}`}>
                  {item.type === "receita" ? "+" : "-"}{formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
