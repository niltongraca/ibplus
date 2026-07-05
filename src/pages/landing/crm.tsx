import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { ArrowRight, Users, Target, BarChart3, MessageCircle } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function LandingCRM() {
  return (
    <SiteLayout>
      <SEO title="CRM" description="Gestão completa de clientes e funil de vendas." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ib-accent/20 text-ib-light text-sm mb-6">
            <Users className="h-4 w-4" /> Módulo IBPlus
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">CRM</h1>
          <p className="text-xl text-ib-muted max-w-2xl mx-auto mb-8">Gestão completa de clientes e funil de vendas para o seu negócio.</p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
            Começar Gratuitamente <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, title: "Gestão de Clientes", desc: "Perfil completo com histórico de compras e interacções." },
            { icon: Target, title: "Funil de Vendas", desc: "Acompanhe cada lead desde o primeiro contacto até à venda." },
            { icon: BarChart3, title: "Relatórios", desc: "Métricas de conversão, retenção e valor do cliente." },
            { icon: MessageCircle, title: "Automação", desc: "Lembretes automáticos e follow-up inteligente." },
          ].map((f) => (
            <div key={f.title} className="text-center p-6">
              <f.icon className="w-12 h-12 text-ib-accent mx-auto mb-4" />
              <h3 className="font-semibold text-ib-primary mb-2">{f.title}</h3>
              <p className="text-ib-muted text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-4"><h2 className="text-3xl font-bold text-ib-primary mb-6">Pronto para vender mais?</h2>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
            Criar Conta Grátis <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
