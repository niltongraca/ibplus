import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import SEO from "@/components/site/SEO";

const posts = [
  { title: "Como digitalizar o seu pequeno negócio em Angola", date: "15 Jun 2026", excerpt: "Guia prático para levar o seu negócio para o digital com ferramentas acessíveis." },
  { title: "Gestão financeira para MPMEs: dicas essenciais", date: "8 Jun 2026", excerpt: "Aprenda a controlar o fluxo de caixa e evitar surpresas financeiras." },
  { title: "Vantagens de usar um sistema de gestão integrado", date: "1 Jun 2026", excerpt: "Descubra como um sistema único pode simplificar a sua operação." },
  { title: "Faturação electrónica em Angola: o que mudou?", date: "25 Mai 2026", excerpt: "Tudo sobre as novas regras de facturação electrónica no país." },
  { title: "CRM para pequenas empresas: por que precisa?", date: "18 Mai 2026", excerpt: "Como um CRM simples pode aumentar as suas vendas e fidelizar clientes." },
];

export default function Blog() {
  return (
    <SiteLayout>
      <SEO title="Blog" description="Dicas, tutoriais e novidades para o seu negócio." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Blog</h1>
          <p className="text-xl text-ib-muted">Dicas, tutoriais e novidades para o seu negócio.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {posts.map((p) => (
            <article key={p.title} className="p-6 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/30 transition-all">
              <div className="flex items-center gap-2 text-sm text-ib-muted mb-2">
                <CalendarDays className="h-4 w-4" />
                <span>{p.date}</span>
              </div>
              <h2 className="text-lg font-semibold text-ib-primary mb-2">{p.title}</h2>
              <p className="text-ib-muted text-sm mb-4">{p.excerpt}</p>
              <Link href="#" className="text-ib-accent text-sm font-medium hover:underline inline-flex items-center gap-1">
                Ler mais <ArrowRight className="h-3 w-3" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
