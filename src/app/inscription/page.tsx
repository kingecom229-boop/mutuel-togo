"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, UserPlus } from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import { LogoComplet } from "@/components/Logo";
import { Alerte } from "@/components/ui";
import { apiSend } from "@/lib/api";

export default function PageInscription() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    if (password !== confirmPassword) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setEnCours(true);
    try {
      await apiSend("/api/auth/inscription", "POST", {
        fullName,
        phone,
        password,
        confirmPassword,
      });
      try {
        localStorage.setItem("mutuel-dernier-telephone", phone);
      } catch {
        /* ignore */
      }
      router.replace("/tableau-de-bord");
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Inscription impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main className="mx-auto max-w-md px-4 py-8">
        <LogoComplet />
        <h1 className="mt-7 text-2xl font-black">Créer mon compte</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Particuliers et PME : un seul compte pour tous vos projets au Togo.
        </p>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
          <Gift size={20} aria-hidden />
          Bonus de bienvenue : 500 FCFA crédités dès l&apos;inscription.
        </div>

        <form onSubmit={soumettre} className="carte mt-5 space-y-4">
          {erreur ? <Alerte type="erreur">{erreur}</Alerte> : null}
          <div>
            <label htmlFor="fullName" className="libelle">Nom complet</label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Ex : Adjoua Mensah"
              className="champ"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={3}
            />
          </div>
          <div>
            <label htmlFor="phone" className="libelle">Numéro de téléphone togolais</label>
            <div className="flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/15 dark:border-slate-700 dark:bg-slate-900">
              <span className="flex items-center border-r border-slate-200 px-3 font-bold text-slate-500 dark:border-slate-700">
                +228
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98 00 01 01"
                className="min-h-12 w-full bg-transparent px-3 py-3 text-base outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="libelle">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              className="champ"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <label htmlFor="confirm" className="libelle">Confirmer le mot de passe</label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Répétez le mot de passe"
              className="champ"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <button type="submit" disabled={enCours} className="btn-principal w-full">
            <UserPlus size={19} aria-hidden />
            {enCours ? "Création en cours..." : "Créer mon compte"}
          </button>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="font-bold text-brand-blue dark:text-brand-sky">
              Se connecter
            </Link>
          </p>
        </form>
        <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
          En créant un compte, vous acceptez que vos informations soient utilisées
          pour l&apos;étude de vos demandes de crédit (voir{" "}
          <Link href="/mentions-legales" className="underline">mentions légales</Link>).
        </p>
      </main>
    </div>
  );
}
