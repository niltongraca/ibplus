import nodemailer from "nodemailer";
import { PLANS, type PlanId } from "@/config/plans";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getTransporter() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.SMTP_FROM || "noreply@ibplus.co.ao";

function baseHtml(body: string, title: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  .container{max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:22px;font-weight:700}
  .body{padding:32px;color:#334155;font-size:15px;line-height:1.6}
  .btn{display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin:16px 0}
  .btn:hover{background:#1d4ed8}
  .footer{text-align:center;padding:24px 32px;color:#94a3b8;font-size:13px;border-top:1px solid #e2e8f0}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>IBPlus+</h1></div>
  <div class="body">${body}</div>
  <div class="footer">IBPlus+ — Plataforma de Gestão Empresarial</div>
</div>
</body>
</html>`;
}

export function forgotPasswordEmail(token: string): { subject: string; html: string } {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/recuperar-senha/${token}`;
  return {
    subject: "Recuperação de Senha — IBPlus+",
    html: baseHtml(
      `<h2 style="margin-top:0;color:#1e3a5f">Recuperar a sua senha</h2>
       <p>Recebemos um pedido de recuperação de senha para a sua conta.</p>
       <p>Clique no botão abaixo para definir uma nova senha. Este link expira em <strong>1 hora</strong>.</p>
       <p style="text-align:center"><a href="${url}" class="btn">Redefinir Senha</a></p>
       <p style="color:#94a3b8;font-size:13px">Se não pediu esta alteração, ignore este email.</p>`,
      "Recuperação de Senha"
    ),
  };
}

export function inviteEmail(email: string, token: string, inviterName: string): { subject: string; html: string } {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cadastro?invite=${token}`;
  return {
    subject: "Convite para IBPlus+",
    html: baseHtml(
      `<h2 style="margin-top:0;color:#1e3a5f">Você foi convidado!</h2>
       <p><strong>${esc(inviterName)}</strong> convidou-o para se juntar à equipa no IBPlus+.</p>
       <p>Clique no botão abaixo para aceitar o convite e criar a sua conta. Este link expira em <strong>7 dias</strong>.</p>
       <p style="text-align:center"><a href="${url}" class="btn">Aceitar Convite</a></p>`,
      "Convite para IBPlus+"
    ),
  };
}

const ACCOUNT_LABELS: Record<string, string> = {
  EMPREENDEDOR: "Empreendedor Individual",
  EMPRESA: "Empresa",
  ONG: "Organização Não-Governamental",
  ASSOCIACAO: "Associação",
  EDUCACAO: "Instituição de Ensino",
  COOPERATIVA: "Cooperativa",
};

export function welcomeEmail(name: string, accountType: string): { subject: string; html: string } {
  const tipo = ACCOUNT_LABELS[accountType] || accountType;
  return {
    subject: "Bem-vindo ao IBPlus+!",
    html: baseHtml(
      `<h2 style="margin-top:0;color:#1e3a5f">Olá ${esc(name)}, seja bem-vindo! 🎉</h2>
       <p>A sua conta <strong>${esc(tipo)}</strong> foi criada com sucesso no IBPlus+.</p>
       <p>O IBPlus+ é a plataforma completa de gestão empresarial que oferece:</p>
       <ul>
         <li>📊 Dashboard inteligente com gráficos</li>
         <li>📦 Gestão de produtos e serviços</li>
         <li>💰 Facturação e orçamentos profissionais</li>
         <li>🤝 CRM com funil de vendas</li>
         <li>🧠 Assistente IA para decisões</li>
         <li>📈 Relatórios e análises</li>
       </ul>
       <p style="text-align:center"><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/gestao/dashboard" class="btn">Ir para o Painel</a></p>
       <p style="color:#94a3b8;font-size:13px">Se tiver dúvidas, responda a este email ou consulte a nossa central de ajuda.</p>`,
      "Bem-vindo ao IBPlus+"
    ),
  };
}

function planName(plan: string): string {
  return PLANS[plan as PlanId]?.name ?? plan;
}

export function upgradeApprovedEmail(name: string, plan: string): { subject: string; html: string } {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/gestao/dashboard`;
  return {
    subject: "Upgrade aprovado — IBPlus+",
    html: baseHtml(
      `<h2 style="margin-top:0;color:#1e3a5f">Olá ${esc(name)}, o seu upgrade foi aprovado! 🎉</h2>
       <p>O plano da sua conta passou para <strong>${esc(planName(plan))}</strong> e já pode utilizar todos os recursos incluídos.</p>
       <p style="text-align:center"><a href="${url}" class="btn">Ir para o Painel</a></p>
       <p style="color:#94a3b8;font-size:13px">Se a alteração não aparecer de imediato, recarregue a página ou inicie sessão novamente.</p>`,
      "Upgrade aprovado"
    ),
  };
}

export function upgradeRejectedEmail(name: string, plan: string): { subject: string; html: string } {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/upgrade`;
  return {
    subject: "Sobre o seu pedido de upgrade — IBPlus+",
    html: baseHtml(
      `<h2 style="margin-top:0;color:#1e3a5f">Olá ${esc(name)}, sobre o seu pedido de upgrade</h2>
       <p>Não foi possível aprovar, neste momento, a passagem para o plano <strong>${esc(planName(plan))}</strong>.</p>
       <p>Se tiver dúvidas ou quiser mais informações, responda a este email ou consulte novamente os planos disponíveis.</p>
       <p style="text-align:center"><a href="${url}" class="btn">Ver Planos</a></p>`,
      "Pedido de upgrade"
    ),
  };
}

export interface EventRegistrationMailData {
  name: string;
  eventTitle: string;
  eventDate: string;
  reference: string;
  amount: string;
  tickets: string;
}

function eventMailBody(data: EventRegistrationMailData, message: string): string {
  return `
    <h2 style="margin-top:0;color:#1e3a5f">Olá ${esc(data.name)},</h2>
    <p>${message} do evento <strong>${esc(data.eventTitle)}</strong> (${esc(data.eventDate)}).</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:6px 0;color:#64748b">Referência</td><td style="padding:6px 0"><strong>${esc(data.reference)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Bilhetes</td><td style="padding:6px 0">${esc(data.tickets)}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Total</td><td style="padding:6px 0"><strong>${esc(data.amount)}</strong></td></tr>
    </table>`;
}

export function eventRegistrationSubmittedEmail(
  data: EventRegistrationMailData
): { subject: string; html: string } {
  return {
    subject: `Inscrição recebida — ${data.eventTitle}`,
    html: baseHtml(
      eventMailBody(
        data,
        "Recebemos a sua inscrição e o comprovativo de pagamento. A sua inscrição ficará pendente até validação pela organização."
      ) +
        `<p style="color:#64748b;font-size:13px">Não responda a este email.</p>`,
      "Inscrição recebida"
    ),
  };
}

export function eventRegistrationApprovedEmail(
  data: EventRegistrationMailData
): { subject: string; html: string } {
  return {
    subject: `Inscrição confirmada — ${data.eventTitle}`,
    html: baseHtml(
      eventMailBody(data, "A sua inscrição foi confirmada e os seus bilhetes emitidos. Apresente o código no dia do evento.") +
        `<p style="text-align:center"><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/eventos" class="btn">Ver detalhes</a></p>`,
      "Inscrição confirmada"
    ),
  };
}

export function eventRegistrationRejectedEmail(
  data: EventRegistrationMailData,
  reason?: string | null
): { subject: string; html: string } {
  return {
    subject: `Sobre a sua inscrição — ${data.eventTitle}`,
    html: baseHtml(
      eventMailBody(data, "Não foi possível confirmar a sua inscrição.") +
        (reason ? `<p><strong>Motivo:</strong> ${esc(reason)}</p>` : ""),
      "Inscrição não confirmada"
    ),
  };
}

export function eventRegistrationOrganizerNotice(
  data: EventRegistrationMailData,
  adminUrl: string
): { subject: string; html: string } {
  return {
    subject: `Nova inscrição pendente — ${data.eventTitle}`,
    html: baseHtml(
      eventMailBody(data, "Recebeu uma nova inscrição pendente de validação.") +
        `<p style="text-align:center"><a href="${esc(adminUrl)}" class="btn">Validar inscrição</a></p>`,
      "Nova inscrição"
    ),
  };
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Email] SMTP não configurado. Email não enviado para:", to);
    return { success: false, error: "SMTP não configurado" };
  }

  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    return { success: true };
  } catch (err: any) {
    console.error("[Email] Erro ao enviar email:", err?.message);
    return { success: false, error: err?.message };
  }
}
