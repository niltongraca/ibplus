"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search, Settings, LogOut } from "lucide-react";

const moduleNames: Record<string, string> = {
  gestao: "Gestão",
  finance: "Finance",
  crm: "CRM",
  store: "Store",
  ia: "IA",
  marketing: "Marketing",
  rh: "RH",
};

export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const currentModule = segments[0] || "";
  const currentPage = segments[1] || "";

  const moduleLabel = moduleNames[currentModule] || "IBPlus";

  const pageLabel = currentPage
    ? currentPage
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "Dashboard";

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          <h1 className="text-xl font-semibold text-ib-primary">
            {moduleLabel}
          </h1>
          <p className="text-sm text-ib-muted">{pageLabel}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ib-muted" />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-ib-surface focus:outline-none focus:ring-2 focus:ring-ib-accent/40 w-64"
            />
          </div>

          <button className="relative p-2 text-ib-muted hover:text-ib-primary rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-ib-danger" />
          </button>

          <button className="p-2 text-ib-muted hover:text-ib-primary rounded-lg hover:bg-gray-100 transition-colors">
            <Settings className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : (
              <>
                <div className="h-8 w-8 rounded-full bg-ib-accent flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="text-sm hidden sm:block">
                  <p className="font-medium text-ib-primary">{user?.name || "Utilizador"}</p>
                  <p className="text-ib-muted text-xs">{user?.email || ""}</p>
                </div>
                <button
                  onClick={logout}
                  className="ml-2 p-2 text-ib-muted hover:text-ib-danger rounded-lg hover:bg-gray-100 transition-colors"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
