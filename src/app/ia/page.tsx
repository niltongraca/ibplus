import Link from "next/link";

const links = [
  { label: "Assistente", href: "/ia/assistente" },
  { label: "Análise de Vendas", href: "/ia/analise-vendas" },
  { label: "Previsões", href: "/ia/previsoes" },
  { label: "Recomendações", href: "/ia/recomendacoes" },
  { label: "Relatórios", href: "/ia/relatorios" },
];

export default function IAPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ib-primary mb-6">IBPlus IA</h2>
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
