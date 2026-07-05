import SiteLayout from "@/components/site/Layout";
import { Star, Quote } from "lucide-react";
import SEO from "@/components/site/SEO";

const cases = [
  { name: "Mercearia Flor de Maio", sector: "Comércio", desc: "Aumentou as vendas em 40% após organizar o stock e controlar as despesas com o IBPlus." },
  { name: "Clínica Sagrada Esperança", sector: "Saúde", desc: "Digitalizou todo o agendamento de pacientes e reduziu faltas em 60%." },
  { name: "Restaurante Sabor Caseiro", sector: "Restauração", desc: "Controlo de mesas e pedidos em tempo real. Redução de 30% no desperdício." },
  { name: "Escola Primária Novo Saber", sector: "Educação", desc: "Gestão de matrículas e mensalidades simplificada. Pais recebem boletins online." },
  { name: "Loja Moderna", sector: "Retalho", desc: "Faturação electrónica integrada com contabilidade. Poupança de 20h/mês." },
];

export default function CasosSucesso() {
  return (
    <SiteLayout>
      <SEO title="Casos de Sucesso" description="Empresas que transformaram a sua gestão com o IBPlus." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Casos de Sucesso</h1>
          <p className="text-xl text-ib-muted">Empresas que transformaram a sua gestão com o IBPlus.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {cases.map((c) => (
            <div key={c.name} className="p-6 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/30 transition-all">
              <Quote className="h-6 w-6 text-ib-accent/50 mb-2" />
              <p className="text-ib-muted mb-4 italic">{c.desc}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ib-primary">{c.name}</p>
                  <p className="text-sm text-ib-muted">{c.sector}</p>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
