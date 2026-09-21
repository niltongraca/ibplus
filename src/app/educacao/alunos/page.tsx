"use client";

import { useState } from "react";
import { Plus, Search, Edit3, Trash2, GraduationCap } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { useList } from "@/hooks/useList";
import Pagination from "@/components/Pagination";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  grade: string | null;
  active: boolean;
}

export default function AlunosPage() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const { data: students, setData: setStudents, loading, page, setPage, totalPages } = useList<Student>("/api/students", "students", { limit: 20, params: { search } });

  async function handleDelete(id: string) {
    if (!(await confirm({ title: "Eliminar aluno", message: "Tem a certeza que deseja eliminar este aluno?", variant: "danger" }))) return;
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Aluno eliminado com sucesso!");
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } else {
      toast("Erro ao eliminar aluno.", "error");
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Alunos</h1>
          <p className="text-ib-muted text-sm">Gerir base de alunos</p>
        </div>
        <Link
          href="/educacao/alunos/novo"
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" /> Novo Aluno
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar alunos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
          </div>
        </div>

        <DataTable
          columns={[
            { key: "name", header: "Nome", render: (s) => (
              <Link href={`/educacao/alunos/${s.id}`} className="font-medium text-ib-primary hover:text-ib-accent">
                {s.name}
              </Link>
            )},
            { key: "email", header: "Email", hide: "tablet", render: (s) => <span className="text-ib-muted">{s.email || "—"}</span> },
            { key: "phone", header: "Telefone", hide: "mobile", render: (s) => <span className="text-ib-muted">{s.phone || "—"}</span> },
            { key: "grade", header: "Turma", hide: "tablet", render: (s) => <span className="text-ib-muted">{s.grade || "—"}</span> },
            { key: "active", header: "Estado", hide: "mobile", className: "text-center", render: (s) => (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {s.active ? "Activo" : "Inactivo"}
              </span>
            )},
            { key: "actions", header: "Acções", hide: "mobile", className: "text-right", render: (s) => (
              <div className="flex items-center justify-end gap-1">
                <Link href={`/educacao/alunos/${s.id}`} className="p-1.5 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"><Edit3 className="w-4 h-4 text-ib-muted" /></Link>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            )},
          ]}
          data={students}
          loading={loading}
          emptyIcon={<GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          emptyText="Nenhum aluno encontrado."
          keyExtractor={(s) => s.id}
          mobileCard={(s) => (
            <Link href={`/educacao/alunos/${s.id}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="font-semibold text-ib-primary">{s.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {s.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="text-sm text-ib-muted space-y-0.5">
                {s.email && <p>{s.email}</p>}
                {s.phone && <p>{s.phone}</p>}
              </div>
            </Link>
          )}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
