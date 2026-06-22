import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow access from local network (e.g. 10.5.0.2) so HMR works when
  // the dev server is reached over LAN. Without this, Turbopack blocks
  // cross-origin requests to /_next/webpack-hmr and surfaces a generic
  // "An unexpected Turbopack error occurred" overlay in the browser.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "10.5.0.2",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;