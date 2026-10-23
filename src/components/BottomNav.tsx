"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, House, MessagesSquare, UserRound } from "lucide-react";

const ITEMS = [
  { href: "/tableau-de-bord", label: "Accueil", Icone: House },
  { href: "/messages", label: "Messages", Icone: MessagesSquare, badgeKey: "messages" },
  { href: "/transfert", label: "Transfert", Icone: ArrowLeftRight },
  { href: "/profil", label: "Profil", Icone: UserRound },
] as const;

/** Navbar du bas façon application mobile (Accueil, Messages, Transfert, Profil). */
export default function BottomNav({ messagesNonLus = 0 }: { messagesNonLus?: number }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"
    >
      <div className="pb-safe mx-auto grid max-w-3xl grid-cols-4 px-2">
        {ITEMS.map(({ href, label, Icone, ...rest }) => {
          const actif = pathname === href || pathname.startsWith(`${href}/`);
          const badge =
            "badgeKey" in rest && rest.badgeKey === "messages" ? messagesNonLus : 0;
          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
                actif
                  ? "text-brand-blue dark:text-brand-sky"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <span className="relative">
                <Icone size={23} strokeWidth={actif ? 2.4 : 2} aria-hidden />
                {badge > 0 ? (
                  <span className="absolute -right-2.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </span>
              {label}
              {actif ? (
                <span className="absolute -top-px h-0.5 w-10 rounded-full bg-brand-gradient" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
