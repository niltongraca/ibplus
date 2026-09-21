"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getBreadcrumbs } from "@/config/breadcrumbs";

/**
 * Breadcrumbs de navegação (auditoria #16 — UX).
 * Lê a rota atual e renderiza Início / Módulo / Página, com o último item
 * marcado como `aria-current="page"` e separador semântico (li).
 */
export function Breadcrumbs() {
  const pathname = usePathname() ?? "";
  const trail = getBreadcrumbs(pathname);

  if (!trail || trail.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 -mt-1">
      <ol className="flex flex-wrap items-center gap-y-1 text-sm text-ib-muted">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1;
          const clickable = Boolean(crumb.href) && !isLast;
          return (
            <li key={`${i}-${crumb.label}`} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-ib-muted shrink-0" aria-hidden />
              )}
              {clickable ? (
                <Link
                  href={crumb.href!}
                  className="inline-flex items-center min-h-[36px] px-1.5 rounded-lg hover:text-ib-accent hover:underline underline-offset-4 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "font-medium text-ib-primary" : ""}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}