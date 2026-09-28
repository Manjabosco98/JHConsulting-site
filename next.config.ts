import type { NextConfig } from "next";

// Images uploaded to the Supabase Storage bucket "portfolio" (phase 8).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Baseline security headers (phase 18). Deliberately no `script-src`: Next and
 * the analytics snippet rely on inline scripts, and a real script policy needs
 * per-request nonces — a change with breakage risk that buys little on a site
 * with no third-party embeds. The directives below are the ones that cost
 * nothing and close real holes: no framing, no plugins, no base-tag or form
 * hijacking, no MIME sniffing, and referrers trimmed across origins.
 */
const contentSecurityPolicy = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" }
];

// HSTS only makes sense once the site is served over HTTPS, and pinning it on a
// plain-HTTP localhost would be a foot-gun during development.
if ((process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://")) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains"
  });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/portfolio/**`)]
      : []
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    // Cover uploads go through a Server Action: 5 MB image + multipart overhead.
    serverActions: { bodySizeLimit: "6mb" }
  }
};

export default nextConfig;
