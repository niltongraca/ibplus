"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function CadastroPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "particular",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("O nome é obrigatório.");
      return;
    }

    setLoading(true);

    const result = await register(form);
    setLoading(false);

    if (result.success) {
      router.push("/gestao/dashboard");
    } else {
      setError(result.error || "Erro ao criar conta.");
    }
  };

  return (
    <div className="min-h-screen bg-ib-surface flex items-center justify-center px-4 relative">
      <Link href="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-ib-muted hover:text-ib-primary transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        <span className="text-sm">Voltar ao início</span>
      </Link>
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
          <p className="text-ib-muted">Crie a sua conta gratuita</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-ib-danger/10 text-ib-danger text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">
              Nome completo
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com"
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">
              Tipo de conta
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "particular", label: "Particular", desc: "Para uso individual" },
                { value: "empresa", label: "Empresa", desc: "Para negócios e equipas" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: opt.value })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${form.role === opt.value ? "border-ib-accent bg-ib-accent/5" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <span className="block text-sm font-medium text-ib-primary">{opt.label}</span>
                  <span className="block text-xs text-ib-muted mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
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

          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1.5">
              Confirmar senha
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Repita a senha"
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
            {loading ? "Criando conta..." : (
              <>
                <UserPlus className="h-4 w-4" />
                Criar conta
              </>
            )}
          </button>

          <p className="text-center text-sm text-ib-muted">
            Já tem conta?{" "}
            <Link href="/login" className="text-ib-accent hover:underline font-medium">
              Fazer login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
