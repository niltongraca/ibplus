"use client";

import { useState, useEffect } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import { User, Building2, Lock, Save } from "lucide-react";

export default function PerfilPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [company, setCompany] = useState({ name: "", nif: "", phone: "", address: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email });
      fetch("/api/company")
        .then((r) => r.json())
        .then((d) => {
          if (d.company) setCompany({ name: d.company.name || "", nif: d.company.nif || "", phone: d.company.phone || "", address: d.company.address || "" });
        })
        .catch(() => {});
    }
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name }),
    });
    setLoading(false);
    if (res.ok) toast("Perfil actualizado!", "success");
    else toast("Erro ao actualizar perfil.", "error");
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    });
    setLoading(false);
    if (res.ok) toast("Empresa actualizada!", "success");
    else toast("Erro ao actualizar empresa.", "error");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      toast("As senhas não coincidem.", "error");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
    });
    setLoading(false);
    if (res.ok) {
      toast("Senha alterada com sucesso!", "success");
      setPasswords({ current: "", newPass: "", confirm: "" });
    } else {
      const data = await res.json();
      toast(data.error || "Erro ao alterar senha.", "error");
    }
  }

  return (
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-ib-primary">Definições do Perfil</h1>

        {/* Profile Info */}
        <form onSubmit={saveProfile} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-ib-primary flex items-center gap-2"><User className="w-5 h-5 text-ib-accent" /> Informações Pessoais</h2>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Nome</label>
            <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Email</label>
            <input type="email" value={profile.email} disabled
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> Salvar
          </button>
        </form>

        {/* Company Info */}
        <form onSubmit={saveCompany} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-ib-primary flex items-center gap-2"><Building2 className="w-5 h-5 text-ib-accent" /> Dados da Empresa</h2>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Nome da Empresa</label>
            <input type="text" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">NIF</label>
              <input type="text" value={company.nif} onChange={(e) => setCompany({ ...company, nif: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Telefone</label>
              <input type="text" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Endereço</label>
            <input type="text" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> Salvar
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={changePassword} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-ib-primary flex items-center gap-2"><Lock className="w-5 h-5 text-ib-accent" /> Alterar Senha</h2>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Senha Actual</label>
            <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Nova Senha</label>
              <input type="password" value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Confirmar Nova Senha</label>
              <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> Alterar Senha
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
