"use client";

import { useState, useEffect } from "react";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface DashboardData {
  totalRevenue: number;
  todaySales: number;
  totalCustomers: number;
  totalProducts: number;
  pendingInvoices: number;
  pendingInvoicesTotal: number;
  productsLowStock: number;
  recentSales: { id: string; total: number; date: string; customer: { name: string } | null }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Dashboard</h1>
        <p className="text-ib-muted text-sm">Visão geral do negócio</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Receita Total</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data ? formatCurrency(data.totalRevenue) : "—"}</p>
          {data && data.todaySales > 0 && (
            <p className="text-xs text-green-600 mt-1">+{formatCurrency(data.todaySales)} hoje</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-blue-600" /></div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Vendas</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data?.totalProducts || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Clientes</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data?.totalCustomers || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center"><Package className="w-5 h-5 text-orange-600" /></div>
            <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">Produtos</span>
          </div>
          <p className="text-2xl font-bold text-ib-primary">{data?.totalProducts || 0}</p>
          {data && data.productsLowStock > 0 && (
            <p className="text-xs text-red-500 mt-1">{data.productsLowStock} com stock crítico</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ib-primary">Vendas Recentes</h2>
            <Link href="/gestao/vendas" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data?.recentSales?.length ? (
            <div className="divide-y divide-gray-100">
              {data.recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-ib-primary">{sale.customer?.name || "Cliente"}</p>
                    <p className="text-xs text-ib-muted">{formatDate(sale.date)}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(sale.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ib-muted py-8 text-center">Nenhuma venda recente.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ib-primary">Resumo Financeiro</h2>
            <Link href="/finance/relatorios" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1">
              Relatórios <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {data ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-ib-muted">Receita</span>
                </div>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(data.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-ib-muted">Faturas Pendentes</span>
                </div>
                <span className="text-sm font-semibold text-red-500">{data.pendingInvoices} ({formatCurrency(data.pendingInvoicesTotal)})</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-ib-primary">Produtos em Stock</span>
                <span className="text-sm font-bold text-ib-primary">{data.totalProducts}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ib-muted py-8 text-center">Sem dados disponíveis.</p>
          )}
        </div>
      </div>
    </div>
  );
}
