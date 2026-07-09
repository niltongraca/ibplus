"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import ErrorBoundary from "../ErrorBoundary";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-secondary)", backgroundImage: "radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.03) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(37, 99, 235, 0.03) 0%, transparent 50%)" }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:ml-60 lg:ml-64 xl:ml-[280px] flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
