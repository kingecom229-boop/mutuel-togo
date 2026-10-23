import type { MetadataRoute } from "next";

/** robots.txt — l'espace client et le back-office ne sont jamais indexés. */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/inscription", "/connexion", "/mentions-legales"],
      disallow: [
        "/api/",
        "/admin",
        "/tableau-de-bord",
        "/profil",
        "/credit",
        "/transfert",
        "/messages",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
