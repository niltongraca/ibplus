"use client";

import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  hide?: "mobile" | "tablet";
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon?: ReactNode;
  emptyText?: string;
  mobileCard?: (item: T) => ReactNode;
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyIcon,
  emptyText,
  mobileCard,
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return <div className="p-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>A carregar...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="p-12 text-center">
        {emptyIcon}
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{emptyText || "Nenhum registo encontrado."}</p>
      </div>
    );
  }

  const hideClass = (hide?: "mobile" | "tablet") => {
    if (hide === "mobile") return "hidden sm:table-cell";
    if (hide === "tablet") return "hidden md:table-cell";
    return "";
  };

  return (
    <>
      {/* Mobile card view */}
      {mobileCard && (
        <div className="sm:hidden space-y-3 p-3">
          {data.map((item) => (
            <div key={keyExtractor(item)} className="rounded-xl border p-4 shadow-sm" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              {mobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop/tablet table view */}
      <div className={`overflow-x-auto scrollbar-hide ${mobileCard ? "hidden sm:block" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left p-4 font-medium ${hideClass(col.hide)} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="border-b transition-colors" style={{ borderColor: "var(--border-color)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-secondary)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`p-4 ${hideClass(col.hide)} ${col.className || ""}`}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
