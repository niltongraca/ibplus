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
    return <div className="p-12 text-center text-ib-muted text-sm">A carregar...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="p-12 text-center">
        {emptyIcon}
        <p className="text-ib-muted text-sm">{emptyText || "Nenhum registo encontrado."}</p>
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
            <div key={keyExtractor(item)} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              {mobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop/tablet table view */}
      <div className={`overflow-x-auto scrollbar-hide ${mobileCard ? "hidden sm:block" : ""}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-ib-muted text-xs uppercase tracking-wider">
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
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
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
