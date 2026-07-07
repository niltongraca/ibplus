"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Save } from "lucide-react";

export default function MovimentoStockPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [productId, setProductId] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!productId || !quantidade) {
      setError("Preencha todos os campos.");
      return;
    }

    const qty = parseInt(quantidade);
    if (isNaN(qty) || qty <= 0) {
      setError("Quantidade inválida.");
      return;
    }

    try {
      const r = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockAdjust: tipo === "entrada" ? qty : -qty,
          motivo,
        }),
      });

      if (!r.ok) throw new Error("Erro ao registar movimento");
      router.push("/gestao/stock");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-ib-accent" />
        <h1 className="text-xl font-bold text-ib-primary">Movimento de Stock</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Produto</label>
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
            <option value="">Seleccionar produto</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Tipo</label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setTipo("entrada")} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${tipo === "entrada" ? "bg-green-50 text-green-700 border-green-300" : "bg-white text-gray-600 border-gray-200"}`}>Entrada</button>
            <button type="button" onClick={() => setTipo("saida")} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${tipo === "saida" ? "bg-red-50 text-red-700 border-red-300" : "bg-white text-gray-600 border-gray-200"}`}>Saída</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Quantidade</label>
          <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ib-primary mb-1">Motivo</label>
          <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex: Ajuste de inventário" className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
        </div>

        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-ib-accent text-white py-2.5 rounded-lg font-medium text-sm hover:bg-ib-accent/90 transition-colors">
          <Save className="w-4 h-4" /> Registar Movimento
        </button>
      </form>
    </div>
  );
}
