import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/site/SEO";

const pages = [
  { slug: "faturacao", title: "Sistema de Faturação", desc: "Emita faturas, recibos e orçamentos profissionais em segundos." },
  { slug: "crm", title: "CRM", desc: "Gestão completa de clientes e funil de vendas." },
  { slug: "gestao-financeira", title: "Gestão Financeira", desc: "Controle total das finanças do seu negócio." },
  { slug: "loja-online", title: "Loja Online", desc: "Venda 24/7 com a sua loja virtual integrada." },
  { slug: "restaurantes", title: "Sistema para Restaurantes", desc: "Gestão completa para o seu restaurante." },
  { slug: "farmacias", title: "Sistema para Farmácias", desc: "Solução completa para a sua farmácia." },
  { slug: "escolas", title: "Sistema para Escolas", desc: "Gestão académica e administrativa para escolas." },
  { slug: "igrejas", title: "Sistema para Igrejas", desc: "Gestão de membros, dízimos e ofertas." },
];

export default function LandingIndex() {
  return (
    <SiteLayout>
      <SEO title="Landing Pages" description="Páginas de aterragem IBPlus." />
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-ib-primary mb-6">Landing Pages</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {pages.map((p) => (
              <Link key={p.slug} href={`/landing/${p.slug}`} className="p-6 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/50 hover:shadow-lg transition-all text-left">
                <h3 className="font-semibold text-ib-primary mb-2">{p.title}</h3>
                <p className="text-ib-muted text-sm">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
