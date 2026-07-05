"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Store, ArrowRight, LogIn, UserPlus } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const defaultRoute = user.role === "admin" ? "/admin" : "/gestao/dashboard";
      router.replace(defaultRoute);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-ib-muted">A carregar...</div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-ib-accent flex items-center justify-center font-bold text-xl text-white">IB</div>
            <span className="font-bold text-2xl text-ib-primary">IBPlus<sup className="text-ib-accent font-bold">+</sup></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ib-primary hover:bg-gray-100 rounded-lg transition-colors">
              <LogIn className="w-4 h-4" /> Entrar
            </Link>
            <Link href="/cadastro" className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ib-accent text-white rounded-lg hover:bg-blue-700 transition-colors">
              <UserPlus className="w-4 h-4" /> Criar Conta
            </Link>
          </div>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold text-ib-primary mb-6 leading-tight">
            A plataforma inteligente para gerir e fazer crescer o seu negócio
          </h1>
          <p className="text-lg text-ib-muted mb-8">
            Gestão, Finance, CRM, Store, IA, Marketing e RH — tudo num só lugar.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/cadastro" className="inline-flex items-center gap-2 px-6 py-3 bg-ib-accent text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-base">
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/praca" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-ib-primary rounded-lg font-medium hover:bg-gray-50 transition-colors text-base">
              <Store className="w-4 h-4" /> Explorar Praça
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
