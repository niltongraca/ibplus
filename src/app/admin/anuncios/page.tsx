"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Megaphone, Send, RefreshCw, ListChecks, Info } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface Announcement {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  requiresUpdate: boolean;
  createdAt: string;
}

export default function AdminAnuncios() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [requiresUpdate, setRequiresUpdate] = useState(false);
  const [sending, setSending] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastBroadcast, setLastBroadcast] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<{ announcements?: Announcement[] }>("/api/admin/announcements")
      .then((d) => setAnnouncements(d.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function sendAnnouncement() {
    if (!title.trim()) {
      toast("Indique o título do anúncio.", "error");
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch<{ broadcast?: number }>("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, link, requiresUpdate }),
      });
      setLastBroadcast(res.broadcast ?? 0);
      setTitle("");
      setMessage("");
      setLink("");
      setRequiresUpdate(false);
      toast("Anúncio enviado a todas as empresas!", "success");
      const list = await apiFetch<{ announcements?: Announcement[] }>("/api/admin/announcements");
      setAnnouncements(list.announcements || []);
    } catch {
      toast("Erro ao enviar o anúncio.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="w-6 h-6 text-ib-accent" />
        <div>
          <h1 className="page-title">Anúncios / Novas Funções</h1>
          <p className="text-sm text-ib-muted">Enviar avisos a todas as empresas do sistema</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-ib-accent" /> Novo Anúncio
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Novas funções implementadas"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Mensagem</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Descreva a novidade para os utilizadores..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Link (opcional)</label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Ex.: /gestao/configuracao"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={requiresUpdate}
              onChange={(e) => setRequiresUpdate(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm">
              <span className="font-medium text-ib-primary flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-ib-accent" /> Exige actualização da conta
              </span>
              <span className="text-ib-muted">Se activado, os utilizadores verão os passos para completar a conta (foto, capa, bio, etc.) e a notificação dará destaque a essa necessidade.</span>
            </span>
          </label>
          <div className="flex justify-end">
            <button
              onClick={sendAnnouncement}
              disabled={sending}
              className="btn btn-primary disabled:opacity-50"
            >
              {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "A enviar..." : "Enviar para todas as empresas"}
            </button>
          </div>
          {lastBroadcast !== null && (
            <p className="text-xs text-ib-muted text-right">
              <Info className="inline w-3.5 h-3.5 mr-1" />Anúncio entregue a {lastBroadcast} empresas.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-ib-primary flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-ib-accent" /> Histórico de Anúncios
          </h2>
        </div>
        {loading ? (
          <div className="p-12 text-center text-ib-muted">A carregar...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-ib-muted">Nenhum anúncio enviado ainda.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {announcements.map((a) => (
              <div key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-ib-primary">{a.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${a.requiresUpdate ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                    {a.requiresUpdate ? "Requer actualização" : "Informativo"}
                  </span>
                </div>
                {a.message && <p className="text-xs text-ib-muted mt-1">{a.message}</p>}
                {a.link && <p className="text-xs text-ib-accent mt-1">Link: {a.link}</p>}
                <p className="text-[10px] text-ib-muted mt-1">{new Date(a.createdAt).toLocaleString("pt-PT")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}