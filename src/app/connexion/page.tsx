"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import { LogoComplet } from "@/components/Logo";
import { Alerte } from "@/components/ui";
import { apiSend } from "@/lib/api";

const CLE_TELEPHONE = "mutuel-dernier-telephone";

export default function PageConnexion() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Le numéro utilisé la dernière fois est pré-rempli (jamais le mot de passe).
  useEffect(() => {
    try {
      const sauvegarde = localStorage.getItem(CLE_TELEPHONE);
      if (sauvegarde) setPhone(sauvegarde);
    } catch {
      /* ignore */
    }
  }, []);

  async function soumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await apiSend("/api/auth/connexion", "POST", { phone, password });
      try {
        localStorage.setItem(CLE_TELEPHONE, phone);
      } catch {
        /* ignore */
      }
      const retour = new URLSearchParams(window.location.search).get("retour");
      router.replace(retour && retour.startsWith("/") ? retour : "/tableau-de-bord");
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Connexion impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 py-8">
        <LogoComplet />
        <h1 className="mt-7 text-2xl font-black">Connexion</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Avec votre numéro togolais et votre mot de passe.
        </p>

        <form onSubmit={soumettre} className="carte mt-6 space-y-4">
          {erreur ? <Alerte type="erreur">{erreur}</Alerte> : null}
          <div>
            <label htmlFor="phone" className="libelle">Numéro de téléphone</label>
            <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/15 dark:border-slate-700 dark:bg-slate-900">
              <span className="flex items-center border-r border-slate-200 px-3 font-bold text-slate-500 dark:border-slate-700">
                +228
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="username"
                placeholder="98 00 01 01"
                className="min-h-12 w-full bg-transparent px-3 py-3 text-base outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Vous pouvez aussi saisir le numéro complet avec +228.
            </p>
          </div>
          <div>
            <label htmlFor="password" className="libelle">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              className="champ"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={enCours} className="btn-principal w-full">
            <LogIn size={19} aria-hidden />
            {enCours ? "Connexion en cours..." : "Se connecter"}
          </button>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Nouveau sur MUTUEL TOGO ?{" "}
            <Link href="/inscription" className="font-bold text-brand-blue dark:text-brand-sky">
              Créer un compte
            </Link>
          </p>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          Mot de passe oublié ? Contactez la direction via la page d&apos;accueil.
          Votre numéro est mémorisé sur cet appareil pour la prochaine connexion
          (jamais votre mot de passe).
        </p>
      </main>
    </div>
  );
}
