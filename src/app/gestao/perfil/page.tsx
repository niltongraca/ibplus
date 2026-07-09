"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import {
  User, Building2, Lock, Save, MapPin, Phone, Smartphone,
  Palette, Clock, Download, Share2, Globe, Store, Image as LucideImage,
  MessageCircle, CheckCircle, AlertCircle, Moon, Sun
} from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { InviteManager } from "@/components/InviteManager";
import { useTheme } from "@/contexts/ThemeContext";

interface CompanyData {
  name: string;
  nif: string;
  phone: string;
  email: string;
  address: string;
  logo: string;
  whatsappNumber: string;
  whatsappStore: string;
  provinciaOperacao: string;
  horarioFuncionamento: string;
  corPrincipal: string;
  descricaoLoja: string;
  sobreNos: string;
}

export default function PerfilPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("perfil");

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [company, setCompany] = useState<CompanyData>({
    name: "", nif: "", phone: "", email: "", address: "", logo: "",
    whatsappNumber: "", whatsappStore: "", provinciaOperacao: "",
    horarioFuncionamento: "", corPrincipal: "#2563eb",
    descricaoLoja: "", sobreNos: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email, phone: user.phone || "" });
    }
  }, [user]);

  useEffect(() => {
    fetch("/api/company")
      .then((r) => r.json())
      .then((d) => {
        if (d.company) {
          setCompany({
            name: d.company.name || "",
            nif: d.company.nif || "",
            phone: d.company.phone || "",
            email: d.company.email || "",
            address: d.company.address || "",
            logo: d.company.logo || "",
            whatsappNumber: d.company.whatsappNumber || "",
            whatsappStore: d.company.whatsappStore || "",
            provinciaOperacao: d.company.provinciaOperacao || "",
            horarioFuncionamento: d.company.horarioFuncionamento || "",
            corPrincipal: d.company.corPrincipal || "#2563eb",
            descricaoLoja: d.company.descricaoLoja || "",
            sobreNos: d.company.sobreNos || "",
          });
        }
      })
      .catch(() => {});
  }, []);

  async function saveCompany(data: Partial<CompanyData>) {
    setSaving(true);
    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast("Configurações salvas!", "success");
        setCompany((prev) => ({ ...prev, ...data }));
      } else {
        toast("Erro ao salvar.", "error");
      }
    } catch {
      toast("Erro ao salvar.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profile.name }),
    });
    setSaving(false);
    toast("Perfil actualizado!", "success");
  }

  const tabs = [
    { key: "perfil", label: "Meu Perfil", icon: User },
    { key: "loja", label: "Informações da Loja", icon: Store },
    { key: "contactos", label: "Contactos da Loja", icon: MessageCircle },
    { key: "endereco", label: "Configuração de Endereço", icon: MapPin },
    { key: "personalizar", label: "Personalização", icon: Palette },
    { key: "horarios", label: "Horários", icon: Clock },
  ];

  const updateCompany = (field: string, value: string) =>
    setCompany((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Configurações</h1>
        <p className="text-ib-muted text-sm">Gerir perfil, loja e preferências</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-ib-accent text-white"
                : "bg-white border border-gray-200 text-ib-muted hover:bg-gray-50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "perfil" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-ib-accent" /> Dados Pessoais
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-ib-muted">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
                )}
              </div>
              <FileUpload value={user?.avatar || ""} onChange={async (url) => {
                await fetch("/api/auth/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: profile.name, avatar: url }),
                });
                window.location.reload();
              }} label="Alterar Avatar" accept="image/*" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Nome Completo</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Email</label>
                <input type="email" value={profile.email} disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Telefone Pessoal</label>
                <input type="text" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+244 XXX XXX XXX" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={saveProfile} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? "A salvar..." : "Salvar Perfil"}
              </button>
            </div>
          </div>
          <InviteManager />
        </div>
      )}

      {activeTab === "contactos" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-ib-accent" /> Contactos da Loja
            </h2>
            <p className="text-sm text-ib-muted mb-4">Números de WhatsApp associados à loja que serão exibidos para os clientes.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">WhatsApp Loja (exibido aos clientes)</label>
                <input type="text" value={company.whatsappStore} onChange={(e) => updateCompany("whatsappStore", e.target.value)} placeholder="+244 XXX XXX XXX" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">WhatsApp Notificações (opcional)</label>
                <input type="text" value={company.whatsappNumber} onChange={(e) => updateCompany("whatsappNumber", e.target.value)} placeholder="+244 XXX XXX XXX" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => saveCompany({ whatsappStore: company.whatsappStore, whatsappNumber: company.whatsappNumber })} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> Salvar Contactos
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "endereco" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-ib-accent" /> Configuração de Endereço
            </h2>
            <p className="text-sm text-ib-muted mb-4">Defina o ponto de origem para entregas e retiradas.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Endereço</label>
                <input type="text" value={company.address} onChange={(e) => updateCompany("address", e.target.value)} placeholder="Rua, nº, bairro" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Província de Operação</label>
                <select value={company.provinciaOperacao} onChange={(e) => updateCompany("provinciaOperacao", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
                  <option value="">Seleccionar província</option>
                  {["Bengo","Benguela","Bié","Cabinda","Cuando Cubango","Cuanza Norte","Cuanza Sul","Cunene","Huambo","Huíla","Luanda","Lunda Norte","Lunda Sul","Malanje","Moxico","Namibe","Uíge","Zaire"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => saveCompany({ address: company.address, provinciaOperacao: company.provinciaOperacao })} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> Salvar Endereço
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "loja" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-ib-accent" /> Dados Básicos
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Nome da Loja/Empresa</label>
                <input type="text" value={company.name} onChange={(e) => updateCompany("name", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">NIF</label>
                <input type="text" value={company.nif} onChange={(e) => updateCompany("nif", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Email da Loja</label>
                <input type="email" value={company.email} onChange={(e) => updateCompany("email", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Telefone da Loja</label>
                <input type="text" value={company.phone} onChange={(e) => updateCompany("phone", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-ib-accent" /> Sobre Nós
            </h2>
            <p className="text-sm text-ib-muted mb-4">Descrição da sua loja para redes sociais. Aparece quando partilhar a loja.</p>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Descrição da Loja</label>
              <textarea value={company.descricaoLoja} onChange={(e) => updateCompany("descricaoLoja", e.target.value)} rows={3} placeholder="Conte um pouco sobre o seu negócio..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-ib-primary mb-1">Sobre Nós (texto completo)</label>
              <textarea value={company.sobreNos} onChange={(e) => updateCompany("sobreNos", e.target.value)} rows={4} placeholder="História, missão, valores..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" />
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => saveCompany({ name: company.name, nif: company.nif, email: company.email, phone: company.phone, descricaoLoja: company.descricaoLoja, sobreNos: company.sobreNos })} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> Salvar Loja
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "personalizar" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4 text-ib-accent" /> Personalização
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Cor Principal</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={company.corPrincipal} onChange={(e) => updateCompany("corPrincipal", e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  <span className="text-sm text-ib-muted font-mono">{company.corPrincipal}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Logo da Loja</label>
                <FileUpload value={company.logo} onChange={(url) => updateCompany("logo", url)} label="Carregar Logo" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => saveCompany({ corPrincipal: company.corPrincipal, logo: company.logo })} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> Salvar Personalização
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
              <Moon className="w-4 h-4 text-ib-accent" /> Tema da Interface
            </h2>
            <p className="text-sm text-ib-muted mb-4">Alternar entre modo claro e escuro.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${theme === "light" ? "bg-ib-accent text-white border-ib-accent" : "border-gray-200 text-ib-muted hover:bg-gray-50"}`}
              >
                <Sun className="w-4 h-4" /> Modo Claro
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${theme === "dark" ? "bg-ib-accent text-white border-ib-accent" : "border-gray-200 text-ib-muted hover:bg-gray-50"}`}
              >
                <Moon className="w-4 h-4" /> Modo Escuro
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-ib-accent" /> Instalar Aplicativo
            </h2>
            <p className="text-sm text-ib-muted mb-4">Acesse sua loja direto da tela inicial do seu dispositivo.</p>
            <button onClick={() => {
              toast("Adicione aos favoritos ou use 'Instalar App' no menu do navegador.", "info");
            }} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50">
              <Download className="w-4 h-4" /> Como Instalar
            </button>
          </div>
        </div>
      )}

      {activeTab === "horarios" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-ib-accent" /> Horários de Funcionamento
            </h2>
            <p className="text-sm text-ib-muted mb-4">Configure os dias e horários de operação da sua loja.</p>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Horários (ex: Seg-Sex: 8h-18h, Sáb: 8h-13h)</label>
              <textarea value={company.horarioFuncionamento} onChange={(e) => updateCompany("horarioFuncionamento", e.target.value)} rows={4} placeholder="Segunda a Sexta: 08:00 - 18:00&#10;Sábado: 08:00 - 13:00&#10;Domingo: Fechado" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" />
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => saveCompany({ horarioFuncionamento: company.horarioFuncionamento })} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                <Save className="w-4 h-4" /> Salvar Horários
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
