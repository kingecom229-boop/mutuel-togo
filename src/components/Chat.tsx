"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { FileText, Paperclip, SendHorizontal, X } from "lucide-react";
import { Alerte, Chargement } from "./ui";
import { apiGet, apiUpload } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { ApiMessage } from "@/lib/types";

interface ChatProps {
  loadUrl: string;
  postUrl: string;
  ownRole: "USER" | "ADMIN";
  titreVide: string;
  texteVide: string;
}

/**
 * Messagerie MUTUEL TOGO : discussion + Pieces jointes .
 * Actualisation légère toutes les 5 secondes (polling), sans websocket.
 */
export default function Chat({ loadUrl, postUrl, ownRole, titreVide, texteVide }: ChatProps) {
  const [messages, setMessages] = useState<ApiMessage[] | null>(null);
  const [texte, setTexte] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const basRef = useRef<HTMLDivElement>(null);
  const inputFichierRef = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    const data = await apiGet<{ messages: ApiMessage[] }>(loadUrl);
    setMessages(data.messages);
  }, [loadUrl]);

  useEffect(() => {
    charger().catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
    const timer = setInterval(() => charger().catch(() => null), 5000);
    return () => clearInterval(timer);
  }, [charger]);

  useEffect(() => {
    basRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages?.length]);

  async function envoyer(event: FormEvent) {
    event.preventDefault();
    if (!texte.trim() && !fichier) return;
    setErreur(null);
    setEnCours(true);
    try {
      const form = new FormData();
      form.set("content", texte.trim());
      if (fichier) form.set("file", fichier);
      await apiUpload<{ message: ApiMessage }>(postUrl, form);
      setTexte("");
      setFichier(null);
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex min-h-[62dvh] flex-col">
      {erreur ? (
        <div className="mb-3"><Alerte type="erreur">{erreur}</Alerte></div>
      ) : null}

      <div className="carte flex-1 space-y-3 overflow-y-auto !p-4">
        {messages === null ? (
          <Chargement texte="Chargement de la discussion..." />
        ) : messages.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-bold">{titreVide}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{texteVide}</p>
          </div>
        ) : (
          messages.map((message) => {
            const moi = message.senderRole === ownRole;
            return (
              <div key={message.id} className={`flex ${moi ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-sm ${
                    moi
                      ? "rounded-br-lg bg-brand-gradient text-white"
                      : "rounded-bl-lg bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                  }`}
                >
                  {message.attachmentFileId ? (
                    <PieceJointe fileId={message.attachmentFileId} inverse={moi} />
                  ) : null}
                  {message.content ? (
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.content}</p>
                  ) : null}
                  <p className={`mt-1.5 text-right text-[11px] ${moi ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={basRef} />
      </div>

      <form onSubmit={envoyer} className="sticky bottom-[76px] mt-3 rounded-3xl border border-slate-200 bg-white p-2 shadow-doux dark:border-slate-800 dark:bg-slate-900">
        {fichier ? (
          <div className="flex items-center justify-between gap-2 px-2 pb-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <FileText size={16} aria-hidden />
              <span className="truncate font-medium">{fichier.name}</span>
            </span>
            <button type="button" aria-label="Retirer la pièce jointe" onClick={() => setFichier(null)}>
              <X size={18} aria-hidden />
            </button>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <input
            ref={inputFichierRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            aria-label="Joindre un fichier"
            onClick={() => inputFichierRef.current?.click()}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Paperclip size={19} aria-hidden />
          </button>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Écrivez votre message..."
            rows={1}
            maxLength={4000}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-slate-100 px-3 py-2.5 text-base outline-none focus:ring-4 focus:ring-brand-blue/15 dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={enCours || (!texte.trim() && !fichier)}
            aria-label="Envoyer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-doux disabled:opacity-50"
          >
            <SendHorizontal size={19} aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}

/** Aperçu d'une piece jointe : image si possible, sinon lien de téléchargement (PDF...). */
function PieceJointe({ fileId, inverse }: { fileId: string; inverse: boolean }) {
  const [imageOk, setImageOk] = useState(true);
  const url = `/api/fichiers/${fileId}`;
  if (imageOk) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-2xl">
        {/* Fichier privé servi par l'API : balise img directe (pas d'optimisation Next). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Pièce jointe"
          className="max-h-56 w-full object-cover"
          onError={() => setImageOk(false)}
          loading="lazy"
        />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`mb-2 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold underline ${inverse ? "bg-white/20" : "bg-white dark:bg-slate-900"}`}
    >
      <FileText size={17} aria-hidden /> Ouvrir la pièce jointe
    </a>
  );
}
