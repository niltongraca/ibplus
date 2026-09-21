"use client";

import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  hide?: "mobile" | "tablet";
  className?: string;
}

export interface DataTableProps<T> {
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
    return (
      <div className="p-4 space-y-3" role="status" aria-label="A carregar">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 p-4 rounded-xl border animate-pulse"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}
          >
            <div className="h-4 w-1/4 rounded-md" style={{ backgroundColor: "var(--skeleton)" }} />
            <div className="h-4 w-1/4 rounded-md hidden sm:block" style={{ backgroundColor: "var(--skeleton)" }} />
            <div className="h-4 w-1/6 rounded-md hidden md:block" style={{ backgroundColor: "var(--skeleton)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-4">
        <div
          className="w-14 h-14 rounded-full border flex items-center justify-center mb-3"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
        >
          {emptyIcon || <Inbox className="w-6 h-6" style={{ color: "var(--text-muted)" }} />}
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {emptyText || "Nenhum registo encontrado."}
        </p>
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
        <div className="sm:hidden space-y-3 p-4">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              className="card card-pad"
            >
              {mobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop/tablet table view */}
      <div className={`table-scroll ${mobileCard ? "hidden sm:block" : ""}`}>
        <table className="tbl">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border-color)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`tbl-th ${hideClass(col.hide)} ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="tbl-row">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`tbl-td ${hideClass(col.hide)} ${col.className || ""}`}
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