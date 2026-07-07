"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface MonthlySales {
  month: string;
  total: number;
  count: number;
}

interface CategorySales {
  name: string;
  value: number;
}

interface ChartsData {
  monthlySales: MonthlySales[];
  categorySales: CategorySales[];
}

export function ChartsWidget({ data }: { data: { monthlySales?: MonthlySales[]; categorySales?: CategorySales[] } | null }) {
  if (!data) return null;
  const { monthlySales, categorySales } = data;
  if ((!monthlySales || monthlySales.length === 0) && (!categorySales || categorySales.length === 0)) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-ib-accent" />
        <h2 className="font-semibold text-ib-primary">Gráficos</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {monthlySales && monthlySales.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-ib-muted mb-4">Vendas Mensais</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} name="Total (Kz)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {categorySales && categorySales.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-ib-muted mb-4">Vendas por Categoria</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categorySales} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}>
                  {categorySales.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
