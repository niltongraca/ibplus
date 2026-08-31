import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rede",
  description:
    "Explore conteúdos, artigos, vídeos e recursos partilhados pela comunidade IBPlus+.",
  openGraph: {
    title: "Rede — IBPlus+",
    description: "Explore conteúdos e recursos partilhados pela comunidade IBPlus+.",
  },
};

export default function RedeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
