import type { Metadata } from "next";
export const dynamic = 'force-dynamic';
import { getPlatformSettings } from "@/components/landing/actions";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

import { AuthProvider } from "@/components/providers/auth-provider";
import { BackgroundUploadManager } from "@/components/shared/background-upload-manager";
import { Toaster } from 'sonner';
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  return {
    title: settings?.platform_name ? `${settings.platform_name} - Immersive Learning Platform` : "TechNurture Labs - Immersive Learning Platform",
    description: "Next-gen immersive LMS",
    icons: {
      icon: settings?.favicon_url || "/favicon.ico",
      shortcut: settings?.favicon_url || "/favicon.ico",
      apple: settings?.favicon_url || "/favicon.ico",
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased font-sans">
        <Toaster position="top-center" expand={true} richColors closeButton />
        <AuthProvider>
          <ErrorReporter />
          <BackgroundUploadManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
