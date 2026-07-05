import SiteLayout from "@/components/site/Layout";
import SEO from "@/components/site/SEO";

export default function Termos() {
  return (
    <SiteLayout>
      <SEO title="Termos de Utilização" description="Termos de utilização do IBPlus." />
      <section className="py-20 bg-gradient-to-br from-ib-primary via-ib-primary to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">Termos de Utilização</h1>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray">
          <h2>1. Aceitação dos Termos</h2>
          <p>Ao utilizar o IBPlus, concorda com estes termos de utilização. Se não concordar, não utilize os nossos serviços.</p>
          <h2>2. Conta de Utilizador</h2>
          <p>É responsável por manter a confidencialidade das suas credenciais de acesso e por todas as atividades na sua conta.</p>
          <h2>3. Serviços</h2>
          <p>O IBPlus oferece uma plataforma de gestão empresarial conforme descrito no nosso site. Reservamo-nos o direito de modificar ou descontinuar funcionalidades.</p>
          <h2>4. Privacidade</h2>
          <p>O tratamento dos seus dados é regido pela nossa Política de Privacidade.</p>
          <h2>5. Limitação de Responsabilidade</h2>
          <p>O IBPlus não se responsabiliza por danos indiretos decorrentes do uso da plataforma.</p>
        </div>
      </section>
    </SiteLayout>
  );
}
