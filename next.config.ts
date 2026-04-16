import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Na Vercel `cwd` to katalog repozytorium — wycisza błędny root Turbopack przy wielu lockfile’ach poza repo. */
  turbopack: {
    root: process.cwd(),
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
  },
  async redirects() {
    return [{ source: "/jak-pracujemy", destination: "/jak-dzialamy", permanent: true }];
  },
};

export default nextConfig;
