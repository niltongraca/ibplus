import SiteLayout from "@/components/site/Layout";
import SEO from "@/components/site/SEO";

export default function Privacidade() {
  return (
    <SiteLayout>
      <SEO title="Política de Privacidade" description="Política de privacidade do IBPlus." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Política de Privacidade</h1>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray">
          <h2>1. Informações que recolhemos</h2>
          <p>Recolhemos informações pessoais como nome, email, telefone e NIF quando cria uma conta ou utiliza os nossos serviços.</p>
          <h2>2. Como utilizamos</h2>
          <p>Utilizamos os seus dados para fornecer, manter e melhorar os nossos serviços, processar transações e comunicar consigo.</p>
          <h2>3. Proteção de dados</h2>
          <p>Implementamos medidas de segurança técnicas e organizacionais para proteger os seus dados contra acesso não autorizado.</p>
          <h2>4. Seus direitos</h2>
          <p>Você tem direito a aceder, corrigir, eliminar e portar os seus dados pessoais. Pode exercer estes direitos através do nosso email de contacto.</p>
          <h2>5. Contacto</h2>
          <p>Para questões sobre privacidade, contacte: <strong>geralibuka47@gmail.com</strong></p>
        </div>
      </section>
    </SiteLayout>
  );
}
