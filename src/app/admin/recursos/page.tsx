"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ToggleLeft, ToggleRight, Search, AlertTriangle } from "lucide-react";

interface Resource {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

const ICON_MAP: Record<string, string> = {
  LayoutDashboard: "⊞",
  Package: "□",
  Wrench: "🔧",
  Users: "👥",
  ShoppingCart: "🛒",
  Truck: "🚚",
  Receipt: "🧾",
  ArrowLeftRight: "⇄",
  Warehouse: "🏭",
  FileText: "📄",
  Calculator: "🔢",
  HandCoins: "💰",
  ArrowDownCircle: "⬇",
  ArrowUpCircle: "⬆",
  BarChart3: "📊",
  Building2: "🏢",
  Megaphone: "📢",
  HeartHandshake: "🤝",
  Brain: "🧠",
  Store: "🏪",
  Globe: "🌐",
};

export default function AdminRecursos() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchResources = () => {
    fetch("/api/admin/resources")
      .then((r) => r.json())
      .then((d) => setResources(d.resources));
  };

  useEffect(() => { fetchResources(); }, []);

  const toggleResource = async (res: Resource) => {
    setLoadingId(res.id);
    setError("");
    try {
      const r = await fetch("/api/admin/resources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: res.id, enabled: !res.enabled }),
      });
      if (!r.ok) throw new Error("Erro ao actualizar");
      setResources((prev) => prev.map((p) => (p.id === res.id ? { ...p, enabled: !p.enabled } : p)));
    } catch {
      setError("Erro ao alterar estado do recurso.");
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = resources.filter((r) =>
    r.label.toLowerCase().includes(search.toLowerCase()) || r.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <ToggleRight className="w-6 h-6 text-ib-accent" />
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Recursos</h1>
          <p className="text-sm text-ib-muted">Activar ou desactivar funcionalidades da plataforma</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Pesquisar recursos..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filtered.map((res) => (
            <div key={res.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xl">{ICON_MAP[res.icon] || "▪"}</span>
                <div>
                  <p className="font-medium text-ib-primary">{res.label}</p>
                  <p className="text-xs text-ib-muted">{res.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleResource(res)}
                disabled={loadingId === res.id}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  res.enabled ? "bg-green-500" : "bg-gray-300"
                } ${loadingId === res.id ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  res.enabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-ib-muted">Nenhum recurso encontrado.</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Os recursos desactivados ficam invisíveis no menu e inacessíveis para todos os utilizadores.</p>
      </div>
    </AdminLayout>
  );
}
