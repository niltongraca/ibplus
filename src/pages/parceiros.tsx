import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { Handshake, Star, ArrowRight } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function Parceiros() {
  return (
    <SiteLayout>
      <SEO title="Programa de Parceiros" description="Junte-se ao nosso ecossistema e cresça connosco." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Programa de Parceiros</h1>
          <p className="text-xl text-ib-muted">Junte-se ao nosso ecossistema e cresça connosco.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Handshake, title: "Revendedor", desc: "Revenda o IBPlus para seus clientes e ganhe comissões." },
              { icon: Star, title: "Implementador", desc: "Implemente o sistema em empresas e cobre por projecto." },
              { icon: Handshake, title: "Afiliado", desc: "Divulgue o IBPlus e ganhe por cada cliente indicado." },
            ].map((p) => (
              <div key={p.title} className="p-6 rounded-xl border border-gray-200 bg-white text-center hover:border-ib-accent/30 transition-all">
                <p.icon className="h-10 w-10 text-ib-accent mx-auto mb-4" />
                <h3 className="font-semibold text-ib-primary mb-2">{p.title}</h3>
                <p className="text-sm text-ib-muted">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-ib-primary mb-4">Quer ser nosso parceiro?</h2>
            <Link href="/contactos" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors">
              Fale Connosco <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
