"use client";

import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SubCompaniesManager } from "@/components/company/SubCompaniesManager";
import { AcquisitionSection } from "@/components/company/AcquisitionSection";

export default function OrganizacoesPage() {
  const { user } = useAuth();
  const canManage = Boolean(user?.companyId && user?.isOwner);

  if (!canManage) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-ib-muted">A gestão de organizações está disponível apenas para o dono.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary flex items-center gap-2">
            <Building2 className="w-6 h-6 text-ib-accent" />
            Organizações
          </h1>
          <p className="text-sm text-ib-muted mt-1">
            Subempresas, filiais e organizações parceiras do seu negócio.
          </p>
        </div>
        <Link
          href="/gestao/configuracao"
          className="text-sm font-medium text-ib-accent hover:underline"
        >
          Gestão completa
        </Link>
      </div>

      <div className="space-y-6">
        <SubCompaniesManager />
        <AcquisitionSection />
      </div>
    </div>
  );
}
