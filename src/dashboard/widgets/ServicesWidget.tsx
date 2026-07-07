"use client";

import { Briefcase, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ServicesData {
  totalServices: number;
}

export function ServicesWidget({ data }: { data: ServicesData | null }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-sky-600" />
        <h2 className="font-semibold text-ib-primary">Serviços</h2>
      </div>
      <div className="text-center py-4">
        <p className="text-3xl font-bold text-sky-600 mb-1">{data.totalServices}</p>
        <p className="text-sm text-ib-muted">serviços cadastrados</p>
      </div>
      <Link href="/gestao/servicos" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1 justify-center">
        Gerir serviços <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
