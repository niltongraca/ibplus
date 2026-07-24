import Link from "next/link";
import { Users, TrendingUp, FileText, Calendar, Clock } from "lucide-react";

const links = [
  { label: "Clientes", href: "/crm/clientes", description: "Gestão completa de clientes", icon: Users, color: "bg-blue-50 text-blue-600" },
  { label: "Funil de Vendas", href: "/crm/funil-vendas", description: "Pipeline e oportunidades", icon: TrendingUp, color: "bg-green-50 text-green-600" },
  { label: "Propostas", href: "/crm/propostas", description: "Propostas comerciais", icon: FileText, color: "bg-purple-50 text-purple-600" },
  { label: "Agenda", href: "/crm/agenda", description: "Calendário de atividades", icon: Calendar, color: "bg-orange-50 text-orange-600" },
  { label: "Follow-up", href: "/crm/follow-up", description: "Acompanhamento de contactos", icon: Clock, color: "bg-indigo-50 text-indigo-600" },
];

export default function CrmPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">IBPlus CRM</h1>
        <p className="text-gray-500 text-sm">Gestão de clientes e relacionamento comercial</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="p-5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center mb-3`}>
              <link.icon className="w-5 h-5" />
            </div>
            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{link.label}</p>
            <p className="text-sm text-gray-500 mt-1">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
