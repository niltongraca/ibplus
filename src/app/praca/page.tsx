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
    <div>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
            <Store className="w-8 h-8 text-ib-accent" />
          </div>
          <h1 className="text-4xl font-bold mt-4 mb-3" style={{ color: "var(--text-primary)" }}>Praça</h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Explore as empresas registadas na plataforma e descubra os seus produtos e serviços.
          </p>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-lg" style={{ color: "var(--text-muted)" }}>Nenhuma empresa registada na Praça.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/praca/${company.id}`}
                className="glass-card p-6 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
                    <Store className="w-6 h-6 text-ib-accent" />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "var(--color-ib-accent)" }}>
                    {company._count.products} produtos
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{company.name}</h3>
                {company.nif && <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>NIF: {company.nif}</p>}
                <div className="space-y-1 mb-4">
                  {company.address && (
                    <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {company.address}
                    </p>
                  )}
                  {company.phone && (
                    <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      {company.phone}
                    </p>
                  )}
                  {company.email && (
                    <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
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
