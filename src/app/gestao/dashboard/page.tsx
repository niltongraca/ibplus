import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";

const stats = [
  { label: "Receita Total", value: "2.450.000 Kz", icon: DollarSign, change: "+12.5%" },
  { label: "Vendas Hoje", value: "45", icon: ShoppingCart, change: "+8.2%" },
  { label: "Clientes Ativos", value: "128", icon: Users, change: "+5.1%" },
  { label: "Crescimento", value: "23.4%", icon: TrendingUp, change: "+3.2%" },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ib-muted">{s.label}</span>
              <s.icon className="h-5 w-5 text-ib-accent" />
            </div>
            <p className="text-2xl font-bold text-ib-primary">{s.value}</p>
            <p className="text-sm text-ib-success">{s.change} vs mês anterior</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-gray-200 bg-white">
          <h3 className="font-semibold text-ib-primary mb-4">Vendas Recentes</h3>
          <p className="text-ib-muted text-sm">Nenhuma venda registada hoje.</p>
        </div>
        <div className="p-6 rounded-xl border border-gray-200 bg-white">
          <h3 className="font-semibold text-ib-primary mb-4">Atividades</h3>
          <p className="text-ib-muted text-sm">Nenhuma atividade recente.</p>
        </div>
      </div>
    </div>
  );
}
