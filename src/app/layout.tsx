import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SITE } from "@/lib/constants";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MUTUEL TOGO — Votre crédit en ligne, simplement",
    template: "%s | MUTUEL TOGO",
  },
  description:
    "MUTUEL TOGO : demande de crédit en ligne pour particuliers et PME au Togo, de 50 000 à 10 000 000 FCFA, de 1 à 15 ans. Financement en quelques clics, à Lomé et dans tout le Togo.",
  keywords: [
    "crédit en ligne Togo",
    "prêt particulier Lomé",
    "financement PME Togo",
    "MUTUEL TOGO",
    "micro crédit Togo",
  ],
  authors: [{ name: "MUTUEL TOGO" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: SITE.name,
    title: "MUTUEL TOGO — Votre crédit en ligne, simplement",
    description:
      "Financement des particuliers et PME en quelques clics. Demandez votre crédit de 50 000 à 10 000 000 FCFA au Togo.",
    images: [{ url: "/brand/logo.png", width: 1200, height: 600, alt: "MUTUEL TOGO" }],
  },
  robots: { index: true, follow: true },
  applicationName: SITE.name,
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

/** Applique le thème sauvegardé avant le premier rendu (clair par défaut). */
const scriptTheme = `(function(){try{var t=localStorage.getItem('mutuel-theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTheme }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
