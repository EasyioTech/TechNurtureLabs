import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from 'sonner';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "TechNurture Labs - Immersive Learning Platform",
  description: "Next-gen immersive LMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} ${inter.variable}`}>
      <body className="antialiased font-roboto">
        <Toaster position="top-center" expand={true} richColors closeButton />
        <AuthProvider>
          <ErrorReporter />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
