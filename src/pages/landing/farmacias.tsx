import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { ArrowRight, Pill } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function LandingFarmacias() {
  return (
    <SiteLayout>
      <SEO title="Sistema para Farmácias" description="Controlo de stock e vendas para farmácias." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ib-accent/20 text-ib-light text-sm mb-6">
            <Pill className="h-4 w-4" /> Solução IBPlus
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Sistema para Farmácias</h1>
          <p className="text-xl text-ib-muted max-w-2xl mx-auto mb-8">Controlo de stock, lotes, validades e vendas com receituário integrado.</p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
            Começar Gratuitamente <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
