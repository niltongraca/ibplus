"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Store, ArrowRight, UserPlus, LayoutDashboard, ShoppingCart,
  BarChart3, Users, Smartphone, BookOpen, Globe, Shield, Zap, CheckCircle,
  Building2, GraduationCap, HeartHandshake, Sparkles, TrendingUp
} from "lucide-react";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import { CountUpStat } from "@/components/site/CountUpStat";
import { Accordion } from "@/components/ui/transitions/Accordion";
import { LearnMore } from "@/components/ui/transitions/LearnMore";

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

const stats = [
  { value: 100, suffix: "%", label: "Gratuito para começar" },
  { value: 6, suffix: "", label: "Tipos de conta" },
  { value: 8, suffix: "+", label: "Módulos integrados" },
  { value: 24, suffix: "/7", label: "Disponibilidade" },
];

const accountTypes = [
  { icon: Building2, label: "Empreendedor" },
  { icon: Building2, label: "Empresa" },
  { icon: HeartHandshake, label: "ONG" },
  { icon: Users, label: "Associação" },
  { icon: GraduationCap, label: "Educação" },
  { icon: Users, label: "Cooperativa" },
];

const faqItems = [
  {
    value: "gratis",
    title: "O IBPlus+ é mesmo gratuito?",
    content: (
      <p>
        Sim. Pode começar a usar a plataforma totalmente de graça, sem custos
        escondidos. Explore todos os módulos e decida depois se deseja evoluir
        para um plano com mais funcionalidades.
      </p>
    ),
  },
  {
    value: "tipos",
    title: "Que tipos de organização suportam?",
    content: (
      <p>
        O IBPlus+ foi desenhado para <strong>Empreendedores, Empresas, ONGs,
        Associações, Educação e Cooperativas</strong>. Cada tipo de conta recebe
        um painel e permissões adaptadas às suas necessidades.
      </p>
    ),
  },
  {
    value: "dados",
    title: "Os meus dados estão seguros?",
    content: (
      <p>
        Utilizamos autenticação segura, verificação de sessões e armazenamento
        em PostgreSQL serverless (Neon). Os teus dados são privados e protegidos
        por permissões por tipo de conta (RBAC).
      </p>
    ),
  },
  {
    value: "comecar",
    title: "Como posso começar?",
    content: (
      <p>
        Basta criar uma conta gratuita, escolher o seu tipo de organização e
        começar a explorar o dashboard intuitivo. Sem cartão de crédito.
      </p>
    ),
  },
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

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-ib-primary pt-16 pb-16">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 75% 40%, rgba(37,99,235,0.35) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 10% 80%, rgba(37,99,235,0.2) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Gestão inteligente para MPMEs angolanas
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
            A plataforma que faz o seu{" "}
            <span className="text-blue-400 relative inline-block">
              negócio crescer
              <span className="absolute bottom-1 left-0 right-0 h-0.5 bg-blue-400/50 rounded-full" />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gestão, Finanças, CRM, Store, IA, Marketing e RH — tudo num só lugar,
            adaptado ao seu tipo de conta: empreendedor, empresa, ONG, associação,
            educação ou cooperativa.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
            <Link href="/cadastro" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-600 text-white px-8 py-4 rounded-full text-base font-semibold shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-0.5">
              Criar Conta Grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/praca" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 px-8 py-4 rounded-full text-base font-semibold transition-all">
              <Store className="w-4 h-4" /> Explorar a Praça
            </Link>
          </div>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { icon: Shield, text: "Seguro e privado", color: "#4ADE80" },
              { icon: Zap, text: "Resultados em minutos", color: "#FACC15" },
              { icon: TrendingUp, text: "Feito para crescer", color: "#60A5FA" },
            ].map((b) => (
              <span key={b.text} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-medium text-white/70">
                <b.icon className="w-4 h-4" style={{ color: b.color }} />
                {b.text}
              </span>
            ))}
          </div>
        </div>

        {/* Ticker */}
        <div className="relative mt-14 bg-ib-accent py-3 overflow-hidden">
          <div className="flex w-max ticker-track whitespace-nowrap">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex">
                {["Dashboard", "Facturação", "CRM", "Praça", "IA", "Marketing", "RH", "Educação", "Financeiro"].map((t) => (
                  <span key={t + dup} className="inline-flex items-center gap-2 text-white font-semibold text-sm px-8">
                    <Sparkles className="w-3.5 h-3.5 opacity-70" /> {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-ib-surface py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="glass-card text-center p-6">
              <div className="text-3xl sm:text-4xl font-extrabold text-ib-accent mb-2">
                <CountUpStat value={s.value} suffix={s.suffix} />
              </div>
              <p className="text-sm text-ib-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MÓDULOS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-ib-accent">Módulos</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ib-primary mt-2 mb-3">
            Uma plataforma, todos os módulos
          </h2>
          <p className="text-ib-muted max-w-xl mx-auto">
            Cada módulo foi pensado para simplificar a gestão do seu negócio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((mod) => (
            <div key={mod.name} className="group glass-card p-6 hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-ib-accent/10 group-hover:bg-ib-accent transition-colors">
                <mod.icon className="w-6 h-6 text-ib-accent group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-bold text-ib-primary mb-1">{mod.name}</h3>
              <p className="text-sm text-ib-muted">{mod.desc}</p>
              <LearnMore className="mt-4 text-ib-accent text-sm font-semibold" underlineClassName="bg-ib-accent" />
            </div>
          ))}
        </div>
      </section>

      {/* ── PORQUÊ / TIPOS DE CONTA ── */}
      <section className="bg-ib-primary py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 20% 10%, rgba(37,99,235,0.25) 0%, transparent 65%)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Porquê o IBPlus+?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-3">
              Feito para todos os tipos de organização
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-12">
            {accountTypes.map((a) => (
              <div key={a.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
                <a.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white/80">{a.label}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              "RBAC dinâmico — permissões por tipo de conta",
              "Dashboard inteligente adaptado ao seu perfil",
              "Facturação e orçamentos profissionais",
              "Praça online para expor produtos e serviços",
              "Módulo de Educação com gestão de alunos",
              "Suporte a Neon (PostgreSQL serverless)",
            ].map((b) => (
              <div key={b} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-white/80">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-ib-accent">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ib-primary mt-2 mb-3">
            Perguntas frequentes
          </h2>
        </div>

        <Accordion
          items={faqItems}
          triggerClassName="font-semibold text-ib-primary text-sm px-5 py-4"
          contentClassName="px-5 pb-5 text-sm text-ib-muted leading-relaxed"
          itemClassName="bg-white border border-gray-200 shadow-sm"
        />
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-ib-accent py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 70%)" }} />
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Pronto para dar o próximo passo?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Crie a sua conta gratuitamente e explore todas as funcionalidades.
          </p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-white text-ib-accent hover:bg-blue-50 px-8 py-4 rounded-full text-lg font-bold shadow-xl transition-all hover:-translate-y-0.5">
            <UserPlus className="w-5 h-5" /> Criar Conta Grátis
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
