"use client";

import { useState, useEffect } from "react";
import { Search, Users, UserPlus, Mail, Briefcase, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
  salary: number;
  active: boolean;
}

export default function FuncionariosPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Funcionários</h1>
          <p className="text-ib-muted text-sm">Gestão de funcionários</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar funcionários..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
        </div>

        <DataTable
          columns={[
            { key: "name", header: "Nome", render: (e: Employee) => <span className="font-medium text-ib-primary">{e.name}</span> },
            { key: "email", header: "Email", hide: "tablet", render: (e: Employee) => <span className="text-ib-muted">{e.email || "—"}</span> },
            { key: "position", header: "Cargo", hide: "mobile", render: (e: Employee) => <span className="text-ib-muted">{e.position || "—"}</span> },
            { key: "salary", header: "Salário", hide: "mobile", className: "text-right", render: (e: Employee) => <span className="font-semibold">{formatCurrency(e.salary)}</span> },
            { key: "active", header: "Estado", className: "text-center", render: (e: Employee) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {e.active ? "Activo" : "Inactivo"}
              </span>
            )},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum funcionário encontrado."
          keyExtractor={(e: Employee) => e.id}
          mobileCard={(e: Employee) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{e.name}</p>
                  <p className="text-xs text-ib-muted">{e.position || "—"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {e.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="font-semibold text-ib-primary">{formatCurrency(e.salary)}</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}
