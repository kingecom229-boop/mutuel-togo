"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Eye,
  EyeOff,
  FileCheck2,
  HandCoins,
  Hourglass,
  Wallet,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { Alerte, BadgeStatut, BarreProgression, Chargement, EtatVide } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { maskTogoPhone } from "@/lib/phone";
import type { ApiLoan, ApiTransaction, ApiUser, WalletInfo } from "@/lib/types";

interface DashboardData {
  user: ApiUser;
  date: string;
  annualRatePercent: number;
  profile: { percent: number; status: string; missingLabels: string[] };
  WalletInfo: WalletInfo;
  stats: {
    totalCreditsApprouvesFcfa: number;
    creditsEnAttente: number;
    creditsApprouves: number;
    transfertsEnAttente: number;
    mensueliteEnCoursFcfa: number;
    messagesNonLus: number;
  };
  transactions: ApiTransaction[];
  recentLoans: ApiLoan[];
}

export default function PageTableauDeBord() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [masque, setMasque] = useState(false);

  const charger = useCallback(async () => {
    try {
      setData(await apiGet<DashboardData>("/api/tableau-de-bord"));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement impossible.");
    }
  }, []);

  useEffect(() => {
    void charger();
    try {
      setMasque(localStorage.getItem("mutuel-masquer-solde") === "oui");
    } catch {
      /* ignore */
    }
  }, [charger]);

  function basculerMasque() {
    const nouveau = !masque;
    setMasque(nouveau);
    try {
      localStorage.setItem("mutuel-masquer-solde", nouveau ? "oui" : "non");
    } catch {
      /* ignore */
    }
  }

  if (!data && !erreur) return (<AppShell><Chargement /></AppShell>);
  if (erreur && !data)
    return (
      <AppShell>
        <Alerte type="erreur">{erreur}</Alerte>
        <button type="button" onClick={charger} className="btn-principal mt-4">Réessayer</button>
      </AppShell>
    );
  if (!data) return null;

  const prenom = data.user.fullName.trim().split(" ")[0];
  const soldeAffiche = masque ? "•••••• FCFA" : formatFcfa(data.WalletInfo.balanceFcfa);

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Bonjour,</p>
          <h1 className="text-2xl font-black">{prenom} 👋</h1>
        </div>
        <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
          <CalendarDays size={16} aria-hidden />
          {new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" }).format(new Date(data.date))}
        </p>
      </div>

      {/* CARTE VIRTUELLE */}
      <section
        aria-label="Votre carte MUTUEL TOGO"
        className="relative mt-5 overflow-hidden rounded-[28px] bg-brand-gradient p-5 text-white shadow-carte sm:p-6"
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/15" />
        <div className="pointer-events-none absolute -bottom-20 -left-8 h-48 w-48 rounded-full bg-slate-950/15" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="block h-11 w-11 overflow-hidden rounded-2xl bg-black ring-1 ring-white/40">
              <Image src="/brand/icon.png" alt="" width={88} height={88} className="h-full w-full scale-[1.35] object-cover" />
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-black">MUTUEL TOGO</p>
              <p className="text-[11px] text-white/85">Carte membre</p>
            </div>
          </div>
          <BadgeStatut
            statut={data.profile.status}
            label={data.profile.status === "APPROUVE" ? "APPROUVÉ ✓" : `Profil ${data.profile.percent} %`}
          />
        </div>

        <div className="relative mt-6 flex items-center gap-2">
          <p className="text-sm font-medium text-white/85">Solde disponible</p>
          <button
            type="button"
            onClick={basculerMasque}
            aria-label={masque ? "Afficher le solde" : "Masquer le solde"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20"
          >
            {masque ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
          </button>
        </div>
        <p className="relative mt-1 text-3xl font-black tracking-tight sm:text-4xl">{soldeAffiche}</p>

        <div className="relative mt-6 flex items-end justify-between gap-3 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/75">Titulaire</p>
            <p className="font-bold uppercase">{data.user.fullName}</p>
            <p className="text-white/85">{maskTogoPhone(data.user.phone)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-white/75">Membre depuis</p>
            <p className="font-bold">{formatDateTime(data.user.createdAt).split(" à")[0]}</p>
          </div>
        </div>
      </section>

      {/* CTA CRÉDIT */}
      <Link href="/credit" className="btn-principal mt-5 w-full text-lg">
        <HandCoins size={22} aria-hidden /> DEMANDER UN CRÉDIT
      </Link>
      <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
        50 000 à 10 000 000 FCFA • 1 à 15 ans • Taux actuel {data.annualRatePercent} % par an
      </p>

      {/* PROFIL INCOMPLET */}
      {data.profile.status !== "APPROUVE" ? (
        <section className="carte mt-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-bold">
              <FileCheck2 className="text-brand-blue dark:text-brand-sky" size={20} aria-hidden />
              Complétez votre profil
            </h2>
            <span className="text-lg font-black text-brand-blue dark:text-brand-sky">{data.profile.percent} %</span>
          </div>
          <div className="mt-3"><BarreProgression percent={data.profile.percent} /></div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            À 100 %, votre profil obtient la mention <strong>APPROUVÉ</strong> et vous
            pouvez demander un crédit. Encore : {data.profile.missingLabels.slice(0, 3).join(", ")}
            {data.profile.missingLabels.length > 3 ? "…" : ""}.
          </p>
          <Link href="/profil" className="btn-secondaire mt-4 w-full">Compléter mon profil</Link>
        </section>
      ) : null}

      {/* BONUS VERROUILLÉ */}
      {data.WalletInfo.bonusLockedFcfa > 0 ? (
        <div className="mt-5">
          <Alerte type="info">
            Votre bonus de bienvenue de {formatFcfa(data.WalletInfo.bonusLockedFcfa)} deviendra
            transférable après l&apos;accord de votre premier crédit.
          </Alerte>
        </div>
      ) : null}

      {/* STATS */}
      <section className="mt-5 grid grid-cols-2 gap-3" aria-label="Vos chiffres">
        <article className="carte !p-4">
          <Wallet className="text-brand-green" size={20} aria-hidden />
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Disponible en transfert</p>
          <p className="mt-0.5 font-black">{masque ? "••••••" : formatFcfa(data.WalletInfo.availableFcfa)}</p>
        </article>
        <article className="carte !p-4">
          <Banknote className="text-brand-blue dark:text-brand-sky" size={20} aria-hidden />
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Crédits accordés (total)</p>
          <p className="mt-0.5 font-black">{formatFcfa(data.stats.totalCreditsApprouvesFcfa)}</p>
        </article>
        <article className="carte !p-4">
          <CalendarDays className="text-brand-blue dark:text-brand-sky" size={20} aria-hidden />
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Mensualités en cours</p>
          <p className="mt-0.5 font-black">{formatFcfa(data.stats.mensueliteEnCoursFcfa)}<span className="text-xs font-semibold text-slate-500"> /mois</span></p>
        </article>
        <article className="carte !p-4">
          <Hourglass className="text-amber-500" size={20} aria-hidden />
          <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Demandes en attente</p>
          <p className="mt-0.5 font-black">{data.stats.creditsEnAttente + data.stats.transfertsEnAttente}</p>
        </article>
      </section>

      {/* CRÉDITS RÉCENTS */}
      {data.recentLoans.length > 0 ? (
        <section className="mt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Mes crédits</h2>
            <Link href="/credit" className="text-sm font-bold text-brand-blue dark:text-brand-sky">Tout voir</Link>
          </div>
          <ul className="mt-3 space-y-3">
            {data.recentLoans.map((loan) => (
              <li key={loan.id} className="carte !p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{formatFcfa(loan.amountFcfa)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {loan.durationYears} an{loan.durationYears > 1 ? "s" : ""} • {formatFcfa(loan.monthlyPaymentFcfa)}/mois
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{loan.reason}</p>
                  </div>
                  <BadgeStatut statut={loan.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* HISTORIQUE RÉEL */}
      <section className="mt-7">
        <h2 className="text-lg font-black">Historique</h2>
        {data.transactions.length === 0 ? (
          <div className="mt-3"><EtatVide titre="Aucune opération" texte="Vos opérations réelles apparaîtront ici." /></div>
        ) : (
          <ul className="carte mt-3 divide-y divide-slate-100 !p-0 dark:divide-slate-800">
            {data.transactions.map((tx) => {
              const positif = tx.amountFcfa >= 0;
              return (
                <li key={tx.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${positif ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"}`}>
                    {positif ? <ArrowDownLeft size={18} aria-hidden /> : <ArrowUpRight size={18} aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{tx.label}</span>
                    <span className="block text-xs text-slate-500">
                      {formatDateTime(tx.createdAt)} • Réf. {tx.reference}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={`block font-black ${positif ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {masque ? "••••••" : formatFcfa(tx.amountFcfa, true)}
                    </span>
                    <span className="block text-xs text-slate-500">Solde : {masque ? "••••••" : formatFcfa(tx.balanceAfterFcfa)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
