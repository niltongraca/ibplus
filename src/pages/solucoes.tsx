import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { Store, UtensilsCrossed, Pill, GraduationCap, Church, Briefcase, Building2, Users, ArrowRight } from "lucide-react";
import SEO from "@/components/site/SEO";

const solutions = [
  { icon: Store, title: "Pequenos Negócios", desc: "Gestão completa para mercearias, cantinas, boutiques e comércio local." },
  { icon: Building2, title: "Lojas", desc: "Controle de stock, vendas, clientes e faturação para lojas de retalho." },
  { icon: UtensilsCrossed, title: "Restaurantes", desc: "Gestão de mesas, pedidos, carta digital e controlo de custos." },
  { icon: Pill, title: "Farmácias", desc: "Controlo de stock, lotes, validades e vendas com receituário." },
  { icon: Briefcase, title: "Prestadores de Serviços", desc: "Gestão de projetos, clientes, orçamentos e faturação." },
  { icon: GraduationCap, title: "Escolas", desc: "Gestão de alunos, turmas, matrículas e mensalidades." },
  { icon: Church, title: "Igrejas", desc: "Gestão de membros, dízimos, ofertas e eventos." },
  { icon: Users, title: "Freelancers", desc: "Faturação simples, controle de receitas e despesas." },
];

export default function Solucoes() {
  return (
    <SiteLayout>
      <SEO title="Soluções" description="Soluções específicas para cada tipo de negócio." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Soluções</h1>
          <p className="text-xl text-ib-muted">Soluções específicas para cada tipo de negócio.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {solutions.map((s) => (
              <div key={s.title} className="p-6 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/50 hover:shadow-lg transition-all">
                <s.icon className="h-10 w-10 text-ib-accent mb-4" />
                <h3 className="text-lg font-semibold text-ib-primary mb-2">{s.title}</h3>
                <p className="text-ib-muted text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ib-primary mb-6">Não encontrou o seu negócio?</h2>
          <p className="text-ib-muted mb-8">O IBPlus adapta-se a qualquer tipo de empresa. Fale connosco para uma demonstração personalizada.</p>
          <Link href="/contactos" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
            Falar Connosco <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
