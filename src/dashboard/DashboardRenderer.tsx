"use client";

import type { DashboardWidget } from "./getDashboard";
import { StatsWidget } from "./widgets/StatsWidget";
import { SalesWidget } from "./widgets/SalesWidget";
import { FinanceWidget } from "./widgets/FinanceWidget";
import { PlaceholderWidget } from "./widgets/PlaceholderWidget";
import { Users, Heart, GraduationCap, Handshake, Package, Briefcase, Megaphone } from "lucide-react";

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

const placeholderIcons: Record<string, any> = {
  clients: Users,
  products: Package,
  services: Briefcase,
  hr: Users,
  donations: Heart,
  students: GraduationCap,
  campaigns: Megaphone,
  inventory: Package,
};

export function DashboardRenderer({ widgets, data }: { widgets: DashboardWidget[]; data: DashboardData | null }) {
  return (
    <div>
      {widgets.map((widget) => {
        switch (widget.id) {
          case "stats":
            return <StatsWidget key="stats" data={data} />;
          case "sales":
            return (
              <div key="sales" className="mb-6">
                <SalesWidget sales={data?.recentSales} />
              </div>
            );
          case "finance":
            return (
              <div key="finance" className="mb-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {data && <FinanceWidget data={data} />}
                  <PlaceholderWidget icon={Handshake} title={widget.title} description={widget.description} />
                </div>
              </div>
            );
          default:
            return (
              <div key={widget.id} className="mb-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <PlaceholderWidget icon={placeholderIcons[widget.id] || Package} title={widget.title} description={widget.description} />
                </div>
              </div>
            );
        }
      })}
    </div>
  );
}
