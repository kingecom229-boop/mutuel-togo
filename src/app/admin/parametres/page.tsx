"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KeyRound, Percent, Save } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { Alerte, Chargement } from "@/components/ui";
import { apiGet, apiSend } from "@/lib/api";
import type { ApiUser } from "@/lib/types";

export default function PageAdminParametres() {
  const [admin, setAdmin] = useState<ApiUser | null>(null);
  const [taux, setTaux] = useState<string>("");
  const [messageTaux, setMessageTaux] = useState<string | null>(null);
  const [erreurTaux, setErreurTaux] = useState<string | null>(null);
  const [sauvegardeTaux, setSauvegardeTaux] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [messageMdp, setMessageMdp] = useState<string | null>(null);
  const [erreurMdp, setErreurMdp] = useState<string | null>(null);
  const [sauvegardeMdp, setSauvegardeMdp] = useState(false);

  const charger = useCallback(async () => {
    const [moi, params] = await Promise.all([
      apiGet<{ user: ApiUser | null }>("/api/auth/moi"),
      apiGet<{ annualRatePercent: number }>("/api/admin/parametres"),
    ]);
    setAdmin(moi.user);
    setTaux(String(params.annualRatePercent));
  }, []);

  useEffect(() => {
    charger().catch((e) => setErreurTaux(e instanceof Error ? e.message : "Chargement impossible."));
  }, [charger]);

  async function sauverTaux(event: FormEvent) {
    event.preventDefault();
    setErreurTaux(null);
    setMessageTaux(null);
    setSauvegardeTaux(true);
    try {
      const res = await apiSend<{ annualRatePercent: number; message: string }>(
        "/api/admin/parametres",
        "PATCH",
        { annualRatePercent: Number(taux) }
      );
      setTaux(String(res.annualRatePercent));
      setMessageTaux(res.message);
    } catch (e) {
      setErreurTaux(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setSauvegardeTaux(false);
    }
  }

  async function changerMotDePasse(event: FormEvent) {
    event.preventDefault();
    setErreurMdp(null);
    setMessageMdp(null);
    if (newPassword !== confirmPassword) {
      setErreurMdp("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSauvegardeMdp(true);
    try {
      const res = await apiSend<{ message: string }>("/api/admin/mot-de-passe", "POST", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setMessageMdp(res.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setErreurMdp(e instanceof Error ? e.message : "Changement impossible.");
    } finally {
      setSauvegardeMdp(false);
    }
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-black">Paramètres & profil admin</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {admin ? <>Connecté en tant que <strong>{admin.fullName}</strong> ({admin.email})</> : "Chargement du compte..."}
      </p>

      {admin === null && !erreurTaux ? <Chargement /> : null}

      <form onSubmit={sauverTaux} className="carte mt-5 space-y-4">
        <h2 className="flex items-center gap-2 font-bold">
          <Percent className="text-brand-blue dark:text-brand-sky" size={20} aria-hidden />
          Taux d&apos;intérêt annuel des crédits
        </h2>
        {erreurTaux ? <Alerte type="erreur">{erreurTaux}</Alerte> : null}
        {messageTaux ? <Alerte type="succes">{messageTaux}</Alerte> : null}
        <div>
          <label htmlFor="taux" className="libelle">Taux annuel (%) appliqué aux nouvelles demandes</label>
          <input
            id="taux"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.1"
            className="champ max-w-xs"
            value={taux}
            onChange={(e) => setTaux(e.target.value)}
            required
          />
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Les demandes déjà déposées conservent le taux figé au jour de leur demande.
          </p>
        </div>
        <button type="submit" disabled={sauvegardeTaux} className="btn-principal">
          <Save size={18} aria-hidden /> {sauvegardeTaux ? "Enregistrement..." : "Enregistrer le taux"}
        </button>
      </form>

      <form onSubmit={changerMotDePasse} className="carte mt-5 space-y-4">
        <h2 className="flex items-center gap-2 font-bold">
          <KeyRound className="text-brand-blue dark:text-brand-sky" size={20} aria-hidden />
          Changer mon mot de passe administrateur
        </h2>
        {erreurMdp ? <Alerte type="erreur">{erreurMdp}</Alerte> : null}
        {messageMdp ? <Alerte type="succes">{messageMdp}</Alerte> : null}
        <div>
          <label htmlFor="mdp-actuel" className="libelle">Mot de passe actuel</label>
          <input id="mdp-actuel" type="password" autoComplete="current-password" className="champ" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mdp-nouveau" className="libelle">Nouveau mot de passe</label>
            <input id="mdp-nouveau" type="password" autoComplete="new-password" minLength={8} className="champ" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="mdp-confirm" className="libelle">Confirmer</label>
            <input id="mdp-confirm" type="password" autoComplete="new-password" minLength={8} className="champ" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
        </div>
        <button type="submit" disabled={sauvegardeMdp} className="btn-principal">
          <KeyRound size={18} aria-hidden /> {sauvegardeMdp ? "Mise à jour..." : "Mettre à jour"}
        </button>
        <p className="text-xs text-slate-500">
          Le mot de passe initial défini dans le fichier d&apos;environnement du serveur
          n&apos;est utilisé qu&apos;à la création du compte admin ; celui-ci le remplace définitivement.
        </p>
      </form>
    </AdminShell>
  );
}
