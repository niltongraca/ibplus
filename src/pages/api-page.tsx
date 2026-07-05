import SiteLayout from "@/components/site/Layout";
import { Code2, BookOpen, Server, Zap, Lock, Globe } from "lucide-react";
import SEO from "@/components/site/SEO";

export default function ApiPage() {
  return (
    <SiteLayout>
      <SEO title="API para Developers" description="Integre o IBPlus com os seus sistemas." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">API para Developers</h1>
          <p className="text-xl text-ib-muted">Integre o IBPlus com os seus sistemas.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Code2, title: "REST API", desc: "API RESTful com endpoints para todos os módulos." },
              { icon: BookOpen, title: "Documentação", desc: "Documentação completa com exemplos de código." },
              { icon: Server, title: "Webhooks", desc: "Notificações em tempo real para as suas aplicações." },
              { icon: Zap, title: "Rápido", desc: "Respostas em milissegundos com infraestrutura global." },
              { icon: Lock, title: "Seguro", desc: "Autenticação via JWT e HTTPS obrigatório." },
              { icon: Globe, title: "Qualquer Lugar", desc: "API acessível de qualquer lugar do mundo." },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-gray-200 bg-white text-center">
                <f.icon className="h-8 w-8 text-ib-accent mx-auto mb-3" />
                <h3 className="font-semibold text-ib-primary mb-1">{f.title}</h3>
                <p className="text-sm text-ib-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
