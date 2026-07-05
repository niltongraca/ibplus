import SiteLayout from "@/components/site/Layout";
import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

const posts = {
  "como-digitalizar-seu-negocio": {
    title: "Como digitalizar o seu pequeno negócio em Angola",
    date: "15 Jun 2026",
    content: `Digitalizar um pequeno negócio em Angola é mais simples do que parece. Com ferramentas acessíveis como o IBPlus, pode automatizar tarefas repetitivas, controlar o stock em tempo real e emitir facturas electrónicas a partir do telemóvel.

Comece pelo essencial: organize o cadastro de clientes, registe os produtos, e passe a controlar as vendas diariamente. Em poucas semanas já terá dados para tomar decisões mais inteligentes.

O IBPlus foi desenhado para funcionar em qualquer dispositivo, mesmo com internet limitada.`
  }
};

export async function getStaticPaths() {
  const paths = Object.keys(posts).map((slug) => ({ params: { slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = posts[params.slug as keyof typeof posts];
  return { props: { post } };
}

export default function BlogPost({ post }: { post: { title: string; date: string; content: string } }) {
  return (
    <SiteLayout>
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-ib-muted hover:text-white transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Blog
          </Link>
          <div className="flex items-center gap-2 text-sm text-ib-muted mb-4">
            <CalendarDays className="h-4 w-4" />
            <span>{post.date}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{post.title}</h1>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray">
          {post.content.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>
    </SiteLayout>
  );
}
