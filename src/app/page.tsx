import Link from "next/link";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Store,
  Bot,
  Megaphone,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Gestão Total",
    desc: "Dashboard, clientes, produtos, stock, vendas e fluxo de caixa num só lugar.",
    href: "/login",
  },
  {
    icon: BarChart3,
    title: "Financeiro Inteligente",
    desc: "Faturação, cobranças, contas a pagar e receber com relatórios automáticos.",
    href: "/login",
  },
  {
    icon: Users,
    title: "CRM Completo",
    desc: "Gestão de clientes, funil de vendas, propostas e follow-up integrados.",
    href: "/login",
  },
  {
    icon: Store,
    title: "Loja Online",
    desc: "Catálogo digital, encomendas e pagamentos para vender 24/7.",
    href: "/login",
  },
  {
    icon: Bot,
    title: "Assistente IA",
    desc: "Análise de vendas, previsões e recomendações inteligentes para o seu negócio.",
    href: "/login",
  },
  {
    icon: Megaphone,
    title: "Marketing Integrado",
    desc: "Campanhas WhatsApp, e-mail marketing e gestão de promoções e fidelização.",
    href: "/login",
  },
];

const modules = [
  { name: "IBPlus Gestão", items: 8, color: "bg-ib-accent" },
  { name: "IBPlus Finance", items: 5, color: "bg-ib-success" },
  { name: "IBPlus CRM", items: 5, color: "bg-ib-light" },
  { name: "IBPlus Store", items: 4, color: "bg-ib-warning" },
  { name: "IBPlus IA", items: 5, color: "bg-purple-500" },
  { name: "IBPlus Marketing", items: 4, color: "bg-pink-500" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="bg-ib-primary text-white">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-ib-accent flex items-center justify-center font-bold text-lg">
              IB
            </div>
            <span className="font-semibold text-lg">
              IBPlus<sup className="text-ib-accent font-bold">+</sup>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-ib-muted hover:text-white transition-colors"
            >
              Plataforma
            </Link>
            <Link
              href="/login"
              className="bg-ib-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Acessar Plataforma
            </Link>
          </div>
        </nav>
      </header>

      <section className="bg-ib-primary text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ib-accent/20 text-ib-light text-sm mb-6">
            <Bot className="h-4 w-4" />
            Plataforma Inteligente de Gestão
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            O parceiro inteligente{" "}
            <span className="text-ib-accent">do seu negócio</span>
          </h1>
          <p className="text-xl text-ib-muted max-w-2xl mx-auto mb-10">
            IBPlus é a plataforma completa para micro, pequenas e médias empresas
            em Angola. Gestão, finanças, vendas, CRM e inteligência artificial
            integrados para simplificar o seu dia-a-dia.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/cadastro"
              className="bg-ib-accent hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              Começar Gratuitamente
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-ib-primary mb-4">
              Tudo o que precisa para gerir o seu negócio
            </h2>
            <p className="text-ib-muted max-w-xl mx-auto">
              Seis módulos integrados que cobrem todas as áreas da sua empresa
              num único ecossistema.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group p-6 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/50 hover:shadow-lg transition-all"
              >
                <f.icon className="h-10 w-10 text-ib-accent mb-4" />
                <h3 className="text-lg font-semibold text-ib-primary mb-2">
                  {f.title}
                </h3>
                <p className="text-ib-muted text-sm">{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ib-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Ecossistema IBPlus
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {modules.map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div
                  className={`h-3 w-3 rounded-full ${m.color} shrink-0`}
                />
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-ib-muted">
                    {m.items} funcionalidades
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-ib-primary mb-6">
                Porquê escolher o IBPlus?
              </h2>
              <ul className="space-y-4">
                {[
                  "Plataforma completa e integrada",
                  "Tecnologia acessível para MPMEs angolanas",
                  "Assistente IA para tomada de decisões",
                  "Dados seguros e protegidos",
                  "Suporte local dedicado",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-ib-success shrink-0 mt-0.5" />
                    <span className="text-ib-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-ib-accent to-ib-secondary rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Pronto para transformar o seu negócio?
              </h3>
              <p className="text-white/80 mb-6">
                Junte-se a centenas de empresas que já confiam no IBPlus para
                gerir e fazer crescer os seus negócios.
              </p>
              <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 bg-white text-ib-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Começar Agora
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-ib-primary text-ib-muted py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-6 w-6 rounded bg-ib-accent flex items-center justify-center font-bold text-xs text-white">
              IB
            </div>
            <span className="font-semibold text-white">
              IBPlus<sup className="text-ib-accent font-bold">+</sup>
            </span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} IBPlus. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
