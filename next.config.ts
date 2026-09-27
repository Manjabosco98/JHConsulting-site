import type { NextConfig } from "next";

// Images uploaded to the Supabase Storage bucket "portfolio" (phase 8).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/portfolio/**`)]
      : []
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
    // Cover uploads go through a Server Action: 5 MB image + multipart overhead.
    serverActions: { bodySizeLimit: "6mb" }
  }
};

export default nextConfig;
