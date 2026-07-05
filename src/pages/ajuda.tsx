import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { BookOpen, Video, HelpCircle, FileText, ArrowRight } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function Ajuda() {
  return (
    <SiteLayout>
      <SEO title="Central de Ajuda" description="Tudo o que precisa para aproveitar o IBPlus ao máximo." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Central de Ajuda</h1>
          <p className="text-xl text-ib-muted">Tudo o que precisa para aproveitar o IBPlus ao máximo.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { icon: BookOpen, title: "Guias", desc: "Manuais detalhados de cada módulo." },
              { icon: Video, title: "Tutoriais", desc: "Vídeos passo-a-passo para aprender rápido." },
              { icon: HelpCircle, title: "FAQ", desc: "Respostas às perguntas mais frequentes." },
              { icon: FileText, title: "Documentação", desc: "Documentação técnica e de API." },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl border border-gray-200 bg-white text-center hover:border-ib-accent/50 transition-all">
                <item.icon className="w-10 h-10 text-ib-accent mx-auto mb-4" />
                <h3 className="font-semibold text-ib-primary mb-2">{item.title}</h3>
                <p className="text-ib-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-ib-primary mb-4">Ainda precisa de ajuda?</h2>
            <p className="text-ib-muted mb-6">A nossa equipa de suporte está pronta para ajudar.</p>
            <Link href="/contactos" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors">
              Falar Connosco <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
