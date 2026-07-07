"use client";

import type { DashboardWidget } from "./getDashboard";
import { StatsWidget } from "./widgets/StatsWidget";
import { SalesWidget } from "./widgets/SalesWidget";
import { FinanceWidget } from "./widgets/FinanceWidget";
import { ClientsWidget } from "./widgets/ClientsWidget";
import { ProductsWidget } from "./widgets/ProductsWidget";
import { InventoryWidget } from "./widgets/InventoryWidget";
import { HRWidget } from "./widgets/HRWidget";
import { ServicesWidget } from "./widgets/ServicesWidget";
import { DonationsWidget } from "./widgets/DonationsWidget";
import { StudentsWidget } from "./widgets/StudentsWidget";
import { CampaignsWidget } from "./widgets/CampaignsWidget";
import { ChartsWidget } from "./widgets/ChartsWidget";

export interface DashboardData {
  totalRevenue: number;
  todaySales: number;
  totalCustomers: number;
  totalProducts: number;
  pendingInvoices: number;
  pendingInvoicesTotal: number;
  productsLowStock: number;
  recentSales: { id: string; total: number; date: string; customer: { name: string } | null }[];
  recentClients: { id: string; name: string; email: string | null; phone: string | null }[];
  totalEmployees: number;
  totalServices: number;
  lowStockProducts: { id: string; name: string; stock: number; minStock: number }[];
  totalDonations: number;
  donationTotal: number;
  totalStudents: number;
  activeCampaigns: number;
  monthlySales?: { month: string; total: number; count: number }[];
  categorySales?: { name: string; value: number }[];
}

export function DashboardRenderer({ widgets, data }: { widgets: DashboardWidget[]; data: DashboardData | null }) {
  return (
    <div>
      <ChartsWidget key="charts" data={data} />
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
                <FinanceWidget data={data} />
              </div>
            );
          case "clients":
            return (
              <div key="clients" className="mb-6">
                <ClientsWidget data={data} />
              </div>
            );
          case "products":
            return (
              <div key="products" className="mb-6">
                <ProductsWidget data={data} />
              </div>
            );
          case "inventory":
            return (
              <div key="inventory" className="mb-6">
                <InventoryWidget data={data} />
              </div>
            );
          case "hr":
            return (
              <div key="hr" className="mb-6">
                <HRWidget data={data} />
              </div>
            );
          case "services":
            return (
              <div key="services" className="mb-6">
                <ServicesWidget data={data} />
              </div>
            );
          case "donations":
            return (
              <div key="donations" className="mb-6">
                <DonationsWidget data={data} />
              </div>
            );
          case "students":
            return (
              <div key="students" className="mb-6">
                <StudentsWidget data={data} />
              </div>
            );
          case "campaigns":
            return (
              <div key="campaigns" className="mb-6">
                <CampaignsWidget data={data} />
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
