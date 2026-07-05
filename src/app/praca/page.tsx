import { prisma } from "@/lib/prisma";
import { Store, ShoppingBag, MapPin, Phone, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getCompanies() {
  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { products: { where: { active: true } } } },
    },
    orderBy: { name: "asc" },
  });
  return companies;
}

export default async function PracaPage() {
  const companies = await getCompanies();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ib-accent/10 mb-4">
            <Store className="w-8 h-8 text-ib-accent" />
          </div>
          <h1 className="text-4xl font-bold text-ib-primary mb-3">Praça</h1>
          <p className="text-lg text-ib-muted max-w-2xl mx-auto">
            Explore as empresas registadas na plataforma e descubra os seus produtos e serviços.
          </p>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Nenhuma empresa registada na Praça.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/praca/${company.id}`}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-ib-accent/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-ib-accent/10 flex items-center justify-center">
                    <Store className="w-6 h-6 text-ib-accent" />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-ib-accent/10 text-ib-accent font-medium">
                    {company._count.products} produtos
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-ib-primary mb-1">{company.name}</h3>
                {company.nif && <p className="text-xs text-gray-400 mb-2">NIF: {company.nif}</p>}
                <div className="space-y-1 mb-4">
                  {company.address && (
                    <p className="text-sm text-ib-muted flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {company.address}
                    </p>
                  )}
                  {company.phone && (
                    <p className="text-sm text-ib-muted flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      {company.phone}
                    </p>
                  )}
                  {company.email && (
                    <p className="text-sm text-ib-muted flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      {company.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center text-ib-accent text-sm font-medium group-hover:gap-2 transition-all">
                  Ver produtos <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
