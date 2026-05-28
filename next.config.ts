import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // web-push uses Node.js built-ins (crypto, https, http2).
  // Marking it as external prevents Next.js from trying to bundle it,
  // which avoids "Module not found" errors during Vercel builds.
  serverExternalPackages: ["web-push"],
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
