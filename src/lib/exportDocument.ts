export interface ExportLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ExportCompanyInfo {
  name: string;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
}

export interface ExportDocumentData {
  type: "FATURA" | "ORÇAMENTO";
  typeLabel: string;
  number: string;
  customer: string | null;
  date: string;
  secondaryDateLabel: string;
  secondaryDate: string | null;
  status: string;
  notes?: string | null;
  items: ExportLineItem[];
  total: number;
}

interface StatusStyle {
  label: string;
  bg: string;
  color: string;
  border: string;
}

const statusMap: Record<string, StatusStyle> = {
  draft: { label: "Rascunho", bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  sent: { label: "Enviado", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  paid: { label: "Pago", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  approved: { label: "Aprovado", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  overdue: { label: "Vencido", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  rejected: { label: "Rejeitado", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  cancelled: { label: "Cancelado", bg: "#f3f4f6", color: "#9ca3af", border: "#e5e7eb" },
  converted: { label: "Convertido", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: number): string {
  return value.toLocaleString("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " Kz";
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-AO");
}

export function buildDocumentHtml(data: ExportDocumentData, company: ExportCompanyInfo | null): string {
  const companyName = company?.name || "IBPlus+";
  const status: StatusStyle = statusMap[data.status] || { label: data.status, bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

  const logoHtml = company?.logo
    ? `<img src="${esc(company.logo)}" alt="${esc(companyName)}" class="logo" />`
    : `<div class="logo-fallback">${esc(companyName.charAt(0).toUpperCase())}</div>`;

  const companyLine = [
    company?.nif ? `NIF: ${esc(company.nif)}` : "",
    company?.email ? esc(company.email) : "",
    company?.phone ? esc(company.phone) : "",
  ].filter(Boolean).join(" &nbsp;·&nbsp; ");

  const addressLine = company?.address ? `<p class="address">${esc(company.address)}</p>` : "";

  const itemsRows = data.items.map((item, idx) => `
      <tr class="${idx % 2 ? "alt" : ""}">
        <td class="desc">${esc(item.description)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${money(item.unitPrice)}</td>
        <td class="num strong">${money(item.total)}</td>
      </tr>`).join("");

  const emptyRows = data.items.length === 0
    ? `<tr><td colspan="4" class="empty">Sem itens registados.</td></tr>`
    : "";

  const notesHtml = data.notes
    ? `
      <div class="notes">
        <h4>Observações</h4>
        <p>${esc(data.notes)}</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(data.type)} ${esc(data.number)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #eef1f6; color: #1a2a4a; line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet {
    max-width: 860px; margin: 24px auto; background: #fff;
    border-radius: 16px; overflow: hidden;
    box-shadow: 0 12px 40px rgba(10,22,40,.12);
  }
  .header {
    background: linear-gradient(120deg, #0a1628 0%, #0f1f3d 55%, #1a2a4a 100%);
    padding: 28px 36px; display: flex; justify-content: space-between; align-items: center; gap: 16px;
  }
  .brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .logo { height: 56px; width: 56px; object-fit: contain; border-radius: 12px;
    background: rgba(255,255,255,.12); padding: 6px; border: 1px solid rgba(255,255,255,.15); }
  .logo-fallback { height: 56px; width: 56px; border-radius: 12px; display: flex; align-items: center;
    justify-content: center; font-size: 26px; font-weight: 800; color: #fff;
    background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.15); }
  .company-name { font-size: 19px; font-weight: 800; color: #fff; letter-spacing: -.2px; }
  .company-line { font-size: 11px; color: #9db3cf; margin-top: 4px; }
  .address { font-size: 11px; color: #7d93b5; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-type { font-size: 30px; font-weight: 900; color: #fff; letter-spacing: 3px; }
  .doc-number { font-size: 13px; color: #9db3cf; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 2px; }
  .status { display: inline-block; margin-top: 10px; font-size: 11px; font-weight: 700; letter-spacing: .5px;
    padding: 4px 12px; border-radius: 999px; background: ${status.bg}; color: ${status.color};
    border: 1px solid ${status.border}; }
  .body { padding: 32px 36px 28px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; }
  .card { background: #f8fafc; border: 1px solid #eef1f6; border-radius: 12px; padding: 16px 18px; }
  .card h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin-bottom: 10px; }
  .card p { font-size: 13px; color: #334155; }
  .card p b { color: #0f172a; font-weight: 600; }
  .card .customer { font-size: 14px; font-weight: 700; color: #0f172a; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #eef1f6; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
  thead th { background: linear-gradient(120deg, #0a1628 0%, #1a2a4a 100%); color: #fff; text-align: left;
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 12px 14px; }
  thead th.num { text-align: right; }
  tbody td { padding: 11px 14px; font-size: 13px; border-top: 1px solid #f1f5f9; vertical-align: top; }
  tbody tr.alt td { background: #f8fafc; }
  td.desc { color: #0f172a; font-weight: 500; }
  td.num { text-align: right; color: #475569; white-space: nowrap; }
  td.strong { font-weight: 700; color: #0f172a; }
  td.empty { text-align: center; color: #94a3b8; padding: 20px; }
  .total-wrap { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .total-card { min-width: 260px; background: linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%);
    border-radius: 12px; padding: 16px 20px; color: #fff; text-align: right; }
  .total-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.2px; color: #9db3cf; margin-bottom: 4px; }
  .total-value { font-size: 24px; font-weight: 800; letter-spacing: -.3px; }
  .notes { border-top: 1px solid #eef1f6; padding-top: 16px; margin-bottom: 20px; }
  .notes h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin-bottom: 6px; }
  .notes p { font-size: 13px; color: #475569; white-space: pre-wrap; }
  .footer { border-top: 1px solid #eef1f6; padding-top: 14px; display: flex; justify-content: space-between;
    align-items: center; font-size: 11px; color: #94a3b8; }
  .generated { position: fixed; top: 16px; right: 16px; z-index: 50; }
  @media (max-width: 640px) {
    .sheet { margin: 0; border-radius: 0; box-shadow: none; min-height: 100vh; }
    .header { padding: 20px; }
    .body { padding: 22px 16px 24px; }
    .grid { grid-template-columns: 1fr; gap: 12px; }
    .doc-type { font-size: 24px; }
    .total-card { width: 100%; }
    thead th { padding: 10px 8px; }
    tbody td { padding: 9px 8px; font-size: 12px; }
  }
  @media print {
    body { background: #fff; }
    .sheet { margin: 0; border-radius: 0; box-shadow: none; max-width: none; }
    @page { margin: 12mm; }
  }
</style>
</head>
<body>
  <script>
    setTimeout(function () { window.print(); }, 250);
  <\/script>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        ${logoHtml}
        <div>
          <div class="company-name">${esc(companyName)}</div>
          ${companyLine ? `<div class="company-line">${companyLine}</div>` : ""}
          ${addressLine}
        </div>
      </div>
      <div class="doc-title">
        <div class="doc-type">${esc(data.type)}</div>
        <div class="doc-number">${esc(data.number)}</div>
        <span class="status">${esc(status.label)}</span>
      </div>
    </div>
    <div class="body">
      <div class="grid">
        <div class="card">
          <h4>Datas</h4>
          <p><b>Emissão:</b> ${fmtDate(data.date)}</p>
          <p><b>${esc(data.secondaryDateLabel)}:</b> ${fmtDate(data.secondaryDate)}</p>
        </div>
        <div class="card">
          <h4>Cliente</h4>
          <p class="customer">${esc(data.customer || "—")}</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th class="num" style="width:70px;">Qtd</th>
            <th class="num" style="width:130px;">Preço Unit.</th>
            <th class="num" style="width:130px;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsRows}${emptyRows}</tbody>
      </table>
      <div class="total-wrap">
        <div class="total-card">
          <div class="total-label">Total ${esc(data.typeLabel)}</div>
          <div class="total-value">${money(data.total)}</div>
        </div>
      </div>
      ${notesHtml}
      <div class="footer">
        <span>Documento gerado por ${esc(companyName)}</span>
        <span>${esc(data.type)} ${esc(data.number)}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}