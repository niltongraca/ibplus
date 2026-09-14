"use client";

import { useState, useRef, useEffect } from "react";
import { Package, Wrench, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
}

export interface CatalogService {
  id: string;
  name: string;
  price: number;
}

interface CatalogPickerProps {
  products: CatalogProduct[];
  services: CatalogService[];
  onSelect: (entry: { name: string; price: number; kind: "product" | "service" }) => void;
}

export function CatalogPicker({ products, services, onSelect }: CatalogPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleTouchOutside(e: TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleTouchOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, []);

  const hasItems = products.length > 0 || services.length > 0;

  function pick(name: string, price: number, kind: "product" | "service") {
    onSelect({ name, price, kind });
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm text-ib-accent hover:text-blue-700 font-medium"
      >
        <Package className="w-4 h-4" /> Catálogo
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-20">
          {!hasItems && (
            <p className="px-4 py-3 text-sm text-ib-muted">O catálogo está vazio.</p>
          )}

          {services.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ib-muted">Serviços</p>
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s.name, s.price, "service")}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-ib-muted hover:bg-gray-50 hover:text-ib-primary"
                >
                  <Wrench className="w-4 h-4 shrink-0 text-gray-400" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{s.name}</span>
                    <span className="block text-xs">{formatCurrency(s.price)}</span>
                  </span>
                </button>
              ))}
            </>
          )}

          {products.length > 0 && (
            <>
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ib-muted">Produtos</p>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(p.name, p.price, "product")}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-ib-muted hover:bg-gray-50 hover:text-ib-primary"
                >
                  <Package className="w-4 h-4 shrink-0 text-gray-400" />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate">{p.name}</span>
                    <span className="block text-xs">{formatCurrency(p.price)}</span>
                  </span>
                  {typeof p.stock === "number" && <span className="text-xs text-ib-muted shrink-0">{p.stock} u.</span>}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}