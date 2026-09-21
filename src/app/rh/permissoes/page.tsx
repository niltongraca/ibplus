"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Save, RotateCcw, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import {
  CARGO_LEVEL_LABELS,
  CARGO_LEVELS,
  DEFAULT_FEATURE_PERMISSIONS,
  FEATURE_LABELS,
  FEATURE_KEYS,
  type CargoLevel,
  type FeatureKey,
} from "@/config/permissions";

type Matrix = Record<CargoLevel, Record<FeatureKey, boolean>>;

export default function PermissoesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<Matrix | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canManage = Boolean(user?.companyId && user?.isOwner);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/company/permissions");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMatrix(data.matrix as Matrix);
      setError("");
    } catch {
      setError("Não foi possível carregar as permissões.");
    }
  }, []);

  useEffect(() => {
    if (canManage) load();
  }, [canManage, load]);

  const toggle = (level: CargoLevel, feature: FeatureKey) => {
    if (level === "owner") return;
    setMatrix((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [level]: { ...prev[level], [feature]: !prev[level][feature] },
      };
    });
  };

  const reset = async () => {
    if (!matrix) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrix: DEFAULT_FEATURE_PERMISSIONS }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao repor permissões.");
      await load();
      toast("Permissões repostas ao padrão.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao repor permissões.", "error");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!matrix) return;
    setSaving(true);
    try {
      const res = await fetch("/api/company/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrix }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao guardar permissões.");
      await load();
      toast("Permissões guardadas.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao guardar permissões.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!user?.companyId) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 text-center">
          <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-ib-muted">As permissões estão disponíveis apenas para organizações com equipa.</p>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 text-center">
          <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-ib-muted">Apenas o dono da organização pode gerir as permissões.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-ib-accent" />
            Permissões por Cargo
          </h1>
          <p className="text-ib-muted text-sm mt-1">
            Define a que áreas cada nível de cargo tem acesso. A configuração aplica-se a toda a sua organização.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-ib-muted hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" /> Repor padrão
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="btn btn-primary disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>
      )}

      {!matrix ? (
        <div className="card p-10 text-center text-ib-muted">A carregar permissões...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left px-4 py-3 font-semibold text-ib-primary w-48 sticky left-0 bg-gray-50/60">Nível</th>
                  {FEATURE_KEYS.map((f) => (
                    <th key={f} className="px-2 py-3 text-center font-medium text-ib-muted whitespace-nowrap min-w-[110px]" title={FEATURE_LABELS[f]}>
                      {FEATURE_LABELS[f]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CARGO_LEVELS.map((level) => {
                  const isOwnerRow = level === "owner";
                  return (
                    <tr key={level} className="border-b border-gray-50 hover:bg-gray-50/40">
                      <td className="px-4 py-2.5 font-medium text-ib-primary sticky left-0 bg-white">
                        <span className="flex items-center gap-2">
                          {CARGO_LEVEL_LABELS[level]}
                          {isOwnerRow && <Lock className="w-3.5 h-3.5 text-gray-300" aria-label="O dono tem sempre acesso total" />}
                        </span>
                      </td>
                      {FEATURE_KEYS.map((feature) => {
                        const value = matrix[level][feature];
                        const isOverride = value !== DEFAULT_FEATURE_PERMISSIONS[level][feature];
                        return (
                          <td key={feature} className="px-2 py-2.5 text-center">
                            <button
                              disabled={isOwnerRow}
                              onClick={() => toggle(level, feature)}
                              title={isOwnerRow ? "O dono tem sempre acesso" : (value ? "Desativar" : "Ativar")}
                              className={`w-8 h-5 rounded-full transition-colors relative disabled:opacity-40 disabled:cursor-not-allowed ${
                                value ? "bg-ib-accent" : "bg-gray-200"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                                  value ? "left-[calc(100%-18px)]" : "left-0.5"
                                }`}
                              />
                            </button>
                            {isOverride && <span className="block text-[10px] text-ib-accent mt-0.5">alterado</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50/60 text-xs text-ib-muted">
            Dica: só é possível <b>reduzir</b> o acesso em relação ao padrão do nível. O nível &quot;Dono&quot; tem sempre acesso total.
          </div>
        </div>
      )}
    </div>
  );
}