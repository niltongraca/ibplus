import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { LayoutDashboard, Receipt, BarChart3, Users, Store, Bot, ShoppingCart, Megaphone, CreditCard, Shield, Zap, HeadphonesIcon, ArrowRight } from "lucide-react";
import SEO from "@/components/site/SEO";

const modules = [
  { icon: LayoutDashboard, title: "Gestão", desc: "Dashboard completo, clientes, produtos, stock, vendas, compras e fluxo de caixa.", href: "/login" },
  { icon: Receipt, title: "Faturação", desc: "Faturas, notas de crédito, recibos e orçamentos profissionais.", href: "/landing/faturacao" },
  { icon: BarChart3, title: "Financeiro", desc: "Contas a pagar/receber, relatórios, DRE, balanço e indicadores.", href: "/login" },
  { icon: Users, title: "CRM", desc: "Gestão de clientes, funil de vendas, propostas e follow-up automatizado.", href: "/landing/crm" },
  { icon: Store, title: "Loja Online", desc: "Catálogo digital, encomendas, carrinho e pagamentos integrados.", href: "/landing/loja-online" },
  { icon: ShoppingCart, title: "Compras", desc: "Gestão de fornecedores, compras e controle de inventário.", href: "/login" },
  { icon: Bot, title: "Inteligência Artificial", desc: "Análise preditiva, previsões, recomendações e relatórios inteligentes.", href: "/login" },
  { icon: Megaphone, title: "Marketing", desc: "Campanhas WhatsApp, e-mail marketing, promoções e fidelização.", href: "/login" },
  { icon: CreditCard, title: "Pagamentos", desc: "Múltiplos métodos de pagamento com reconciliação automática.", href: "/login" },
  { icon: Shield, title: "Segurança", desc: "Dados encriptados, backups automáticos e controlo de acessos.", href: "/login" },
  { icon: Zap, title: "Automação", desc: "Processos automáticos para reduzir erros e aumentar produtividade.", href: "/login" },
  { icon: HeadphonesIcon, title: "Suporte", desc: "Equipa local pronta para ajudar via WhatsApp, email e telefone.", href: "/contactos" },
];

export default function Funcionalidades() {
  return (
    <SiteLayout>
      <SEO title="Funcionalidades" description="Descubra todas as funcionalidades do IBPlus." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Funcionalidades</h1>
          <p className="text-xl text-ib-muted max-w-2xl mx-auto">Conheça todas as ferramentas que o IBPlus oferece para simplificar a gestão do seu negócio.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <Link key={m.title} href={m.href} className="group p-6 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/50 hover:shadow-lg transition-all">
                <m.icon className="h-10 w-10 text-ib-accent mb-4" />
                <h3 className="text-lg font-semibold text-ib-primary mb-2 group-hover:text-ib-accent transition-colors">{m.title}</h3>
                <p className="text-ib-muted text-sm">{m.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-ib-primary mb-6">Pronto para testar?</h2>
          <p className="text-ib-muted mb-8">Crie uma conta gratuita e explore todas as funcionalidades sem compromisso.</p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
            Começar Gratuitamente <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
