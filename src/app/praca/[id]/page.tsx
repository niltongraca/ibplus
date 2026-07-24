import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Store, MapPin, Phone, Mail, ArrowLeft, Package, Globe, Facebook, Instagram, Linkedin, MessageCircle, Send, User } from "lucide-react";
import Link from "next/link";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";

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
    <div>
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/praca" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors" style={{ color: "var(--text-muted)" }}>
        <ArrowLeft className="w-4 h-4" /> Voltar à Praça
      </Link>

      <div className="glass-card p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)" }}>
            {user?.name ? <User className="w-8 h-8 text-ib-accent" /> : <Store className="w-8 h-8 text-ib-accent" />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{company.name}</h1>
            {company.nif && <p className="text-sm" style={{ color: "var(--text-muted)" }}>NIF: {company.nif}</p>}
            {user?.name && (
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{user.name}</p>
            )}
          </div>
        </div>

        {profile.descricao && (
          <div className="glass-card mb-6 p-4">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{profile.descricao}</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {company.address && (
            <div className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text-muted)" }}>
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-ib-accent" />
              <span>{company.address}</span>
            </div>
          )}
          {company.phone && (
            <a href={`tel:${company.phone}`} className="flex items-start gap-2.5 text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
              <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-ib-accent" />
              <span>{company.phone}</span>
            </a>
          )}
          {company.email && (
            <a href={`mailto:${company.email}`} className="flex items-start gap-2.5 text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
              <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-ib-accent" />
              <span>{company.email}</span>
            </a>
          )}
        </div>

        {socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-4" style={{ borderTop: "1px solid var(--border-color)" }}>
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.url!.startsWith("http") ? s.url! : `https://${s.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                <s.icon className="w-3.5 h-3.5" />
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Package className="w-5 h-5" /> Produtos e Serviços
        </h2>
      </div>

      {company.products.length === 0 ? (
        <div className="glass-card text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>Nenhum produto disponível de momento.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {company.products.map((product) => (
            <div key={product.id} className="glass-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "rgba(37, 99, 235, 0.1)", color: "var(--color-ib-accent)" }}>
                  {product.category?.name || "Sem categoria"}
                </span>
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>{product.unit}</span>
              </div>
              <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{product.name}</h3>
              {product.description && (
                <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--text-muted)" }}>{product.description}</p>
              )}
              <p className="text-lg font-bold text-ib-accent">{formatCurrency(product.price)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card mt-8 p-6 text-center">
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Interessado em algum produto ou serviço?</p>
        <div className="flex flex-wrap justify-center gap-3">
          {company.phone && (
            <a
              href={`https://wa.me/${company.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#22c55e", color: "white" }}
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          {company.email && (
            <a
              href={`mailto:${company.email}`}
              className="glass-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Send className="w-4 h-4" /> Enviar Email
            </a>
          )}
        </div>
      </div>
      </div>
      <SiteFooter />
    </div>
  );
}
