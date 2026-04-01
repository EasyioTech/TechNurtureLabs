import type { NextConfig } from "next";
import path from "node:path";
import fs from "node:fs";

// ── PDF.js asset sync ────────────────────────────────────────────────────────
// Runs on every config evaluation (dev start + build) so all three assets always
// match the installed pdfjs-dist version.  Eliminates any CDN dependency at
// runtime — cmaps and standard_fonts are served from our own origin.

// 1. Worker — must match the pdfjs-dist version exactly
try {
  const workerSrc = path.join(process.cwd(), "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
  const workerDest = path.join(process.cwd(), "public/pdf.worker.min.mjs");
  if (fs.existsSync(workerSrc)) {
    fs.copyFileSync(workerSrc, workerDest);
  }
} catch (_) {}

// 2. Character Maps — required for CJK, Arabic, and other non-Latin PDFs
try {
  const cmapSrc = path.join(process.cwd(), "node_modules/pdfjs-dist/cmaps");
  const cmapDest = path.join(process.cwd(), "public/pdfjs-cmaps");
  if (fs.existsSync(cmapSrc)) {
    fs.cpSync(cmapSrc, cmapDest, { recursive: true, force: true });
  }
} catch (_) {}

// 3. Standard Fonts — fallback fonts for PDFs that embed no font data
try {
  const fontSrc = path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts");
  const fontDest = path.join(process.cwd(), "public/pdfjs-fonts");
  if (fs.existsSync(fontSrc)) {
    fs.cpSync(fontSrc, fontDest, { recursive: true, force: true });
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
  output: 'standalone',
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    // CSP: restrictive but practical — covers Vidstack (blob:), PDF.js worker,
    // and R2/CDN media. Keep 'unsafe-inline' only for styles (Tailwind injects them).
    // In production HSTS is enforced; skip in dev to avoid breaking http://localhost.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://*.youtube.com https://s.ytimg.com https://player.vimeo.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "worker-src 'self' blob:",
      "frame-src 'self' https://youtube.com https://*.youtube.com https://youtube-nocookie.com https://*.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com https://*.videodelivery.net https://videodelivery.net",
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
