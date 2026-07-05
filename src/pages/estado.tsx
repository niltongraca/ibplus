import SiteLayout from "@/components/site/Layout";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import SEO from "@/components/site/SEO";

const services = [
  { name: "API Principal", status: "Operacional", icon: CheckCircle, color: "text-green-500" },
  { name: "Base de Dados", status: "Operacional", icon: CheckCircle, color: "text-green-500" },
  { name: "Autenticação", status: "Operacional", icon: CheckCircle, color: "text-green-500" },
  { name: "Faturação Electrónica", status: "Operacional", icon: CheckCircle, color: "text-green-500" },
  { name: "Envio de Emails", status: "Operacional", icon: CheckCircle, color: "text-green-500" },
  { name: "Armazenamento", status: "Operacional", icon: CheckCircle, color: "text-green-500" },
];

export default function Estado() {
  return (
    <SiteLayout>
      <SEO title="Estado do Sistema" description="Monitore a disponibilidade dos serviços IBPlus." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Estado do Sistema</h1>
          <p className="text-xl text-ib-muted">Monitore a disponibilidade dos serviços IBPlus.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.name} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <span className="font-medium text-ib-primary">{s.name}</span>
                </div>
                <span className={`text-sm font-medium ${s.color}`}>{s.status}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-ib-muted mt-6">Última actualização: há 2 minutos</p>
        </div>
      </section>
    </SiteLayout>
  );
}
