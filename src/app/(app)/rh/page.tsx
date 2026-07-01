import Link from "next/link";

const links = [
  { label: "Funcionários", href: "/rh/funcionarios" },
  { label: "Salários", href: "/rh/salarios" },
  { label: "Férias", href: "/rh/ferias" },
  { label: "Presenças", href: "/rh/presencas" },
];

export default function RhPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ib-primary mb-6">IBPlus RH</h2>
      <p className="text-sm text-ib-warning bg-ib-warning/10 px-3 py-1.5 rounded-lg inline-block mb-4">
        Módulo em desenvolvimento
      </p>
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
