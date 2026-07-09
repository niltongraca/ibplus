"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Shield, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getSidebarConfig } from "@/config/sidebar";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();
  const groups = getSidebarConfig(user?.accountType || "");

  const sidebarContent = (
    <nav className="px-3 py-4 space-y-6 overflow-y-auto h-full">
      {groups.map((group) => (
        <div key={group.name}>
          <div className="flex items-center gap-2 px-3 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-ib-muted">
              {group.name}
            </span>
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px]",
                      isActive
                        ? "bg-ib-accent/20 text-ib-light font-medium"
                        : "text-ib-muted hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {user?.role === "admin" && (
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 mb-1">
            <Shield className="w-4 h-4 text-ib-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ib-accent">Admin</span>
          </div>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/admin"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px]",
                  pathname.startsWith("/admin")
                    ? "bg-ib-accent/20 text-ib-light font-medium"
                    : "text-ib-muted hover:text-white hover:bg-white/5"
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Admin da Plataforma
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 lg:w-64 xl:w-[280px] bg-ib-primary text-white flex-col">
        <div className="flex items-center justify-between px-4 lg:px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ib-accent font-bold text-lg">
              IB
            </div>
            <span className="font-semibold text-lg tracking-tight">
              IBPlus<sup className="text-ib-accent font-bold">+</sup>
            </span>
          </div>
          <Link href="/" className="text-ib-muted hover:text-white transition-colors p-1" title="Voltar ao início">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </Link>
        </div>
        {sidebarContent}
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden animate-fade-in"
          onClick={onClose}
        >
          <aside
            className="fixed left-0 top-0 z-50 h-screen w-[280px] bg-ib-primary text-white flex-col animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ib-accent font-bold text-lg">
                  IB
                </div>
                <span className="font-semibold text-lg tracking-tight">
                  IBPlus<sup className="text-ib-accent font-bold">+</sup>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Link href="/" className="text-ib-muted hover:text-white transition-colors p-1" title="Voltar ao início">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </Link>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5 text-ib-muted" />
                </button>
              </div>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
