"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, UserPlus, ArrowLeft, ArrowRight, Check, User, Building2, Users, MapPin, Briefcase, Sparkles, Heart, GraduationCap, Handshake, Link2 } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: "EMPREENDEDOR", label: "Empreendedor", desc: "Ideal para quem trabalha por conta própria.", icon: User },
  { value: "EMPRESA", label: "Empresa", desc: "Ideal para empresas com uma ou mais equipas.", icon: Building2 },
  { value: "ONG", label: "ONG", desc: "Organizações não-governamentais e projectos sociais.", icon: Heart },
  { value: "ASSOCIACAO", label: "Associação", desc: "Associações culturais, desportivas e comunitárias.", icon: Handshake },
  { value: "EDUCACAO", label: "Educação", desc: "Escolas, universidades e centros de formação.", icon: GraduationCap },
  { value: "COOPERATIVA", label: "Cooperativa", desc: "Cooperativas de produção, crédito ou serviços.", icon: Users },
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

export default function CadastroPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div style={{ color: "var(--text-muted)" }}>A carregar...</div></div>}>
      <CadastroPage />
    </Suspense>
  );
}

function CadastroPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [step, setStep] = useState(inviteToken ? 1 : 0);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<string | null>(null);
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
    const payload: Record<string, any> = { ...form, accountType };
    if (inviteToken) payload.invite = inviteToken;
    const result = await register(payload as any);
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)" }}>
            <Check className="w-8 h-8" style={{ color: "var(--color-ib-success)" }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Conta criada com sucesso!</h2>
          <p style={{ color: "var(--text-muted)" }}>A redirecionar para o painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      <Link href="/" className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 z-10" style={{ color: "var(--text-muted)" }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        <span className="text-sm">Voltar ao início</span>
      </Link>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>IBPlus<sup className="text-ib-accent font-bold">+</sup></span>
          </div>
          <p style={{ color: "var(--text-muted)" }}>Crie a sua conta gratuita</p>
        </div>

        <div className="glass-card p-8">
          {inviteToken && (
            <div className="mb-6 glass-card p-4 flex items-start gap-3" style={{ borderRadius: "12px" }}>
              <Link2 className="w-5 h-5 text-ib-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Convite de Acesso</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Você foi convidado a aceder a uma conta existente. Preencha os seus dados para criar o seu acesso.</p>
              </div>
            </div>
          )}
          {step === 0 ? (
            <div>
              <h2 className="text-xl font-bold text-center mb-2" style={{ color: "var(--text-primary)" }}>Que tipo de conta pretende criar?</h2>
              <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>Escolha o perfil que melhor se adequa a si</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {ACCOUNT_TYPES.map((t) => (
                  <button key={t.value} onClick={() => selectType(t.value)}
                    className="glass-card p-5 hover:shadow-md transition-all text-left group">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
                      <t.icon className="w-5 h-5 text-ib-accent" />
                    </div>
                    <h3 className="font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{t.label}</h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.desc}</p>
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
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${isActive ? "bg-ib-accent text-white" : "glass-btn"}`}>
                          {stepNum}
                        </div>
                        <div className={`hidden sm:block text-xs font-medium ${isActive ? "text-ib-accent" : ""}`} style={{ color: isActive ? undefined : "var(--text-muted)" }}>
                          {s.title}
                        </div>
                        {i < steps.length - 2 && <div className={`flex-1 h-0.5 ${isActive ? "bg-ib-accent" : ""}`} style={{ backgroundColor: isActive ? undefined : "var(--border-color)" }} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Dados da Conta</h2>
                  <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Informações básicas para criar a sua conta</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                        {accountType === "EMPRESA" || accountType === "ONG" || accountType === "EDUCACAO" ? "Nome do responsável" : "Nome completo"}
                      </label>
                      <input value={form.nome || ""} onChange={(e) => updateField("nome", e.target.value)}
                        className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}
                        placeholder="Seu nome completo" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Email</label>
                      <input type="email" value={form.email || ""} onChange={(e) => updateField("email", e.target.value)}
                        className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}
                        placeholder="seu@email.com" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Telefone <span style={{ color: "var(--text-muted)" }} className="font-normal">(opcional)</span></label>
                      <input type="tel" value={form.telefone || ""} onChange={(e) => updateField("telefone", e.target.value)}
                        className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}
                        placeholder="+244 900 000 000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Senha</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={form.password || ""} onChange={(e) => updateField("password", e.target.value)}
                          className="glass-input w-full px-3 py-2.5 text-sm pr-10" style={{ color: "var(--text-primary)" }}
                          placeholder="Mínimo 6 caracteres" required minLength={6} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {accountType !== "EMPRESA" && (
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Confirmar senha</label>
                        <input type={showPassword ? "text" : "password"} value={form.confirmPassword || ""} onChange={(e) => updateField("confirmPassword", e.target.value)}
                          className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}
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
                  <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Identidade da Empresa</h2>
                  <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Conte-nos sobre a sua empresa</p>
                  <div>
                    <textarea value={form.descricao || ""} onChange={(e) => updateField("descricao", e.target.value)} rows={3}
                      className="glass-input w-full px-3 py-2.5 text-sm resize-none" style={{ color: "var(--text-primary)" }}
                      placeholder="Descreva a sua empresa" />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Missão <span style={{ color: "var(--text-muted)" }} className="font-normal">(opcional)</span></label>
                      <textarea value={form.missao || ""} onChange={(e) => updateField("missao", e.target.value)} rows={2}
                        className="glass-input w-full px-3 py-2.5 text-sm resize-none" style={{ color: "var(--text-primary)" }} placeholder="Missão" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Visão <span style={{ color: "var(--text-muted)" }} className="font-normal">(opcional)</span></label>
                      <textarea value={form.visao || ""} onChange={(e) => updateField("visao", e.target.value)} rows={2}
                        className="glass-input w-full px-3 py-2.5 text-sm resize-none" style={{ color: "var(--text-primary)" }} placeholder="Visão" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Valores <span style={{ color: "var(--text-muted)" }} className="font-normal">(opcional)</span></label>
                      <textarea value={form.valores || ""} onChange={(e) => updateField("valores", e.target.value)} rows={2}
                        className="glass-input w-full px-3 py-2.5 text-sm resize-none" style={{ color: "var(--text-primary)" }} placeholder="Valores" />
                    </div>
                  </div>
                  <ActividadeForm form={form} updateField={updateField} />
                </div>
              )}

              {error && (
                <div className="mt-5 p-3 rounded-lg text-sm" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--color-ib-danger)" }}>{error}</div>
              )}

              <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid var(--border-color)" }}>
                <button type="button" onClick={prevStep}
                  className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  <ArrowLeft className="w-4 h-4" /> {step > 1 ? "Anterior" : "Alterar tipo"}
                </button>
                {step < totalSteps ? (
                  <button type="button" onClick={nextStep} disabled={!canProceed()}
                    className="glass-btn-primary flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50">
                    Seguinte <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={loading}
                    className="glass-btn-primary flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-50">
                    {loading ? "Criando conta..." : <><UserPlus className="w-4 h-4" /> Criar conta</>}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
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
      <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
        {label} {!required && <span style={{ color: "var(--text-muted)" }} className="font-normal">(opcional)</span>}
      </label>
      <input type={type || "text"} value={form[field] || ""} onChange={(e) => updateField(field, e.target.value)}
        className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}
        placeholder={placeholder} />
    </div>
  );
}

function EmpreendedorForm({ form, updateField }: any) {
  return (
    <>
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Perfil do Empreendedor</h2>
      <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Informações adicionais sobre si</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Nome comercial" field="nomeComercial" form={form} updateField={updateField} placeholder="Como é conhecido(a)" />
        <Input label="NIF" field="nif" form={form} updateField={updateField} placeholder="Número de identificação fiscal" />
        <Input label="BI" field="bi" form={form} updateField={updateField} placeholder="Bilhete de identidade" />
        <Input label="Data de nascimento" field="dataNascimento" form={form} updateField={updateField} type="date" />
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Sexo <span style={{ color: "var(--text-muted)" }} className="font-normal">(opcional)</span></label>
          <select value={form.sexo || ""} onChange={(e) => updateField("sexo", e.target.value)}
            className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}>
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
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Dados da Empresa</h2>
      <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Informações sobre o seu negócio</p>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Nome da empresa <span style={{ color: "var(--color-ib-danger)" }}>*</span></label>
        <input value={form.nomeEmpresa || ""} onChange={(e) => updateField("nomeEmpresa", e.target.value)}
          className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}
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
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Dados da ONG</h2>
      <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Informações sobre a organização</p>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Nome da ONG</label>
        <input value={form.nomeInstituicao || form.nome || ""} onChange={(e) => updateField("nomeInstituicao", e.target.value)}
          className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }} placeholder="Nome da organização" />
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
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Dados da Associação</h2>
      <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Informações sobre a associação</p>
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
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Dados da Instituição</h2>
      <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Informações sobre a instituição de ensino</p>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Nome da instituição</label>
        <input value={form.nomeInstituicao || ""} onChange={(e) => updateField("nomeInstituicao", e.target.value)}
          className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }} placeholder="Nome da escola/universidade" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Tipo de instituição</label>
          <select value={form.tipoInstituicao || ""} onChange={(e) => updateField("tipoInstituicao", e.target.value)}
            className="glass-input w-full px-3 py-2.5 text-sm" style={{ color: "var(--text-primary)" }}>
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
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Dados da Cooperativa</h2>
      <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Informações sobre a cooperativa</p>
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
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Localização</h2>
      <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Onde está localizado(a)</p>
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
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Identidade</h2>
      <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Informações adicionais</p>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Descrição</label>
        <textarea value={form.descricao || ""} onChange={(e) => updateField("descricao", e.target.value)} rows={3}
          className="glass-input w-full px-3 py-2.5 text-sm resize-none" style={{ color: "var(--text-primary)" }}
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
      <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Actividade</h2>
      <p className="text-sm -mt-3" style={{ color: "var(--text-muted)" }}>Ramo e presença online</p>
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
