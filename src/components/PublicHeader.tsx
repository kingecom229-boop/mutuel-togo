"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Phone } from "lucide-react";
import { LogoCompact } from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { apiGet } from "@/lib/api";
import { SITE } from "@/lib/constants";
import type { ApiUser } from "@/lib/types";

/** En-tête public : logo, soleil/lune en haut, accès connexion/inscription. */
export default function PublicHeader() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    apiGet<{ user: ApiUser | null }>("/api/auth/moi")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setCharge(true));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2.5">
        <LogoCompact />
        <div className="flex items-center gap-2">
          <a
            href={`tel:${SITE.phoneE164}`}
            className="hidden items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 md:inline-flex"
          >
            <Phone size={16} aria-hidden /> {SITE.phoneDisplay}
          </a>
          <ThemeToggle />
          {charge && user ? (
            <Link
              href={user.role === "ADMIN" ? "/admin" : "/tableau-de-bord"}
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-white shadow-doux"
            >
              <LayoutDashboard size={17} aria-hidden />
              <span className="hidden sm:inline">Mon espace</span>
              <span className="sm:hidden">Espace</span>
            </Link>
          ) : (
            <>
              <Link
                href="/connexion"
                className="hidden min-h-11 items-center rounded-2xl px-3 py-2.5 text-sm font-bold text-brand-blue dark:text-brand-sky sm:inline-flex"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                className="inline-flex min-h-11 items-center rounded-2xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-white shadow-doux"
              >
                Ouvrir un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
