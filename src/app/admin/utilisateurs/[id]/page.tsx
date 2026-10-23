"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, MessagesSquare } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { Alerte, BadgeStatut, BarreProgression, Chargement, EtatVide } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { formatDate, formatDateTime, formatFcfa } from "@/lib/format";
import { formatTogoPhone } from "@/lib/phone";
import type { ApiLoan, ApiProfile, ApiTransaction, ApiTransfer, ApiUser } from "@/lib/types";

interface Dossier {
  user: ApiUser;
  profile: ApiProfile;
  percent: number;
  status: string;
  missingLabels: string[];
  loans: ApiLoan[];
  transfers: ApiTransfer[];
  transactions: ApiTransaction[];
}

export default function PageAdminUtilisateur({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Dossier>(`/api/admin/utilisateurs/${id}`)
      .then(setDossier)
      .catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
  }, [id]);

  if (!dossier && !erreur) return (<AdminShell><Chargement /></AdminShell>);
  if (!dossier) return (<AdminShell>{erreur ? <Alerte type="erreur">{erreur}</Alerte> : null}</AdminShell>);

  const p = dossier.profile;
  const infos: Array<[string, string]> = [
    ["Nom complet", dossier.user.fullName],
    ["Téléphone", formatTogoPhone(dossier.user.phone)],
    ["Email", dossier.user.email ?? "—"],
    ["Date de naissance", p.dateOfBirth ? formatDate(p.dateOfBirth) : "—"],
    ["Adresse", p.address ?? "—"],
    ["Ville", p.city ?? "—"],
    ["Profession", p.profession ?? "—"],
    ["Revenu mensuel", p.monthlyIncomeFcfa ? formatFcfa(p.monthlyIncomeFcfa) : "—"],
    ["Témoin", p.witnessName ?? "—"],
    ["Lien témoin", p.witnessRelation ?? "—"],
    ["Téléphone témoin", p.witnessPhone ? formatTogoPhone(p.witnessPhone) : "—"],
    ["Inscrit le", formatDateTime(dossier.user.createdAt)],
  ];

  return (
    <AdminShell>
      <Link href="/admin/utilisateurs" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue dark:text-brand-sky">
        <ArrowLeft size={16} aria-hidden /> Tous les clients
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{dossier.user.fullName}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {formatTogoPhone(dossier.user.phone)} • Solde : <strong>{formatFcfa(dossier.user.balanceFcfa)}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BadgeStatut statut={dossier.status} label={dossier.status === "APPROUVE" ? "APPROUVÉ" : `${dossier.percent} %`} />
          <Link href={`/admin/messages/${dossier.user.id}`} className="btn-principal">
            <MessagesSquare size={18} aria-hidden /> Discuter
          </Link>
        </div>
      </div>

      <section className="carte mt-5">
        <h2 className="font-bold">Dossier KYC ({dossier.percent} %)</h2>
        <div className="mt-3"><BarreProgression percent={dossier.percent} /></div>
        {dossier.missingLabels.length > 0 ? (
          <p className="mt-2 text-sm text-slate-500">Manquant : {dossier.missingLabels.join(", ")}.</p>
        ) : null}
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {infos.map(([libelle, valeur]) => (
            <div key={libelle} className="flex justify-between gap-3 border-b border-slate-100 pb-2 dark:border-slate-800">
              <dt className="text-sm font-medium text-slate-500">{libelle}</dt>
              <dd className="text-right font-semibold">{valeur}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="carte mt-5">
        <h2 className="font-bold">Documents fournis</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <DocumentAdmin titre="Photo portrait" fileId={p.portraitFileId} />
          <DocumentAdmin titre="CNI — recto" fileId={p.cniFrontFileId} />
          <DocumentAdmin titre="CNI — verso" fileId={p.cniBackFileId} />
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-black">Crédits du client</h2>
        {dossier.loans.length === 0 ? (
          <div className="mt-3"><EtatVide titre="Aucune demande de crédit" /></div>
        ) : (
          <ul className="mt-3 space-y-3">
            {dossier.loans.map((loan) => (
              <li key={loan.id} className="carte !p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{formatFcfa(loan.amountFcfa)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {loan.durationYears} an(s) • {loan.annualRatePercent} %/an • {formatFcfa(loan.monthlyPaymentFcfa)}/mois • Total {formatFcfa(loan.totalRepayFcfa)}
                    </p>
                    <p className="mt-1 text-sm">Motif : {loan.reason}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(loan.createdAt)}</p>
                    {loan.adminNote ? <p className="mt-1 text-sm"><strong>Note :</strong> {loan.adminNote}</p> : null}
                  </div>
                  <BadgeStatut statut={loan.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-black">Transferts du client</h2>
        {dossier.transfers.length === 0 ? (
          <div className="mt-3"><EtatVide titre="Aucun transfert" /></div>
        ) : (
          <ul className="mt-3 space-y-3">
            {dossier.transfers.map((t) => (
              <li key={t.id} className="carte !p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{formatFcfa(t.amountFcfa)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t.provider ?? t.channel} • {t.destinationName} • {t.channel === "MOBILE" ? formatTogoPhone(t.destinationNumber) : t.destinationNumber}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(t.createdAt)}</p>
                  </div>
                  <BadgeStatut statut={t.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-black">Historique financier</h2>
        {dossier.transactions.length === 0 ? (
          <div className="mt-3"><EtatVide titre="Aucune opération" /></div>
        ) : (
          <ul className="carte mt-3 divide-y divide-slate-100 !p-0 dark:divide-slate-800">
            {dossier.transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block font-semibold">{tx.label}</span>
                  <span className="block text-xs text-slate-500">{formatDateTime(tx.createdAt)} • {tx.reference}</span>
                </span>
                <span className={`font-black ${tx.amountFcfa >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatFcfa(tx.amountFcfa, true)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

function DocumentAdmin({ titre, fileId }: { titre: string; fileId: string | null }) {
  const [casse, setCasse] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      {fileId && !casse ? (
        <a href={`/api/fichiers/${fileId}`} target="_blank" rel="noreferrer">
          {/* Document privé via API */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/fichiers/${fileId}`} alt={titre} className="aspect-[4/3] w-full object-cover" onError={() => setCasse(true)} loading="lazy" />
        </a>
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 dark:bg-slate-800">
          <FileText size={26} aria-hidden />
          <span className="text-xs font-medium">{fileId ? "Document PDF" : "Non fourni"}</span>
          {fileId ? (
            <a href={`/api/fichiers/${fileId}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand-blue dark:text-brand-sky">
              Ouvrir
            </a>
          ) : null}
        </div>
      )}
      <p className="px-3 py-2 text-sm font-semibold">{titre}</p>
    </div>
  );
}
