import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const contactSubject = subject || "Nova mensagem de contacto";
    const html = `
      <h2 style="margin-top:0;color:#1e3a5f">Nova mensagem de contacto</h2>
      <p><strong>Nome:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${subject ? `<p><strong>Assunto:</strong> ${subject}</p>` : ""}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
      <p style="white-space:pre-wrap">${message}</p>
    `;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      await sendEmail(adminEmail, `[IBPlus+] ${contactSubject}`, html);
    }

    console.log("[Contact]", { name, email, subject: contactSubject, timestamp: new Date().toISOString() });

    return NextResponse.json({ success: true, message: "Mensagem enviada com sucesso!" });
  } catch {
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
