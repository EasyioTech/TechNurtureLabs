import type { NextConfig } from "next";
import path from "node:path";
import fs from "node:fs";

// Copy PDF.js worker to public/ so pdf-viewer can load it without hitting unpkg CDN.
// Runs at config evaluation time (both dev and build).
try {
  const workerSrc = path.join(process.cwd(), "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
  const workerDest = path.join(process.cwd(), "public/pdf.worker.min.mjs");
  if (fs.existsSync(workerSrc) && !fs.existsSync(workerDest)) {
    fs.copyFileSync(workerSrc, workerDest);
  }
} catch (_) {}

// Derive allowed image hostnames from environment at build time
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://technurture.io';
const cloudflareDomain = process.env.CLOUDFLARE_PUBLIC_DOMAIN || '';

const remotePatterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [];

// Always allow the app's own origin for self-hosted images
try {
  const appHost = new URL(appUrl).hostname;
  remotePatterns.push({ protocol: 'https', hostname: appHost });
} catch (_) {}

// Allow Cloudflare R2 / CDN domain if configured
if (cloudflareDomain) {
  try {
    const r2Host = new URL(cloudflareDomain.startsWith('http') ? cloudflareDomain : `https://${cloudflareDomain}`).hostname;
    remotePatterns.push({ protocol: 'https', hostname: r2Host });
  } catch (_) {}
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    // CSP: restrictive but practical — covers Vidstack (blob:), PDF.js worker,
    // and R2/CDN media. Keep 'unsafe-inline' only for styles (Tailwind injects them).
    // In production HSTS is enforced; skip in dev to avoid breaking http://localhost.
    const csp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: csp },
          // HSTS: 1 year, include subdomains. Only send in production (http://localhost breaks otherwise).
          ...(!isDev ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
