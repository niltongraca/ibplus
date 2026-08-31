import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ibplus.co.ao";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/cadastro", "/sobre", "/praca", "/rede", "/upgrade"],
        disallow: [
          "/admin/",
          "/gestao/",
          "/crm/",
          "/finance/",
          "/store/",
          "/rh/",
          "/educacao/",
          "/marketing/",
          "/ia/",
          "/onboarding/",
          "/api/",
          "/recuperar-senha/",
          "/login",
          "/unauthorized",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
