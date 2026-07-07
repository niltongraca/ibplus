"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Dashboard</h1>
        <p className="text-ib-muted text-sm">Visão geral do negócio</p>
      </div>
      <DashboardRenderer widgets={widgets} data={data} />
    </div>
  );
}
