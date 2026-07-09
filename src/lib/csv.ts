export function jsonToCsv(data: Record<string, any>[], headers: Record<string, string>): string {
  const headerRow = Object.values(headers).map(escapeCsv).join(",");
  const rows = data.map((row) =>
    Object.keys(headers)
      .map((key) => escapeCsv(String(row[key] ?? "")))
      .join(",")
  );
  return [headerRow, ...rows].join("\r\n");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
