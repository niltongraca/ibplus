import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
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
};

export default nextConfig;
