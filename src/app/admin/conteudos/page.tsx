"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmModal";
import { Plus, Pencil, Trash2, ExternalLink, Youtube, Book, FileText } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface ContentItem {
  id: string;
  title: string;
  type: "VIDEO" | "POST" | "BOOK" | "ARTICLE";
  url: string;
  description: string | null;
  thumbnail: string | null;
  author: string | null;
  tags: string | null;
  featured: boolean;
  published: boolean;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  VIDEO: "Vídeo",
  POST: "Post",
  BOOK: "Ebook",
  ARTICLE: "Artigo",
};

const typeIcons: Record<string, any> = {
  VIDEO: Youtube,
  POST: FileText,
  BOOK: Book,
  ARTICLE: FileText,
};

export default function AdminConteudosPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      setContent(data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!(await confirm({ title: "Eliminar conteúdo", message: "Tem a certeza que deseja eliminar este conteúdo?", variant: "danger" }))) return;
    await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    setContent((prev) => prev.filter((c) => c.id !== id));
  }

  async function toggleFeatured(item: ContentItem) {
    await fetch(`/api/admin/content/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !item.featured }),
    });
    load();
  }

  async function togglePublished(item: ContentItem) {
    await fetch(`/api/admin/content/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !item.published }),
    });
    load();
  }

  if (loading) return <AdminLayout><div className="p-12 text-center text-ib-muted">A carregar...</div></AdminLayout>;

  return (
    <AdminLayout>
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Conteúdos</h1>
          <p className="text-ib-muted text-sm">Gerir vídeos, posts, ebooks e artigos</p>
        </div>
        <Link href="/admin/conteudos/novo" className="flex items-center gap-1.5 px-3 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Novo Conteúdo
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-ib-muted text-xs uppercase tracking-wider">
              <th className="text-left p-3 font-medium">Título</th>
              <th className="text-center p-3 font-medium w-20">Tipo</th>
              <th className="text-center p-3 font-medium w-20">Destaque</th>
              <th className="text-center p-3 font-medium w-20">Publicado</th>
              <th className="text-center p-3 font-medium w-24">Data</th>
              <th className="text-center p-3 font-medium w-28">Acções</th>
            </tr>
          </thead>
          <tbody>
            {content.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-ib-muted">Nenhum conteúdo encontrado.</td>
              </tr>
            ) : content.map((item) => {
              const Icon = typeIcons[item.type];
              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        item.type === "VIDEO" ? "bg-red-100 text-red-500" :
                        item.type === "BOOK" ? "bg-green-100 text-green-500" :
                        "bg-blue-100 text-blue-500"
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-ib-primary truncate max-w-xs">{item.title}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-xs text-ib-muted">{typeLabels[item.type]}</span>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleFeatured(item)} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.featured ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      {item.featured ? "Sim" : "Não"}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => togglePublished(item)} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.published ? "bg-green-100 text-green-600" : "bg-red-100 text-red-400"
                    }`}>
                      {item.published ? "Sim" : "Não"}
                    </button>
                  </td>
                  <td className="p-3 text-center text-xs text-ib-muted">{formatDate(item.createdAt)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded-lg" title="Abrir URL">
                        <ExternalLink className="w-4 h-4 text-ib-muted" />
                      </a>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Eliminar">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </AdminLayout>
  );
}
