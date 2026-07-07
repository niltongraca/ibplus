"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function ResetarSenhaPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Erro ao redefinir senha.");
      toast(data.error || "Erro ao redefinir senha.", "error");
      return;
    }

    setSuccess(true);
    toast("Senha redefinida com sucesso!", "success");
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ib-surface flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
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
            <p className="text-ib-primary font-medium">Senha redefinida com sucesso!</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-ib-accent hover:underline font-medium text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ib-surface flex items-center justify-center px-4 relative">
      <Link href="/recuperar-senha" className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-ib-muted hover:text-ib-primary transition-colors">
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm">Voltar</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="font-bold text-2xl text-ib-primary">
              IBPlus<sup className="text-ib-accent font-bold">+</sup>
            </span>
          </div>
          <p className="text-ib-muted">Nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-ib-danger/10 text-ib-danger text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ib-accent hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "A redefinir..." : (
              <>
                <Lock className="h-4 w-4" />
                Redefinir senha
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
