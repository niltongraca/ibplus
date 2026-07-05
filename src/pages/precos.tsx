import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { CheckCircle, ArrowRight, HelpCircle } from "lucide-react";
import SEO from "@/components/site/SEO";

const plans = [
  { name: "Gratuito", price: "0", popular: false, features: ["1 utilizador", "Até 50 produtos", "Faturação básica", "Relatórios simples", "Suporte por email"] },
  { name: "Profissional", price: "9.500", popular: true, features: ["3 utilizadores", "Produtos ilimitados", "Faturação completa", "CRM + Loja Online", "Relatórios avançados", "Suporte prioritário"] },
  { name: "Empresarial", price: "25.000", popular: false, features: ["Utilizadores ilimitados", "Todas as funcionalidades", "API + Integrações", "IA Avançada", "Gestor de conta dedicado", "Suporte 24/7"] },
];

const faq = [
  { q: "Posso mudar de plano?", a: "Sim. Pode fazer upgrade ou downgrade do seu plano a qualquer momento sem custos adicionais." },
  { q: "O plano gratuito tem limite de tempo?", a: "Não. O plano gratuito é válido por tempo ilimitado, com funcionalidades básicas para começar." },
  { q: "Aceitam quais formas de pagamento?", a: "Aceitamos transferência bancária, Multicaixa Express, EMIS e dinheiro móvel." },
  { q: "Há desconto para pagamento anual?", a: "Sim. Oferecemos 2 meses de desconto no plano anual (pague 10 meses e use 12)." },
];

export default function Precos() {
  return (
    <SiteLayout>
      <SEO title="Planos e Preços" description="Escolha o plano ideal para o seu negócio." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Planos e Preços</h1>
          <p className="text-xl text-ib-muted">Escolha o plano ideal para o seu negócio.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
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
                <Link href="/cadastro" className={`block text-center py-3 rounded-lg text-sm font-medium transition-colors ${plan.popular ? "bg-ib-accent hover:bg-blue-700 text-white" : "border border-gray-200 hover:border-ib-accent text-ib-primary"}`}>
                  {plan.name === "Gratuito" ? "Começar Grátis" : "Contratar Agora"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ib-primary mb-8 text-center">Perguntas Frequentes</h2>
          <div className="space-y-3">
            {faq.map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 p-5 group">
                <summary className="flex items-center gap-3 cursor-pointer list-none">
                  <HelpCircle className="w-5 h-5 text-ib-accent shrink-0" />
                  <span className="font-medium text-ib-primary text-sm sm:text-base">{item.q}</span>
                </summary>
                <p className="mt-3 text-ib-muted text-sm pl-8">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-ib-primary mb-4">Ainda com dúvidas?</h2>
          <p className="text-ib-muted mb-6">Fale connosco e encontraremos o plano ideal para si.</p>
          <Link href="/contactos" className="inline-flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors">
            Falar Connosco <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
