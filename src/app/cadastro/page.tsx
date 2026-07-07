"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, UserPlus, ArrowLeft, ArrowRight, Check, User, Building2, Users, MapPin, Briefcase, Sparkles, Heart, GraduationCap, Handshake } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "EMPREENDEDOR", label: "Empreendedor", desc: "Ideal para quem trabalha por conta própria.", icon: User, color: "bg-violet-50 text-violet-600 hover:border-violet-300 hover:bg-violet-50/50" },
  { value: "EMPRESA", label: "Empresa", desc: "Ideal para empresas com uma ou mais equipas.", icon: Building2, color: "bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-50/50" },
  { value: "ONG", label: "ONG", desc: "Organizações não-governamentais e projectos sociais.", icon: Heart, color: "bg-emerald-50 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50" },
  { value: "ASSOCIACAO", label: "Associação", desc: "Associações culturais, desportivas e comunitárias.", icon: Handshake, color: "bg-amber-50 text-amber-600 hover:border-amber-300 hover:bg-amber-50/50" },
  { value: "EDUCACAO", label: "Educação", desc: "Escolas, universidades e centros de formação.", icon: GraduationCap, color: "bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-50/50" },
  { value: "COOPERATIVA", label: "Cooperativa", desc: "Cooperativas de produção, crédito ou serviços.", icon: Users, color: "bg-cyan-50 text-cyan-600 hover:border-cyan-300 hover:bg-cyan-50/50" },
] as const;

const STEP_LABELS: Record<string, { title: string; icon: any }[]> = {
  EMPREENDEDOR: [
    { title: "Dados Pessoais", icon: User },
    { title: "Perfil", icon: Sparkles },
    { title: "Localização", icon: MapPin },
  ],
  EMPRESA: [
    { title: "Conta", icon: User },
    { title: "Empresa", icon: Building2 },
    { title: "Identidade", icon: Sparkles },
    { title: "Localização", icon: MapPin },
  ],
  ONG: [
    { title: "Dados Básicos", icon: User },
    { title: "ONG", icon: Heart },
    { title: "Localização", icon: MapPin },
  ],
  ASSOCIACAO: [
    { title: "Dados Pessoais", icon: User },
    { title: "Associação", icon: Briefcase },
    { title: "Localização", icon: MapPin },
  ],
  EDUCACAO: [
    { title: "Dados Básicos", icon: User },
    { title: "Instituição", icon: GraduationCap },
    { title: "Localização", icon: MapPin },
  ],
  COOPERATIVA: [
    { title: "Dados Pessoais", icon: User },
    { title: "Cooperativa", icon: Handshake },
    { title: "Localização", icon: MapPin },
  ],
};

