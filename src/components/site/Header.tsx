"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/rede", label: "Rede" },
  { href: "/sobre", label: "Sobre" },
  { href: "/praca", label: "Praça" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border-color)" }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>IBPlus<sup className="text-ib-accent">+</sup></span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href!}
                className="px-3 py-2 text-sm rounded-lg transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-sm px-4 py-2 transition-colors" style={{ color: "var(--text-muted)" }}>Entrar</Link>
            <Link href="/cadastro" className="bg-ib-accent hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Experimentar Grátis</Link>
          </div>

          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg" style={{ color: "var(--text-muted)" }}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden py-4 space-y-1" style={{ borderTop: "1px solid var(--border-color)" }}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href!} className="block px-3 py-2.5 text-sm rounded-lg" style={{ color: "var(--text-muted)" }} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2 px-3" style={{ borderTop: "1px solid var(--border-color)" }}>
              <Link href="/login" className="text-center text-sm px-4 py-2.5 rounded-lg border" style={{ color: "var(--text-muted)", borderColor: "var(--border-color)" }} onClick={() => setOpen(false)}>Entrar</Link>
              <Link href="/cadastro" className="text-center bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium" onClick={() => setOpen(false)}>Experimentar Grátis</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
