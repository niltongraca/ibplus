"use client";

import { useState, useEffect } from "react";
import { Plus, X, Trash2, Search, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/Toast";

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
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", position: "", salary: 0, phone: "" });

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees))
      .catch((err) => console.error("Erro ao carregar funcionários:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees((prev) => [...prev, data.employee]);
      setShowForm(false);
      setFormData({ name: "", email: "", position: "", salary: 0, phone: "" });
      toast("Funcionário criado com sucesso.");
    } catch {
      toast("Erro ao criar funcionário.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este funcionário?")) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      toast("Funcionário eliminado com sucesso.");
    } catch {
      toast("Erro ao eliminar funcionário.", "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Funcionários</h1>
          <p className="text-ib-muted text-sm">Gestão de funcionários</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Funcionário
        </button>
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
            { key: "actions", header: "Acções", hide: "mobile", className: "text-center", render: (e: Employee) => (
              <button onClick={() => handleDelete(e.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ib-primary">Novo Funcionário</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Nome *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Telefone</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Cargo</label>
                <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Salário (KZ)</label>
                <input type="number" min="0" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <button type="submit" className="w-full bg-ib-accent hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium">
                Salvar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
