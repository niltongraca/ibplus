import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { ArrowRight, CheckCircle, Receipt, FileText, BarChart3, Zap } from "lucide-react";
import SEO from "@/components/site/SEO";

const features = [
  { icon: Receipt, title: "Faturas Profissionais", desc: "Crie faturas personalizadas com o seu logótipo e informações fiscais." },
  { icon: FileText, title: "Orçamentos & Recibos", desc: "Gere orçamentos, notas de crédito e recibos com poucos cliques." },
  { icon: BarChart3, title: "Relatórios Fiscais", desc: "Relatórios automáticos para facilitar a declaração fiscal." },
  { icon: Zap, title: "Automação", desc: "Envio automático de faturas por email e notificações de vencimento." },
];

export default function LandingFaturacao() {
  return (
    <SiteLayout>
      <SEO title="Sistema de Faturação" description="Emita faturas, orçamentos e recibos profissionais." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ib-accent/20 text-ib-light text-sm mb-6">
            <Receipt className="h-4 w-4" /> Módulo IBPlus
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Sistema de Faturação</h1>
          <p className="text-xl text-ib-muted max-w-2xl mx-auto mb-8">Emita faturas, orçamentos e recibos profissionais para o seu negócio em Angola.</p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
            Começar Gratuitamente <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="text-center p-6">
                <f.icon className="w-12 h-12 text-ib-accent mx-auto mb-4" />
                <h3 className="font-semibold text-ib-primary mb-2">{f.title}</h3>
                <p className="text-ib-muted text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ib-primary mb-8 text-center">Benefícios</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Faturação 100% conforme a legislação angolana",
              "Envio automático de faturas por email",
              "Histórico completo de todas as transações",
              "Relatórios financeiros em tempo real",
              "Controlo de prazos de pagamento",
              "Integração com contabilidade",
            ].map((b) => (
              <div key={b} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-200">
                <CheckCircle className="w-5 h-5 text-ib-success shrink-0 mt-0.5" />
                <span className="text-ib-primary text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ib-primary mb-6">Pronto para começar a faturar?</h2>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
            Criar Conta Grátis <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
