import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Faça login na sua conta IBPlus+ e aceda à plataforma de gestão empresarial.",
  openGraph: {
    title: "Entrar — IBPlus+",
    description: "Faça login na sua conta IBPlus+.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
