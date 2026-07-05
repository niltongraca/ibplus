import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function LandingGestaoFinanceira() {
  return (
    <SiteLayout>
      <SEO title="Gestão Financeira" description="Controle total das finanças do seu negócio." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ib-accent/20 text-ib-light text-sm mb-6">
            <BarChart3 className="h-4 w-4" /> Módulo IBPlus
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Gestão Financeira</h1>
          <p className="text-xl text-ib-muted max-w-2xl mx-auto mb-8">Controle total das finanças do seu negócio com relatórios em tempo real.</p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
            Começar Gratuitamente <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
