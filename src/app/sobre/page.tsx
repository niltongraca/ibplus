import { Shield, Zap, Globe, Heart, GraduationCap, Handshake, BookOpen, CheckCircle } from "lucide-react";
import Link from "next/link";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";

const accountTypes = [
  { icon: Zap, name: "Empreendedor", desc: "Profissional individual que quer gerir clientes, serviços e finanças pessoais." },
  { icon: Shield, name: "Empresa", desc: "PME com equipa, stock, vendas, compras, facturação e RH." },
  { icon: Heart, name: "ONG", desc: "Organização não-governamental com gestão de doações, campanhas e voluntários." },
  { icon: Handshake, name: "Associação", desc: "Associações com membros, eventos e contribuições." },
  { icon: GraduationCap, name: "Educação", desc: "Escolas, universidades e centros de formação com gestão de alunos." },
  { icon: BookOpen, name: "Cooperativa", desc: "Cooperativas com membros, produção e distribuição." },
];

export default function SobrePage() {
  return (
    <div>
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
            <Shield className="w-8 h-8 text-ib-accent" />
          </div>
          <h1 className="text-4xl font-bold mt-4 mb-3" style={{ color: "var(--text-primary)" }}>Sobre o IBPlus+</h1>
          <p className="text-lg max-w-3xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Uma plataforma completa de gestão empresarial, adaptada a diferentes tipos de organização.
          </p>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>O que é o IBPlus+?</h2>
          <p className="leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
            O IBPlus+ é uma plataforma SaaS de gestão empresarial que reúne num só lugar todas as ferramentas
            necessárias para administrar o seu negócio ou organização. Desde o controlo financeiro até à gestão
            de clientes, passando por RH, marketing, vendas e muito mais.
          </p>
          <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Com um sistema de permissões inteligente (RBAC dinâmico), cada utilizador vê apenas o que é relevante
            para o seu tipo de conta, tornando a experiência simples e eficiente.
          </p>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Tipos de Conta</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accountTypes.map((at) => (
              <div key={at.name} className="glass-card p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
                  <at.icon className="w-4 h-4 text-ib-accent" />
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>{at.name}</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{at.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>Funcionalidades Principais</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Dashboard inteligente adaptado ao perfil",
              "CRM com gestão de clientes e follow-up",
              "Facturação e orçamentos profissionais",
              "Controlo de stock e produtos",
              "Gestão financeira (fluxo de caixa, despesas)",
              "Módulo de RH (funcionários, férias, presenças)",
              "Praça online para expor produtos",
              "Módulo de Educação com gestão de alunos",
              "Campanhas de marketing e fidelização",
              "Relatórios e análises",
              "IA generativa para apoio ao negócio",
              "100% gratuito",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>Tecnologia</h2>
          <p className="mb-4 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Construído com Next.js 15, TypeScript, Tailwind CSS 4, Prisma 7 e Neon (PostgreSQL serverless).
            Interface moderna, responsiva e preparada para o futuro.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/cadastro" className="glass-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
              Criar Conta Grátis
            </Link>
            <Link href="/praca" className="glass-btn inline-flex items-center gap-2 px-6 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}>
              Explorar a Praça
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