export default function CadastroPage() {
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<string | null>(null);
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

  function selectType(value: string) {
    setAccountType(value);
    setStep(1);
    setError("");
  }

  const steps = accountType ? STEP_LABELS[accountType] || [] : [];
  const totalSteps = steps.length;

  function canProceed(): boolean {
    const t = accountType;
    if (step === 1) return !!(form.nome && form.email && form.password && (t === "EMPRESA" || t === "ONG" || form.confirmPassword));
    if (step === totalSteps) return true;
    if (t === "EMPRESA" && step === 2) return !!(form.nomeEmpresa);
    return true;
  }

  function nextStep() {
    if (step < totalSteps) setStep((s) => s + 1);
  }

  function prevStep() {
    if (step > 1) setStep((s) => s - 1);
    else { setAccountType(null); setStep(0); }
  }

  async function handleSubmit() {
    setError("");
    if (accountType !== "EMPRESA" && form.password !== form.confirmPassword) {
      setError("As senhas não coincidem."); return;
    }
    setLoading(true);
    const result = await register({ ...form, accountType } as any);
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
                {ACCOUNT_TYPES.map((t) => (
                  <button key={t.value} onClick={() => selectType(t.value)}
                    className="group p-5 rounded-xl border-2 border-gray-200 hover:border-ib-accent hover:bg-ib-accent/5 transition-all text-left">
                    <div className={`w-11 h-11 rounded-xl ${t.color.split(" ")[0]} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                      <t.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-ib-primary mb-0.5">{t.label}</h3>
                    <p className="text-xs text-ib-muted">{t.desc}</p>
                  </button>
                ))}
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

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">Dados da Conta</h2>
                  <p className="text-sm text-ib-muted -mt-3">Informações básicas para criar a sua conta</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-ib-primary mb-1">
                        {accountType === "EMPRESA" || accountType === "ONG" || accountType === "EDUCACAO" ? "Nome do responsável" : "Nome completo"}
                      </label>
                      <input value={form.nome || ""} onChange={(e) => updateField("nome", e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                        placeholder="Seu nome completo" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Email</label>
                      <input type="email" value={form.email || ""} onChange={(e) => updateField("email", e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                        placeholder="seu@email.com" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Telefone <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <input type="tel" value={form.telefone || ""} onChange={(e) => updateField("telefone", e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                        placeholder="+244 900 000 000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Senha</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={form.password || ""} onChange={(e) => updateField("password", e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 pr-10"
                          placeholder="Mínimo 6 caracteres" required minLength={6} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-ib-muted hover:text-ib-primary">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {accountType !== "EMPRESA" && (
                      <div>
                        <label className="block text-sm font-medium text-ib-primary mb-1">Confirmar senha</label>
                        <input type={showPassword ? "text" : "password"} value={form.confirmPassword || ""} onChange={(e) => updateField("confirmPassword", e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                          placeholder="Repita a senha" required minLength={6} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  {accountType === "EMPREENDEDOR" && (
                    <EmpreendedorForm form={form} updateField={updateField} />
                  )}
                  {accountType === "EMPRESA" && (
                    <EmpresaForm form={form} updateField={updateField} />
                  )}
                  {accountType === "ONG" && (
                    <ONGForm form={form} updateField={updateField} />
                  )}
                  {accountType === "ASSOCIACAO" && (
                    <AssociacaoForm form={form} updateField={updateField} />
                  )}
                  {accountType === "EDUCACAO" && (
                    <EducacaoForm form={form} updateField={updateField} />
                  )}
                  {accountType === "COOPERATIVA" && (
                    <CooperativaForm form={form} updateField={updateField} />
                  )}
                </div>
              )}

              {step === 3 && (accountType === "EMPREENDEDOR" || accountType === "ASSOCIACAO" || accountType === "COOPERATIVA") && (
                <LocationForm form={form} updateField={updateField} />
              )}
              {step === 3 && (accountType === "EMPRESA" || accountType === "ONG" || accountType === "EDUCACAO") && (
                <IdentityForm form={form} updateField={updateField} accountType={accountType} />
              )}
              {step === 4 && accountType === "EMPRESA" && (
                <LocationForm form={form} updateField={updateField} />
              )}
              {step === 3 && accountType === "EMPRESA" && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold text-ib-primary">Identidade da Empresa</h2>
                  <p className="text-sm text-ib-muted -mt-3">Conte-nos sobre a sua empresa</p>
                  <div>
                    <textarea value={form.descricao || ""} onChange={(e) => updateField("descricao", e.target.value)} rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
                      placeholder="Descreva a sua empresa" />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Missão <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <textarea value={form.missao || ""} onChange={(e) => updateField("missao", e.target.value)} rows={2}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" placeholder="Missão" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Visão <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <textarea value={form.visao || ""} onChange={(e) => updateField("visao", e.target.value)} rows={2}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" placeholder="Visão" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ib-primary mb-1">Valores <span className="text-ib-muted font-normal">(opcional)</span></label>
                      <textarea value={form.valores || ""} onChange={(e) => updateField("valores", e.target.value)} rows={2}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" placeholder="Valores" />
                    </div>
                  </div>
                  <ActividadeForm form={form} updateField={updateField} />
                </div>
              )}

              {error && (
                <div className="mt-5 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button type="button" onClick={prevStep}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ib-muted hover:text-ib-primary hover:bg-gray-50 rounded-lg transition-colors">
                  <ArrowLeft className="w-4 h-4" /> {step > 1 ? "Anterior" : "Alterar tipo"}
                </button>
                {step < totalSteps ? (
                  <button type="button" onClick={nextStep} disabled={!canProceed()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-ib-accent hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    Seguinte <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {loading ? "Criando conta..." : <><UserPlus className="w-4 h-4" /> Criar conta</>}
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

function Input({ label, field, form, updateField, placeholder, type, required }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-ib-primary mb-1">
        {label} {!required && <span className="text-ib-muted font-normal">(opcional)</span>}
      </label>
      <input type={type || "text"} value={form[field] || ""} onChange={(e) => updateField(field, e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
        placeholder={placeholder} />
    </div>
  );
}

function EmpreendedorForm({ form, updateField }: any) {
  return (
    <>
      <h2 className="text-xl font-bold text-ib-primary">Perfil do Empreendedor</h2>
      <p className="text-sm text-ib-muted -mt-3">Informações adicionais sobre si</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Nome comercial" field="nomeComercial" form={form} updateField={updateField} placeholder="Como é conhecido(a)" />
        <Input label="NIF" field="nif" form={form} updateField={updateField} placeholder="Número de identificação fiscal" />
        <Input label="BI" field="bi" form={form} updateField={updateField} placeholder="Bilhete de identidade" />
        <Input label="Data de nascimento" field="dataNascimento" form={form} updateField={updateField} type="date" />
        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Sexo <span className="text-ib-muted font-normal">(opcional)</span></label>
          <select value={form.sexo || ""} onChange={(e) => updateField("sexo", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 bg-white">
            <option value="">Seleccionar</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>
    </>
  );
}

function EmpresaForm({ form, updateField }: any) {
  return (
    <>
      <h2 className="text-xl font-bold text-ib-primary">Dados da Empresa</h2>
      <p className="text-sm text-ib-muted -mt-3">Informações sobre o seu negócio</p>
      <div>
        <label className="block text-sm font-medium text-ib-primary mb-1">Nome da empresa <span className="text-red-500">*</span></label>
        <input value={form.nomeEmpresa || ""} onChange={(e) => updateField("nomeEmpresa", e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
          placeholder="Nome da sua empresa" required />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="NIF" field="nif" form={form} updateField={updateField} placeholder="NIF da empresa" />
        <Input label="Registo comercial" field="registoComercial" form={form} updateField={updateField} placeholder="Número de registo" />
        <Input label="Ano de fundação" field="anoFundacao" form={form} updateField={updateField} type="number" placeholder="Ex.: 2020" />
        <Input label="Colaboradores" field="numColaboradores" form={form} updateField={updateField} type="number" placeholder="Número de colaboradores" />
      </div>
    </>
  );
}

function ONGForm({ form, updateField }: any) {
  return (
    <>
      <h2 className="text-xl font-bold text-ib-primary">Dados da ONG</h2>
      <p className="text-sm text-ib-muted -mt-3">Informações sobre a organização</p>
      <div>
        <label className="block text-sm font-medium text-ib-primary mb-1">Nome da ONG</label>
        <input value={form.nomeInstituicao || form.nome || ""} onChange={(e) => updateField("nomeInstituicao", e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Nome da organização" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Missão" field="missao" form={form} updateField={updateField} placeholder="Missão da ONG" />
        <Input label="Área de actuação" field="areaActuacao" form={form} updateField={updateField} placeholder="Ex.: Educação, Saúde, Ambiente" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Website" field="website" form={form} updateField={updateField} placeholder="https://" />
        <Input label="NIF" field="nif" form={form} updateField={updateField} placeholder="NIF da organização" />
      </div>
    </>
  );
}

function AssociacaoForm({ form, updateField }: any) {
  return (
    <>
      <h2 className="text-xl font-bold text-ib-primary">Dados da Associação</h2>
      <p className="text-sm text-ib-muted -mt-3">Informações sobre a associação</p>
      <Input label="Nome da associação" field="nomeInstituicao" form={form} updateField={updateField} placeholder="Nome da associação" />
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Input label="Área de actuação" field="areaActuacao" form={form} updateField={updateField} placeholder="Ex.: Cultura, Desporto" />
        <Input label="NIF" field="nif" form={form} updateField={updateField} placeholder="NIF" />
      </div>
    </>
  );
}

function EducacaoForm({ form, updateField }: any) {
  return (
    <>
      <h2 className="text-xl font-bold text-ib-primary">Dados da Instituição</h2>
      <p className="text-sm text-ib-muted -mt-3">Informações sobre a instituição de ensino</p>
      <div>
        <label className="block text-sm font-medium text-ib-primary mb-1">Nome da instituição</label>
        <input value={form.nomeInstituicao || ""} onChange={(e) => updateField("nomeInstituicao", e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" placeholder="Nome da escola/universidade" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Tipo de instituição</label>
          <select value={form.tipoInstituicao || ""} onChange={(e) => updateField("tipoInstituicao", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 bg-white">
            <option value="">Seleccionar</option>
            <option value="escola">Escola</option>
            <option value="universidade">Universidade</option>
            <option value="centro">Centro de Formação</option>
            <option value="jardim">Jardim Infantil</option>
          </select>
        </div>
        <Input label="Cursos oferecidos" field="cursos" form={form} updateField={updateField} placeholder="Ex.: Informática, Gestão" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Input label="Website" field="website" form={form} updateField={updateField} placeholder="https://" />
        <Input label="NIF" field="nif" form={form} updateField={updateField} placeholder="NIF" />
      </div>
    </>
  );
}

function CooperativaForm({ form, updateField }: any) {
  return (
    <>
      <h2 className="text-xl font-bold text-ib-primary">Dados da Cooperativa</h2>
      <p className="text-sm text-ib-muted -mt-3">Informações sobre a cooperativa</p>
      <Input label="Nome da cooperativa" field="nomeInstituicao" form={form} updateField={updateField} placeholder="Nome da cooperativa" />
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Input label="Ramo" field="ramoActividade" form={form} updateField={updateField} placeholder="Ex.: Agricultura, Crédito" />
        <Input label="NIF" field="nif" form={form} updateField={updateField} placeholder="NIF" />
      </div>
      <Input label="Descrição" field="descricao" form={form} updateField={updateField} placeholder="Descreva a cooperativa" />
    </>
  );
}

function LocationForm({ form, updateField }: any) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-ib-primary">Localização</h2>
      <p className="text-sm text-ib-muted -mt-3">Onde está localizado(a)</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="País" field="pais" form={form} updateField={updateField} placeholder="Angola" />
        <Input label="Província" field="provincia" form={form} updateField={updateField} placeholder="Luanda, Benguela..." />
        <Input label="Município" field="municipio" form={form} updateField={updateField} placeholder="Município" />
        <Input label="Bairro" field="bairro" form={form} updateField={updateField} placeholder="Bairro" />
        <div className="sm:col-span-2">
          <Input label="Endereço" field="endereco" form={form} updateField={updateField} placeholder="Rua, número, ponto de referência" />
        </div>
        <div className="sm:col-span-2">
          <Input label="Localização GPS" field="gpsLocation" form={form} updateField={updateField} placeholder="Latitude, Longitude" />
        </div>
      </div>
    </div>
  );
}

function IdentityForm({ form, updateField, accountType }: any) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-ib-primary">Identidade</h2>
      <p className="text-sm text-ib-muted -mt-3">Informações adicionais</p>
      <div>
        <label className="block text-sm font-medium text-ib-primary mb-1">Descrição</label>
        <textarea value={form.descricao || ""} onChange={(e) => updateField("descricao", e.target.value)} rows={3}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
          placeholder="Breve descrição" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Website" field="website" form={form} updateField={updateField} placeholder="https://" />
        <Input label="Redes sociais" field="redesSociais" form={form} updateField={updateField} placeholder="Instagram, Facebook..." />
      </div>
    </div>
  );
}

function ActividadeForm({ form, updateField }: any) {
  return (
    <div className="space-y-5 mt-5">
      <h2 className="text-xl font-bold text-ib-primary">Actividade</h2>
      <p className="text-sm text-ib-muted -mt-3">Ramo e presença online</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Ramo de actividade" field="ramoActividade" form={form} updateField={updateField} placeholder="Ex.: Tecnologia, Saúde" />
        <Input label="Categoria" field="categoria" form={form} updateField={updateField} placeholder="Ex.: Software, Vestuário" />
        <Input label="Website" field="website" form={form} updateField={updateField} placeholder="https://" />
        <Input label="Facebook" field="facebook" form={form} updateField={updateField} placeholder="URL ou @username" />
        <Input label="Instagram" field="instagram" form={form} updateField={updateField} placeholder="@username" />
        <Input label="LinkedIn" field="linkedin" form={form} updateField={updateField} placeholder="URL ou @company" />
      </div>
    </div>
  );
}
