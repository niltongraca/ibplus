"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/Toast";
import { SuccessCheck } from "@/components/ui/SuccessCheck";

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="font-bold text-2xl text-ib-primary">
                IBPlus<sup className="text-ib-accent font-bold">+</sup>
              </span>
            </div>
          </div>

          <div className="card p-8 space-y-5 text-center">
            <div className="flex justify-center">
              <SuccessCheck size={64} />
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
    <div className="min-h-screen flex items-center justify-center px-4 relative">
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

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-ib-danger/10 text-ib-danger text-sm">{error}</div>
          )}

          <div>
            <label className="label">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="input"
            />
          </div>

          <div>
            <label className="label">Confirmar senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
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
