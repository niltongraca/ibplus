"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { FilePlus2, Users, Package, ReceiptText } from "lucide-react";
import { getDashboard } from "@/dashboard/getDashboard";
import { DashboardRenderer, type DashboardData } from "@/dashboard/DashboardRenderer";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const widgets = getDashboard(user?.accountType || "");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch((err) => console.error("Erro ao carregar dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-ib-muted">A carregar...</div>;

  const firstName = user?.name?.split(" ")[0] || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-ib-muted">
            {greeting},{firstName ? ` ${firstName}` : ""} 👋
          </p>
          <h1 className="text-2xl font-bold text-ib-primary">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 text-sm text-ib-muted">
            <Users className="w-4 h-4" /> {data?.totalCustomers || 0} clientes
            <span className="mx-1 text-gray-300">•</span>
            <Package className="w-4 h-4" /> {data?.totalProducts || 0} produtos
            <span className="mx-1 text-gray-300">•</span>
            <ReceiptText className="w-4 h-4" /> {data?.totalSales || 0} vendas
          </div>
          <Link
            href="/gestao/vendas/nova"
            className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
          >
            <FilePlus2 className="w-4 h-4" /> Registrar Venda
          </Link>
        </div>
      </div>
      <DashboardRenderer widgets={widgets} data={data} />
    </div>
  );
}
