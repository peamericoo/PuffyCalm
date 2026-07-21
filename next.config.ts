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
      // Phase I media proxy (API serves private Railway bucket objects)
      {
        protocol: "https",
        hostname: "api-production-4f01.up.railway.app",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
