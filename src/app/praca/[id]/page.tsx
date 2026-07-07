import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Store, MapPin, Phone, Mail, ArrowLeft, Package, Globe, Facebook, Instagram, Linkedin, MessageCircle, Send, User } from "lucide-react";
import Link from "next/link";

async function getCompany(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      users: {
        include: {
          profile: true,
          companyProfile: true,
          ngoProfile: true,
          educationProfile: true,
        },
      },
      products: {
        where: { active: true },
        include: { category: { select: { name: true } } },
        orderBy: { name: "asc" },
      },
    },
  });
  return company;
}

function getProfileInfo(user: any) {
  if (user.profile) {
    return {
      descricao: user.profile.descricao,
      redesSociais: user.profile.redesSociais,
      telefone: user.profile.telefone,
      endereco: user.profile.endereco,
    };
  }
  if (user.companyProfile) {
    return {
      descricao: user.companyProfile.descricao,
      redesSociais: [user.companyProfile.facebook, user.companyProfile.instagram, user.companyProfile.linkedin, user.companyProfile.website].filter(Boolean).join(", "),
      telefone: null,
      endereco: user.companyProfile.endereco,
      website: user.companyProfile.website,
      facebook: user.companyProfile.facebook,
      instagram: user.companyProfile.instagram,
      linkedin: user.companyProfile.linkedin,
    };
  }
  if (user.ngoProfile) {
    return {
      descricao: user.ngoProfile.missao,
      redesSociais: [user.ngoProfile.facebook, user.ngoProfile.instagram, user.ngoProfile.website].filter(Boolean).join(", "),
      website: user.ngoProfile.website,
      facebook: user.ngoProfile.facebook,
      instagram: user.ngoProfile.instagram,
    };
  }
  if (user.educationProfile) {
    return {
      descricao: null,
      redesSociais: [user.educationProfile.facebook, user.educationProfile.instagram, user.educationProfile.website].filter(Boolean).join(", "),
      website: user.educationProfile.website,
      facebook: user.educationProfile.facebook,
      instagram: user.educationProfile.instagram,
    };
  }
  return {};
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const user = company.users[0];
  const profile = user ? getProfileInfo(user) : {};

  const socialLinks = [
    { url: profile.facebook, icon: Facebook, label: "Facebook" },
    { url: profile.instagram, icon: Instagram, label: "Instagram" },
    { url: profile.linkedin, icon: Linkedin, label: "LinkedIn" },
    { url: profile.website, icon: Globe, label: "Website" },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/praca" className="inline-flex items-center gap-1.5 text-ib-muted hover:text-ib-accent text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar à Praça
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-ib-accent/10 flex items-center justify-center flex-shrink-0">
              {user?.name ? <User className="w-8 h-8 text-ib-accent" /> : <Store className="w-8 h-8 text-ib-accent" />}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-ib-primary">{company.name}</h1>
              {company.nif && <p className="text-sm text-gray-400">NIF: {company.nif}</p>}
              {user?.name && (
                <p className="text-sm text-ib-muted mt-1">{user.name}</p>
              )}
            </div>
          </div>

          {profile.descricao && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-ib-muted leading-relaxed">{profile.descricao}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {company.address && (
              <div className="flex items-start gap-2.5 text-sm text-ib-muted">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-ib-accent" />
                <span>{company.address}</span>
              </div>
            )}
            {company.phone && (
              <a href={`tel:${company.phone}`} className="flex items-start gap-2.5 text-sm text-ib-muted hover:text-ib-accent transition-colors">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-ib-accent" />
                <span>{company.phone}</span>
              </a>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`} className="flex items-start gap-2.5 text-sm text-ib-muted hover:text-ib-accent transition-colors">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-ib-accent" />
                <span>{company.email}</span>
              </a>
            )}
          </div>

          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.url!.startsWith("http") ? s.url! : `https://${s.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-ib-accent/10 border border-gray-200 rounded-lg text-xs font-medium text-ib-muted hover:text-ib-accent transition-all"
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-ib-primary flex items-center gap-2">
            <Package className="w-5 h-5" /> Produtos e Serviços
          </h2>
        </div>

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

        <div className="mt-8 bg-gradient-to-r from-ib-accent/5 to-blue-50 rounded-xl border border-ib-accent/20 p-6 text-center">
          <p className="text-sm text-ib-muted mb-3">Interessado em algum produto ou serviço?</p>
          <div className="flex flex-wrap justify-center gap-3">
            {company.phone && (
              <a
                href={`https://wa.me/${company.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            )}
            {company.email && (
              <a
                href={`mailto:${company.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-ib-accent text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" /> Enviar Email
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
