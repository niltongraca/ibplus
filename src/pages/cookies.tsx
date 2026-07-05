import SiteLayout from "@/components/site/Layout";
import SEO from "@/components/site/SEO";

export default function Cookies() {
  return (
    <SiteLayout>
      <SEO title="Política de Cookies" description="Política de cookies do IBPlus." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Política de Cookies</h1>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray">
          <h2>O que são cookies?</h2>
          <p>Cookies são pequenos ficheiros de texto armazenados no seu navegador para melhorar a sua experiência de navegação.</p>
          <h2>Como utilizamos cookies</h2>
          <p>Utilizamos cookies essenciais para o funcionamento da plataforma, cookies de autenticação para manter a sua sessão segura, e cookies analíticos para melhorar os nossos serviços.</p>
          <h2>Cookies de terceiros</h2>
          <p>Utilizamos o Vercel Analytics para compreender como os visitantes interagem com o nosso site.</p>
          <h2>Gestão de cookies</h2>
          <p>Pode configurar o seu navegador para recusar cookies, mas isso pode afetar algumas funcionalidades do site.</p>
        </div>
      </section>
    </SiteLayout>
  );
}
