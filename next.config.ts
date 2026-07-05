import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-libsql", "@libsql/client", "@prisma/adapter-neon", "@neondatabase/serverless", "ws"],
  async redirects() {
    return [
      { source: "/gestao/admin/:path*", destination: "/admin/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
