"use client";

import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

const axisTick = { fontSize: 11, fill: "#94a3b8" };
const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 12px rgba(0,0,0,.06)",
  fontSize: 12,
};

function KzTooltip({ active, payload, label, suffix = " Kz" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-xs">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-gray-600">
          <span style={{ color: p.color || p.fill || "#2563eb" }}>●</span>{" "}
          {p.name}: <b>{Number(p.value).toLocaleString()}{suffix}</b>
        </p>
      ))}
    </div>
  );
}

export function ChartsWidget({ data }: { data: { monthlySales?: any[]; categorySales?: any[] } | null }) {
  if (!data) return null;
  const { monthlySales, categorySales } = data;
  const hasMonthly = monthlySales && monthlySales.length > 0;
  const hasCategory = categorySales && categorySales.length > 0;
  if (!hasMonthly && !hasCategory) return null;

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      {/* Sales trend — area chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Tendência de Vendas
          </h3>
          <span className="text-xs text-gray-400">Últimos 6 meses</span>
        </div>
        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlySales} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={64} />
              <Tooltip content={<KzTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Vendas"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#salesGrad)"
                dot={{ fill: "#2563eb", r: 3.5, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#1d4ed8" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-ib-muted py-16 text-center">Sem dados suficientes.</p>
        )}
      </div>

      {/* Category share — donut */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Vendas por Categoria
          </h3>
          <span className="text-xs text-gray-400">Partilha</span>
        </div>
        {hasCategory ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categorySales}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                stroke="none"
              >
                {categorySales.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<KzTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#64748b" }}
                formatter={(value: any) => <span className="text-[11px] text-gray-500">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-ib-muted py-16 text-center">Sem dados suficientes.</p>
        )}
      </div>
    </div>
  );
}
