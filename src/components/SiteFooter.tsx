import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { LogoCompact } from "./Logo";
import { SITE } from "@/lib/constants";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2">
        <div>
          <LogoCompact />
          <p className="mt-4 max-w-sm text-sm text-slate-600 dark:text-slate-400">
            {SITE.baseline}. Crédit de 50 000 à 10 000 000 FCFA, de 1 à 15 ans.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
            Un crédit vous engage et doit être remboursé. Vérifiez votre capacité
            de remboursement avant de vous engager.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-bold">Contact</p>
          <a href={`tel:${SITE.phoneE164}`} className="flex items-center gap-2 font-medium">
            <Phone size={16} aria-hidden /> {SITE.phoneDisplay}
          </a>
          <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 font-medium">
            <Mail size={16} aria-hidden /> {SITE.email}
          </a>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <MapPin size={16} aria-hidden /> Lomé, Togo
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 font-medium">
            <Link href="/mentions-legales" className="text-brand-blue dark:text-brand-sky">
              Mentions légales
            </Link>
            <Link href="/connexion" className="text-brand-blue dark:text-brand-sky">
              Se connecter
            </Link>
            <Link href="/inscription" className="text-brand-blue dark:text-brand-sky">
              Ouvrir un compte
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-800">
        © {new Date().getFullYear()} {SITE.name} — Tous droits réservés.
      </div>
    </footer>
  );
}
