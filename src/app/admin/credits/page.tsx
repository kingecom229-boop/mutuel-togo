"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { Alerte, BadgeStatut, Chargement, EtatVide } from "@/components/ui";
import { apiGet, apiSend } from "@/lib/api";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { formatTogoPhone } from "@/lib/phone";
import type { ApiLoan } from "@/lib/types";

const FILTRES = [
  { id: "EN_ATTENTE", label: "En attente" },
  { id: "APPROUVE", label: "Approuvés" },
  { id: "REFUSE", label: "Refusés" },
  { id: "", label: "Tous" },
] as const;

export default function PageAdminCredits() {
  const [credits, setCredits] = useState<ApiLoan[] | null>(null);
  const [filtre, setFiltre] = useState<string>("EN_ATTENTE");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [enCoursId, setEnCoursId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const url = filtre ? `/api/admin/credits?statut=${filtre}` : "/api/admin/credits";
    const data = await apiGet<{ credits: ApiLoan[] }>(url);
    setCredits(data.credits);
  }, [filtre]);

  useEffect(() => {
    setCredits(null);
    charger().catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
  }, [charger]);

  async function decider(loan: ApiLoan, decision: "APPROUVE" | "REFUSE") {
    const action = decision === "APPROUVE" ? "approuver" : "refuser";
    const detail =
      decision === "APPROUVE"
        ? `\n${formatFcfa(loan.amountFcfa)} seront crédités immédiatement sur le solde du client.`
        : "";
    if (!window.confirm(`Confirmez-vous de ${action} ce crédit de ${formatFcfa(loan.amountFcfa)} pour ${loan.clientName} ?${detail}`)) return;
    setErreur(null);
    setMessage(null);
    setEnCoursId(loan.id);
    try {
      const res = await apiSend<{ message: string }>(`/api/admin/credits/${loan.id}`, "PATCH", {
        decision,
        adminNote: notes[loan.id]?.trim() || undefined,
      });
      setMessage(res.message);
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setEnCoursId(null);
    }
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-black">Demandes de crédit</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Approuver crédite le montant sur le solde du client (historique automatique). Refuser ne déplace aucun fonds.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFiltre(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${filtre === f.id ? "bg-brand-gradient text-white" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {message ? <div className="mt-4"><Alerte type="succes">{message}</Alerte></div> : null}
      {erreur ? <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div> : null}

      {credits === null && !erreur ? <Chargement /> : null}
      {credits !== null && credits.length === 0 ? (
        <div className="mt-5"><EtatVide titre="Aucune demande dans cette catégorie" /></div>
      ) : null}

      <ul className="mt-4 space-y-3">
        {(credits ?? []).map((loan) => (
          <li key={loan.id} className="carte !p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">{formatFcfa(loan.amountFcfa)}</p>
                <p className="text-sm">
                  <Link href={`/admin/utilisateurs/${loan.userId}`} className="font-bold text-brand-blue dark:text-brand-sky">
                    {loan.clientName}
                  </Link>{" "}
                  • {formatTogoPhone(loan.clientPhone)} • Profil {loan.profilePercent} %
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {loan.durationYears} an(s) • {loan.annualRatePercent} %/an • Mensualité {formatFcfa(loan.monthlyPaymentFcfa)} • Total {formatFcfa(loan.totalRepayFcfa)}
                </p>
                <p className="mt-1.5 text-sm"><strong>Motif :</strong> {loan.reason}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(loan.createdAt)}</p>
                {loan.adminNote ? <p className="mt-1 text-sm"><strong>Note :</strong> {loan.adminNote}</p> : null}
              </div>
              <BadgeStatut statut={loan.status} />
            </div>

            {loan.status === "EN_ATTENTE" ? (
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <label className="libelle" htmlFor={`note-${loan.id}`}>Note pour le client (optionnel)</label>
                <input
                  id={`note-${loan.id}`}
                  className="champ"
                  placeholder="Ex : dossier complet, félicitations..."
                  value={notes[loan.id] ?? ""}
                  onChange={(e) => setNotes((ancien) => ({ ...ancien, [loan.id]: e.target.value }))}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={enCoursId === loan.id}
                    onClick={() => decider(loan, "APPROUVE")}
                    className="btn-principal flex-1"
                  >
                    <Check size={18} aria-hidden /> Approuver et créditer
                  </button>
                  <button
                    type="button"
                    disabled={enCoursId === loan.id}
                    onClick={() => decider(loan, "REFUSE")}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 disabled:opacity-60 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
                  >
                    <X size={18} aria-hidden /> Refuser
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
