"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { Alerte, BadgeStatut, Chargement, EtatVide } from "@/components/ui";
import { apiGet, apiSend } from "@/lib/api";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { formatTogoPhone } from "@/lib/phone";
import type { ApiTransfer } from "@/lib/types";

const FILTRES = [
  { id: "EN_ATTENTE", label: "En attente" },
  { id: "APPROUVE", label: "Validés" },
  { id: "REFUSE", label: "Refusés" },
  { id: "", label: "Tous" },
] as const;

export default function PageAdminTransferts() {
  const [transferts, setTransferts] = useState<ApiTransfer[] | null>(null);
  const [filtre, setFiltre] = useState<string>("EN_ATTENTE");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [enCoursId, setEnCoursId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const url = filtre ? `/api/admin/transferts?statut=${filtre}` : "/api/admin/transferts";
    const data = await apiGet<{ transferts: ApiTransfer[] }>(url);
    setTransferts(data.transferts);
  }, [filtre]);

  useEffect(() => {
    setTransferts(null);
    charger().catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
  }, [charger]);

  async function decider(t: ApiTransfer, decision: "APPROUVE" | "REFUSE") {
    const dest = t.channel === "MOBILE" ? formatTogoPhone(t.destinationNumber) : t.destinationNumber;
    const detail =
      decision === "APPROUVE"
        ? `\nLe solde du client sera débité de ${formatFcfa(t.amountFcfa)}. Pensez ensuite à envoyer réellement les fonds vers ${t.destinationName} (${dest}) puis à prévenir le client.`
        : "";
    if (!window.confirm(`Confirmez-vous de ${decision === "APPROUVE" ? "valider" : "refuser"} ce transfert de ${formatFcfa(t.amountFcfa)} ?${detail}`)) return;
    setErreur(null);
    setMessage(null);
    setEnCoursId(t.id);
    try {
      const res = await apiSend<{ message: string }>(`/api/admin/transferts/${t.id}`, "PATCH", {
        decision,
        adminNote: notes[t.id]?.trim() || undefined,
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
      <h1 className="text-2xl font-black">Transferts à traiter</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Pas d&apos;API externe : valider débite le solde dans l&apos;application, puis la direction
        effectue l&apos;envoi réel (Mobile Money / virement) et contacte le client.
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

      {transferts === null && !erreur ? <Chargement /> : null}
      {transferts !== null && transferts.length === 0 ? (
        <div className="mt-5"><EtatVide titre="Aucun transfert dans cette catégorie" /></div>
      ) : null}

      <ul className="mt-4 space-y-3">
        {(transferts ?? []).map((t) => (
          <li key={t.id} className="carte !p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">{formatFcfa(t.amountFcfa)}</p>
                <p className="text-sm">
                  Client :{" "}
                  <Link href={`/admin/utilisateurs/${t.userId}`} className="font-bold text-brand-blue dark:text-brand-sky">
                    {t.clientName}
                  </Link>{" "}
                  ({formatTogoPhone(t.clientPhone)}) • Solde actuel : {formatFcfa(t.clientBalanceFcfa ?? 0)}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  Vers : <strong>{t.destinationName}</strong> —{" "}
                  {t.channel === "MOBILE" ? formatTogoPhone(t.destinationNumber) : t.destinationNumber}
                  {t.provider ? ` (${t.provider})` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(t.createdAt)}</p>
                {t.adminNote ? <p className="mt-1 text-sm"><strong>Note :</strong> {t.adminNote}</p> : null}
              </div>
              <BadgeStatut statut={t.status} />
            </div>

            {t.status === "EN_ATTENTE" ? (
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <label className="libelle" htmlFor={`tnote-${t.id}`}>Note pour le client (optionnel)</label>
                <input
                  id={`tnote-${t.id}`}
                  className="champ"
                  placeholder="Ex : transfert effectué, vérifiez votre compte..."
                  value={notes[t.id] ?? ""}
                  onChange={(e) => setNotes((ancien) => ({ ...ancien, [t.id]: e.target.value }))}
                />
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button type="button" disabled={enCoursId === t.id} onClick={() => decider(t, "APPROUVE")} className="btn-principal flex-1">
                    <Check size={18} aria-hidden /> Valider et débiter
                  </button>
                  <button
                    type="button"
                    disabled={enCoursId === t.id}
                    onClick={() => decider(t, "REFUSE")}
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
