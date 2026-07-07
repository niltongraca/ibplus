"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Check } from "lucide-react";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(null);
    setToken(null);
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erro ao enviar pedido.");
      return;
    }

    setSuccess(data.message);
    if (data.token) {
      setToken(data.token);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ib-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-xl bg-ib-accent flex items-center justify-center font-bold text-xl text-white">IB</div>
              <span className="font-bold text-2xl text-ib-primary">
                IBPlus<sup className="text-ib-accent font-bold">+</sup>
              </span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-gray-200 space-y-5 text-center">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-ib-primary font-medium">{success}</p>

            {token && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800 break-all">
                <p className="font-medium mb-1">Token (dev):</p>
                <Link
                  href={`/recuperar-senha/${token}`}
                  className="text-blue-600 hover:underline"
                >
                  {token}
                </Link>
              </div>
            )}

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-ib-accent hover:underline font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ib-surface flex items-center justify-center px-4 relative">
      <Link href="/login" className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-ib-muted hover:text-ib-primary transition-colors">
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm">Voltar ao login</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-ib-accent flex items-center justify-center font-bold text-xl text-white">IB</div>
            <span className="font-bold text-2xl text-ib-primary">
              IBPlus<sup className="text-ib-accent font-bold">+</sup>
            </span>
          </div>
          <p className="text-ib-muted">Recuperar senha</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-ib-danger/10 text-ib-danger text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ib-accent hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "A enviar..." : (
              <>
                <Mail className="h-4 w-4" />
                Enviar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
