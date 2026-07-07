"use client";

import { useState, useEffect } from "react";
import { Bot, Send, TrendingUp, ShoppingCart, Package, Users as UsersIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  totalRevenue: number;
  todaySales: number;
  totalCustomers: number;
  totalProducts: number;
  totalSales: number;
}

const WELCOME = "Olá! Sou o IBPlus IA. Pergunte-me sobre vendas, produtos, clientes ou peça recomendações.";

export default function AssistentePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([
    { from: "ia", text: WELCOME },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setMessages([
          {
            from: "ia",
            text: `Olá! 👋 Aqui está o resumo do seu negócio:\n\n📊 **Receita Total:** ${formatCurrency(d.totalRevenue || 0)}\n🛒 **Vendas Hoje:** ${formatCurrency(d.todaySales || 0)}\n👥 **Clientes:** ${d.totalCustomers || 0}\n📦 **Produtos:** ${d.totalProducts || 0}\n\nPergunte-me sobre vendas, produtos, clientes ou peça recomendações!`,
          },
        ]);
      })
      .catch(() => {});
  }, []);

  function handleSend() {
    if (!input.trim() || !data) return;
    const question = input.trim();
    setMessages((prev) => [...prev, { from: "user", text: question }]);
    setInput("");

    setTimeout(() => {
      const q = question.toLowerCase();
      let answer = "";

      if (q.includes("venda") || q.includes("receita") || q.includes("facturação") || q.includes("faturação")) {
        answer = `📊 **Análise de Vendas**\n\n• Receita Total: ${formatCurrency(data.totalRevenue)}\n• Vendas Hoje: ${formatCurrency(data.todaySales)}\n• Total de Vendas: ${data.totalSales}\n\nA receita total é de ${formatCurrency(data.totalRevenue)}. ${data.todaySales > 0 ? `Hoje já foram registados ${formatCurrency(data.todaySales)} em vendas.` : "Ainda não há vendas registadas hoje."}`;
      } else if (q.includes("cliente") || q.includes("pessoa") || q.includes("quem")) {
        answer = `👥 **Base de Clientes**\n\nTotal de clientes registados: **${data.totalCustomers}**\n\nQuer ver os detalhes? Aceda à secção de Clientes no menu CRM.`;
      } else if (q.includes("produto") || q.includes("stock") || q.includes("inventário") || q.includes("inventario")) {
        answer = `📦 **Produtos e Stock**\n\nTotal de produtos: **${data.totalProducts}**\n\nAceda à secção Gestão > Produtos para gerir o seu catálogo e controlar o stock.`;
      } else if (q.includes("recomenda") || q.includes("dica") || q.includes("sugestão") || q.includes("sugestao")) {
        const tips: string[] = [];
        if (data.totalCustomers > 0) tips.push("📈 Invista em campanhas de marketing para aumentar as vendas.");
        if (data.totalProducts > 0) tips.push("📊 Reveja os preços dos produtos com menor margem de lucro.");
        tips.push("🤝 Mantenha um bom relacionamento com os clientes para garantir fidelização.");
        tips.push("📱 Utilize o WhatsApp Business para comunicar com os clientes.");
        answer = `💡 **Recomendações**\n\n${tips.map((t) => `• ${t}`).join("\n")}`;
      } else if (q.includes("ola") || q.includes("olá") || q.includes("bom dia") || q.includes("boa tarde")) {
        answer = `Olá! 👋 Como posso ajudar o seu negócio hoje? Pergunte sobre vendas, clientes, produtos ou peça recomendações!`;
      } else {
        answer = `Desculpe, não entendi a sua pergunta. 🤔\n\nPergunte sobre:\n• **Vendas** — receita, facturação\n• **Clientes** — base de clientes\n• **Produtos** — stock, catálogo\n• **Recomendações** — dicas para o negócio`;
      }

      setMessages((prev) => [...prev, { from: "ia", text: answer }]);
    }, 600);
  }

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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Pergunte sobre vendas, clientes, produtos..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !data}
              className="p-2.5 rounded-lg bg-ib-accent text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-ib-muted mt-2 text-center">O assistente responde com base nos dados reais do seu negócio</p>
        </div>
      </div>
    </div>
  );
}
