"use client";

import { useState, useEffect, useCallback } from "react";
import { KeyRound, RefreshCcw, Copy, Check, ArrowLeftRight } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";

export function AcquisitionSection() {
  const { toast } = useToast();
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/company/acquisition");
      if (res.ok) {
        const d = await res.json();
        setCode(d.company?.acquisitionCode || null);
      }
    } catch {
      // ignora
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/company/acquisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setCode(d.code);
      toast("Código de aquisição gerado.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao gerar o código.");
    } finally {
      setGenerating(false);
    }
  }

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = redeemCode.trim();
    if (!value) {
      setError("Indique o código de aquisição.");
      return;
    }
    setRedeeming(true);
    try {
      const res = await fetch("/api/company/acquisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "redeem", code: value }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setRedeemCode("");
      toast(`Empresa "${d.company?.name || ""}" adquirida com sucesso!`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao processar a aquisição.");
    } finally {
      setRedeeming(false);
    }
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Não foi possível copiar.", "error");
    }
  }

  return (
    <div className="card mb-6">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-ib-accent" />
        <h2 className="font-semibold text-ib-primary">Aquisição de empresas</h2>
      </div>
      <div className="p-4 space-y-5">
        <div>
          <p className="text-sm text-ib-primary font-medium mb-1">Código de aquisição da minha empresa</p>
          <p className="text-xs text-ib-muted mb-3">
            Partilhe este código com outro utilizador para ceder a sua empresa: todos os dados (funcionários, vendas, faturas, produtos...) passam para o novo dono.
          </p>
          {loading ? (
            <p className="text-sm text-ib-muted">A carregar...</p>
          ) : code ? (
            <div className="flex items-center gap-2">
              <code className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 font-mono text-base font-bold tracking-widest text-ib-primary">{code}</code>
              <button onClick={copyCode} className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50" title="Copiar">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={generate} disabled={generating} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-ib-muted hover:bg-gray-50 disabled:opacity-50">
                <RefreshCcw className="w-4 h-4" /> {generating ? "A gerar..." : "Gerar novo"}
              </button>
            </div>
          ) : (
            <button onClick={generate} disabled={generating} className="btn btn-primary disabled:opacity-50">
              <KeyRound className="w-4 h-4" /> {generating ? "A gerar..." : "Gerar código de aquisição"}
            </button>
          )}
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm text-ib-primary font-medium mb-1 flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4 text-ib-accent" /> Adquirir outra empresa
          </p>
          <p className="text-xs text-ib-muted mb-3">
            Entre com o código recebido pelo dono de outra empresa para se tornar no novo dono e receber todos os seus dados.
            A sua empresa atual deixa de o ter como dono.
          </p>
          <form onSubmit={redeem} className="flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              type="text"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="Código de aquisição"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
            />
            <button type="submit" disabled={redeeming} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {redeeming ? "A adquirir..." : "Adquirir empresa"}
            </button>
          </form>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}