import type { MetadataRoute } from "next";

/**
 * Manifeste web : permet « Ajouter à l'écran d'accueil » sur mobile,
 * première marche vers une future application mobile.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MUTUEL TOGO — Votre crédit en ligne, simplement",
    short_name: "MUTUEL TOGO",
    description: "Financement des particuliers et PME au Togo en quelques clics.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0B5FD7",
    lang: "fr",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
