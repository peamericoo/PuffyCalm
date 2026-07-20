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
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
