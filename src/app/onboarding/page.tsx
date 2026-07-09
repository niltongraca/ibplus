"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import {
  Store, MapPin, Smartphone, Palette, Clock, CheckCircle,
  ArrowRight, ArrowLeft, Building2, Share2, User, Heart,
  GraduationCap, Handshake, Users, Target, Globe
} from "lucide-react";

interface OnboardingStep {
  key: string;
  label: string;
  icon: any;
  desc: string;
}

const ONBOARDING_STEPS: Record<string, OnboardingStep[]> = {
  EMPREENDEDOR: [
    { key: "perfil", label: "Perfil", icon: User, desc: "Nome e dados" },
    { key: "contacto", label: "Contacto", icon: Smartphone, desc: "WhatsApp e telefone" },
    { key: "endereco", label: "Endereço", icon: MapPin, desc: "Localização" },
    { key: "horarios", label: "Horários", icon: Clock, desc: "Disponibilidade" },
  ],
  EMPRESA: [
    { key: "loja", label: "Empresa", icon: Building2, desc: "Nome e dados" },
    { key: "contacto", label: "Contacto", icon: Smartphone, desc: "WhatsApp e telefone" },
    { key: "endereco", label: "Endereço", icon: MapPin, desc: "Onde está" },
    { key: "sobre", label: "Sobre", icon: Share2, desc: "Descrição" },
    { key: "horarios", label: "Horários", icon: Clock, desc: "Funcionamento" },
  ],
  ONG: [
    { key: "perfil", label: "ONG", icon: Heart, desc: "Nome da organização" },
    { key: "actuacao", label: "Actuação", icon: Target, desc: "Área de actuação" },
    { key: "contacto", label: "Contacto", icon: Smartphone, desc: "Telefone" },
    { key: "endereco", label: "Endereço", icon: MapPin, desc: "Localização" },
  ],
  ASSOCIACAO: [
    { key: "perfil", label: "Associação", icon: Handshake, desc: "Nome da associação" },
    { key: "contacto", label: "Contacto", icon: Smartphone, desc: "Telefone" },
    { key: "endereco", label: "Endereço", icon: MapPin, desc: "Localização" },
  ],
  EDUCACAO: [
    { key: "instituicao", label: "Instituição", icon: GraduationCap, desc: "Nome da escola" },
    { key: "contacto", label: "Contacto", icon: Smartphone, desc: "Telefone" },
    { key: "endereco", label: "Endereço", icon: MapPin, desc: "Localização" },
  ],
  COOPERATIVA: [
    { key: "perfil", label: "Cooperativa", icon: Users, desc: "Nome e ramo" },
    { key: "contacto", label: "Contacto", icon: Smartphone, desc: "Telefone" },
    { key: "endereco", label: "Endereço", icon: MapPin, desc: "Localização" },
  ],
};

