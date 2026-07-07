"use client";

import { Building2, ArrowRight, Users, Briefcase } from "lucide-react";
import Link from "next/link";

interface HRData {
  totalEmployees: number;
}

export function HRWidget({ data }: { data: HRData | null }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-ib-primary">Recursos Humanos</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <Users className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-indigo-600">{data.totalEmployees}</p>
          <p className="text-xs text-indigo-500">Funcionários</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <Briefcase className="w-6 h-6 text-purple-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-purple-600">{data.totalEmployees > 0 ? "Ativo" : "—"}</p>
          <p className="text-xs text-purple-500">Estado</p>
        </div>
      </div>
      <Link href="/rh" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1 justify-center">
        Gerir equipa <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
