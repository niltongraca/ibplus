"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, UserPlus, ArrowLeft, ArrowRight, Check, User, Building2, Users, MapPin, Briefcase, Sparkles } from "lucide-react";

type AccountType = "empreendedor" | "empresa" | null;

export default function CadastroPage() {
  const [step, setStep] = useState(0);
  const [tipo, setTipo] = useState<AccountType>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectTipo(t: AccountType) {
    setTipo(t);
    setStep(1);
    setError("");
  }

  const empreendedorSteps = [
    { title: "Dados Pessoais", icon: User },
    { title: "Perfil", icon: Sparkles },
    { title: "Localização", icon: MapPin },
    { title: "Actividade", icon: Briefcase },
  ];

  const empresaSteps = [
    { title: "Conta", icon: User },
    { title: "Empresa", icon: Building2 },
    { title: "Identidade", icon: Sparkles },
    { title: "Localização", icon: MapPin },
    { title: "Actividade", icon: Briefcase },
  ];

  const steps = tipo === "empresa" ? empresaSteps : empreendedorSteps;
  const totalSteps = steps.length;

  function canProceed(): boolean {
    if (tipo === "empreendedor") {
      if (step === 1) return !!(form.nomeCompleto && form.email && form.password && form.confirmPassword);
      if (step === 2) return true;
      if (step === 3) return true;
      if (step === 4) return true;
    }
    if (tipo === "empresa") {
      if (step === 1) return !!(form.nomeResponsavel && form.email && form.password);
      if (step === 2) return !!(form.nomeEmpresa);
      if (step === 3) return true;
      if (step === 4) return true;
      if (step === 5) return true;
    }
    return false;
  }

  function nextStep() {
    if (step < totalSteps) setStep((s) => s + 1);
  }

  function prevStep() {
    if (step > 1) setStep((s) => s - 1);
    else {
      setTipo(null);
      setStep(0);
    }
  }

  async function handleSubmit() {
    setError("");
    if (tipo === "empreendedor" && form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const result = await register({ ...form, tipo } as any);
    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/gestao/dashboard"), 1500);
    } else {
      setError(result.error || "Erro ao criar conta.");
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-ib-primary mb-2">Conta criada com sucesso!</h2>
          <p className="text-ib-muted">A redirecionar para o painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4 py-8 relative">
      <Link href="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-ib-muted hover:text-ib-primary transition-colors z-10">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        <span className="text-sm">Voltar ao início</span>
      </Link>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-ib-accent flex items-center justify-center font-bold text-xl text-white">IB</div>
            <span className="font-bold text-2xl text-ib-primary">IBPlus<sup className="text-ib-accent font-bold">+</sup></span>
          </div>
          <p className="text-ib-muted">Crie a sua conta gratuita</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {step === 0 ? (
            <div>
              <h2 className="text-xl font-bold text-ib-primary text-center mb-2">Que tipo de conta pretende criar?</h2>
              <p className="text-sm text-ib-muted text-center mb-8">Escolha o perfil que melhor se adequa a si</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <button onClick={() => selectTipo("empreendedor")} className="group p-6 rounded-xl border-2 border-gray-200 hover:border-ib-accent hover:bg-ib-accent/5 transition-all text-left">
                  <div className="w-12 h-12 rounded-xl bg-ib-accent/10 flex items-center justify-center mb-4 group-hover:bg-ib-accent/20 transition-colors">
                    <User className="w-6 h-6 text-ib-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-ib-primary mb-1">Empreendedor</h3>
                  <p className="text-sm text-ib-muted">Ideal para quem trabalha por conta própria.</p>
                </button>
                <button onClick={() => selectTipo("empresa")} className="group p-6 rounded-xl border-2 border-gray-200 hover:border-ib-accent hover:bg-ib-accent/5 transition-all text-left">
                  <div className="w-12 h-12 rounded-xl bg-ib-accent/10 flex items-center justify-center mb-4 group-hover:bg-ib-accent/20 transition-colors">
                    <Building2 className="w-6 h-6 text-ib-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-ib-primary mb-1">Empresa</h3>
                  <p className="text-sm text-ib-muted">Ideal para empresas com uma ou mais equipas.</p>
                </button>
              </div>
              <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-ib-muted">
                  <Users className="w-4 h-4" />
                  <span>Organização <span className="text-ib-accent font-medium">(em breve)</span></span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {step > 1 && (
                <div className="flex items-center gap-2 mb-6">
                  {steps.slice(0, -1).map((s, i) => {
                    const stepNum = i + 1;
                    const isActive = stepNum <= step;
                    return (
                      <div key={s.title} className="flex items-center gap-2 flex-1">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${isActive ? "bg-ib-accent text-white" : "bg-gray-100 text-ib-muted"}`}>
                          {stepNum}
                        </div>
                        <div className={`hidden sm:block text-xs font-medium ${isActive ? "text-ib-accent" : "text-ib-muted"}`}>
                          {s.title}
                        </div>
                        {i < steps.length - 2 && <div className={`flex-1 h-0.5 ${isActive ? "bg-ib-accent" : "bg-gray-200"}`} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {step === totalSteps && tipo === "empreendedor" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">Actividade</h2>
                  <p className="text-sm text-ib-muted -mt-3">Conte-nos sobre a sua área de trabalho</p>
                  <div>
                    <label className="block text-sm font-medium text-ib-primary mb-1">Área de actividade</label>
                    <input value={form.areaActividade || ""} onChange={(e) => updateField("areaActividade", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Ex.: Tecnologia, Saúde, Comércio" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ib-primary mb-1">Profissão</label>
                    <input value={form.profissao || ""} onChange={(e) => updateField("profissao", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Ex.: Designer, Consultor, Mecânico" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ib-primary mb-1">Serviços prestados</label>
                    <textarea value={form.servicosDescricao || ""} onChange={(e) => updateField("servicosDescricao", e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" placeholder="Descreva brevemente os seus serviços" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ib-primary mb-1">Redes sociais <span className="text-ib-muted font-normal">(opcional)</span></label>
                    <input value={form.redesSociais || ""} onChange={(e) => updateField("redesSociais", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Instagram, Facebook, LinkedIn..." />
                  </div>
                </div>
              )}

              {step === totalSteps && tipo === "empresa" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">Actividade</h2>
                  <p className="text-sm text-ib-muted -mt-3">Informações sobre o ramo e presença online</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Ramo de actividade</label>
                      <input value={form.ramoActividade || ""} onChange={(e) => updateField("ramoActividade", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Ex.: Tecnologia, Saúde" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Categoria</label>
                      <input value={form.categoria || ""} onChange={(e) => updateField("categoria", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Ex.: Software, Vestuário" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Website <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input value={form.website || ""} onChange={(e) => updateField("website", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="https://" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Facebook <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input value={form.facebook || ""} onChange={(e) => updateField("facebook", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="URL ou @username" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Instagram <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input value={form.instagram || ""} onChange={(e) => updateField("instagram", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="@username" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">LinkedIn <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input value={form.linkedin || ""} onChange={(e) => updateField("linkedin", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="URL ou @company" />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">
                    {tipo === "empresa" ? "Dados da Conta" : "Dados Pessoais"}
                  </h2>
                  <p className="text-sm text-ib-muted -mt-3">Informações básicas para criar a sua conta</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-ib-primary mb-1">
                        {tipo === "empresa" ? "Nome do responsável" : "Nome completo"}
                      </label>
                      <input value={form.nomeCompleto || form.nomeResponsavel || ""} onChange={(e) => updateField(tipo === "empresa" ? "nomeResponsavel" : "nomeCompleto", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder={tipo === "empresa" ? "Nome do responsável" : "Seu nome completo"} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Email</label>
                      <input type="email" value={form.email || ""} onChange={(e) => updateField("email", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="seu@email.com" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Telefone</label>
                      <input type="tel" value={form.telefone || ""} onChange={(e) => updateField("telefone", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="+244 900 000 000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Senha</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={form.password || ""} onChange={(e) => updateField("password", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 pr-10" placeholder="Mínimo 6 caracteres" required minLength={6} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ib-muted hover:text-ib-primary">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {tipo === "empreendedor" && (
                      <div>
                        <label className="block text-sm font-medium text-ib-primary mb-1">Confirmar senha</label>
                        <input type={showPassword ? "text" : "password"} value={form.confirmPassword || ""} onChange={(e) => updateField("confirmPassword", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Repita a senha" required minLength={6} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && tipo === "empreendedor" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">Perfil do Empreendedor</h2>
                  <p className="text-sm text-ib-muted -mt-3">Informações adicionais sobre si</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Nome comercial <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input value={form.nomeComercial || ""} onChange={(e) => updateField("nomeComercial", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Como é conhecido(a)" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">NIF <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input value={form.nif || ""} onChange={(e) => updateField("nif", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Número de identificação fiscal" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">BI <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input value={form.bi || ""} onChange={(e) => updateField("bi", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Bilhete de identidade" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Data de nascimento <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input type="date" value={form.dataNascimento || ""} onChange={(e) => updateField("dataNascimento", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Sexo <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <select value={form.sexo || ""} onChange={(e) => updateField("sexo", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 bg-white">
                        <option value="">Seleccionar</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && tipo === "empresa" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">Dados da Empresa</h2>
                  <p className="text-sm text-ib-muted -mt-3">Informações sobre o seu negócio</p>
                  <div>
                    <label className="block text-sm font-medium text-ib-primary mb-1">Nome da empresa</label>
                    <input value={form.nomeEmpresa || ""} onChange={(e) => updateField("nomeEmpresa", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Nome da sua empresa" required />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">NIF</label>
                      <input value={form.nif || ""} onChange={(e) => updateField("nif", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Número de identificação fiscal" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Registo comercial <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input value={form.registoComercial || ""} onChange={(e) => updateField("registoComercial", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Número de registo" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Ano de fundação <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input type="number" value={form.anoFundacao || ""} onChange={(e) => updateField("anoFundacao", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Ex.: 2020" min={1900} max={2030} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Colaboradores <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input type="number" value={form.numColaboradores || ""} onChange={(e) => updateField("numColaboradores", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Número de colaboradores" min={0} />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && tipo === "empreendedor" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">Localização</h2>
                  <p className="text-sm text-ib-muted -mt-3">Onde está localizado(a)</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">País</label>
                      <input value={form.pais || ""} onChange={(e) => updateField("pais", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Angola" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Província</label>
                      <input value={form.provincia || ""} onChange={(e) => updateField("provincia", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Luanda, Benguela..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Município</label>
                      <input value={form.municipio || ""} onChange={(e) => updateField("municipio", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Município" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Distrito/Bairro</label>
                      <input value={form.bairro || ""} onChange={(e) => updateField("bairro", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Bairro" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-ib-primary mb-1">Endereço</label>
                      <input value={form.endereco || ""} onChange={(e) => updateField("endereco", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Rua, número, ponto de referência" />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && tipo === "empresa" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">Identidade da Empresa</h2>
                  <p className="text-sm text-ib-muted -mt-3">Conte-nos sobre a sua empresa</p>
                  <div>
                    <label className="block text-sm font-medium text-ib-primary mb-1">Descrição da empresa</label>
                    <textarea value={form.descricao || ""} onChange={(e) => updateField("descricao", e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" placeholder="Descreva a sua empresa" />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Missão <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <textarea value={form.missao || ""} onChange={(e) => updateField("missao", e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" placeholder="Missão" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Visão <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <textarea value={form.visao || ""} onChange={(e) => updateField("visao", e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" placeholder="Visão" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Valores <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <textarea value={form.valores || ""} onChange={(e) => updateField("valores", e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" placeholder="Valores" />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && tipo === "empresa" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">Localização</h2>
                  <p className="text-sm text-ib-muted -mt-3">Onde a sua empresa está localizada</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">País</label>
                      <input value={form.pais || ""} onChange={(e) => updateField("pais", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Angola" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Província</label>
                      <input value={form.provincia || ""} onChange={(e) => updateField("provincia", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Luanda, Benguela..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Município</label>
                      <input value={form.municipio || ""} onChange={(e) => updateField("municipio", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Município" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Bairro</label>
                      <input value={form.bairro || ""} onChange={(e) => updateField("bairro", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Bairro" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-ib-primary mb-1">Endereço</label>
                      <input value={form.endereco || ""} onChange={(e) => updateField("endereco", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Rua, número, ponto de referência" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-ib-primary mb-1">Localização GPS <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input value={form.gpsLocation || ""} onChange={(e) => updateField("gpsLocation", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Latitude, Longitude" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-5 p-3 rounded-lg bg-ib-danger/10 text-ib-danger text-sm">{error}</div>
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={prevStep} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ib-muted hover:text-ib-primary hover:bg-gray-50 rounded-lg transition-colors">
                  <ArrowLeft className="w-4 h-4" /> {step > 1 ? "Anterior" : "Alterar tipo"}
                </button>

                {step < totalSteps ? (
                  <button type="button" onClick={nextStep} disabled={!canProceed()} className="flex items-center gap-2 px-6 py-2.5 bg-ib-accent hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {step === totalSteps - 1 && tipo === "empreendedor" ? "Finalizar" : "Seguinte"} <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {loading ? "Criando conta..." : (
                      <><UserPlus className="w-4 h-4" /> Criar conta</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-ib-muted mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-ib-accent hover:underline font-medium">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
