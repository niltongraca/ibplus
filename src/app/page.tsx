"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Store, ArrowRight, LogIn, UserPlus, LayoutDashboard, ShoppingCart,
  BarChart3, Users, Smartphone, BookOpen, Globe, Shield, Zap, CheckCircle
} from "lucide-react";

const modules = [
  { icon: LayoutDashboard, name: "Dashboard", desc: "Visão geral do seu negócio" },
  { icon: Users, name: "CRM", desc: "Gestão de clientes e relacionamento" },
  { icon: ShoppingCart, name: "Vendas", desc: "Controlo de vendas e facturação" },
  { icon: BarChart3, name: "Financeiro", desc: "Fluxo de caixa, despesas e relatórios" },
  { icon: Store, name: "Praça", desc: "Exponha os seus produtos online" },
  { icon: Smartphone, name: "RH", desc: "Equipa, férias e presenças" },
  { icon: BookOpen, name: "Educação", desc: "Gestão de alunos e instituições" },
  { icon: Globe, name: "Marketing", desc: "Campanhas e fidelização" },
];

const benefits = [
  "Multi-tipo: Empreendedor, Empresa, ONG, Associação, Educação, Cooperativa",
  "RBAC dinâmico — permissões por tipo de conta",
  "Dashboard inteligente adaptado ao seu perfil",
  "Facturação e orçamentos profissionais",
  "Praça online para expor produtos e serviços",
  "Módulo de Educação com gestão de alunos",
  "100% gratuito — sem custos escondidos",
  "Suporte a Neon (PostgreSQL serverless)",
];

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
      <header className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-bold text-2xl text-ib-primary">IBPlus<sup className="text-ib-accent font-bold">+</sup></span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-ib-muted">
          <Link href="/praca" className="hover:text-ib-accent transition-colors">Praça</Link>
          <Link href="/rede" className="hover:text-ib-accent transition-colors">Rede</Link>
          <Link href="/sobre" className="hover:text-ib-accent transition-colors">Sobre</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ib-primary hover:bg-gray-100 rounded-lg transition-colors">
            <LogIn className="w-4 h-4" /> Entrar
          </Link>
          <Link href="/cadastro" className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-ib-accent text-white rounded-lg hover:bg-blue-700 transition-colors">
            <UserPlus className="w-4 h-4" /> Criar Conta
          </Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-ib-primary mb-6 leading-tight">
          A plataforma inteligente para gerir e fazer crescer o seu negócio
        </h1>
        <p className="text-lg sm:text-xl text-ib-muted max-w-3xl mx-auto mb-10">
          Gestão, Finance, CRM, Store, IA, Marketing e RH — tudo num só lugar.
          Adaptado ao seu tipo de conta: empreendedor, empresa, ONG, associação, educação ou cooperativa.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/cadastro" className="inline-flex items-center gap-2 px-6 py-3 bg-ib-accent text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-base shadow-lg shadow-blue-500/20">
            Começar Agora <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/praca" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-ib-primary rounded-lg font-medium hover:bg-gray-50 transition-colors text-base">
            <Store className="w-4 h-4" /> Explorar a Praça
          </Link>
          <Link href="/sobre" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-ib-primary rounded-lg font-medium hover:bg-gray-50 transition-colors text-base">
            Saber Mais
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-ib-primary text-center mb-12">Módulos da Plataforma</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((mod) => (
            <div key={mod.name} className="glass-card p-5 hover:shadow-md hover:border-ib-accent/30 transition-all">
              <div className="w-10 h-10 rounded-lg bg-ib-accent/10 flex items-center justify-center mb-3">
                <mod.icon className="w-5 h-5 text-ib-accent" />
              </div>
              <h3 className="font-semibold text-ib-primary mb-1">{mod.name}</h3>
              <p className="text-sm text-ib-muted">{mod.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#0a1628] via-[#0f1f3d] to-[#1a2a4a] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Porquê o IBPlus+?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-100">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-ib-primary mb-4">Pronto para começar?</h2>
        <p className="text-ib-muted mb-8">Crie a sua conta gratuitamente e explore todas as funcionalidades.</p>
        <Link href="/cadastro" className="inline-flex items-center gap-2 px-8 py-3 bg-ib-accent text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-lg shadow-lg shadow-blue-500/20">
          <UserPlus className="w-5 h-5" /> Criar Conta Grátis
        </Link>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-xs text-ib-muted">
        <p>IBPlus+ — Plataforma de Gestão Empresarial. &copy; {new Date().getFullYear()}</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/sobre" className="hover:text-ib-accent">Sobre</Link>
          <Link href="/praca" className="hover:text-ib-accent">Praça</Link>
          <Link href="/rede" className="hover:text-ib-accent">Rede</Link>
        </div>
      </footer>
    </div>
  );
}
