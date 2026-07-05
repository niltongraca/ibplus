"use client";

import { useState, useEffect } from "react";
import { Sun, Search, Plus, Calendar, CheckCircle, XCircle, Clock, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Employee {
  id: string;
  name: string;
}

interface Vacation {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string | null;
  employee: { name: string };
}

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado", cancelled: "Cancelado",
};

export default function FeriasPage() {
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", startDate: "", endDate: "", notes: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/vacations").then((r) => r.json()),
      fetch("/api/employees").then((r) => r.json()),
    ]).then(([vData, eData]) => {
      setVacations(vData.vacations || []);
      setEmployees(eData.employees || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = vacations.filter((v) =>
    v.employee.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        const emp = employees.find((e) => e.id === form.employeeId);
        setVacations((prev) => [{ ...data.vacation, employee: { name: emp?.name || "" } }, ...prev]);
        setShowForm(false);
        setForm({ employeeId: "", startDate: "", endDate: "", notes: "" });
      }
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Férias</h1>
          <p className="text-ib-muted text-sm">Gestão de férias dos funcionários</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Solicitar Férias
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ib-primary mb-4">Solicitar Férias</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Funcionário</label>
                <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Seleccionar...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Data Início</label>
                  <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Data Fim</label>
                  <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Observações</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-ib-muted hover:text-ib-primary transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">Solicitar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar por funcionário..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>
        <DataTable
          columns={[
            { key: "employee", header: "Funcionário", render: (v: Vacation) => (
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-ib-primary">{v.employee.name}</span>
              </div>
            )},
            { key: "startDate", header: "Início", render: (v: Vacation) => <span className="text-ib-muted">{formatDate(v.startDate)}</span> },
            { key: "endDate", header: "Fim", render: (v: Vacation) => <span className="text-ib-muted">{formatDate(v.endDate)}</span> },
            { key: "status", header: "Estado", render: (v: Vacation) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[v.status]}`}>{statusLabels[v.status]}</span>
            )},
            { key: "actions", header: "", hide: "mobile", className: "text-right", render: () => <MoreHorizontal className="w-4 h-4 text-ib-muted ml-auto" /> },
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum período de férias encontrado."
          keyExtractor={(v: Vacation) => v.id}
          mobileCard={(v: Vacation) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{v.employee.name}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{formatDate(v.startDate)} — {formatDate(v.endDate)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[v.status]}`}>{statusLabels[v.status]}</span>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
