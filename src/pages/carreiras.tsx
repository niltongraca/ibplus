import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import SEO from "@/components/site/SEO";

const vagas = [
  { titulo: "Desenvolvedor Full Stack", tipo: "Remoto", regime: "Tempo Integral" },
  { titulo: "Designer UX/UI", tipo: "Remoto", regime: "Tempo Integral" },
  { titulo: "Customer Success", tipo: "Presencial (Luanda)", regime: "Tempo Integral" },
  { titulo: "Marketing Digital", tipo: "Remoto", regime: "Meio Período" },
];

export default function Carreiras() {
  return (
    <SiteLayout>
      <SEO title="Carreiras" description="Faça parte da equipa IBPlus." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Carreiras</h1>
          <p className="text-xl text-ib-muted">Faça parte da equipa que está a transformar a gestão em Angola.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {vagas.map((v) => (
              <div key={v.titulo} className="p-5 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/30 transition-all flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-ib-primary">{v.titulo}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-ib-muted">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{v.regime}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.tipo}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{v.regime}</span>
                  </div>
                </div>
                <Link href="/contactos" className="text-ib-accent text-sm font-medium hover:underline shrink-0">Candidatar</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
