"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Paperclip } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { Alerte, Chargement, EtatVide } from "@/components/ui";
import { apiGet } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { formatTogoPhone } from "@/lib/phone";

interface Conversation {
  userId: string;
  fullName: string;
  phone: string | null;
  lastContent: string | null;
  lastSenderRole: string | null;
  lastAt: string | null;
  lastAttachmentId: string | null;
  unread: number;
}

export default function PageAdminMessages() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    const charger = () =>
      apiGet<{ conversations: Conversation[] }>("/api/admin/messages")
        .then((d) => setConversations(d.conversations))
        .catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
    void charger();
    const timer = setInterval(charger, 10_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AdminShell>
      <h1 className="text-2xl font-black">Messagerie clients</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Discutez avec chaque client et échangez des documents.
      </p>
      {erreur ? <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div> : null}
      {conversations === null && !erreur ? <Chargement /> : null}
      {conversations !== null && conversations.length === 0 ? (
        <div className="mt-5"><EtatVide titre="Aucun client" /></div>
      ) : null}

      <ul className="carte mt-4 divide-y divide-slate-100 !p-0 dark:divide-slate-800">
        {(conversations ?? []).map((c) => (
          <li key={c.userId}>
            <Link href={`/admin/messages/${c.userId}`} className="flex items-center gap-3 px-4 py-3.5">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-black text-white">
                {c.fullName.trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold">{c.fullName}</span>
                  {c.lastAt ? <span className="shrink-0 text-xs text-slate-500">{formatDateTime(c.lastAt)}</span> : null}
                </span>
                <span className="block truncate text-sm text-slate-600 dark:text-slate-400">
                  {c.lastContent
                    ? `${c.lastSenderRole === "ADMIN" ? "Vous : " : ""}${c.lastContent}`
                    : c.lastAttachmentId
                      ? "📎 Pièce jointe"
                      : `${formatTogoPhone(c.phone)} — aucune discussion`}
                </span>
              </span>
              {c.unread > 0 ? (
                <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-black text-white">
                  {c.unread}
                </span>
              ) : c.lastAttachmentId ? (
                <Paperclip size={16} className="shrink-0 text-slate-400" aria-hidden />
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
