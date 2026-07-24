"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

interface MonthlySales {
  month: string;
  total: number;
  count: number;
}

interface CategorySales {
  name: string;
  value: number;
}

export function ChartsWidget({ data }: { data: { monthlySales?: MonthlySales[]; categorySales?: CategorySales[] } | null }) {
  if (!data) return null;
  const { monthlySales, categorySales } = data;
  if ((!monthlySales || monthlySales.length === 0) && (!categorySales || categorySales.length === 0)) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900">Análise Gráfica</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {monthlySales && monthlySales.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Tendência de Vendas (6 meses)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} Kz`, "Total"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ fill: "#2563eb", r: 4 }}
                  activeDot={{ r: 6, fill: "#1d4ed8" }}
                  name="Vendas"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {monthlySales && monthlySales.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Volume de Vendas</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} Kz`, "Total"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} name="Total (Kz)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {categorySales && categorySales.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 md:col-span-2">
            <h3 className="text-sm font-medium text-gray-600 mb-4">Vendas por Categoria</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={45}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categorySales.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${Number(value).toLocaleString()} Kz`, "Total"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
