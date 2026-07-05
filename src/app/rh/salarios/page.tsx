"use client";

import { useState, useEffect } from "react";
import { DollarSign, Users, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Employee {
  id: string;
  name: string;
  position: string | null;
  salary: number;
}

export default function SalariosPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalSalaries = employees.reduce((sum, e) => sum + e.salary, 0);
  const avgSalary = employees.length > 0 ? totalSalaries / employees.length : 0;

  const summaryCards = [
    { label: "Total Salários", value: formatCurrency(totalSalaries), icon: DollarSign, color: "bg-blue-50 text-blue-600" },
    { label: "Média Salarial", value: formatCurrency(avgSalary), icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { label: "N.º Funcionários", value: employees.length, icon: Users, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Salários</h1>
        <p className="text-ib-muted text-sm">Gestão de salários e processamento</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs text-ib-muted uppercase tracking-wider font-medium">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-ib-primary">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <DataTable
          columns={[
            { key: "name", header: "Nome", render: (e: Employee) => <span className="font-medium text-ib-primary">{e.name}</span> },
            { key: "position", header: "Cargo", render: (e: Employee) => <span className="text-ib-muted">{e.position || "—"}</span> },
            { key: "salary", header: "Salário", className: "text-right", render: (e: Employee) => <span className="font-semibold">{formatCurrency(e.salary)}</span> },
            { key: "average", header: "Média", hide: "mobile", className: "text-right", render: (e: Employee) => <span className="text-ib-muted">{avgSalary > 0 ? formatCurrency(avgSalary) : "—"}</span> },
          ]}
          data={employees}
          loading={loading}
          emptyIcon={<DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum funcionário encontrado."
          keyExtractor={(e: Employee) => e.id}
          mobileCard={(e: Employee) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{e.name}</p>
                  <p className="text-xs text-ib-muted">{e.position || "—"}</p>
                </div>
              </div>
              <p className="font-semibold text-ib-primary">{formatCurrency(e.salary)}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
