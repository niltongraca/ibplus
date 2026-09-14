"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Save, Building2, ClipboardList, ListOrdered } from "lucide-react";
import Link from "next/link";
import { formatCurrency, SUPPORTED_CURRENCIES } from "@/lib/utils";
import { CatalogPicker } from "@/components/finance/CatalogPicker";
import { apiFetch } from "@/lib/api";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  kind?: "product" | "service";
}

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  nif?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Company {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  nif?: string | null;
  address?: string | null;
}

interface EditableDocument {
  customer: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerNif: string | null;
  notes: string | null;
  discountType: string | null;
  discountValue: number;
  installments: number;
  currency: string | null;
  paymentMethod: string | null;
  bankDetails: string | null;
  dueDate: string | null;
  validUntil: string | null;
  status: string | null;
  paidAmount: number;
  items: LineItem[];
}

const PAYMENT_METHODS = ["dinheiro", "transferência", "depósito", "cartão", "multicaixa", "payback"] as const;

const sections = [
  { num: 1, title: "Informações comerciais e do cliente", icon: Building2, desc: "Dados da empresa e do cliente" },
  { num: 2, title: "Itens", icon: ClipboardList, desc: "Produtos e serviços, desconto, prestações e total" },
  { num: 3, title: "Outros", icon: ListOrdered, desc: "Moeda, forma de pagamento e coordenadas bancárias" },
];

