"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { LogoCompact } from "./Logo";
import ThemeToggle from "./ThemeToggle";
import BottomNav from "./BottomNav";
import { apiGet, apiSend } from "@/lib/api";

/** Habillage de l'espace client : en-tête + contenu centré mobile + navbar du bas. */
export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [nonLus, setNonLus] = useState(0);

  const chargerNonLus = useCallback(async () => {
    try {
      const data = await apiGet<{ stats: { messagesNonLus: number } }>("/api/tableau-de-bord");
      setNonLus(data.stats.messagesNonLus);
    } catch {
      /* badge optionnel */
    }
  }, []);

  useEffect(() => {
    void chargerNonLus();
    const timer = setInterval(chargerNonLus, 30_000);
    return () => clearInterval(timer);
  }, [chargerNonLus]);

  async function deconnexion() {
    await apiSend("/api/auth/deconnexion", "POST").catch(() => null);
    router.replace("/connexion");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <LogoCompact href="/tableau-de-bord" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={deconnexion}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <LogOut size={19} aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5">{children}</main>
      <BottomNav messagesNonLus={nonLus} />
    </div>
  );
}
