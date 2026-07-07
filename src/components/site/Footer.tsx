import Link from "next/link";

interface FooterLink {
  label: string;
  href?: string;
  external?: boolean;
}

const footerLinks: Record<string, FooterLink[]> = {
  Plataforma: [
    { href: "/funcionalidades", label: "Funcionalidades" },
    { href: "/solucoes", label: "Soluções" },
    { href: "/api-page", label: "API para Devs" },
    { href: "/estado", label: "Estado do Sistema" },
  ],
  Empresa: [
    { href: "/sobre", label: "Sobre Nós" },
    { href: "/blog", label: "Blog" },
    { href: "/casos-sucesso", label: "Casos de Sucesso" },
    { href: "/carreiras", label: "Carreiras" },
    { href: "/parceiros", label: "Programa de Parceiros" },
  ],
  Ajuda: [
    { href: "/ajuda", label: "Central de Ajuda" },
    { href: "/contactos", label: "Contactos" },
    { href: "/privacidade", label: "Privacidade" },
    { href: "/termos", label: "Termos de Utilização" },
    { href: "/cookies", label: "Política de Cookies" },
  ],
  Redes: [
    { href: "https://web.facebook.com/ibplus.ao/", label: "Facebook", external: true },
    { href: "https://www.instagram.com/ibplus_ao/", label: "Instagram", external: true },
    { label: "WhatsApp: +244 932 118 198", external: true },
    { label: "geralibuka47@gmail.com", external: true },
  ],
};

export default function SiteFooter() {
  return (
    <footer className="bg-ib-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="font-bold text-lg">IBPlus<sup className="text-ib-accent">+</sup></span>
            </Link>
            <p className="text-sm text-ib-muted leading-relaxed">
              Plataforma inteligente de gestão para MPMEs angolanas. Tecnologia acessível para fazer o seu negócio crescer.
            </p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4 text-white">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {!link.href ? (
                      <span className="text-sm text-ib-muted">{link.label}</span>
                    ) : (
                      <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="text-sm text-ib-muted hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-ib-muted">
          <p>&copy; {new Date().getFullYear()} IBPlus. Todos os direitos reservados.</p>
          <p className="mt-1">Malanje, Angola</p>
        </div>
      </div>
    </footer>
  );
}
