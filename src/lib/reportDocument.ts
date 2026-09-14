export interface ReportCompanyInfo {
  name: string;
  nif?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
}

export interface ReportMetric {
  label: string;
  value: string;
  tone?: "green" | "red" | "neutral";
}

export interface ReportSection {
  heading?: string;
  metrics?: ReportMetric[];
  table?: { headers: string[]; rows: string[][] };
  text?: string;
}

export interface ReportDocumentOptions {
  title: string;
  subtitle?: string;
  period?: string;
  company: ReportCompanyInfo | null;
  sections: ReportSection[];
  footnote?: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtLongDate(d: Date): string {
  return d.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
}

function companyMeta(company: ReportCompanyInfo | null): string {
  if (!company) return "";
  const lines = [
    company.nif ? `NIF: ${esc(company.nif)}` : "",
    company.phone ? esc(company.phone) : "",
    company.email ? esc(company.email) : "",
  ].filter(Boolean);
  return lines.join(" &nbsp;·&nbsp; ");
}

function logoHtml(company: ReportCompanyInfo | null): string {
  if (!company?.logo) return "";
  return `<img class="doc-logo" src="${esc(company.logo)}" alt="${esc(company.name || "Logótipo")}" />`;
}

function renderMetrics(metrics: ReportMetric[]): string {
  return `
        <div class="metric-grid">
          ${metrics.map((m) => `
          <div class="metric">
            <div class="metric-label">${esc(m.label)}</div>
            <div class="metric-value tone-${m.tone || "neutral"}">${esc(m.value)}</div>
          </div>`).join("")}
        </div>`;
}

function renderTable(table: { headers: string[]; rows: string[][] }): string {
  return `
        <table class="tbl">
          <thead>
            <tr>${table.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${table.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>`;
}

function renderSection(section: ReportSection): string {
  const parts: string[] = [];
  if (section.heading) parts.push(`<h3 class="sec-title">${esc(section.heading)}</h3>`);
  if (section.metrics && section.metrics.length) parts.push(renderMetrics(section.metrics));
  if (section.table) parts.push(renderTable(section.table));
  if (section.text) parts.push(`<p class="sec-text">${esc(section.text)}</p>`);
  if (!parts.length) return "";
  return `
      <section class="sec">
        ${parts.join("")}
      </section>`;
}

export function buildReportHtml(opts: ReportDocumentOptions): string {
  const company = opts.company;
  const brand = company?.name || "IBPlus+";
  const periodLabel = opts.period ? `<p class="period">${esc(opts.period)}</p>` : "";
  const sectionHtml = opts.sections.map(renderSection).join("");
  const footnote = opts.footnote || "Documento gerado na plataforma IBPlus+";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(opts.title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
  html, body { background: #fff; }
  body {
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1f2937; line-height: 1.5; font-size: 12.5px;
    padding: 16mm 18mm;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet { max-width: 860px; margin: 0 auto; }
  .letterhead { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
  .brand { min-width: 0; }
  .doc-logo { display: block; max-height: 40px; width: auto; max-width: 160px; object-fit: contain; margin-bottom: 6px; }
  .company-name { font-size: 19px; font-weight: 800; color: #0f172a; letter-spacing: -.2px; }
  .company-meta { font-size: 11px; color: #64748b; margin-top: 3px; }
  .company-address { font-size: 11px; color: #64748b; margin-top: 2px; }
  .contact { text-align: right; font-size: 11px; color: #475569; }
  .contact .c-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; }
  .rule { border: none; border-top: 2px solid #0f172a; margin: 16px 0 24px; }
  .doctitle { text-align: center; margin-bottom: 26px; }
  .doctitle h1 { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 1px; text-transform: uppercase; }
  .doctitle .sub { color: #475569; font-size: 13px; margin-top: 4px; }
  .doctitle .period { display: inline-block; margin-top: 10px; font-size: 11px; font-weight: 700; letter-spacing: .6px;
    color: #1d4ed8; border: 1px solid #bfdbfe; background: #eff6ff; padding: 4px 12px; border-radius: 999px; }
  .sec { margin-bottom: 24px; page-break-inside: avoid; }
  .sec-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.1px;
    color: #64748b; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 12px; }
  .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }
  .metric { background: #f8fafc; border-radius: 6px; padding: 11px 13px; }
  .metric-label { font-size: 9.5px; text-transform: uppercase; letter-spacing: .8px; color: #94a3b8; font-weight: 700; margin-bottom: 4px; }
  .metric-value { font-size: 16px; font-weight: 800; color: #0f172a; }
  .metric-value.tone-green { color: #047857; }
  .metric-value.tone-red { color: #b91c1c; }
  table.tbl { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.tbl thead th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: .7px;
    color: #64748b; font-weight: 700; padding: 7px 9px; border-bottom: 1px solid #cbd5e1; background: #f8fafc; }
  table.tbl tbody td { padding: 7px 9px; border-bottom: 1px solid #eef1f6; font-size: 12px; color: #374151; }
  table.tbl tr:nth-child(even) td { background: #fafafa; }
  .sec-text { font-size: 12.5px; color: #374151; line-height: 1.7; text-align: justify; }
  .sign { margin-top: 34px; display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; }
  .sign .sign-block { flex: 1; }
  .sign .sign-line { color: #0f172a; font-size: 12px; margin-bottom: 6px; }
  .sign .sign-space { height: 44px; border-bottom: 1px solid #0f172a; }
  .sign .sign-title { font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 4px; }
  .sign .sign-sub { font-size: 10.5px; color: #64748b; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex;
    justify-content: space-between; font-size: 10px; color: #94a3b8; }
  @media print {
    body { padding: 16mm 18mm; }
    .sec, table.tbl tr { page-break-inside: avoid; }
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
          ${companyMeta(company) ? `<div class="company-meta">${companyMeta(company)}</div>` : ""}
          ${company?.address ? `<div class="company-address">${esc(company.address)}</div>` : ""}
        </div>
      </div>
      <div class="contact">
        <div class="c-label">Contactos</div>
        ${company?.phone ? `<div>${esc(company.phone)}</div>` : ""}
        ${company?.email ? `<div>${esc(company.email)}</div>` : ""}
        ${company?.nif ? `<div><b>NIF:</b> ${esc(company.nif)}</div>` : ""}
      </div>
    </div>
    <hr class="rule" />
    <div class="doctitle">
      <h1>${esc(opts.title)}</h1>
      ${opts.subtitle ? `<p class="sub">${esc(opts.subtitle)}</p>` : ""}
      ${periodLabel}
    </div>
    ${sectionHtml}
    <div class="sign">
      <div class="sign-block">
        <div class="sign-line"><b>Data:</b> ${fmtLongDate(new Date())}</div>
      </div>
      <div class="sign-block" style="text-align:right;">
        <div class="sign-space"></div>
        <div class="sign-title">Assinatura</div>
        <div class="sign-sub">${esc(brand)} — Direcção Geral</div>
      </div>
    </div>
    <div class="footer">
      <span>${esc(footnote)}</span>
      <span>${esc(opts.title)}</span>
    </div>
  </div>
</body>
</html>`;
}