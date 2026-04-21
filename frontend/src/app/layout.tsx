import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";

import { SiteShell } from "@/components/layout/site-shell";
import { AppProviders } from "@/components/providers/app-providers";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import "@/styles/globals.css";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: "400"
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space"
});

export const metadata: Metadata = {
  title: "Jumpman Commerce",
  description: "Premium sneaker commerce platform powered by Next.js and Django"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebas.variable} ${space.variable}`}>
      <body suppressHydrationWarning>
        <AppProviders>
          <ServiceWorkerRegister />
          <SiteShell>{children}</SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
