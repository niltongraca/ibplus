import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Criar Conta",
  description:
    "Crie a sua conta gratuita no IBPlus+ e comece a gerir o seu negócio. Empreendedor, empresa, ONG, associação, educação ou cooperativa.",
  openGraph: {
    title: "Criar Conta — IBPlus+",
    description: "Crie a sua conta gratuita e comece a gerir o seu negócio.",
  },
};

export default function CadastroLayout({ children }: { children: React.ReactNode }) {
  return children;
}
