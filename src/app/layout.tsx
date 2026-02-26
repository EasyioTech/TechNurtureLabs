import type { Metadata } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "EduQuest - Immersive Learning Platform",
  description: "Next-gen immersive LMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ErrorReporter />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
