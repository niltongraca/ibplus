"use client";

import { useState, useEffect } from "react";
import { BookOpen, Youtube, FileText, Book, ExternalLink, Search, Filter } from "lucide-react";
import Link from "next/link";

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
  createdAt: string;
}

const typeConfig = {
  VIDEO: { icon: Youtube, label: "Vídeo", color: "bg-red-100 text-red-600" },
  POST: { icon: FileText, label: "Post", color: "bg-blue-100 text-blue-600" },
  BOOK: { icon: Book, label: "Ebook", color: "bg-green-100 text-green-600" },
  ARTICLE: { icon: FileText, label: "Artigo", color: "bg-purple-100 text-purple-600" },
};

export default function BibliotecaPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("type", filter);
    fetch(`/api/content?${params}`)
      .then((r) => r.json())
      .then((d) => setContent(d.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = content.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const types = [
    { key: "all", label: "Todos" },
    { key: "VIDEO", label: "Vídeos" },
    { key: "POST", label: "Posts" },
    { key: "BOOK", label: "Ebooks" },
    { key: "ARTICLE", label: "Artigos" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ib-accent/10 mb-4">
            <BookOpen className="w-8 h-8 text-ib-accent" />
          </div>
          <h1 className="text-4xl font-bold text-ib-primary mb-3">Biblioteca</h1>
          <p className="text-lg text-ib-muted max-w-2xl mx-auto">
            Vídeos, artigos, ebooks e posts sobre empreendedorismo, negócios e vida financeira.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar conteúdos..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {types.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === t.key
                    ? "bg-ib-accent text-white"
                    : "bg-white border border-gray-200 text-ib-muted hover:bg-gray-50"
                }`}
              >
                {t.key !== "all" && <Filter className="w-3.5 h-3.5" />}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-ib-muted">A carregar...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Nenhum conteúdo disponível de momento.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => {
              const tc = typeConfig[item.type];
              const Icon = tc.icon;
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-ib-accent/30 transition-all"
                >
                  {item.thumbnail ? (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-ib-accent/5 to-blue-50 flex items-center justify-center">
                      <Icon className="w-12 h-12 text-ib-accent/30" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tc.color}`}>
                        <Icon className="w-3 h-3" />
                        {tc.label}
                      </span>
                      {item.featured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-medium">
                          Destaque
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-ib-primary mb-1 group-hover:text-ib-accent transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-ib-muted line-clamp-2 mb-3">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {item.author && (
                        <span className="text-xs text-gray-400">{item.author}</span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-ib-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Aceder <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
