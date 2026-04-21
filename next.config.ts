import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Na Vercel `cwd` to katalog repozytorium - wycisza błędny root Turbopack przy wielu lockfile’ach poza repo. */
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "videodelivery.net", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/**" },
      { protocol: "https", hostname: "*.cloudflarestream.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.pixabay.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pixabay.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [60, 72, 75, 78],
  },
  async redirects() {
    return [
      { source: "/o-nas", destination: "/o-fibrze", permanent: true },
    ];
  },
};

export default nextConfig;
