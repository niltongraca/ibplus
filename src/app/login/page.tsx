"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, LogIn } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const { user: u } = await fetch("/api/auth/me").then((r) => r.json());
      const defaultRoute = u?.role === "admin" ? "/admin" : "/gestao/dashboard";
      const redirect = searchParams?.get("redirect") || defaultRoute;
      router.push(redirect);
    } else {
      setError(result.error || "Erro ao fazer login.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <Link href="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        <span className="text-sm">Voltar ao início</span>
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-ib-accent flex items-center justify-center font-bold text-xl text-white">
              IB
            </div>
            <span className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              IBPlus<sup className="text-ib-accent font-bold">+</sup>
            </span>
          </div>
          <p style={{ color: "var(--text-muted)" }}>Entre na sua conta</p>
        </div>

        <form className="glass-card p-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--color-ib-danger)" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="glass-input w-full px-3 py-2.5 text-sm"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="glass-input w-full px-3 py-2.5 text-sm pr-10"
                style={{ color: "var(--text-primary)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Entrando..." : (
              <>
                <LogIn className="h-4 w-4" />
                Entrar
              </>
            )}
          </button>

          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-ib-accent hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </form>

        <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          <Link href="/recuperar-senha" className="hover:underline">Esqueceu a senha?</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="animate-pulse" style={{ color: "var(--text-muted)" }}>A carregar...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
