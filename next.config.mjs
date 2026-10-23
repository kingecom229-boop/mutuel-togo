/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      { source: "/accueil", destination: "/", permanent: true },
      { source: "/login", destination: "/connexion", permanent: true },
      { source: "/register", destination: "/inscription", permanent: true },
      { source: "/signup", destination: "/inscription", permanent: true },
      { source: "/dashboard", destination: "/tableau-de-bord", permanent: true },
      { source: "/home", destination: "/tableau-de-bord", permanent: true },
      { source: "/profile", destination: "/profil", permanent: true },
      { source: "/messages", destination: "/messages", permanent: false },
    ].filter((r) => r.source !== r.destination);
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' data: blob:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "connect-src 'self'",
              "font-src 'self' data:",
              "frame-ancestors 'self' https://*.e2b.app",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
