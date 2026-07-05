import SiteLayout from "@/components/site/Layout";
import { Mail, Phone, MapPin, MessageCircle, Globe } from "lucide-react";
import { useState, FormEvent } from "react";
import SEO from "@/components/site/SEO";

export default function Contactos() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const data = { name: form.nome.value, email: form.email.value, message: form.mensagem.value };
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { setStatus("success"); form.reset(); } else setStatus("error");
    } catch { setStatus("error"); }
  }

  return (
    <SiteLayout>
      <SEO title="Contactos" description="Entre em contacto com a equipa IBPlus." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Contactos</h1>
          <p className="text-xl text-ib-muted">Estamos aqui para ajudar.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              {[
                { icon: MessageCircle, title: "WhatsApp", value: "+244 932 118 198", href: "https://wa.me/244932118198" },
                { icon: Mail, title: "Email", value: "geralibuka47@gmail.com", href: "mailto:geralibuka47@gmail.com" },
                { icon: Phone, title: "Telefone", value: "+244 932 118 198", href: "tel:+244932118198" },
                { icon: MapPin, title: "Morada", value: "Malanje, Angola" },
                { icon: Globe, title: "Facebook", value: "ibplus.ao", href: "https://web.facebook.com/ibplus.ao/" },
                { icon: Globe, title: "Instagram", value: "@ibplus_ao", href: "https://www.instagram.com/ibplus_ao/" },
              ].map((c) => (
                <div key={c.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-ib-accent/10 flex items-center justify-center shrink-0">
                    <c.icon className="w-5 h-5 text-ib-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-ib-muted">{c.title}</p>
                    {c.href ? (
                      <a href={c.href} target="_blank" rel="noopener noreferrer" className="font-medium text-ib-primary hover:text-ib-accent">{c.value}</a>
                    ) : (
                      <p className="font-medium text-ib-primary">{c.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-ib-primary mb-6">Envie-nos uma mensagem</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Nome</label>
                  <input name="nome" required type="text" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Email</label>
                  <input name="email" required type="email" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ib-primary mb-1">Mensagem</label>
                  <textarea name="mensagem" required rows={4} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ib-accent/40 resize-none" />
                </div>
                <button type="submit" disabled={status === "loading"} className="w-full bg-ib-accent hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  {status === "loading" ? "A enviar..." : status === "success" ? "Mensagem enviada!" : status === "error" ? "Erro. Tente novamente." : "Enviar Mensagem"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
