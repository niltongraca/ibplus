interface ExportLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ExportCompanyInfo {
  name: string;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
}

interface ExportDocumentData {
  type: "FATURA" | "ORÇAMENTO";
  typeLabel: string;
  number: string;
  customer: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerNif?: string | null;
  date: string;
  secondaryDateLabel: string;
  secondaryDate: string | null;
  status: string;
  notes?: string | null;
  items: ExportLineItem[];
  subtotal?: number;
  discountType?: string;
  discountValue?: number;
  discount?: number;
  installments?: number;
  currency?: string;
  paymentMethod?: string | null;
  bankDetails?: string | null;
  paidAmount?: number;
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
  pending: { label: "Espera", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  partially_paid: { label: "Parcialmente Pago", bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe" },
};

const currencySymbols: Record<string, string> = {
  AOA: "Kz",
  USD: "$",
  EUR: "€",
  BRL: "R$",
  ZAR: "R",
  CNY: "¥",
};

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(value: number, currency: string = "AOA"): string {
  return value.toLocaleString("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " " + (currencySymbols[currency] || currency);
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-AO");
}

function companyMeta(company: ExportCompanyInfo | null): string {
  if (!company) return "";
  const lines = [
    company.nif ? `NIF: ${esc(company.nif)}` : "",
    company.phone ? esc(company.phone) : "",
    company.email ? esc(company.email) : "",
  ].filter(Boolean);
  return lines.join(" &nbsp;·&nbsp; ");
}

function logoHtml(company: ExportCompanyInfo | null): string {
  if (!company?.logo) return "";
  return `<img class="doc-logo" src="${esc(company.logo)}" alt="${esc(company.name || "Logótipo")}" />`;
}

function companyAddress(company: ExportCompanyInfo | null): string {
  if (!company?.address) return "";
  return `<div class="company-meta">${esc(company.address)}</div>`;
}

function docFooter(_company: ExportCompanyInfo | null): string {
  return "Documento gerado na plataforma <b>IBPlus+</b>";
}

export function buildDocumentHtml(data: ExportDocumentData, company: ExportCompanyInfo | null): string {
  const status: StatusStyle = statusMap[data.status] || { label: data.status, bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  const currency = data.currency || "AOA";
  const subtotal = data.subtotal ?? data.total;
  const discount = data.discount ?? 0;
  const installments = data.installments ?? 1;
  const paidAmount = data.paidAmount ?? 0;
  const remaining = Math.max(0, data.total - paidAmount);
  const brand = company?.name || "IBPlus+";

  const itemsRows = data.items.map((item, idx) => `
      <tr class="${idx % 2 ? "alt" : ""}">
        <td class="desc">${esc(item.description)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${money(item.unitPrice, currency)}</td>
        <td class="num strong">${money(item.total, currency)}</td>
      </tr>`).join("");

  const emptyRows = data.items.length === 0
    ? `<tr><td colspan="4" class="empty">Sem itens registados.</td></tr>`
    : "";

  const customerExtra = [
    data.customerPhone ? `<p>${esc(data.customerPhone)}</p>` : "",
    data.customerEmail ? `<p>${esc(data.customerEmail)}</p>` : "",
    data.customerNif ? `<p>NIF: ${esc(data.customerNif)}</p>` : "",
  ].join("");

  const summaryRows = `
    <div class="tot-row"><span>Subtotal</span><span>${money(subtotal, currency)}</span></div>
    ${discount > 0 ? `<div class="tot-row discount"><span>Desconto${data.discountType === "percentage" && data.discountValue ? ` (${data.discountValue}%)` : ""}</span><span>- ${money(discount, currency)}</span></div>` : ""}
    ${installments > 1 ? `<div class="tot-row"><span>Prestações</span><span>${installments} × ${money(data.total / installments, currency)}</span></div>` : ""}
    ${data.type === "FATURA" && paidAmount > 0 ? `<div class="tot-row paid"><span>Pago</span><span>${money(paidAmount, currency)}</span></div>` : ""}
    ${data.type === "FATURA" && paidAmount > 0 ? `<div class="tot-row debt"><span>Em dívida</span><span>${money(remaining, currency)}</span></div>` : ""}`;

  const bankHtml = data.bankDetails
    ? `
      <div class="block">
        <h4>Coordenadas Bancárias</h4>
        <p>${esc(data.bankDetails)}</p>
      </div>`
    : "";

  const notesHtml = data.notes
    ? `
      <div class="block">
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
  @page { size: A4; margin: 0; }
  html, body { background: #fff; }
  body {
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937; line-height: 1.45; font-size: 13px;
    padding: 16mm 18mm;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet { max-width: 860px; margin: 0 auto; }
  .letterhead { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
  .brand { min-width: 0; }
  .doc-logo { display: block; max-height: 44px; width: auto; max-width: 180px; object-fit: contain; margin-bottom: 6px; }
  .company-name { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -.2px; }
  .company-meta { font-size: 11.5px; color: #64748b; margin-top: 3px; }
  .company-line { font-size: 11.5px; color: #64748b; margin-top: 3px; }
  .doc-title { text-align: right; min-width: 0; }
  .doc-type { font-size: 25px; font-weight: 800; letter-spacing: 2px; color: #0f172a; text-transform: uppercase; }
  .doc-number { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #475569; font-size: 13px; margin-top: 2px; }
  .status { display: inline-block; margin-top: 8px; font-size: 10px; font-weight: 700; letter-spacing: .6px;
    padding: 3px 10px; border-radius: 999px; background: ${status.bg}; color: ${status.color}; border: 1px solid ${status.border}; }
  .rule { border: none; border-top: 2px solid #0f172a; margin: 18px 0 22px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 22px; }
  .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; margin-bottom: 6px; }
  .parties p { margin: 2px 0; font-size: 12.5px; color: #374151; }
  .parties p b { color: #0f172a; font-weight: 600; }
  .parties .customer { font-size: 14px; font-weight: 700; color: #0f172a; }
  .capitalize { text-transform: capitalize; }
  table.items { width: 100%; border-collapse: collapse; margin: 22px 0 10px; }
  table.items thead th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .8px;
    color: #64748b; font-weight: 700; padding: 8px 10px; border-top: 2px solid #0f172a; border-bottom: 1px solid #cbd5e1; background: #f8fafc; }
  table.items thead th.num { text-align: right; }
  table.items tbody td { padding: 9px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12.5px; vertical-align: top; }
  table.items tr.alt td { background: #fafafa; }
  table.items td.desc { color: #0f172a; font-weight: 500; }
  table.items td.num { text-align: right; color: #475569; white-space: nowrap; }
  table.items td.strong { font-weight: 700; color: #0f172a; }
  table.items td.empty { text-align: center; color: #94a3b8; padding: 18px; }
  .totals { display: flex; justify-content: flex-end; margin: 12px 0 18px; }
  .totals-box { width: 300px; }
  .tot-row { display: flex; justify-content: space-between; gap: 24px; padding: 3px 0; font-size: 12.5px; color: #475569; }
  .tot-row span:last-child { color: #0f172a; font-weight: 600; }
  .tot-row.discount span:last-child { color: #b91c1c; }
  .tot-row.paid span:last-child { color: #047857; }
  .tot-row.debt span:last-child { color: #b91c1c; }
  .tot-row.grand { border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 10px; font-size: 14px; }
  .tot-row.grand span:last-child { font-size: 18px; font-weight: 800; }
  .block { margin-bottom: 16px; }
  .block h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
  .block p { font-size: 12.5px; color: #374151; white-space: pre-wrap; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10.5px; color: #94a3b8; line-height: 1.6; }
  @media print {
    body { padding: 16mm 18mm; }
  }
</style>
</head>
<body>
  <script>
    setTimeout(function () { window.print(); }, 250);
  <\/script>
  <div class="sheet">
    <div class="letterhead">
      <div class="brand">
        <div>
          ${logoHtml(company)}
          <div class="company-name">${esc(brand)}</div>
          ${companyMeta(company) ? `<div class="company-line">${companyMeta(company)}</div>` : ""}
          ${companyAddress(company)}
        </div>
      </div>
      <div class="doc-title">
        <div class="doc-type">${esc(data.type)}</div>
        <div class="doc-number">Nº ${esc(data.number)}</div>
        <span class="status">${esc(status.label)}</span>
      </div>
    </div>
    <hr class="rule" />
    <div class="parties">
      <div>
        <div class="party-label">Informação de Emissão</div>
        <p><b>Data de emissão:</b> ${fmtDate(data.date)}</p>
        <p><b>${esc(data.secondaryDateLabel)}:</b> ${fmtDate(data.secondaryDate)}</p>
        ${data.paymentMethod ? `<p><b>Pagamento:</b> <span class="capitalize">${esc(data.paymentMethod)}</span></p>` : ""}
      </div>
      <div>
        <div class="party-label">Cliente</div>
        <p class="customer">${esc(data.customer || "—")}</p>
        ${customerExtra}
      </div>
    </div>
    <table class="items">
      <thead>
        <tr>
          <th>Descrição</th>
          <th class="num" style="width:64px;">Qtd</th>
          <th class="num" style="width:120px;">Preço Unit.</th>
          <th class="num" style="width:120px;">Total</th>
        </tr>
      </thead>
      <tbody>${itemsRows}${emptyRows}</tbody>
    </table>
    <div class="totals">
      <div class="totals-box">
        ${summaryRows}
        <div class="tot-row grand"><span>Total ${esc(data.typeLabel)}</span><span>${money(data.total, currency)}</span></div>
      </div>
    </div>
    ${bankHtml}
    ${notesHtml}
    <div class="footer">${docFooter(company)}</div>
  </div>
</body>
</html>`;
}