"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Pencil, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";

interface SubCompany {
  id: string;
  name: string;
  type: string;
  sector: string | null;
  address: string | null;
  description: string | null;
  active: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  SUBEMPRESA: "Subempresa",
  ORGANIZACAO: "Organização",
  FILIAL: "Filial",
  SUCURSAL: "Sucursal",
};

const EMPTY_FORM = { name: "", type: "SUBEMPRESA", sector: "", address: "", description: "", active: true };

export function SubCompaniesManager() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [items, setItems] = useState<SubCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SubCompany | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/company/subcompanies");
      if (res.ok) {
        const d = await res.json();
        setItems(d.subCompanies || []);
      }
    } catch {
      // ignora
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setShowForm(true);
  }

  function openEdit(s: SubCompany) {
    setEditing(s);
    setForm({
      name: s.name,
      type: s.type,
      sector: s.sector || "",
      address: s.address || "",
      description: s.description || "",
      active: s.active,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        sector: form.sector.trim() || null,
        address: form.address.trim() || null,
        description: form.description.trim() || null,
        active: form.active,
      };
      const res = await fetch(editing ? `/api/company/subcompanies/${editing.id}` : "/api/company/subcompanies", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Erro ao registar subempresa.");
        return;
      }
      toast(editing ? "Subempresa atualizada." : "Subempresa registada.");
      setShowForm(false);
      load();
    } catch {
      setError("Erro de ligação.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: SubCompany) {
    if (!(await confirm({ title: "Remover", message: `Deseja remover "${s.name}"?`, variant: "danger" }))) return;
    try {
      const res = await fetch(`/api/company/subcompanies/${s.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast(data?.error || "Erro ao remover.", "error");
        return;
      }
      toast("Subempresa removida.");
      load();
    } catch {
      toast("Erro ao remover.", "error");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-6">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-ib-accent" />
          <h2 className="font-semibold text-ib-primary">Subempresas e Organizações</h2>
        </div>
        <button onClick={openCreate} className="btn btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5" /> Novo
        </button>
      </div>
      <div className="p-4">
        {(showForm) && (
          <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ib-primary">{editing ? "Editar" : "Registar nova subempresa / organização"}</p>
              <button onClick={() => setShowForm(false)} aria-label="Fechar" className="p-1 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Nome *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
                    <option value="SUBEMPRESA">Subempresa</option>
                    <option value="ORGANIZACAO">Organização</option>
                    <option value="FILIAL">Filial</option>
                    <option value="SUCURSAL">Sucursal</option>
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Sector</label>
                  <input type="text" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Ex.: Tecnologia" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Endereço</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Descrição</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <label className="flex items-center gap-2 text-sm text-ib-primary font-medium">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" />
                Activa
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn btn-primary disabled:opacity-50">
                  {saving ? "A guardar..." : "Guardar"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </div>
        )}
        {loading ? (
          <p className="text-sm text-ib-muted">A carregar...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-ib-muted">Ainda não registou subempresas ou organizações. Estas entidades ajudam a organizar a estrutura do seu negócio.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((s) => (
              <div key={s.id} className={`p-3 rounded-lg border ${s.active ? "border-gray-200" : "border-red-100 bg-red-50/40"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ib-primary truncate">{s.name}</p>
                    <p className="text-xs text-ib-muted mt-0.5">{TYPE_LABELS[s.type] || s.type}{s.sector ? ` · ${s.sector}` : ""}</p>
                    {(s.address || s.description) && (
                      <p className="text-xs text-ib-muted mt-1 line-clamp-2">{s.address || s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(s)} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded min-w-[44px] min-h-[44px] flex items-center justify-center" title="Editar" aria-label={`Editar ${s.name}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(s)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded min-w-[44px] min-h-[44px] flex items-center justify-center" title="Remover" aria-label={`Remover ${s.name}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {!s.active && <p className="text-xs text-red-600 mt-1">Inactiva</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}