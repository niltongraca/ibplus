"use client";

import { Users, ArrowRight, Phone, Mail } from "lucide-react";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface ClientsData {
  totalCustomers: number;
  recentClients: Client[];
}

export function ClientsWidget({ data }: { data: ClientsData | null }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <h2 className="font-semibold text-ib-primary">Clientes</h2>
        </div>
        <Link href="/gestao/clientes" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1">
          Ver todos ({data.totalCustomers}) <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {data.recentClients?.length ? (
        <div className="divide-y divide-gray-100">
          {data.recentClients.map((client) => (
            <div key={client.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-ib-primary">{client.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {client.phone && (
                    <span className="text-xs text-ib-muted flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {client.phone}
                    </span>
                  )}
                  {client.email && (
                    <span className="text-xs text-ib-muted flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {client.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ib-muted py-8 text-center">Nenhum cliente registado.</p>
      )}
    </div>
  );
}
