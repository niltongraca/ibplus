"use client";

import { useState, useEffect } from "react";
import { Sparkles, ShoppingCart, Users, TrendingUp, AlertTriangle, Package, Lightbulb } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardData {
  totalRevenue: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  totalEmployees: number;
  productsLowStock: number;
  lowStockProducts: { id: string; name: string; stock: number; minStock: number }[];
  recentSales: { id: string; total: number; date: string; customer: { name: string } | null }[];
  recentClients: { id: string; name: string; email: string | null }[];
}

export default function RecomendacoesPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;
  if (!data) return null;

  const recommendations: { title: string; detail: string; icon: any; color: string; bg: string }[] = [];
  if (data.productsLowStock > 0) {
    recommendations.push({
      title: "Reabastecer stock",
      detail: `${data.productsLowStock} produto${data.productsLowStock > 1 ? "s" : ""} com stock crítico.${data.lowStockProducts?.length ? ` Prioridade: ${data.lowStockProducts.slice(0, 3).map((p) => p.name).join(", ")}.` : ""}`,
      icon: Package,
      color: "text-orange-600",
      bg: "bg-orange-50",
    });
  }
  if (data.totalCustomers > 0 && data.totalSales > 0) {
    const avgPerCustomer = data.totalRevenue / data.totalCustomers;
    if (avgPerCustomer < 10000) {
      recommendations.push({
        title: "Aumentar ticket médio",
        detail: `O ticket médio por cliente é de ${formatCurrency(avgPerCustomer)}. Considere criar pacotes promocionais ou programas de fidelidade.`,
        icon: TrendingUp,
        color: "text-green-600",
        bg: "bg-green-50",
      });
    }
  }
  if (data.recentClients && data.recentClients.length > 0) {
    recommendations.push({
      title: "Follow-up com novos clientes",
      detail: `${data.recentClients.length} novo${data.recentClients.length > 1 ? "s" : ""} cliente${data.recentClients.length > 1 ? "s" : ""} registado${data.recentClients.length > 1 ? "s" : ""} recentemente. Active campanhas de boas-vindas para aumentar a retenção.`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    });
  }
  if (data.totalSales > 0) {
    recommendations.push({
      title: "Analisar produtos mais vendidos",
      detail: `${data.totalSales} venda${data.totalSales > 1 ? "s" : ""} realizada${data.totalSales > 1 ? "s" : ""}. Reveja quais produtos têm maior saída e optimize o stock desses itens.`,
      icon: ShoppingCart,
      color: "text-purple-600",
      bg: "bg-purple-50",
    });
  }
  if (data.totalRevenue > 50000) {
    recommendations.push({
      title: "Oportunidade de expansão",
      detail: `Com receita de ${formatCurrency(data.totalRevenue)}, considere expandir para novas categorias de produtos ou serviços.`,
      icon: Lightbulb,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    });
  }
  if (data.totalEmployees > 0) {
    recommendations.push({
      title: "Gestão de equipa",
      detail: `${data.totalEmployees} colaborador${data.totalEmployees > 1 ? "es" : ""} activo${data.totalEmployees > 1 ? "s" : ""}. Avalie a produtividade e considere programas de incentivo.`,
      icon: Users,
      color: "text-red-600",
      bg: "bg-red-50",
    });
  }
  recommendations.push({
    title: "Presença digital",
    detail: "Mantenha as redes sociais actualizadas e utilize o WhatsApp Business para comunicar com os clientes.",
    icon: Sparkles,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-ib-accent" />
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Recomendações</h1>
          <p className="text-ib-muted text-sm">Sugestões inteligentes baseadas nos dados reais do seu negócio</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          return (
            <div key={rec.title} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-lg ${rec.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${rec.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-ib-primary text-sm mb-1">{rec.title}</h3>
                  <p className="text-sm text-ib-muted">{rec.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.recentSales && data.recentSales.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-ib-primary mb-2">Vendas Recentes</h3>
          <div className="space-y-2">
            {data.recentSales.map((sale) => (
              <div key={sale.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 text-sm">
                <div>
                  <p className="font-medium text-ib-primary">{sale.customer?.name || "Cliente"}</p>
                  <p className="text-xs text-ib-muted">{formatDate(sale.date)}</p>
                </div>
                <span className="font-semibold text-ib-accent">{formatCurrency(sale.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
