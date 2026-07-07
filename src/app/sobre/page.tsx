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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ib-accent/10 mb-4">
            <Shield className="w-8 h-8 text-ib-accent" />
          </div>
          <h1 className="text-4xl font-bold text-ib-primary mb-3">Sobre o IBPlus+</h1>
          <p className="text-lg text-ib-muted max-w-3xl mx-auto">
            Uma plataforma completa de gestão empresarial, adaptada a diferentes tipos de organização.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-ib-primary mb-4">O que é o IBPlus+?</h2>
          <p className="text-ib-muted leading-relaxed mb-4">
            O IBPlus+ é uma plataforma SaaS de gestão empresarial que reúne num só lugar todas as ferramentas
            necessárias para administrar o seu negócio ou organização. Desde o controlo financeiro até à gestão
            de clientes, passando por RH, marketing, vendas e muito mais.
          </p>
          <p className="text-ib-muted leading-relaxed">
            Com um sistema de permissões inteligente (RBAC dinâmico), cada utilizador vê apenas o que é relevante
            para o seu tipo de conta, tornando a experiência simples e eficiente.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-ib-primary mb-6">Tipos de Conta</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accountTypes.map((at) => (
              <div key={at.name} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-ib-accent/10 flex items-center justify-center mb-2">
                  <at.icon className="w-4 h-4 text-ib-accent" />
                </div>
                <h3 className="font-semibold text-ib-primary text-sm mb-1">{at.name}</h3>
                <p className="text-xs text-ib-muted">{at.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-ib-primary mb-4">Funcionalidades Principais</h2>
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
              <div key={f} className="flex items-center gap-2 text-sm text-ib-muted">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-ib-accent/5 to-blue-50 rounded-xl border border-ib-accent/20 p-8 text-center">
          <h2 className="text-2xl font-bold text-ib-primary mb-3">Tecnologia</h2>
          <p className="text-ib-muted mb-4 max-w-2xl mx-auto">
            Construído com Next.js 15, TypeScript, Tailwind CSS 4, Prisma 7 e Neon (PostgreSQL serverless).
            Interface moderna, responsiva e preparada para o futuro.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/cadastro" className="inline-flex items-center gap-2 px-6 py-2.5 bg-ib-accent text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
              Criar Conta Grátis
            </Link>
            <Link href="/praca" className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-ib-primary rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm">
              Explorar a Praça
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
