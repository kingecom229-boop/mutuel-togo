"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Calculator, FileCheck2, Send } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Alerte, BadgeStatut, BarreProgression, Chargement, EtatVide } from "@/components/ui";
import { apiGet, apiSend } from "@/lib/api";
import { computeLoan } from "@/lib/loan";
import {
  CREDIT_DUREE_MAX_ANNEES,
  CREDIT_DUREE_MIN_ANNEES,
  CREDIT_MAX_FCFA,
  CREDIT_MIN_FCFA,
} from "@/lib/constants";
import { formatDateTime, formatFcfa } from "@/lib/format";
import type { ApiLoan } from "@/lib/types";

interface Contexte {
  annualRatePercent: number;
  profile: { percent: number; status: string; missingLabels: string[] };
}

export default function PageCredit() {
  const [contexte, setContexte] = useState<Contexte | null>(null);
  const [loans, setLoans] = useState<ApiLoan[]>([]);
  const [amount, setAmount] = useState(500_000);
  const [years, setYears] = useState(2);
  const [reason, setReason] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const charger = useCallback(async () => {
    const [dash, credits] = await Promise.all([
      apiGet<Contexte>("/api/tableau-de-bord"),
      apiGet<{ loans: ApiLoan[] }>("/api/credits"),
    ]);
    setContexte(dash);
    setLoans(credits.loans);
  }, []);

  useEffect(() => {
    charger().catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
  }, [charger]);

  const calcul = useMemo(() => {
    if (!contexte) return null;
    const montantValide = Math.min(CREDIT_MAX_FCFA, Math.max(CREDIT_MIN_FCFA, amount || 0));
    return computeLoan(montantValide, years, contexte.annualRatePercent);
  }, [contexte, amount, years]);

  async function soumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setSucces(null);
    setEnCours(true);
    try {
      const data = await apiSend<{ loan: ApiLoan; message: string }>("/api/credits", "POST", {
        amountFcfa: amount,
        durationYears: years,
        reason,
      });
      setSucces(data.message);
      setReason("");
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setEnCours(false);
    }
  }

  if (!contexte && !erreur) return (<AppShell><Chargement /></AppShell>);

  const approuve = contexte?.profile.status === "APPROUVE";

  return (
    <AppShell>
      <h1 className="text-2xl font-black">Demander un crédit</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Particuliers et PME : {formatFcfa(CREDIT_MIN_FCFA)} à {formatFcfa(CREDIT_MAX_FCFA)},
        de {CREDIT_DUREE_MIN_ANNEES} à {CREDIT_DUREE_MAX_ANNEES} ans.
        {contexte ? <> Taux actuel : <strong>{contexte.annualRatePercent} % par an</strong> (fixé par la direction).</> : null}
      </p>

      {erreur ? <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div> : null}
      {succes ? <div className="mt-4"><Alerte type="succes">{succes} Suivez la réponse de la direction dans vos <Link className="underline" href="/messages">messages</Link>.</Alerte></div> : null}

      {contexte && !approuve ? (
        <section className="carte mt-5">
          <h2 className="flex items-center gap-2 font-bold">
            <FileCheck2 className="text-brand-blue dark:text-brand-sky" size={20} aria-hidden />
            profil à compléter ({contexte.profile.percent} %)
          </h2>
          <div className="mt-3"><BarreProgression percent={contexte.profile.percent} /></div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            La demande de crédit nécessite la mention <strong>APPROUVÉ</strong>, obtenue
            automatiquement à 100 %. Il vous manque : {contexte.profile.missingLabels.join(", ")}.
          </p>
          <Link href="/profil" className="btn-principal mt-4 w-full">Compléter mon profil</Link>
          <p className="mt-3 text-center text-xs text-slate-500">
            Vous pouvez déjà simuler votre crédit ci-dessous pendant ce temps.
          </p>
        </section>
      ) : null}

      <form onSubmit={soumettre} className="carte mt-5 space-y-5">
        <div>
          <label htmlFor="montant" className="libelle">Montant souhaité (FCFA)</label>
          <input
            id="montant"
            type="number"
            inputMode="numeric"
            min={CREDIT_MIN_FCFA}
            max={CREDIT_MAX_FCFA}
            step={10_000}
            className="champ text-lg font-bold"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
          <input
            type="range"
            aria-label="Choisir le montant"
            min={CREDIT_MIN_FCFA}
            max={CREDIT_MAX_FCFA}
            step={10_000}
            className="mt-3 w-full"
            value={Math.min(CREDIT_MAX_FCFA, Math.max(CREDIT_MIN_FCFA, amount || CREDIT_MIN_FCFA))}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>{formatFcfa(CREDIT_MIN_FCFA)}</span>
            <span>{formatFcfa(CREDIT_MAX_FCFA)}</span>
          </div>
        </div>

        <div>
          <label htmlFor="duree" className="libelle">Durée de remboursement</label>
          <select
            id="duree"
            className="champ"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
          >
            {Array.from({ length: CREDIT_DUREE_MAX_ANNEES }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} an{n > 1 ? "s" : ""} ({n * 12} mensualités)</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="motif" className="libelle">Motif du crédit</label>
          <textarea
            id="motif"
            className="champ min-h-28"
            placeholder="Ex : développement de ma boutique à Bè, achat d'un terrain, équipement de mon atelier..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={5}
            maxLength={1000}
            disabled={!approuve}
          />
        </div>

        {calcul ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/50">
            <p className="flex items-center gap-2 font-bold text-sky-950 dark:text-sky-100">
              <Calculator size={18} aria-hidden /> Votre simulation
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-sky-950 dark:text-sky-100">
              <dt>Mensualité</dt>
              <dd className="text-right font-black">{formatFcfa(calcul.monthlyPaymentFcfa)}</dd>
              <dt>Nombre de mensualités</dt>
              <dd className="text-right font-semibold">{calcul.numberOfPayments}</dd>
              <dt>Total des intérêts</dt>
              <dd className="text-right font-semibold">{formatFcfa(calcul.totalInterestFcfa)}</dd>
              <dt>Total à rembourser</dt>
              <dd className="text-right font-black">{formatFcfa(calcul.totalRepayFcfa)}</dd>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-sky-900/80 dark:text-sky-200/80">
              Simulation indicative au taux de {calcul.annualRatePercent} % par an. La
              direction confirme les conditions définitives après étude de votre
              dossier. Un crédit vous engage et doit être remboursé.
            </p>
          </div>
        ) : null}

        <button type="submit" disabled={enCours || !approuve} className="btn-principal w-full">
          <Send size={19} aria-hidden />
          {enCours ? "Envoi en cours..." : approuve ? "Envoyer ma demande" : "Profil APPROUVÉ requis"}
        </button>
        <p className="text-center text-xs text-slate-500">
          Vous pouvez déposer plusieurs demandes : chacune est étudiée séparément par la direction.
        </p>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-black">Mes demandes</h2>
        {loans.length === 0 ? (
          <div className="mt-3"><EtatVide titre="Aucune demande de crédit" texte="Vos demandes et leurs décisions apparaîtront ici." /></div>
        ) : (
          <ul className="mt-3 space-y-3">
            {loans.map((loan) => (
              <li key={loan.id} className="carte !p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black">{formatFcfa(loan.amountFcfa)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {loan.durationYears} an{loan.durationYears > 1 ? "s" : ""} • {loan.annualRatePercent} %/an • {formatFcfa(loan.monthlyPaymentFcfa)}/mois
                    </p>
                    <p className="mt-1 text-sm">Motif : {loan.reason}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Demandé le {formatDateTime(loan.createdAt)}
                      {loan.decidedAt ? ` • Décision le ${formatDateTime(loan.decidedAt)}` : ""}
                    </p>
                    {loan.adminNote ? (
                      <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                        <strong>Direction :</strong> {loan.adminNote}
                      </p>
                    ) : null}
                  </div>
                  <BadgeStatut statut={loan.status} />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Total à rembourser : {formatFcfa(loan.totalRepayFcfa)} (intérêts {formatFcfa(loan.totalInterestFcfa)})
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
