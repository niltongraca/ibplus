"use client";

import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface DonationsData {
  totalDonations: number;
  donationTotal: number;
}

export function DonationsWidget({ data }: { data: DonationsData | null }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-pink-600" />
        <h2 className="font-semibold text-ib-primary">Doações</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-pink-50 rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-pink-600">{data.totalDonations}</p>
          <p className="text-xs text-pink-500">Doações recebidas</p>
        </div>
        <div className="bg-rose-50 rounded-lg p-4 text-center">
          <p className="text-xl font-bold text-rose-600">{formatCurrency(data.donationTotal)}</p>
          <p className="text-xs text-rose-500">Valor total</p>
        </div>
      </div>
      <Link href="/gestao/vendas" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1 justify-center">
        Ver doações <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
