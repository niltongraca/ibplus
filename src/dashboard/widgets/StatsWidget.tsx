"use client";

import { DollarSign, ShoppingCart, Users, Package, Briefcase, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatsData {
  totalRevenue: number;
  todaySales: number;
  totalCustomers: number;
  totalProducts: number;
  productsLowStock: number;
  totalEmployees: number;
  totalServices: number;
  pendingInvoices: number;
  totalSales: number;
}

export function StatsWidget({ data }: { data: StatsData | null }) {
  if (!data) return null;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard icon={DollarSign} label="Receita Total" value={formatCurrency(data.totalRevenue)} color="green" sub={data.todaySales > 0 ? `+${formatCurrency(data.todaySales)} hoje` : undefined} />
      <StatCard icon={ShoppingCart} label="Total de Vendas" value={String(data.totalSales)} color="blue" sub={`${formatCurrency(data.todaySales)} hoje`} />
      <StatCard icon={Users} label="Clientes" value={String(data.totalCustomers)} color="purple" />
      <StatCard icon={Package} label="Produtos" value={String(data.totalProducts)} color="orange" sub={data.productsLowStock > 0 ? `${data.productsLowStock} stock baixo` : undefined} />
      <StatCard icon={Briefcase} label="Funcionários" value={String(data.totalEmployees)} color="blue" />
      <StatCard icon={FileText} label="Serviços" value={String(data.totalServices)} color="green" />
      <StatCard icon={FileText} label="Faturas Pendentes" value={String(data.pendingInvoices)} color="red" />
      <StatCard icon={Package} label="Stock Baixo" value={String(data.productsLowStock)} color={data.productsLowStock > 0 ? "red" : "green"} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string; color: string; sub?: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className={`text-xs mt-1 ${sub.includes("baixo") || sub.includes("Pendentes") ? "text-red-500" : "text-green-600"}`}>{sub}</p>}
    </div>
  );
}
