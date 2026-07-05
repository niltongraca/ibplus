"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingBag, ShoppingCart, Plus, Minus, Trash2, CreditCard, X, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Category { name: string; }

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  unit: string;
  category: Category | null;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export default function LojaOnlinePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products))
      .catch((err) => console.error("Erro ao carregar loja:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.stock) return item;
        return { ...item, quantity: newQty };
      }).filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.productId !== productId));
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  async function handleCheckout() {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || undefined,
          items: cart.map((item) => ({ productId: item.productId, price: item.price, quantity: item.quantity })),
          paymentMethod,
        }),
      });
      if (res.ok) {
        setCart([]);
        setCheckoutDone(true);
        setTimeout(() => { setShowCheckout(false); setCheckoutDone(false); setShowCart(false); }, 2000);
      }
    } catch {}
    setCheckingOut(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ib-primary">Loja Online</h1>
          <p className="text-ib-muted text-sm">Catálogo de produtos disponíveis</p>
        </div>
        <button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 px-4 py-2.5 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-ib-accent/90 transition-colors">
          <ShoppingCart className="w-4 h-4" /> Carrinho
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{cartCount}</span>
          )}
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Pesquisar produtos..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-ib-muted text-sm">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-ib-muted text-sm">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => {
            const inCart = cart.find((item) => item.productId === product.id);
            return (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col">
                <div className="w-full h-32 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="font-semibold text-ib-primary text-sm mb-1">{product.name}</h3>
                {product.category && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium inline-block mb-2 self-start">
                    {product.category.name}
                  </span>
                )}
                <p className="text-xl font-bold text-ib-accent mt-auto mb-3">{formatCurrency(product.price)}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {product.stock > 0 ? `${product.stock} ${product.unit}` : "Sem stock"}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      inCart ? "bg-green-100 text-green-700" : "bg-ib-accent text-white hover:bg-ib-accent/90"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Plus className="w-3 h-3" /> {inCart ? `${inCart.quantity}` : "Add"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={() => setShowCart(false)}>
          <div className="w-full max-w-md bg-white h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-ib-primary flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Carrinho ({cartCount})</h2>
              <button onClick={() => setShowCart(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-ib-muted text-sm">Carrinho vazio</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-ib-primary text-sm">{item.name}</p>
                      <p className="text-xs text-ib-muted">{formatCurrency(item.price)} cada</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"><Minus className="w-3 h-3" /></button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} disabled={item.quantity >= item.stock} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"><Plus className="w-3 h-3" /></button>
                      <button onClick={() => removeFromCart(item.productId)} className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center hover:bg-red-100 ml-1"><Trash2 className="w-3 h-3 text-red-500" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-ib-muted text-sm">Total</span>
                  <span className="text-xl font-bold text-ib-primary">{formatCurrency(cartTotal)}</span>
                </div>
                <button onClick={() => { setShowCheckout(true); }} className="w-full py-3 bg-ib-accent text-white rounded-lg font-medium hover:bg-ib-accent/90 transition-colors flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" /> Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { if (!checkingOut) setShowCheckout(false); }}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            {checkoutDone ? (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-ib-primary mb-2">Compra Finalizada!</h3>
                <p className="text-sm text-ib-muted">A sua encomenda foi registada com sucesso.</p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-ib-primary mb-4">Checkout</h2>
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <span className="text-ib-primary">{item.name} <span className="text-ib-muted">x{item.quantity}</span></span>
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                    <span className="font-bold text-ib-primary">Total</span>
                    <span className="text-xl font-bold text-ib-primary">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-ib-primary mb-1">Nome do Cliente (opcional)</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Cliente anónimo" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ib-primary mb-1">Método de Pagamento</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option value="cash">Dinheiro</option>
                      <option value="card">Cartão</option>
                      <option value="transfer">Transferência</option>
                      <option value="multicaixa">Multicaixa</option>
                    </select>
                  </div>
                  <button onClick={handleCheckout} disabled={checkingOut} className="w-full py-3 bg-ib-accent text-white rounded-lg font-medium hover:bg-ib-accent/90 disabled:opacity-50 transition-colors">
                    {checkingOut ? "A processar..." : `Pagar ${formatCurrency(cartTotal)}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
