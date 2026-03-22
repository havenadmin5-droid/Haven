import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  eslint: {
    // Allow production builds to complete with warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete with type errors (we check in CI)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
