import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/jak-pracujemy", destination: "/jak-dzialamy", permanent: true }];
  },
};

export default nextConfig;
