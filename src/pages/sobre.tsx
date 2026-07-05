import SiteLayout from "@/components/site/Layout";
import { Target, Eye, Heart, Users, Award, Globe } from "lucide-react";
import SEO from "@/components/site/SEO";

const values = [
  { icon: Heart, title: "Compromisso", desc: "Dedicados ao sucesso dos nossos clientes." },
  { icon: Award, title: "Excelência", desc: "Qualidade e inovação em cada funcionalidade." },
  { icon: Users, title: "Pessoas", desc: "Pensamos primeiro nas pessoas, depois na tecnologia." },
  { icon: Globe, title: "Impacto Local", desc: "Criamos soluções para a realidade angolana." },
];

export default function Sobre() {
  return (
    <SiteLayout>
      <SEO title="Sobre Nós" description="Conheça a história do IBPlus." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Sobre o IBPlus</h1>
          <p className="text-xl text-ib-muted">A plataforma inteligente que está a transformar a gestão empresarial em Angola.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-ib-primary mb-6">Nossa História</h2>
              <p className="text-ib-muted mb-4 leading-relaxed">O IBPlus nasceu da necessidade de levar tecnologia de gestão acessível a micro, pequenas e médias empresas angolanas. Percebemos que muitas empresas ainda usam papel, Excel ou sistemas ultrapassados porque as soluções disponíveis são caras, complexas ou estrangeiras.</p>
              <p className="text-ib-muted leading-relaxed">Criámos o IBPlus para ser simples, acessível e feito por angolanos para angolanos. Uma plataforma completa que centraliza todas as áreas do negócio num único lugar.</p>
            </div>
            <div className="bg-gradient-to-br from-ib-accent to-ib-secondary rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div><p className="text-3xl font-bold">2024</p><p className="text-sm text-white/70">Fundação</p></div>
                <div><p className="text-3xl font-bold">+500</p><p className="text-sm text-white/70">Empresas</p></div>
                <div><p className="text-3xl font-bold">72</p><p className="text-sm text-white/70">Páginas</p></div>
                <div><p className="text-3xl font-bold">+50K</p><p className="text-sm text-white/70">Transações</p></div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <Target className="w-10 h-10 text-ib-accent mb-4" />
              <h3 className="text-xl font-bold text-ib-primary mb-3">Missão</h3>
              <p className="text-ib-muted">Democratizar o acesso à tecnologia de gestão, capacitando MPMEs angolanas com ferramentas inteligentes e acessíveis para crescerem de forma sustentável.</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <Eye className="w-10 h-10 text-ib-accent mb-4" />
              <h3 className="text-xl font-bold text-ib-primary mb-3">Visão</h3>
              <p className="text-ib-muted">Ser a plataforma de gestão número um em Angola e referência nos PALOP, reconhecida pela inovação, qualidade e impacto social.</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-ib-primary mb-8 text-center">Nossos Valores</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="text-center p-6 rounded-xl border border-gray-200 bg-white">
                <v.icon className="w-10 h-10 text-ib-accent mx-auto mb-4" />
                <h3 className="font-semibold text-ib-primary mb-2">{v.title}</h3>
                <p className="text-ib-muted text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
