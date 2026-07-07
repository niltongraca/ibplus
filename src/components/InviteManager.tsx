"use client";

import { useState, useEffect } from "react";
import { Link2, Copy, Check, Users, X, Mail } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";

interface Invite {
  id: string;
  token: string;
  email: string | null;
  role: string;
  used: boolean;
  createdAt: string;
}

export function InviteManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/company/invite")
      .then((r) => r.json())
      .then((d) => setInvites(d.invites || []))
      .catch(() => {});
  }, []);

  if (user?.accountType === "EMPREENDEDOR") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-ib-primary mb-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-ib-accent" /> Utilizadores
        </h3>
        <p className="text-sm text-ib-muted">Contas de empreendedor são individuais. Não é possível adicionar outros utilizadores.</p>
      </div>
    );
  }

  async function createInvite() {
    setLoading(true);
    try {
      const res = await fetch("/api/company/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      const data = await res.json();
      if (data.invite) {
        setInvites((prev) => [data.invite, ...prev]);
        setEmail("");
        toast("Link de convite criado!", "success");
      } else {
        toast(data.error || "Erro ao criar convite.", "error");
      }
    } catch {
      toast("Erro ao criar convite.", "error");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(invite: Invite) {
    const url = `${window.location.origin}/cadastro?invite=${invite.token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-ib-accent" /> Convidar Utilizador
        </h3>
        <p className="text-sm text-ib-muted mb-4">Crie um link de acesso para outra pessoa entrar na conta da sua empresa/organização.</p>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email do convidado (opcional)"
            className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
          />
          <button
            onClick={createInvite}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Link2 className="w-4 h-4" /> {loading ? "A criar..." : "Gerar Link"}
          </button>
        </div>
      </div>

      {invites.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-ib-primary mb-4">Convites Activos</h3>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {invite.used ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Mail className="w-4 h-4 text-ib-muted" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-ib-primary">
                      {invite.email || "Link genérico"}
                    </p>
                    <p className="text-xs text-ib-muted">
                      {invite.used ? "Já utilizado" : "Aguardando aceitação"}
                    </p>
                  </div>
                </div>
                {!invite.used && (
                  <button
                    onClick={() => copyToClipboard(invite)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    {copiedId === invite.id ? (
                      <><Check className="w-3 h-3 text-green-500" /> Copiado</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copiar Link</>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
