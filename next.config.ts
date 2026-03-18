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

const remotePatterns: NextConfig['images']['remotePatterns'] = [];

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
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
