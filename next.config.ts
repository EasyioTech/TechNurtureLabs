import type { NextConfig } from "next";
import path from "node:path";
import fs from "node:fs";

// ── Image Optimization Config ───────────────────────────────────────────────

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
      // SECURITY: Removed 'unsafe-eval' — no legitimate use case in modern Next.js
      // Razorpay SDK works without it (uses postMessage instead of eval)
      "script-src 'self' 'unsafe-inline' https://www.youtube.com https://*.youtube.com https://s.ytimg.com https://player.vimeo.com https://checkout.razorpay.com https://cdn.razorpay.com https://*.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://checkout.razorpay.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https: https://api.razorpay.com https://*.razorpay.com",
      "worker-src 'self' blob:",
      "frame-src 'self' https://youtube.com https://*.youtube.com https://youtube-nocookie.com https://*.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com https://*.videodelivery.net https://videodelivery.net https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com",
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
          // SECURITY: Using report-only mode while refactoring to remove 'unsafe-inline' from script-src
          // This allows XSS detection without breaking the app
          { key: 'Content-Security-Policy-Report-Only', value: csp },
          // HSTS: 1 year, include subdomains. Only send in production (http://localhost breaks otherwise).
          ...(!isDev ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
