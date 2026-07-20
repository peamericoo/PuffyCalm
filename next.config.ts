import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /** Native View Transitions on App Router navigations (no animation libs). */
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
