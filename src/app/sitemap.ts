import type { MetadataRoute } from "next";

/** sitemap.xml — uniquement les pages publiques indexables par Google. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const maintenant = new Date();
  return [
    { url: `${base}/`, lastModified: maintenant, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/inscription`, lastModified: maintenant, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/connexion`, lastModified: maintenant, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/mentions-legales`, lastModified: maintenant, changeFrequency: "yearly", priority: 0.3 },
  ];
}
