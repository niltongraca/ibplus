"use client";

import { Users, Phone, Mail, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Props {
  clients?: Client[];
}

export function RecentClientsWidget({ clients }: Props) {
  if (!clients || clients.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Novos Clientes
        </h3>
        <Link href="/gestao/clientes" className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5">
          Ver todos <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {clients.slice(0, 5).map((client) => (
          <div key={client.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
            <div className="w-9 h-9 rounded-full bg-purple-100/70 flex items-center justify-center text-purple-600 font-bold text-sm shrink-0">
              {client.name?.charAt(0)?.toUpperCase() || "C"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
              <div className="flex items-center gap-3 text-xs text-ib-muted">
                {client.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> {client.email}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
