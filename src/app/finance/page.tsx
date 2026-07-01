import Link from "next/link";

const links = [
  { label: "Faturação", href: "/finance/faturacao" },
  { label: "Cobranças", href: "/finance/cobrancas" },
  { label: "Contas a Pagar", href: "/finance/contas-pagar" },
  { label: "Contas a Receber", href: "/finance/contas-receber" },
  { label: "Relatórios", href: "/finance/relatorios" },
];

export default function FinancePage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ib-primary mb-6">IBPlus Finance</h2>
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
