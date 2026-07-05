import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    // Store contact submission in DB or forward to email service
    console.log("Contact form submission:", { name, email, message });

    return NextResponse.json({ success: true, message: "Mensagem enviada com sucesso!" });
  } catch {
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
