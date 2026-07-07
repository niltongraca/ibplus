"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nif: string | null;
  address: string | null;
  birthDate: string | null;
  grade: string | null;
  enrollmentDate: string;
  active: boolean;
  notes: string | null;
  createdAt: string;
}

export default function AlunoDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || "";
  const router = useRouter();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    nif: "",
    address: "",
    birthDate: "",
    grade: "",
    active: true,
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setStudent(d.student);
        setForm({
          name: d.student.name,
          email: d.student.email || "",
          phone: d.student.phone || "",
          nif: d.student.nif || "",
          address: d.student.address || "",
          birthDate: d.student.birthDate ? d.student.birthDate.split("T")[0] : "",
          grade: d.student.grade || "",
          active: d.student.active,
          notes: d.student.notes || "",
        });
      })
      .catch(() => { router.push("/educacao/alunos"); })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleDelete() {
    if (!confirm("Eliminar aluno?")) return;
    const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Aluno eliminado com sucesso!");
      router.push("/educacao/alunos");
    } else {
      toast("Erro ao eliminar aluno.", "error");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          nif: form.nif || null,
          address: form.address || null,
          birthDate: form.birthDate || null,
          grade: form.grade || null,
          active: form.active,
          notes: form.notes || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
        toast("Aluno actualizado com sucesso!");
        setEditing(false);
      } else {
        const data = await res.json();
        toast(data.error || "Erro ao actualizar aluno.", "error");
      }
    } catch {
      toast("Erro ao actualizar aluno.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-ib-muted text-sm">A carregar...</div>
      </div>
    );
  }

  if (!student) return null;

  if (editing) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setEditing(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-ib-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-ib-primary">Editar Aluno</h1>
            <p className="text-ib-muted text-sm">{student.name}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ib-primary mb-1">Nome *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Telefone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">NIF</label>
              <input
                type="text"
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ib-primary mb-1">Morada</label>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Turma</label>
              <input
                type="text"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-ib-accent focus:ring-ib-accent/40"
                />
                <span className="text-sm font-medium text-ib-primary">Activo</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ib-primary mb-1">Notas</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? "A guardar..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-ib-muted hover:text-ib-primary px-4 py-2.5"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/educacao/alunos" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-ib-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ib-primary">{student.name}</h1>
            <p className="text-ib-muted text-sm">Detalhes do aluno</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-ib-primary px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-ib-primary mb-4">Informação Geral</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Nome</span>
            <span className="text-ib-primary font-medium">{student.name}</span>
          </div>
          <div>
            <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Estado</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block ${student.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {student.active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <div>
            <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Email</span>
            <span className="text-ib-primary">{student.email || "—"}</span>
          </div>
          <div>
            <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Telefone</span>
            <span className="text-ib-primary">{student.phone || "—"}</span>
          </div>
          <div>
            <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">NIF</span>
            <span className="text-ib-primary">{student.nif || "—"}</span>
          </div>
          <div>
            <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Turma</span>
            <span className="text-ib-primary">{student.grade || "—"}</span>
          </div>
          <div>
            <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Data de Nascimento</span>
            <span className="text-ib-primary">{student.birthDate ? formatDate(student.birthDate) : "—"}</span>
          </div>
          <div>
            <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Data de Matrícula</span>
            <span className="text-ib-primary">{formatDate(student.enrollmentDate)}</span>
          </div>
          <div>
            <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Criado em</span>
            <span className="text-ib-muted text-sm">{formatDate(student.createdAt)}</span>
          </div>
          {student.address && (
            <div className="sm:col-span-2">
              <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Morada</span>
              <span className="text-ib-primary">{student.address}</span>
            </div>
          )}
          {student.notes && (
            <div className="sm:col-span-2">
              <span className="block text-xs text-ib-muted uppercase tracking-wider mb-1">Notas</span>
              <span className="text-ib-primary">{student.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
