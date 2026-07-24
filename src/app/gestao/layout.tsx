"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GestaoLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-ib-muted">A carregar...</div>
      </div>
    );
  }

  if (user?.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-10 rounded-2xl border border-gray-200 shadow-lg max-w-md">
          <h1 className="text-xl font-bold text-ib-primary mb-2">Acesso Restrito</h1>
          <p className="text-ib-muted text-sm">Os administradores utilizam o painel <a href="/admin" className="text-ib-accent hover:underline font-medium">/admin</a>.</p>
        </div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

