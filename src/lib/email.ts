import nodemailer from "nodemailer";

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
       <p><strong>${inviterName}</strong> convidou-o para se juntar à equipa no IBPlus+.</p>
       <p>Clique no botão abaixo para aceitar o convite e criar a sua conta. Este link expira em <strong>7 dias</strong>.</p>
       <p style="text-align:center"><a href="${url}" class="btn">Aceitar Convite</a></p>`,
      "Convite para IBPlus+"
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
