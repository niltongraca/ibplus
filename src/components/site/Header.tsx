"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/rede", label: "Rede" },
  { href: "/sobre", label: "Sobre" },
  { href: "/praca", label: "Praça" },
] as const;

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-lg text-ib-primary">IBPlus<sup className="text-ib-accent">+</sup></span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-ib-muted hover:text-ib-primary rounded-lg hover:bg-gray-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="text-sm text-ib-muted hover:text-ib-primary px-4 py-2 transition-colors">Entrar</Link>
            <Link href="/cadastro" className="bg-ib-accent hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">Experimentar Grátis</Link>
          </div>

          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-gray-100 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="block px-3 py-2.5 text-sm text-ib-muted hover:text-ib-primary rounded-lg hover:bg-gray-50" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 px-3">
              <Link href="/login" className="text-center text-sm text-ib-muted hover:text-ib-primary px-4 py-2.5 rounded-lg border border-gray-200" onClick={() => setOpen(false)}>Entrar</Link>
              <Link href="/cadastro" className="text-center bg-ib-accent hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium" onClick={() => setOpen(false)}>Experimentar Grátis</Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
