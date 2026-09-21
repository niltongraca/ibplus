import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { headers } from "next/headers";
import { Providers } from "@/components/Providers";
import { WebVitals } from "@/components/WebVitals";
import BotpressChat from "@/components/BotpressChat";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ibplus.co.ao";

export const metadata: Metadata = {
  title: {
    default: "IBPlus+ — A plataforma inteligente para gerir e fazer crescer o seu negócio",
    template: "%s | IBPlus+",
  },
  description:
    "IBPlus+ é a plataforma inteligente de gestão empresarial para micro, pequenas e médias empresas em Angola. Gestão, Finance, CRM, Store, IA, Marketing e RH — tudo num só lugar.",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_AO",
    url: BASE_URL,
    siteName: "IBPlus+",
    title: "IBPlus+ — A plataforma inteligente para gerir e fazer crescer o seu negócio",
    description:
      "Gestão, Finance, CRM, Store, IA, Marketing e RH — tudo num só lugar. Adaptado ao seu tipo de conta: empreendedor, empresa, ONG, associação, educação ou cooperativa.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "IBPlus+ — Plataforma de Gestão Empresarial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IBPlus+ — A plataforma inteligente para gerir e fazer crescer o seu negócio",
    description:
      "Gestão, Finance, CRM, Store, IA, Marketing e RH — tudo num só lugar. 100% gratuito.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce do CSP (#24): exposto no <html> para os popups de exportação PDF
  // (herdam o CSP do opener e precisam do nonce nos scripts inline).
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? "";
  return (
    <html lang="pt-AO" data-nonce={nonce}>
      <body>
        <Providers>{children}</Providers>
        <WebVitals />
        <BotpressChat />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
