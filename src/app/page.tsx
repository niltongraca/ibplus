"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Store, ArrowRight, LogIn, UserPlus, LayoutDashboard, ShoppingCart,
  BarChart3, Users, Smartphone, BookOpen, Globe, Shield, Zap, CheckCircle
} from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse" style={{ color: "var(--text-muted)" }}>A carregar...</div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div>
      <SiteHeader />

      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight" style={{ color: "var(--text-primary)" }}>
          A plataforma inteligente para gerir e fazer crescer o seu negócio
        </h1>
        <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-10" style={{ color: "var(--text-muted)" }}>
          Gestão, Finance, CRM, Store, IA, Marketing e RH — tudo num só lugar.
          Adaptado ao seu tipo de conta: empreendedor, empresa, ONG, associação, educação ou cooperativa.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/cadastro" className="glass-btn-primary inline-flex items-center gap-2 px-6 py-3 text-base shadow-lg">
            Começar Agora <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/praca" className="glass-btn inline-flex items-center gap-2 px-6 py-3 text-base" style={{ color: "var(--text-primary)" }}>
            <Store className="w-4 h-4" /> Explorar a Praça
          </Link>
          <Link href="/sobre" className="glass-btn inline-flex items-center gap-2 px-6 py-3 text-base" style={{ color: "var(--text-primary)" }}>
            Saber Mais
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "var(--text-primary)" }}>Módulos da Plataforma</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((mod) => (
            <div key={mod.name} className="glass-card p-5 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
                <mod.icon className="w-5 h-5 text-ib-accent" />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{mod.name}</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{mod.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: "var(--text-primary)" }}>Porquê o IBPlus+?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b, i) => (
            <div key={i} className="glass-card flex items-start gap-3 p-4">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Pronto para começar?</h2>
        <p className="mb-8" style={{ color: "var(--text-muted)" }}>Crie a sua conta gratuitamente e explore todas as funcionalidades.</p>
        <Link href="/cadastro" className="glass-btn-primary inline-flex items-center gap-2 px-8 py-3 text-lg shadow-lg">
          <UserPlus className="w-5 h-5" /> Criar Conta Grátis
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
