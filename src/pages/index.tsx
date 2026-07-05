import Link from "next/link";
import { ArrowRight, CheckCircle, Star, ChevronDown, Bot, BarChart3, Users, Store, Megaphone, LayoutDashboard, Shield, Zap, HeadphonesIcon, CreditCard, Receipt, Package, ShoppingCart, TrendingUp } from "lucide-react";
import SiteLayout from "@/components/site/Layout";
import { useState } from "react";
import SEO from "@/components/site/SEO";

const features = [
  { icon: LayoutDashboard, title: "Gestão Completa", desc: "Dashboard, clientes, produtos, stock, vendas e fluxo de caixa centralizados." },
  { icon: Receipt, title: "Faturação", desc: "Faturas, recibos e orçamentos profissionais com envio automático." },
  { icon: BarChart3, title: "Relatórios Financeiros", desc: "Demonstrações de resultados, balanços e indicadores em tempo real." },
  { icon: Users, title: "CRM", desc: "Gestão de clientes, funil de vendas, propostas e follow-up." },
  { icon: Store, title: "Loja Online", desc: "Catálogo digital, encomendas e pagamentos integrados." },
  { icon: Bot, title: "Assistente IA", desc: "Análise preditiva, recomendações e automação inteligente." },
  { icon: ShoppingCart, title: "Compras & Stock", desc: "Gestão de compras, fornecedores e inventário automatizado." },
  { icon: Megaphone, title: "Marketing", desc: "Campanhas WhatsApp, e-mail marketing e programas de fidelização." },
  { icon: CreditCard, title: "Pagamentos", desc: "Múltiplos métodos de pagamento e reconciliação automática." },
  { icon: Shield, title: "Segurança", desc: "Dados encriptados, backups automáticos e conformidade fiscal." },
  { icon: Zap, title: "Automação", desc: "Processos automatizados para reduzir erros e poupar tempo." },
  { icon: HeadphonesIcon, title: "Suporte Local", desc: "Equipa angolana pronta para ajudar quando precisar." },
];

const benefits = [
  "Reduza custos operacionais até 40%",
  "Aumente a produtividade da sua equipa",
  "Tome decisões baseadas em dados reais",
  "Elimine erros manuais e retrabalho",
  "Acompanhe o seu negócio de qualquer lugar",
  "Cumpra com as obrigações fiscais angolanas",
];

const plans = [
  { name: "Gratuito", price: "0", popular: false, features: ["1 utilizador", "Até 50 produtos", "Faturação básica", "Relatórios simples", "Suporte por email"] },
  { name: "Profissional", price: "9.500", popular: true, features: ["3 utilizadores", "Produtos ilimitados", "Faturação completa", "CRM + Loja Online", "Relatórios avançados", "Suporte prioritário"] },
  { name: "Empresarial", price: "25.000", popular: false, features: ["Utilizadores ilimitados", "Todas as funcionalidades", "API + Integrações", "IA Avançada", "Gestor de conta dedicado", "Suporte 24/7"] },
];

const faq = [
  { q: "O que é o IBPlus?", a: "IBPlus é uma plataforma completa de gestão empresarial para micro, pequenas e médias empresas angolanas. Reúne gestão, finanças, CRM, loja online, marketing e inteligência artificial num único ecossistema integrado." },
  { q: "Quanto custa o IBPlus?", a: "Oferecemos três planos: Gratuito (sem custos), Profissional (9.500 Kz/mês) e Empresarial (25.000 Kz/mês). Todos os planos incluem acesso a todas as funcionalidades básicas." },
  { q: "Preciso de conhecimentos técnicos?", a: "Não. O IBPlus foi desenhado para ser intuitivo e fácil de usar. Qualquer pessoa consegue gerir o seu negócio sem conhecimentos técnicos." },
  { q: "Os meus dados estão seguros?", a: "Sim. Utilizamos encriptação de ponta a ponta, backups automáticos diários e servidores seguros. Cumprimos com as regulamentações de proteção de dados." },
  { q: "Posso usar no meu telemóvel?", a: "Sim. O IBPlus é totalmente responsivo e funciona em qualquer dispositivo com acesso à internet: computador, tablet ou smartphone." },
  { q: "Como posso começar?", a: "Basta criar uma conta gratuita. Não precisa de cartão de crédito. Em poucos minutos já pode começar a gerir o seu negócio." },
];

