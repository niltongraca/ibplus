"use client";

import { Megaphone, ArrowRight, Mail, Gift, TrendingUp } from "lucide-react";
import Link from "next/link";

interface CampaignsData {
  activeCampaigns: number;
}

export function CampaignsWidget({ data }: { data: CampaignsData | null }) {
  if (!data) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-5 h-5 text-cyan-600" />
        <h2 className="font-semibold text-ib-primary">Campanhas</h2>
      </div>
      <div className="text-center py-4">
        <p className="text-3xl font-bold text-cyan-600 mb-1">{data.activeCampaigns}</p>
        <p className="text-sm text-ib-muted">campanhas activas</p>
      </div>
      <div className="flex justify-center gap-4 mt-3">
        <div className="flex flex-col items-center">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-ib-muted">Email</span>
        </div>
        <div className="flex flex-col items-center">
          <Gift className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-ib-muted">Promoções</span>
        </div>
        <div className="flex flex-col items-center">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-ib-muted">Análise</span>
        </div>
      </div>
      <Link href="/marketing/campanhas" className="text-xs text-ib-accent hover:text-blue-700 font-medium flex items-center gap-1 justify-center mt-3">
        Gerir campanhas <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
