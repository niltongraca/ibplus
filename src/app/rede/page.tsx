"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, MessageCircle, Share2, ExternalLink, Search, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";

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

const typeLabels: Record<string, string> = {
  VIDEO: "Vídeo",
  POST: "Post",
  BOOK: "Ebook",
  ARTICLE: "Artigo",
};

const typeColors: Record<string, string> = {
  VIDEO: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  POST: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  BOOK: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  ARTICLE: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("pt-AO");
}

export default function RedePage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((d) => setContent(d.content || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = content.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <SiteHeader />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-ib-accent/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-ib-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Rede</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Conteúdos, dicas e novidades</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar na rede..."
            className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-5 animate-pulse" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-lg" style={{ color: "var(--text-muted)" }}>Nenhum conteúdo disponível de momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sorted.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-ib-accent/10 flex items-center justify-center shrink-0 text-sm font-bold text-ib-accent">
                      {(item.author || "IB").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {item.author || "IBPlus+"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[item.type]}`}>
                          {typeLabels[item.type]}
                        </span>
                        {item.featured && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                            Destaque
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>

                  {item.thumbnail && (
                    <div className="rounded-lg overflow-hidden mb-3 -mx-1">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-auto max-h-64 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <h2 className="font-semibold text-base mb-1" style={{ color: "var(--text-primary)" }}>
                    {item.title}
                  </h2>
                  {item.description && (
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {item.description}
                    </p>
                  )}

                  {item.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.split(",").map((tag) => (
                        <span
                          key={tag.trim()}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)" }}
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center border-t px-4 sm:px-5 py-2" style={{ borderColor: "var(--border-color)" }}>
                  <button
                    onClick={() => toggleLike(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      liked.has(item.id) ? "text-ib-accent" : ""
                    }`}
                    style={{ color: liked.has(item.id) ? undefined : "var(--text-muted)" }}
                  >
                    <ThumbsUp className={`w-4 h-4 ${liked.has(item.id) ? "fill-ib-accent" : ""}`} />
                    {liked.has(item.id) ? "Curtiu" : "Curtir"}
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm" style={{ color: "var(--text-muted)" }}>
                    <MessageCircle className="w-4 h-4" /> Comentar
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ml-auto"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <ExternalLink className="w-4 h-4" /> Abrir
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
