import Link from "next/link";

const links = [
  { label: "Clientes", href: "/crm/clientes" },
  { label: "Funil de Vendas", href: "/crm/funil-vendas" },
  { label: "Propostas", href: "/crm/propostas" },
  { label: "Agenda", href: "/crm/agenda" },
  { label: "Follow-up", href: "/crm/follow-up" },
];

export default function CrmPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ib-primary mb-6">IBPlus CRM</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="p-4 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/50 hover:shadow-md transition-all"
          >
            <p className="font-medium text-ib-primary">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
