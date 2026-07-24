"use client";

import { Building2, ArrowRight, Users, Clock, Calendar } from "lucide-react";
import Link from "next/link";

interface HRData {
  totalEmployees: number;
  activeEmployees: number;
  vacationPending: number;
}

export function HRWidget({ data }: { data: HRData | null }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900">Recursos Humanos</h2>
        </div>
        <Link href="/rh" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          Gerir <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <Users className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-indigo-600">{data.totalEmployees}</p>
          <p className="text-xs text-indigo-500">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <Clock className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-green-600">{data.activeEmployees}</p>
          <p className="text-xs text-green-500">Ativos</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <Calendar className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
          <p className="text-lg font-bold text-yellow-600">{data.vacationPending}</p>
          <p className="text-xs text-yellow-500">Férias</p>
        </div>
      </div>
    </div>
  );
}
