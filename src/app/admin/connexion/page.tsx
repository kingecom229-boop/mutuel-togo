"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LogoComplet } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { Alerte } from "@/components/ui";
import { apiSend } from "@/lib/api";

export default function PageAdminConnexion() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await apiSend("/api/auth/admin-connexion", "POST", { email, password });
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Connexion impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-md justify-end px-4 pt-4">
        <ThemeToggle />
      </header>
      <main className="mx-auto max-w-md px-4 pb-10 pt-4">
        <LogoComplet />
        <div className="mt-7 flex items-center gap-2">
          <ShieldCheck className="text-brand-blue dark:text-brand-sky" size={26} aria-hidden />
          <h1 className="text-2xl font-black">Administration</h1>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Espace réservé à la direction de MUTUEL TOGO.
        </p>

        <form onSubmit={soumettre} className="carte mt-6 space-y-4">
          {erreur ? <Alerte type="erreur">{erreur}</Alerte> : null}
          <div>
            <label htmlFor="email" className="libelle">Email administrateur</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="admin@..."
              className="champ"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="libelle">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Votre mot de passe administrateur"
              className="champ"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={enCours} className="btn-principal w-full">
            {enCours ? "Vérification..." : "Accéder au back-office"}
          </button>
        </form>
      </main>
    </div>
  );
}
