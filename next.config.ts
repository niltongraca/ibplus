import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon", "@neondatabase/serverless", "ws"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      { source: "/gestao/admin/:path*", destination: "/admin/:path*", permanent: true },
    ];
  },
  async headers() {
    const securityHeaders = [
      // CSP não mora aqui: é gerado no middleware com nonce per-request (#24).
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      // COOP para isolamento parcial entre origens (window.open("",_blank)
      // usa about:blank do mesmo-origem — sem quebras). COEP (require-corp) fica
      // de fora de propósito: partiria script/iframe terceiros (Botpress, Vercel,
      // GTM) que não enviam Cross-Origin-Resource-Policy.
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
