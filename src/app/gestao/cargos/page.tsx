"use client";

import Link from "next/link";
import { ShieldCheck, ArrowRight, BadgeCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CargosManager } from "@/components/rh/CargosManager";

export default function CargosPage() {
  const { user } = useAuth();
  const canManage = Boolean(user?.companyId && user?.isOwner);

  if (!canManage) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-6 text-center">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-ib-muted">
            A gestão de cargos está disponível apenas para o dono da organização.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BadgeCheck className="w-6 h-6 text-ib-accent" />
            Cargos
          </h1>
          <p className="text-ib-muted text-sm mt-1">
            Defina os cargos da sua organização e as sugestões apresentadas a novos convidados.
          </p>
        </div>
        <Link
          href="/rh/permissoes"
          className="btn btn-primary"
        >
          <ShieldCheck className="w-4 h-4" /> Permissões por cargo
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <CargosManager />
    </div>
  );
}
