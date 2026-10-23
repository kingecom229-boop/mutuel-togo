"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import Chat from "@/components/Chat";
import { apiGet } from "@/lib/api";
import { formatTogoPhone } from "@/lib/phone";
import type { ApiUser } from "@/lib/types";

export default function PageAdminConversation({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [client, setClient] = useState<ApiUser | null>(null);

  useEffect(() => {
    apiGet<{ client: ApiUser }>(`/api/admin/messages/${userId}`)
      .then((d) => setClient(d.client))
      .catch(() => setClient(null));
  }, [userId]);

  return (
    <AdminShell>
      <Link href="/admin/messages" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-blue dark:text-brand-sky">
        <ArrowLeft size={16} aria-hidden /> Toutes les conversations
      </Link>
      <h1 className="mt-3 text-2xl font-black">
        {client ? client.fullName : "Conversation"}
      </h1>
      <p className="mb-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
        {client ? (
          <>
            {formatTogoPhone(client.phone)} •{" "}
            <Link href={`/admin/utilisateurs/${client.id}`} className="font-bold text-brand-blue dark:text-brand-sky">
              Voir le dossier client
            </Link>
          </>
        ) : " "}
      </p>
      <Chat
        loadUrl={`/api/admin/messages/${userId}`}
        postUrl={`/api/admin/messages/${userId}`}
        ownRole="ADMIN"
        basClasse="bottom-4"
        titreVide="Aucun message avec ce client"
        texteVide="Envoyez le premier message : décision de crédit, demande de document, confirmation de transfert..."
      />
    </AdminShell>
  );
}
