"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { ListChecks, X, ArrowRight, CheckCircle2, Circle } from "lucide-react";

interface StepItem {
  key: string;
  label: string;
  done: boolean;
}

interface StepsData {
  steps: StepItem[];
  pending: number;
  completed: boolean;
}

export function StepsBanner() {
  const { user } = useAuth();
  const pathname = usePathname() ?? "";
  const [data, setData] = useState<StepsData | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!user || user.role === "admin") return;
    apiFetch<StepsData>("/api/account/steps")
      .then(setData)
      .catch(() => {});
  }, [user]);

  if (!user || user.role === "admin" || pathname.startsWith("/gestao/configuracao")) return null;
  if (!data || data.completed || data.pending === 0 || hidden) return null;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-4">
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 pr-12 sm:pr-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <ListChecks className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Faltam {data.pending} {data.pending === 1 ? "passo" : "passos"} para completar a sua conta
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Com as novas funções do IBPlus é importante actualizar os seus dados.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="flex items-center -space-x-1" aria-hidden>
            {data.steps.map((s) =>
              s.done ? (
                <CheckCircle2 key={s.key} className="w-4 h-4 text-green-500" />
              ) : (
                <Circle key={s.key} className="w-4 h-4 text-amber-400" />
              )
            )}
          </div>
          <Link
            href="/gestao/configuracao"
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Completar agora <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <button
          onClick={() => setHidden(true)}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}