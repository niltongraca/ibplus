import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Store, MapPin, Phone, Mail, ArrowLeft, Package } from "lucide-react";
import Link from "next/link";

async function getCompany(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      products: {
        where: { active: true },
        include: { category: { select: { name: true } } },
        orderBy: { name: "asc" },
      },
    },
  });
  return company;
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/praca" className="inline-flex items-center gap-1.5 text-ib-muted hover:text-ib-accent text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar à Praça
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-ib-accent/10 flex items-center justify-center flex-shrink-0">
              <Store className="w-8 h-8 text-ib-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ib-primary">{company.name}</h1>
              {company.nif && <p className="text-sm text-gray-400">NIF: {company.nif}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {company.address && (
              <div className="flex items-start gap-2 text-sm text-ib-muted">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{company.address}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-start gap-2 text-sm text-ib-muted">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{company.phone}</span>
              </div>
            )}
            {company.email && (
              <div className="flex items-start gap-2 text-sm text-ib-muted">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{company.email}</span>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold text-ib-primary mb-6 flex items-center gap-2">
          <Package className="w-5 h-5" /> Produtos e Serviços
        </h2>

        {company.products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum produto disponível de momento.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {company.products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-ib-accent/10 text-ib-accent font-medium">
                    {product.category?.name || "Sem categoria"}
                  </span>
                  <span className="text-sm text-gray-400">{product.unit}</span>
                </div>
                <h3 className="font-semibold text-ib-primary mb-1">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-ib-muted mb-3 line-clamp-2">{product.description}</p>
                )}
                <p className="text-lg font-bold text-ib-accent">{formatCurrency(product.price)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
