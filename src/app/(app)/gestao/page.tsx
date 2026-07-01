import Link from "next/link";

const links = [
  { label: "Dashboard", href: "/gestao/dashboard" },
  { label: "Clientes", href: "/gestao/clientes" },
  { label: "Produtos", href: "/gestao/produtos" },
  { label: "Stock", href: "/gestao/stock" },
  { label: "Compras", href: "/gestao/compras" },
  { label: "Vendas", href: "/gestao/vendas" },
  { label: "Despesas", href: "/gestao/despesas" },
  { label: "Fluxo de Caixa", href: "/gestao/fluxo-caixa" },
];

export default function GestaoPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ib-primary mb-6">IBPlus Gestão</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
