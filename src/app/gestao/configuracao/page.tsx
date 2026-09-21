"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  ListChecks, CheckCircle2, Circle, ArrowRight, User, Image as ImageIcon,
  Phone, BookOpen, MapPin, Clock, FileText, ClipboardCheck, Settings
} from "lucide-react";
import { CargosManager } from "@/components/rh/CargosManager";
import { SubCompaniesManager } from "@/components/company/SubCompaniesManager";
import { AcquisitionSection } from "@/components/company/AcquisitionSection";

interface StepItem {
  key: string;
  label: string;
  description: string;
  tab: string;
  done: boolean;
}

interface StepsData {
  steps: StepItem[];
  total: number;
  done: number;
  pending: number;
  completed: boolean;
}

const stepIcons: Record<string, React.ReactNode> = {
  user: <User className="w-5 h-5" />,
  image: <ImageIcon className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  bio: <BookOpen className="w-5 h-5" />,
  map: <MapPin className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  file: <FileText className="w-5 h-5" />,
};

export default function ConfiguracaoPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StepsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    apiFetch<StepsData>("/api/account/steps")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const steps = data?.steps || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-ib-accent" /> Completar a Conta
        </h1>
        <p className="text-ib-muted text-sm">Passos para activar todas as novas funções do IBPlus.</p>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-ib-muted">A carregar...</div>
      ) : data && data.completed ? (
        <div className="card border-green-200 p-10 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-ib-primary">Conta completa!</h2>
          <p className="text-sm text-ib-muted mt-1">Todos os passos foram concluídos. Aproveite as novas funções.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.key}
              className={`card p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${step.done ? "border-green-200" : ""}`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-green-100 text-green-600" : "bg-ib-accent/10 text-ib-accent"}`}>
                {stepIcons[step.key] || <Circle className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${step.done ? "text-green-600 line-through" : "text-ib-primary"}`}>{step.label}</p>
                <p className="text-xs text-ib-muted mt-0.5">{step.description}</p>
              </div>
              {step.done ? (
                <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium shrink-0">
                  <CheckCircle2 className="w-4 h-4" /> Concluído
                </span>
              ) : (
                <Link
                  href={`/gestao/perfil?tab=${step.tab}`}
                  className="btn btn-primary transition-colors shrink-0"
                >
                  Completar <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-ib-accent/5 border border-ib-accent/20 rounded-xl p-4 text-sm text-ib-muted flex items-start gap-2">
        <ListChecks className="w-4 h-4 text-ib-accent shrink-0 mt-0.5" />
        <span>
          Sempre que o IBPlus adicionar novas funções, vai encontrar aqui ou no sino de notificações os passos
          necessários para actualizar a sua conta.
        </span>
      </div>

      {user?.isOwner && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-ib-accent" />
            <h2 className="text-xl font-bold text-ib-primary">Configurações da Empresa</h2>
          </div>
          <p className="text-sm text-ib-muted -mt-2 mb-5">
            Gestão de cargos, subempresas/organizações e código de aquisição. Os cargos registados aqui são as sugestões
            apresentadas aos convidados no cadastro.
          </p>
          <CargosManager />
          <SubCompaniesManager />
          <AcquisitionSection />
        </div>
      )}
    </div>
  );
}