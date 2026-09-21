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
import { CargosManager, type Cargo } from "@/components/rh/CargosManager";

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  salary: number;
  active: boolean;
  isOwner?: boolean;
  cargo?: { id: string; name: string; level: string } | null;
}

const EMPTY_FORM = { name: "", email: "", phone: "", position: "", salary: 0, hireDate: "", cargoId: "", active: true };

export default function FuncionariosPage() {
  const { user } = useAuth();
  const isOwner = Boolean(user?.isOwner);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
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

  function openCreate() {
    setEditing(null);
    setFormError("");
    setFormData({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(e: Employee) {
    setEditing(e);
    setFormError("");
    setFormData({
      name: e.name,
      email: e.email || "",
      phone: e.phone || "",
      position: e.position || "",
      salary: Number(e.salary) || 0,
      hireDate: "",
      cargoId: e.cargo?.id || "",
      active: e.active,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formData.name.trim()) return setFormError("O nome é obrigatório.");
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setFormError("O email não é válido.");

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        position: formData.position.trim() || null,
        salary: Number(formData.salary) || 0,
        hireDate: formData.hireDate ? new Date(formData.hireDate).toISOString() : null,
        cargoId: formData.cargoId || undefined,
        ...(editing ? { active: formData.active } : {}),
      };
      const res = await fetch(editing ? `/api/employees/${editing.id}` : "/api/employees", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(data?.error || (editing ? "Erro ao atualizar funcionário." : "Erro ao criar funcionário."));
        return;
      }
      if (editing) {
        setEmployees((prev) => prev.map((e) => (e.id === editing.id ? { ...e, ...payload } : e)));
        toast("Funcionário atualizado com sucesso.");
      } else {
        setEmployees((prev) => [...prev, data.employee]);
        toast("Funcionário criado com sucesso.");
      }
      setShowForm(false);
    } catch {
      setFormError("Erro de ligação. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  }

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

  function cargoOptionsFor(e: Employee | null): Cargo[] {
    const list = cargos.filter((c) => c.active === undefined || c.active);
    if (e?.isOwner) {
      const ownerCargos = list.filter((c) => c.level === "owner");
      return ownerCargos.length ? ownerCargos : list;
    }
    return list;
  }

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Funcionários</h1>
          <p className="text-ib-muted text-sm">Gestão da equipa, cargos e acessos</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Novo Funcionário
        </button>
      </div>

      {isOwner && <CargosManager />}

      <div className="card">
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
          <div className="flex items-center gap-1.5 text-sm text-ib-muted">
            <Shield className="w-4 h-4 text-ib-accent" />
            <span>Os cargos definem as permissões de cada membro da equipa.</span>
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
            { key: "actions", header: "Acções", hide: "tablet", className: "text-center", render: (e: Employee) => (
              <div className="flex items-center justify-center gap-1">
                <button onClick={() => openEdit(e)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Editar" aria-label={`Editar ${e.name}`}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Eliminar" aria-label={`Eliminar ${e.name}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(e)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" title="Editar" aria-label={`Editar ${e.name}`}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(e.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center" title="Eliminar" aria-label={`Eliminar ${e.name}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {e.active ? "Activo" : "Inactivo"}
                </span>
                <p className="font-semibold text-ib-primary">{formatCurrency(e.salary)}</p>
              </div>
            </div>
          )}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForm(false)}>
          <div className="card shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ib-primary">{editing ? "Editar Funcionário" : "Novo Funcionário"}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Fechar" className="p-2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
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
                <select value={formData.cargoId || ""} onChange={(e) => setFormData({ ...formData, cargoId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
                  <option value="">Sem cargo</option>
                  {cargoOptionsFor(editing).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-ib-muted mt-1.5">
                  {editing?.isOwner
                    ? "O dono mantém sempre o nível de acesso total. Pode associar outros cargos de nível Dono."
                    : "Os convidados recebem sugestões dos cargos ao registarem-se com o código de convite."}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Posição (texto livre)</label>
                <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Ex.: Director de Vendas" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Salário (KZ)</label>
                  <input type="number" min="0" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Data de Admissão</label>
                  <input type="date" value={formData.hireDate} onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
                </div>
              </div>
              {editing && (
                <div>
                  <label className="flex items-center gap-2 text-sm text-ib-primary font-medium">
                    <input type="checkbox" checked={formData.active !== false} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="rounded" />
                    Funcionário activo
                  </label>
                </div>
              )}
              <button type="submit" disabled={saving} className="btn btn-primary w-full disabled:opacity-50">
                {saving ? "A salvar..." : "Salvar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}