"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Shield, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";

export interface Cargo {
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

export function CargosManager({ compact = false }: { compact?: boolean }) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<string>("collaborator");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
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
    load();
  }, [load]);

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
      load();
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
      load();
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
      <div className={compact ? "p-4" : "p-4"}>
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
                      <button onClick={() => startEdit(c)} className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded min-w-[44px] min-h-[44px] flex items-center justify-center" title="Editar" aria-label={`Editar ${c.name}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {c.name !== "Dono" && !c.isDefault && (
                      <button onClick={() => remove(c)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded min-w-[44px] min-h-[44px] flex items-center justify-center" title="Remover" aria-label={`Remover ${c.name}`}>
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