import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getClientIp, checkRateLimit, rateLimitResponse } from "@/lib/rateLimit";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const check = checkRateLimit(`contact:${ip}`, "medium");
    if (!check.allowed) return rateLimitResponse(check.retryAfter!);

    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const safeName = escapeHtml(String(name)).slice(0, 100);
    const safeEmail = escapeHtml(String(email)).slice(0, 150);
    const safeSubject = escapeHtml(String(subject || "")).replace(/[\r\n]/g, " ").slice(0, 150);
    const safeMessage = escapeHtml(String(message)).slice(0, 5000);

    const contactSubject = safeSubject || "Nova mensagem de contacto";
    const html = `
      <h2 style="margin-top:0;color:#1e3a5f">Nova mensagem de contacto</h2>
      <p><strong>Nome:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      ${safeSubject ? `<p><strong>Assunto:</strong> ${safeSubject}</p>` : ""}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
      <p style="white-space:pre-wrap">${safeMessage}</p>
    `;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      await sendEmail(adminEmail, `[IBPlus+] ${contactSubject}`, html);
    }

    console.log("[Contact]", { name: safeName, email: safeEmail, subject: contactSubject, timestamp: new Date().toISOString() });

    return NextResponse.json({ success: true, message: "Mensagem enviada com sucesso!" });
  } catch {
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
