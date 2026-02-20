import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { AdSenseScript } from "@/components/ad-sense";
import { ClerkProvider } from "@clerk/nextjs";

import { Inter, JetBrains_Mono } from "next/font/google";

const sans = Inter({
  variable: "--font-geist-sans", // Keeping same variable for compatibility with globals.css
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Link-Collector",
  description: "From URL to Second Brain",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${mono.variable} antialiased bg-background text-foreground`}
      >
        <ClerkProvider>
          <AdSenseScript clientIds={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || ""} />
          <QueryProvider>
            {children}
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
