"use client";

import { GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";

interface StudentsData {
  totalStudents: number;
}

export function StudentsWidget({ data }: { data: StudentsData | null }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-emerald-600" />
        <h2 className="font-semibold text-ib-primary">Alunos</h2>
      </div>
      {data.totalStudents > 0 ? (
        <div className="text-center py-4">
          <p className="text-3xl font-bold text-emerald-600 mb-1">{data.totalStudents}</p>
          <p className="text-sm text-ib-muted">alunos matriculados</p>
        </div>
      ) : (
        <div className="text-center py-6">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-ib-muted">Módulo de alunos disponível em breve</p>
        </div>
      )}
      <Link href="/gestao/dashboard" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1 justify-center">
        Voltar ao dashboard <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
