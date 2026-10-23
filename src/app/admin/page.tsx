"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BadgeCheck,
  HandCoins,
  MessagesSquare,
  Percent,
  UsersRound,
  Wallet,
} from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { Alerte, BadgeStatut, Chargement } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { formatFcfa, formatDate } from "@/lib/format";
import { formatTogoPhone } from "@/lib/phone";

interface Stats {
  clients: { total: number; approuves: number };
  encoursSoldesFcfa: number;
  credits: { enAttente: number; approuves: number; refuses: number; totalAccordeFcfa: number };
  transferts: { enAttente: number; approuves: number; refuses: number };
  messagesNonLus: number;
  annualRatePercent: number;
  recentClients: Array<{
    id: string; fullName: string; phone: string | null; balanceFcfa: number;
    createdAt: string; profilePercent: number; profileStatus: string;
  }>;
}

export default function PageAdminTableau() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setStats(await apiGet<Stats>("/api/admin/tableau"));
  }, []);

  useEffect(() => {
    charger().catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
  }, [charger]);

  if (!stats && !erreur) return (<AdminShell><Chargement /></AdminShell>);
  if (!stats) return (<AdminShell>{erreur ? <Alerte type="erreur">{erreur}</Alerte> : null}</AdminShell>);

  const cartes = [
    { Icone: UsersRound, label: "Clients inscrits", valeur: String(stats.clients.total), href: "/admin/utilisateurs" },
    { Icone: BadgeCheck, label: "profils APPROUVÉS", valeur: String(stats.clients.approuves), href: "/admin/utilisateurs" },
    { Icone: Wallet, label: "Soldes clients (encours)", valeur: formatFcfa(stats.encoursSoldesFcfa), href: "/admin/utilisateurs" },
    { Icone: Percent, label: "Taux annuel en vigueur", valeur: `${stats.annualRatePercent} %`, href: "/admin/parametres" },
    { Icone: HandCoins, label: "Crédits en attente", valeur: String(stats.credits.enAttente), href: "/admin/credits" },
    { Icone: HandCoins, label: "Total crédits accordés", valeur: formatFcfa(stats.credits.totalAccordeFcfa), href: "/admin/credits" },
    { Icone: ArrowLeftRight, label: "Transferts en attente", valeur: String(stats.transferts.enAttente), href: "/admin/transferts" },
    { Icone: MessagesSquare, label: "Messages non lus", valeur: String(stats.messagesNonLus), href: "/admin/messages" },
  ];

  return (
    <AdminShell>
      <h1 className="text-2xl font-black">Tableau de bord</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Vue d&apos;ensemble de la plateforme MUTUEL TOGO.
      </p>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cartes.map(({ Icone, label, valeur, href }) => (
          <Link key={label} href={href} className="carte !p-4 transition hover:-translate-y-0.5">
            <Icone className="text-brand-blue dark:text-brand-sky" size={21} aria-hidden />
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-0.5 truncate font-black">{valeur}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">Derniers clients inscrits</h2>
          <Link href="/admin/utilisateurs" className="text-sm font-bold text-brand-blue dark:text-brand-sky">Tous les clients</Link>
        </div>
        {stats.recentClients.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucun client pour le moment.</p>
        ) : (
          <ul className="carte mt-3 divide-y divide-slate-100 !p-0 dark:divide-slate-800">
            {stats.recentClients.map((client) => (
              <li key={client.id}>
                <Link href={`/admin/utilisateurs/${client.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <span>
                    <span className="block font-semibold">{client.fullName}</span>
                    <span className="block text-xs text-slate-500">
                      {formatTogoPhone(client.phone)} • Inscrit le {formatDate(client.createdAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-bold">{formatFcfa(client.balanceFcfa)}</span>
                    <BadgeStatut statut={client.profileStatus} label={client.profileStatus === "APPROUVE" ? "APPROUVÉ" : `${client.profilePercent} %`} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
