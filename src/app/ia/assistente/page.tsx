"use client";

import { Bot, Send } from "lucide-react";

const messages = [
  { from: "ia", text: "Olá! Sou o IBPlus IA. Como posso ajudar hoje?" },
  { from: "user", text: "Qual foi o produto mais vendido este mês?" },
  { from: "ia", text: "O produto mais vendido foi o **Arroz 25kg** com 340 unidades. Quer ver um relatório detalhado?" },
  { from: "user", text: "Sim, gostava de ver as vendas por categoria." },
  { from: "ia", text: "Aqui está um resumo:\n\n- **Alimentação**: 1.250.000 Kz\n- **Bebidas**: 780.000 Kz\n- **Higiene**: 420.000 Kz\n\nDeseja exportar estes dados?" },
];

export default function AssistentePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ib-primary">Assistente IA</h1>
        <p className="text-ib-muted text-sm">Converse com o assistente inteligente IBPlus</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.from === "user" ? "justify-end" : ""}`}>
              {msg.from === "ia" && (
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-ib-accent" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-line ${
                  msg.from === "ia"
                    ? "bg-gray-50 text-ib-primary border border-gray-100"
                    : "bg-ib-accent text-white"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              disabled
              placeholder="Escreva a sua mensagem..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <button disabled className="p-2.5 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-ib-muted mt-2 text-center">Funcionalidade disponível em breve</p>
        </div>
      </div>
    </div>
  );
}
