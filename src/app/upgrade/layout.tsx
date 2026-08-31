import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planos e Preços",
  description:
    "Escolha o plano ideal para o seu negócio no IBPlus+. Plano gratuito, Premium e Business com funcionalidades avançadas.",
  openGraph: {
    title: "Planos e Preços — IBPlus+",
    description: "Escolha o plano ideal para o seu negócio. 100% gratuito ou planos premium.",
  },
};

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
