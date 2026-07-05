"use client";

import { useState, useEffect } from "react";
import { Clock, Search, Plus, CheckCircle, XCircle, AlertTriangle, MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";

interface Employee {
  id: string;
  name: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  notes: string | null;
  employee: { name: string };
}

const statusStyles: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
  half_day: "bg-blue-100 text-blue-700",
  justified: "bg-purple-100 text-purple-700",
};

const statusLabels: Record<string, string> = {
  present: "Presente", absent: "Ausente", late: "Atrasado", half_day: "Meio Dia", justified: "Justificado",
};

export default function PresencasPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: "", date: "", checkIn: "", checkOut: "", status: "present", notes: "" });

  useEffect(() => {
    Promise.all([
      fetch("/api/attendance").then((r) => r.json()),
      fetch("/api/employees").then((r) => r.json()),
    ]).then(([aData, eData]) => {
      setAttendances(aData.attendances || []);
      setEmployees(eData.employees || []);
    }).catch((err) => console.error("Erro ao carregar presenças:", err)).finally(() => setLoading(false));
  }, []);

  const filtered = attendances.filter((a) =>
    a.employee.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload: any = { employeeId: form.employeeId, date: form.date, status: form.status, notes: form.notes };
      if (form.checkIn) payload.checkIn = `${form.date}T${form.checkIn}:00`;
      if (form.checkOut) payload.checkOut = `${form.date}T${form.checkOut}:00`;
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        const emp = employees.find((e) => e.id === form.employeeId);
        setAttendances((prev) => [{ ...data.attendance, employee: { name: emp?.name || "" } }, ...prev]);
        setShowForm(false);
        setForm({ employeeId: "", date: "", checkIn: "", checkOut: "", status: "present", notes: "" });
      }
    } catch {}
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Presenças</h1>
          <p className="text-ib-muted text-sm">Registo de presenças e controlo de horário</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Registar Presença
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-ib-primary mb-4">Registar Presença</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Funcionário</label>
                <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Seleccionar...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Data</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Entrada</label>
                  <input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Saída</label>
                  <input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Estado</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Observações</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-ib-muted hover:text-ib-primary transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">Registar</button>
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
            { key: "employee", header: "Funcionário", render: (a: Attendance) => (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ib-accent" />
                <span className="font-medium text-ib-primary">{a.employee.name}</span>
              </div>
            )},
            { key: "date", header: "Data", hide: "tablet", render: (a: Attendance) => <span className="text-ib-muted">{formatDate(a.date)}</span> },
            { key: "checkIn", header: "Entrada", render: (a: Attendance) => <span className="text-ib-muted">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }) : "—"}</span> },
            { key: "checkOut", header: "Saída", render: (a: Attendance) => <span className="text-ib-muted">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" }) : "—"}</span> },
            { key: "status", header: "Estado", render: (a: Attendance) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[a.status]}`}>{statusLabels[a.status]}</span>
            )},
          ]}
          data={filtered}
          loading={loading}
          emptyIcon={<AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum registo de presença encontrado."
          keyExtractor={(a: Attendance) => a.id}
          mobileCard={(a: Attendance) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{a.employee.name}</p>
                  <p className="text-xs text-ib-muted mt-0.5">{formatDate(a.date)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[a.status]}`}>{statusLabels[a.status]}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-ib-muted">
                {a.checkIn && <span>Entrada: {new Date(a.checkIn).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}</span>}
                {a.checkOut && <span>Saída: {new Date(a.checkOut).toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}</span>}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