const testimonials = [
  { name: "Maria Santos", role: "Proprietária, Mercearia Santos", text: "O IBPlus transformou a gestão da minha mercearia. Agora tenho controlo total do stock e das vendas." },
  { name: "João Pedro", role: "CEO, Mega Store Lda", text: "Desde que implementámos o IBPlus, reduzimos os custos operacionais em 35% e aumentámos as vendas em 20%." },
  { name: "Ana Paula", role: "Contabilista", text: "Recomendo o IBPlus a todos os meus clientes. A facilidade de uso e o suporte local são imbatíveis." },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <SiteLayout>
      <SEO title="Plataforma Inteligente de Gestão" description="Gestão, finanças, vendas, CRM e inteligência artificial integrados para MPMEs angolanas." />
      {/* Hero */}
      <section className="bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ib-accent/20 text-ib-light text-sm mb-6">
              <Bot className="h-4 w-4" />
              Plataforma Inteligente de Gestão
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              O parceiro inteligente{" "}
              <span className="text-ib-accent">do seu negócio</span>
            </h1>
            <p className="text-lg sm:text-xl text-ib-muted max-w-2xl mx-auto mb-10">
              Gestão, finanças, vendas, CRM e inteligência artificial integrados para micro, pequenas e médias empresas em Angola.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/cadastro" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
                Começar Gratuitamente <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/funcionalidades" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/20 hover:bg-white/10 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition-colors">
                Ver Funcionalidades
              </Link>
            </div>
            <p className="mt-6 text-sm text-ib-muted">Sem cartão de crédito • Cancelamento gratuito • Suporte local</p>
          </div>
        </div>
      </section>

      {/* Marcas / Confiança */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-ib-muted mb-6">Confiado por empresas em toda Angola</p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-ib-muted">
            {["Mega Store Lda", "Comercial Lda", "Santos & Filhos", "TechAngola", "Farmácia Central", "Escola Nova Geração"].map((name) => (
              <span key={name} className="text-lg font-semibold opacity-50">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-ib-primary mb-4">Tudo o que precisa para gerir o seu negócio</h2>
            <p className="text-ib-muted max-w-2xl mx-auto">Seis módulos integrados com dezenas de funcionalidades que cobrem todas as áreas da sua empresa num único ecossistema.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/50 hover:shadow-lg transition-all">
                <f.icon className="h-10 w-10 text-ib-accent mb-4" />
                <h3 className="text-lg font-semibold text-ib-primary mb-2">{f.title}</h3>
                <p className="text-ib-muted text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-ib-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Porquê escolher o IBPlus?</h2>
              <ul className="space-y-4">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-ib-success shrink-0 mt-0.5" />
                    <span className="text-ib-muted">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-ib-accent to-ib-secondary rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Pronto para transformar o seu negócio?</h3>
              <p className="text-white/80 mb-6">Junte-se a centenas de empresas que já confiam no IBPlus para gerir e crescer.</p>
              <Link href="/cadastro" className="inline-flex items-center gap-2 bg-white text-ib-primary px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Começar Agora <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-ib-primary mb-4">Como funciona</h2>
            <p className="text-ib-muted max-w-xl mx-auto">Em três passos simples, o seu negócio está online e a funcionar.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Crie a sua conta", desc: "Registe-se gratuitamente em menos de 2 minutos. Não precisa de cartão de crédito." },
              { step: "02", title: "Configure o seu negócio", desc: "Adicione produtos, clientes e personalize a plataforma ao seu negócio." },
              { step: "03", title: "Comece a gerir", desc: "Aceda ao dashboard completo e comece a vender, faturar e crescer." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-ib-accent/10 text-ib-accent flex items-center justify-center text-xl font-bold mx-auto mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold text-ib-primary mb-2">{item.title}</h3>
                <p className="text-ib-muted text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-ib-primary mb-4">O que dizem os nossos clientes</h2>
            <p className="text-ib-muted max-w-xl mx-auto">Empresas que transformaram a sua gestão com o IBPlus.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-ib-muted mb-6 text-sm leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-ib-primary text-sm">{t.name}</p>
                  <p className="text-ib-muted text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-ib-primary mb-4">Planos para todos os negócios</h2>
            <p className="text-ib-muted max-w-xl mx-auto">Escolha o plano ideal para o seu negócio. Pode mudar ou cancelar quando quiser.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border-2 p-8 ${plan.popular ? "border-ib-accent bg-white shadow-xl" : "border-gray-200 bg-white"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ib-accent text-white text-xs font-semibold px-4 py-1 rounded-full">Mais Popular</div>
                )}
                <h3 className="text-lg font-semibold text-ib-primary mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-ib-primary">{plan.price}</span>
                  <span className="text-ib-muted ml-1">Kz/mês</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ib-muted">
                      <CheckCircle className="w-4 h-4 text-ib-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/cadastro"
                  className={`block text-center py-3 rounded-lg text-sm font-medium transition-colors ${plan.popular ? "bg-ib-accent hover:bg-blue-700 text-white" : "border border-gray-200 hover:border-ib-accent text-ib-primary"}`}
                >
                  {plan.name === "Gratuito" ? "Começar Grátis" : "Contratar Agora"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-ib-primary mb-4">Perguntas Frequentes</h2>
            <p className="text-ib-muted">Tire as suas dúvidas sobre o IBPlus.</p>
          </div>
          <div className="space-y-3">
            {faq.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-medium text-ib-primary text-sm sm:text-base">{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-ib-muted shrink-0 ml-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-ib-muted text-sm">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-ib-accent to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Pronto para levar o seu negócio ao próximo nível?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">Milhares de empresas angolanas já confiam no IBPlus. Comece hoje gratuitamente.</p>
          <Link href="/cadastro" className="inline-flex items-center gap-2 bg-white text-ib-accent px-8 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors">
            Criar Conta Gratuita <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
