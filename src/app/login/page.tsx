"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
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
      const redirect = searchParams.get("redirect") || "/gestao/dashboard";
      router.push(redirect);
    } else {
      setError(result.error || "Erro ao fazer login.");
    }
  };

  return (
    <div className="min-h-screen bg-ib-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-ib-accent flex items-center justify-center font-bold text-xl text-white">
              IB
            </div>
            <span className="font-bold text-2xl text-ib-primary">
              IBPlus<sup className="text-ib-accent font-bold">+</sup>
            </span>
          </div>
          <p className="text-ib-muted">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-ib-danger/10 text-ib-danger text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ib-muted hover:text-ib-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ib-accent hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Entrando..." : (
              <>
                <LogIn className="h-4 w-4" />
                Entrar
              </>
            )}
          </button>

          <p className="text-center text-sm text-ib-muted">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="text-ib-accent hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
