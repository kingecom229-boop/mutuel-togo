"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  HandCoins,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Settings2,
  UsersRound,
} from "lucide-react";
import { LogoCompact } from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { apiSend } from "@/lib/api";

const NAV = [
  { href: "/admin", label: "Tableau", Icone: LayoutDashboard, exact: true },
  { href: "/admin/utilisateurs", label: "Clients", Icone: UsersRound },
  { href: "/admin/credits", label: "Crédits", Icone: HandCoins },
  { href: "/admin/transferts", label: "Transferts", Icone: ArrowLeftRight },
  { href: "/admin/messages", label: "Messages", Icone: MessagesSquare },
  { href: "/admin/parametres", label: "Paramètres", Icone: Settings2 },
] as const;

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function deconnexion() {
    await apiSend("/api/auth/deconnexion", "POST").catch(() => null);
    router.replace("/admin/connexion");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <LogoCompact href="/admin" />
            <span className="hidden rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-900 sm:inline">
              Back-office
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={deconnexion}
              aria-label="Se déconnecter"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <LogOut size={19} aria-hidden />
            </button>
          </div>
        </div>
        <nav aria-label="Navigation administration" className="mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-4 pb-3">
          {NAV.map(({ href, label, Icone, ...rest }) => {
            const actif =
              "exact" in rest && rest.exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={actif ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition ${
                  actif
                    ? "bg-brand-gradient text-white shadow-doux"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                }`}
              >
                <Icone size={16} aria-hidden /> {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-5">{children}</main>
    </div>
  );
}
