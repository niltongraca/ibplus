"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function NovoConteudoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "VIDEO",
    url: "",
    description: "",
    thumbnail: "",
    author: "",
    tags: "",
    featured: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) {
      setError("Título e URL são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/admin/conteudos");
    } catch (err: any) {
      setError(err.message || "Erro ao criar conteúdo.");
    } finally {
      setSaving(false);
    }
  }

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <AdminLayout>
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/conteudos" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-ib-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Novo Conteúdo</h1>
          <p className="text-ib-muted text-sm">Adicionar vídeo, post, ebook ou artigo</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Título *</label>
            <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Tipo *</label>
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
                <option value="VIDEO">Vídeo</option>
                <option value="POST">Post</option>
                <option value="BOOK">Ebook</option>
                <option value="ARTICLE">Artigo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">URL *</label>
              <input type="url" value={form.url} onChange={(e) => update("url", e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Thumbnail (URL)</label>
              <input type="url" value={form.thumbnail} onChange={(e) => update("thumbnail", e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Autor</label>
              <input type="text" value={form.author} onChange={(e) => update("author", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Tags (separadas por vírgula)</label>
            <input type="text" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="ex: empreendedorismo, finanças" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} className="rounded border-gray-300 text-ib-accent focus:ring-ib-accent" />
            <span className="text-sm text-ib-primary font-medium">Conteúdo em destaque</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/conteudos" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-ib-muted hover:bg-gray-50">Cancelar</Link>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "A salvar..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
    </AdminLayout>
  );
}