export default function OnboardingWizard() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", address: "", whatsappStore: "",
    provinciaOperacao: "", descricaoLoja: "", horarioFuncionamento: "",
    areaActuacao: "", website: "",
  });

  const accountType = user?.accountType || "EMPREENDEDOR";
  const steps = ONBOARDING_STEPS[accountType] || ONBOARDING_STEPS.EMPREENDEDOR;

  useEffect(() => {
    if (user) {
      fetch("/api/company")
        .then((r) => r.json())
        .then((d) => {
          if (d.company) {
            setForm((prev) => ({ ...prev, ...d.company }));
            if (d.company.name && d.company.phone) {
              router.push("/gestao/dashboard");
            }
          }
        })
        .catch(() => {});
    }
  }, [user, router]);

  async function handleFinish() {
    setSaving(true);
    try {
      await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onBoardingComplete: true, ...form }),
      });
      toast("Configuração concluída!", "success");
      router.push("/gestao/dashboard");
    } catch {
      toast("Erro ao salvar.", "error");
    } finally {
      setSaving(false);
    }
  }

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));
  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  const isLast = step === steps.length - 1;

  const renderStep = () => {
    const currentKey = steps[step]?.key;

    if (currentKey === "perfil" || currentKey === "loja" || currentKey === "instituicao") {
      const title = accountType === "EMPREENDEDOR" ? "Perfil do Empreendedor"
        : accountType === "EDUCACAO" ? "Dados da Instituição"
        : accountType === "ONG" ? "Dados da ONG"
        : accountType === "ASSOCIACAO" ? "Dados da Associação"
        : accountType === "COOPERATIVA" ? "Dados da Cooperativa"
        : "Dados da Empresa";
      return (
        <div>
          <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-ib-accent" /> {title}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Nome *</label>
              <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nome" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Telefone *</label>
              <input type="text" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+244 XXX XXX XXX" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
          </div>
        </div>
      );
    }

    if (currentKey === "actuacao") {
      return (
        <div>
          <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-ib-accent" /> Área de Actuação
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Área de Actuação</label>
              <input type="text" value={form.areaActuacao} onChange={(e) => update("areaActuacao", e.target.value)} placeholder="Ex.: Educação, Saúde, Ambiente" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Website</label>
              <input type="text" value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
          </div>
        </div>
      );
    }

    if (currentKey === "contacto") {
      return (
        <div>
          <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-ib-accent" /> Contacto
          </h2>
          <p className="text-sm text-ib-muted mb-3">Número de contacto para os seus clientes.</p>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">WhatsApp</label>
            <input type="text" value={form.whatsappStore} onChange={(e) => update("whatsappStore", e.target.value)} placeholder="+244 XXX XXX XXX" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
          </div>
        </div>
      );
    }

    if (currentKey === "endereco") {
      return (
        <div>
          <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-ib-accent" /> Endereço
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Endereço</label>
              <input type="text" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Rua, nº, bairro" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Província</label>
              <select value={form.provinciaOperacao} onChange={(e) => update("provinciaOperacao", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
                <option value="">Seleccionar</option>
                {["Bengo","Benguela","Bié","Cabinda","Cuando Cubango","Cuanza Norte","Cuanza Sul","Cunene","Huambo","Huíla","Luanda","Lunda Norte","Lunda Sul","Malanje","Moxico","Namibe","Uíge","Zaire"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (currentKey === "sobre") {
      return (
        <div>
          <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-ib-accent" /> Sobre
          </h2>
          <p className="text-sm text-ib-muted mb-3">Uma breve descrição do seu negócio.</p>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Descrição</label>
            <textarea value={form.descricaoLoja} onChange={(e) => update("descricaoLoja", e.target.value)} rows={3} placeholder="Conte um pouco sobre..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" />
          </div>
        </div>
      );
    }

    if (currentKey === "horarios") {
      return (
        <div>
          <h2 className="font-semibold text-ib-primary mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ib-accent" /> Horários
          </h2>
          <p className="text-sm text-ib-muted mb-3">Horários de funcionamento/disponibilidade.</p>
          <div>
            <label className="block text-sm font-medium text-ib-primary mb-1">Horários</label>
            <textarea value={form.horarioFuncionamento} onChange={(e) => update("horarioFuncionamento", e.target.value)} rows={4} placeholder="Seg-Sex: 08h-18h&#10;Sáb: 08h-13h" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ib-accent/10 mb-3">
            <Store className="w-7 h-7 text-ib-accent" />
          </div>
          <h1 className="text-2xl font-bold text-ib-primary">Configurar o seu Painel</h1>
          <p className="text-sm text-ib-muted mt-1">Complete os passos abaixo para personalizar a sua conta.</p>
        </div>

        <div className="flex justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? "bg-green-500 text-white" :
                i === step ? "bg-ib-accent text-white ring-4 ring-blue-100" :
                "bg-gray-200 text-gray-400"
              }`}>
                {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 ${i <= step ? "text-ib-primary font-medium" : "text-gray-400"}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {renderStep()}
        </div>

        <div className="flex justify-between mt-6">
          <button onClick={prev} disabled={step === 0} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-ib-muted hover:bg-gray-50 disabled:opacity-30">
            <ArrowLeft className="w-4 h-4" /> Anterior
          </button>
          {isLast ? (
            <button onClick={handleFinish} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              <CheckCircle className="w-4 h-4" /> {saving ? "A salvar..." : "Concluir"}
            </button>
          ) : (
            <button onClick={next} className="flex items-center gap-1.5 px-5 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