export default function DocumentForm({ mode, id }: { mode: "invoice" | "quote"; id?: string }) {
  const isInvoice = mode === "invoice";
  const isEdit = Boolean(id);
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(isEdit);

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nif, setNif] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState(0);
  const [installments, setInstallments] = useState(1);
  const [currency, setCurrency] = useState("AOA");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankDetails, setBankDetails] = useState("");

  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: 0, kind: "product" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingStatus, setExistingStatus] = useState("");
  const [existingPaidAmount, setExistingPaidAmount] = useState(0);

  const backUrl = isInvoice ? "/finance/faturacao" : "/finance/orcamentos";

  useEffect(() => {
    Promise.all([
      apiFetch<{ company?: Company }>("/api/company"),
      apiFetch<{ customers?: Customer[] }>("/api/customers?all=true"),
      apiFetch<{ products?: Product[] }>("/api/products?all=true"),
      apiFetch<{ services?: Service[] }>("/api/services?all=true"),
    ])
      .then(([co, c, p, s]) => {
        setCompany(co.company || null);
        setCustomers(c.customers || []);
        setProducts(p.products || []);
        setServices(s.services || []);
      })
      .catch((err) => console.error("Erro ao carregar dados:", err));
  }, []);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ invoice?: EditableDocument; quote?: EditableDocument }>(isInvoice ? `/api/invoices/${id}` : `/api/quotes/${id}`)
      .then((d) => {
        const doc = isInvoice ? d.invoice : d.quote;
        if (!doc) throw new Error("Documento não encontrado.");
        setCustomer(doc.customer || "");
        setPhone(doc.customerPhone || "");
        setEmail(doc.customerEmail || "");
        setNif(doc.customerNif || "");
        setNotes(doc.notes || "");
        setDiscountType(doc.discountType === "percentage" ? "percentage" : "fixed");
        setDiscountValue(doc.discountValue || 0);
        setInstallments(doc.installments || 1);
        setCurrency(doc.currency || "AOA");
        setPaymentMethod(doc.paymentMethod || "");
        setBankDetails(doc.bankDetails || "");
        const raw = isInvoice ? doc.dueDate : doc.validUntil;
        setDueDate(raw ? new Date(raw).toISOString().slice(0, 10) : "");
        setItems(doc.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })));
        if (isInvoice) {
          setExistingStatus(doc.status || "pending");
          setExistingPaidAmount(doc.paidAmount || 0);
        }
      })
      .catch(() => router.push(backUrl))
      .finally(() => setLoading(false));
  }, [id, isInvoice, router, backUrl]);

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0, kind: "product" }]);
  const removeItem = (i: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== i));
  };
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    setItems(updated);
  };

  const addFromCatalog = (entry: { name: string; price: number; kind?: "product" | "service" }) => {
    setItems([...items, { description: entry.name, quantity: 1, unitPrice: entry.price, kind: entry.kind || "product" }]);
  };

  const handleCustomerChange = (value: string) => {
    setCustomer(value);
    const match = customers.find((c) => c.name.toLowerCase() === value.trim().toLowerCase());
    if (match) {
      setPhone(match.phone || "");
      setEmail(match.email || "");
      setNif(match.nif || "");
    }
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const productNames = new Set(products.map((p) => p.name.trim().toLowerCase()));
  const serviceNames = new Set(services.map((s) => s.name.trim().toLowerCase()));
  const discount = discountType === "percentage" ? (subtotal * Math.min(100, discountValue)) / 100 : Math.min(subtotal, discountValue);
  const total = Math.max(0, subtotal - discount);
  const installmentValue = installments > 0 ? total / installments : total;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.description.trim())) {
      setError("Preencha todos os campos dos itens.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const payload = {
        customer,
        customerPhone: phone || null,
        customerEmail: email || null,
        customerNif: nif || null,
        dueDate: dueDate || null,
        notes,
        items,
        subtotal,
        discountType,
        discountValue,
        discount,
        installments,
        currency,
        paymentMethod,
        bankDetails,
        total,
        ...(isInvoice && isEdit ? { status: existingStatus, paidAmount: existingPaidAmount } : {}),
      };
      await apiFetch(isInvoice ? `/api/invoices${id ? `/${id}` : ""}` : `/api/quotes${id ? `/${id}` : ""}`, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      router.push(isEdit ? (isInvoice ? `/finance/faturacao/${id}` : `/finance/orcamentos/${id}`) : backUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao guardar documento.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40";

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-6">
          <Link href={backUrl} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-ib-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-ib-primary">{isInvoice ? "Editar Fatura" : "Editar Orçamento"}</h1>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-ib-muted">A carregar...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={backUrl} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-ib-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">
            {isEdit ? (isInvoice ? "Editar Fatura" : "Editar Orçamento") : isInvoice ? "Nova Fatura" : "Novo Orçamento"}
          </h1>
          <p className="text-ib-muted text-sm">
            {isEdit ? "Atualize os dados do documento" : isInvoice ? "Criar fatura para enviar ao cliente" : "Criar orçamento para enviar ao cliente"}
          </p>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Secção 1 - Informações comerciais e do cliente */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <header className="flex items-center gap-3 px-6 pt-5 pb-2">
            <span className="w-7 h-7 rounded-full bg-ib-accent text-white text-sm font-bold flex items-center justify-center">1</span>
            <div>
              <h2 className="font-semibold text-ib-primary">Informações comerciais e do cliente</h2>
              <p className="text-xs text-ib-muted">Dados da empresa e de quem vai receber o documento</p>
            </div>
          </header>
          <div className="p-6 space-y-5">
            <div className="rounded-lg bg-blue-50/60 border border-blue-100 p-4">
              <p className="text-xs uppercase tracking-wider text-ib-muted font-medium mb-2">Empresa registada</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <p className="font-semibold text-ib-primary">{company?.name || "—"}</p>
                <p className="text-ib-muted">{company?.nif ? `NIF: ${company.nif}` : "NIF: —"}</p>
                <p className="text-ib-muted">{company?.phone || "—"}</p>
                <p className="text-ib-muted">{company?.email || "—"}</p>
              </div>
              {!company?.name && <p className="text-xs text-ib-muted mt-2">Complete os dados da empresa nas definições da empresa.</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">
                  Nome do cliente <span className="text-red-500">*</span>
                </label>
                <input type="text" value={customer} onChange={(e) => handleCustomerChange(e.target.value)} list="clientes-list" placeholder="Selecione ou digite o nome" className={inputCls} required />
                <datalist id="clientes-list">
                  {customers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Telefone (opcional)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+244 ..." className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">Email (opcional)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@email.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">NIF (opcional)</label>
                <input type="text" value={nif} onChange={(e) => setNif(e.target.value)} placeholder="Número de identificação fiscal" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ib-primary mb-1">{isInvoice ? "Vencimento" : "Validade"}</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        </section>

        {/* Secção 2 - Itens + subtotal/desconto/remessa/total */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <header className="flex items-center gap-3 px-6 pt-5 pb-2">
            <span className="w-7 h-7 rounded-full bg-ib-accent text-white text-sm font-bold flex items-center justify-center">2</span>
            <div>
              <h2 className="font-semibold text-ib-primary">Itens</h2>
              <p className="text-xs text-ib-muted">Produtos e serviços, desconto, prestações e total</p>
            </div>
          </header>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ib-primary">Produtos / Serviços</h3>
              <div className="flex items-center gap-3">
                <CatalogPicker products={products} services={services} onSelect={addFromCatalog} />
                <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm text-ib-accent hover:text-blue-700 font-medium">
                  <Plus className="w-4 h-4" /> Adicionar Item
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-100 text-ib-muted text-xs uppercase tracking-wider">
                    <th className="text-left p-3 font-medium w-2/5">Descrição</th>
                    <th className="text-center p-3 font-medium w-28">Tipo</th>
                    <th className="text-center p-3 font-medium w-16">Qtd</th>
                    <th className="text-right p-3 font-medium w-32">Preço Unit.</th>
                    <th className="text-right p-3 font-medium w-32">Total</th>
                    <th className="text-center p-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="p-1">
                        <input type="text" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Descrição" className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" required />
                      </td>
                      <td className="p-1">
                        {(() => {
                          const key = item.description.trim().toLowerCase();
                          const inProducts = key ? productNames.has(key) : false;
                          const inServices = key ? serviceNames.has(key) : false;
                          if (inProducts) {
                            return <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">Produto</span>;
                          }
                          if (inServices) {
                            return <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">Serviço</span>;
                          }
                          return (
                            <select
                              value={item.kind || "product"}
                              onChange={(e) => updateItem(i, "kind", e.target.value as "product" | "service")}
                              className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                              title="Produto ou serviço (não encontrado no catálogo)"
                            >
                              <option value="product">Produto</option>
                              <option value="service">Serviço</option>
                            </select>
                          );
                        })()}
                      </td>
                      <td className="p-1">
                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)} className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-ib-accent/40" required />
                      </td>
                      <td className="p-1">
                        <input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-ib-accent/40" required />
                      </td>
                      <td className="p-1 text-right font-semibold text-ib-primary">{formatCurrency(item.quantity * item.unitPrice, currency)}</td>
                      <td className="p-1 text-center">
                        <button type="button" onClick={() => removeItem(i)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-6 mt-4 pt-4 border-t border-gray-100">
              <div className="sm:w-72 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ib-muted">Subtotal</span>
                  <span className="font-semibold text-ib-primary">{formatCurrency(subtotal, currency)}</span>
                </div>

                <div className="flex gap-2">
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")} className="px-2 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40">
                    <option value="fixed">Desconto fixo</option>
                    <option value="percentage">Desconto %</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder={discountType === "percentage" ? "%" : currency}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-ib-muted whitespace-nowrap">Remessa (prestações)</label>
                  <input
                    type="number"
                    min={1}
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                    className="w-20 px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-ib-accent/40"
                  />
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between items-end">
                  <span className="text-sm text-ib-muted">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-ib-primary">{formatCurrency(total, currency)}</p>
                    {installments > 1 && (
                      <p className="text-xs text-ib-muted">{installments} × {formatCurrency(installmentValue, currency)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Secção 3 - Outros */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <header className="flex items-center gap-3 px-6 pt-5 pb-2">
            <span className="w-7 h-7 rounded-full bg-ib-accent text-white text-sm font-bold flex items-center justify-center">3</span>
            <div>
              <h2 className="font-semibold text-ib-primary">Outros</h2>
              <p className="text-xs text-ib-muted">Moeda, forma de pagamento e coordenadas bancárias</p>
            </div>
          </header>
          <div className="p-6 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Tipo de moeda</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls}>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ib-primary mb-1">Forma de pagamento</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                <option value="">Selecione a forma de pagamento</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ib-primary mb-1">Coordenadas bancárias</label>
              <textarea value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} rows={2} placeholder="Banco, IBAN, titular da conta..." className={`${inputCls} resize-none`} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ib-primary mb-1">Observações</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Condições de pagamento, prazo, etc." className={`${inputCls} resize-none`} />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link href={backUrl} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-ib-muted hover:bg-gray-50 transition-colors">Cancelar</Link>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-ib-accent hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "A guardar..." : isEdit ? "Guardar Alterações" : isInvoice ? "Salvar Fatura" : "Salvar Orçamento"}
          </button>
        </div>
      </form>
    </div>
  );
}