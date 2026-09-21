import type { Metadata } from "next";
import HomePageContent from "@/components/site/HomePageContent";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ibplus.co.ao";

export const metadata: Metadata = {
  title: "IBPlus+ — Gestão inteligente para MPMEs angolanas",
  description:
    "Plataforma de gestão gratuita para empreendedores, empresas, ONGs, associações, educação e cooperativas em Angola. Dashboard, Financeiro, CRM, Vendas, Praça, RH, Marketing, Educação e IA — tudo num só lugar, sem cartão de crédito.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_AO",
    url: BASE_URL,
    siteName: "IBPlus+",
    title: "IBPlus+ — Gestão inteligente para MPMEs angolanas",
    description:
      "Crie conta grátis e gerencie o seu negócio com Dashboard, Financeiro, CRM, Vendas, Praça, RH e IA. Feito para empreendedores, empresas, ONGs, associações, educação e cooperativas em Angola.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "IBPlus+ — Plataforma de Gestão Empresarial",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "IBPlus+",
      url: BASE_URL,
      logo: `${BASE_URL}/icon.svg`,
    },
    {
      "@type": "SoftwareApplication",
      name: "IBPlus+",
      operatingSystem: "Web",
      applicationCategory: "BusinessApplication",
      url: BASE_URL,
      description:
        "Plataforma de gestão empresarial para MPMEs angolanas: Dashboard, Financeiro, CRM, Vendas, Praça, RH, Marketing, Educação e IA.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "AOA" },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageContent />
    </>
  );
}