"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { Alerte, BadgeStatut, Chargement, EtatVide } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { formatFcfa, formatDate } from "@/lib/format";
import { formatTogoPhone } from "@/lib/phone";

interface ClientResume {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  balanceFcfa: number;
  isActive: boolean;
  createdAt: string;
  profilePercent: number;
  profileStatus: string;
  city: string | null;
  profession: string | null;
  nbCredits: number;
  creditsEnAttente: number;
  transfertsEnAttente: number;
  messagesNonLus: number;
}

export default function PageAdminUtilisateurs() {
  const [clients, setClients] = useState<ClientResume[] | null>(null);
  const [recherche, setRecherche] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ utilisateurs: ClientResume[] }>("/api/admin/utilisateurs")
      .then((d) => setClients(d.utilisateurs))
      .catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
  }, []);

  const filtres = useMemo(() => {
    if (!clients) return [];
    const q = recherche.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q)
    );
  }, [clients, recherche]);

  return (
    <AdminShell>
      <h1 className="text-2xl font-black">Clients</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Tous les comptes clients et l&apos;état de leur dossier. Touchez un client pour voir ses informations et documents.
      </p>

      <div className="relative mt-4">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          className="champ !pl-10"
          placeholder="Rechercher (nom, téléphone, email, ville)..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
      </div>

      {erreur ? <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div> : null}

      {clients === null && !erreur ? <Chargement /> : null}
      {clients !== null && filtres.length === 0 ? (
        <div className="mt-5"><EtatVide titre="Aucun client trouvé" texte="Essayez un autre mot-clé." /></div>
      ) : null}

      <ul className="mt-4 space-y-3">
        {filtres.map((client) => (
          <li key={client.id}>
            <Link href={`/admin/utilisateurs/${client.id}`} className="carte block !p-4 transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{client.fullName}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {formatTogoPhone(client.phone)}
                    {client.city ? ` • ${client.city}` : ""}
                    {client.profession ? ` • ${client.profession}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Inscrit le {formatDate(client.createdAt)} • {client.nbCredits} crédit(s)
                    {client.creditsEnAttente > 0 ? ` • ${client.creditsEnAttente} en attente` : ""}
                    {client.transfertsEnAttente > 0 ? ` • ${client.transfertsEnAttente} transfert(s) en attente` : ""}
                    {client.messagesNonLus > 0 ? ` • ${client.messagesNonLus} message(s) non lu(s)` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black">{formatFcfa(client.balanceFcfa)}</p>
                  <div className="mt-1">
                    <BadgeStatut
                      statut={client.profileStatus}
                      label={client.profileStatus === "APPROUVE" ? "APPROUVÉ" : `${client.profilePercent} %`}
                    />
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
