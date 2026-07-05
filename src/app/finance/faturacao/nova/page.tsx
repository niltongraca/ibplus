"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Save, Wrench } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

export default function NovaFaturaPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [customer, setCustomer] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/services").then(r => r.json()).then(d => setServices(d.services || [])).catch((err) => console.error("Erro ao carregar serviços:", err));
  }, []);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== i));
  };
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    setItems(updated);
  };

  const addService = (service: Service) => {
    setItems([...items, { description: service.name, quantity: 1, unitPrice: service.price }]);
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.description.trim())) {
      setError("Preencha todos os campos dos itens.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, dueDate: dueDate || null, notes, items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/finance/faturacao");
    } catch (err: any) {
      setError(err.message || "Erro ao criar fatura.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/finance/faturacao" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-ib-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Nova Fatura</h1>
          <p className="text-ib-muted text-sm">Criar fatura para enviar ao cliente</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Cliente</label>
              <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nome do cliente" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Vencimento</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ib-primary">Itens</h2>
            <div className="flex items-center gap-2">
              {services.length > 0 && (
                <div className="relative group">
                  <button type="button" className="flex items-center gap-1.5 text-sm text-ib-accent hover:text-blue-700 font-medium">
                    <Wrench className="w-4 h-4" /> Serviços
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg py-2 hidden group-hover:block z-10">
                    {services.map((s) => (
                      <button key={s.id} type="button" onClick={() => addService(s)} className="block w-full text-left px-4 py-2 text-sm text-ib-muted hover:text-ib-primary hover:bg-gray-50">
                        {s.name} — {formatCurrency(s.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm text-ib-accent hover:text-blue-700 font-medium">
                <Plus className="w-4 h-4" /> Adicionar Item
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-ib-muted text-xs uppercase tracking-wider">
                <th className="text-left p-3 font-medium w-2/5">Descrição</th>
                <th className="text-center p-3 font-medium w-16">Qtd</th>
                <th className="text-right p-3 font-medium w-32">Preço Unit.</th>
                <th className="text-right p-3 font-medium w-32">Total</th>
                <th className="text-center p-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="p-1">
                    <input type="text" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Descrição" className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" required />
                  </td>
                  <td className="p-1">
                    <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)} className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-ib-accent/40" required />
                  </td>
                  <td className="p-1">
                    <input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-ib-accent/40" required />
                  </td>
                  <td className="p-1 text-right font-semibold text-ib-primary">{formatCurrency(item.quantity * item.unitPrice)}</td>
                  <td className="p-1 text-center">
                    <button type="button" onClick={() => removeItem(i)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <div className="text-right">
              <span className="text-sm text-ib-muted">Total</span>
              <p className="text-2xl font-bold text-ib-primary">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-ib-primary mb-1">Observações</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Condições de pagamento, etc." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/finance/faturacao" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-ib-muted hover:bg-gray-50 transition-colors">Cancelar</Link>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "A salvar..." : "Salvar Fatura"}
          </button>
        </div>
      </form>
    </div>
  );
}
