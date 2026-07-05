"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function EditarClientePage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    nif: "",
    address: "",
    type: "particular",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const c = d.customer;
        setForm({
          name: c.name || "",
          email: c.email || "",
          phone: c.phone || "",
          nif: c.nif || "",
          address: c.address || "",
          type: c.type || "particular",
          notes: c.notes || "",
        });
      })
      .catch((err) => { console.error(err); router.push("/gestao/clientes"); })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          nif: form.nif || null,
          address: form.address || null,
          type: form.type,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        toast("Cliente actualizado com sucesso!");
        router.push(`/gestao/clientes/${id}`);
      } else {
        toast("Erro ao actualizar cliente.", "error");
      }
    } catch {
      toast("Erro ao actualizar cliente.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-ib-muted text-sm">A carregar...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/gestao/clientes/${id}`} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-ib-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Editar Cliente</h1>
          <p className="text-ib-muted text-sm">{form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ib-primary mb-1">Nome *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Telefone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">NIF</label>
            <input
              type="text"
              value={form.nif}
              onChange={(e) => setForm({ ...form, nif: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            >
              <option value="particular">Particular</option>
              <option value="empresa">Empresa</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ib-primary mb-1">Morada</label>
            <textarea
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-ib-primary mb-1">Notas</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "A guardar..." : "Guardar Alterações"}
          </button>
          <Link
            href={`/gestao/clientes/${id}`}
            className="text-sm text-ib-muted hover:text-ib-primary px-4 py-2.5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
