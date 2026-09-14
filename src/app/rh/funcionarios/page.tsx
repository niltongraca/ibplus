"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Trash2, Search, Users, BadgeCheck, Shield, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";
import { useList } from "@/hooks/useList";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/contexts/AuthContext";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
  salary: number;
  active: boolean;
  isOwner?: boolean;
  cargo?: { id: string; name: string; level: string } | null;
}

interface Cargo {
  id: string;
  name: string;
  description?: string | null;
  level: string;
  isDefault: boolean;
  active: boolean;
  _count?: { employees: number };
}

const LEVEL_LABELS: Record<string, string> = {
  owner: "Dono",
  manager: "Gestor",
  collaborator: "Colaborador",
  viewer: "Só-visualização",
};

const CARGO_LEVELS = ["owner", "manager", "collaborator", "viewer"] as const;

export default function FuncionariosPage() {
  const { user } = useAuth();
  const isOwner = Boolean(user?.isOwner);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [formData, setFormData] = useState({ name: "", email: "", position: "", salary: 0, phone: "", hireDate: "", cargoId: "" });
  const { data: employees, setData: setEmployees, loading, page, setPage, totalPages } = useList<Employee>(
    "/api/employees",
    "employees",
    { limit: 20, params: { search } }
  );

  const { toast } = useToast();
  const { confirm } = useConfirm();

  const loadCargos = useCallback(async () => {
    try {
      const res = await fetch("/api/company/cargos?all=true");
      if (res.ok) {
        const d = await res.json();
        setCargos(d.cargos || []);
      }
    } catch {
      // ignora
    }
  }, []);

  useEffect(() => {
    loadCargos();
  }, [loadCargos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formData.name.trim()) return setFormError("O nome é obrigatório.");
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setFormError("O email não é válido.");

    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim() || null,
          hireDate: formData.hireDate ? new Date(formData.hireDate).toISOString() : null,
          cargoId: formData.cargoId || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(data?.error || "Erro ao criar funcionário.");
        return;
      }
      setEmployees((prev) => [...prev, data.employee]);
      setShowForm(false);
      setFormData({ name: "", email: "", position: "", salary: 0, phone: "", hireDate: "", cargoId: "" });
      toast("Funcionário criado com sucesso.");
    } catch {
      setFormError("Erro de ligação. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Eliminar funcionário", message: "Tem a certeza que deseja eliminar este funcionário?", variant: "danger" }))) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.error || "Erro ao eliminar funcionário.", "error");
        return;
      }
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      toast(data?.message || "Funcionário eliminado com sucesso.");
    } catch {
      toast("Erro ao eliminar funcionário.", "error");
    }
  };

  function cargoBadge(e: Employee) {
    if (e.isOwner) {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
          <BadgeCheck className="w-3 h-3" /> Dono
        </span>
      );
    }
    if (e.cargo) {
      return <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700">{e.cargo.name}</span>;
    }
    return <span className="text-ib-muted">{e.position || "—"}</span>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Funcionários</h1>
          <p className="text-ib-muted text-sm">Gestão da equipa, cargos e acessos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Funcionário
        </button>
      </div>

      {isOwner && (
        <CargosManager cargos={cargos} onChange={loadCargos} />
      )}

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
            { key: "position", header: "Cargo", hide: "mobile", render: cargoBadge },
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
          data={employees}
          loading={loading}
          emptyIcon={<Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum funcionário encontrado."
          keyExtractor={(e: Employee) => e.id}
          mobileCard={(e: Employee) => (
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-ib-primary">{e.name}</p>
                  <div className="flex items-center gap-2 mt-1">{cargoBadge(e)}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {e.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <p className="font-semibold text-ib-primary">{formatCurrency(e.salary)}</p>
            </div>
          )}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{formError}</div>
              )}
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
                {cargos.length > 0 ? (
                  <select value={formData.cargoId || ""} onChange={(e) => setFormData({ ...formData, cargoId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
                    <option value="">Sem cargo</option>
                    {cargos.filter((c) => c.active).map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({LEVEL_LABELS[c.level] || c.level})</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Salário (KZ)</label>
                <input type="number" min="0" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Data de Admissão</label>
                <input type="date" value={formData.hireDate} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-ib-accent hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium">
                {saving ? "A salvar..." : "Salvar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CargosManager({ cargos, onChange }: { cargos: Cargo[]; onChange: () => void }) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<string>("collaborator");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setName("");
    setDescription("");
    setLevel("collaborator");
    setError("");
    setEditing(null);
    setShowAdd(false);
  }

  function startEdit(c: Cargo) {
    setEditing(c);
    setName(c.name);
    setDescription(c.description || "");
    setLevel(c.level);
    setError("");
  }

  async function save() {
    setError("");
    if (!name.trim()) {
      setError("O nome do cargo é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/company/cargos/${editing.id}` : "/api/company/cargos", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, level }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Erro ao guardar cargo.");
        return;
      }
      toast(editing ? "Cargo atualizado." : "Cargo criado.");
      reset();
      onChange();
    } catch {
      setError("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Cargo) {
    if (!(await confirm({ title: "Remover cargo", message: `Deseja remover o cargo "${c.name}"?`, variant: "danger" }))) return;
    try {
      const res = await fetch(`/api/company/cargos/${c.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.error || "Erro ao remover cargo.", "error");
        return;
      }
      toast(data?.message || "Cargo removido.");
      onChange();
    } catch {
      toast("Erro ao remover cargo.", "error");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-ib-accent" />
          <h2 className="font-semibold text-ib-primary">Cargos da organização</h2>
        </div>
        <button onClick={() => { reset(); setShowAdd(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-ib-accent hover:bg-blue-700 text-white rounded-lg text-xs font-medium">
          <Plus className="w-3.5 h-3.5" /> Novo Cargo
        </button>
      </div>
      <div className="p-4">
        {(showAdd || editing) && (
          <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Nome *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Nível</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
                  <option value="collaborator">Colaborador</option>
                  <option value="manager">Gestor</option>
                  <option value="viewer">Só-visualização</option>
                  <option value="owner">Dono</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Descrição</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-ib-accent hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {saving ? "A guardar..." : "Guardar"}
              </button>
              <button onClick={reset} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        )}
        {cargos.length === 0 ? (
          <p className="text-sm text-ib-muted">Ainda não há cargos registados. Crie cargos para a sua equipa — os convidados recebem sugestões destes cargos ao registar-se.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cargos.map((c) => (
              <div key={c.id} className={`p-3 rounded-lg border ${c.active ? "border-gray-200" : "border-red-100 bg-red-50/40"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ib-primary">{c.name} {c.isDefault && <span className="text-xs text-ib-muted font-normal">(padrão)</span>}</p>
                    <p className="text-xs text-ib-muted mt-0.5">{LEVEL_LABELS[c.level] || c.level}{c._count?.employees ? ` · ${c._count.employees} func.` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.name !== "Dono" && (
                      <button onClick={() => startEdit(c)} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {c.name !== "Dono" && !c.isDefault && (
                      <button onClick={() => remove(c)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Remover">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {!c.active && <p className="text-xs text-red-600 mt-1">Desativado</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}