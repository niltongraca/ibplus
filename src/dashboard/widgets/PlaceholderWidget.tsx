"use client";

import { LucideIcon } from "lucide-react";

export function PlaceholderWidget({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
      <Icon className="w-8 h-8 text-gray-300 mb-2" />
      <p className="text-sm font-medium text-gray-400">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  );
}
