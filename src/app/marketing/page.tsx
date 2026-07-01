import Link from "next/link";

const links = [
  { label: "Campanhas", href: "/marketing/campanhas" },
  { label: "E-mail Marketing", href: "/marketing/email-marketing" },
  { label: "Promoções", href: "/marketing/promocoes" },
  { label: "Fidelização", href: "/marketing/fidelizacao" },
];

export default function MarketingPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ib-primary mb-6">IBPlus Marketing</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="p-4 rounded-xl border border-gray-200 bg-white hover:border-ib-accent/50 hover:shadow-md transition-all"
          >
            <p className="font-medium text-ib-primary">{link.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
