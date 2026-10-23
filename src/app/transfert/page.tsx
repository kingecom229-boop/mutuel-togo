"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, Send, Smartphone } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Alerte, BadgeStatut, Chargement, EtatVide } from "@/components/ui";
import { apiGet, apiSend } from "@/lib/api";
import { MOBILE_PROVIDERS } from "@/lib/constants";
import { formatDateTime, formatFcfa } from "@/lib/format";
import { formatTogoPhone } from "@/lib/phone";
import type { ApiTransfer, WalletInfo } from "@/lib/types";

export default function PageTransfert() {
  const [transfers, setTransfers] = useState<ApiTransfer[]>([]);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [chargement, setChargement] = useState(true);

  const [channel, setChannel] = useState<"MOBILE" | "BANQUE">("MOBILE");
  const [provider, setProvider] = useState<string>(MOBILE_PROVIDERS[0]);
  const [banque, setBanque] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [destinationNumber, setDestinationNumber] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [confirmation, setConfirmation] = useState<ApiTransfer | null>(null);

  const charger = useCallback(async () => {
    const data = await apiGet<{ transfers: ApiTransfer[]; WalletInfo: WalletInfo }>("/api/transferts");
    setTransfers(data.transfers);
    setWallet(data.WalletInfo);
  }, []);

  useEffect(() => {
    charger()
      .catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."))
      .finally(() => setChargement(false));
  }, [charger]);

  async function soumettre(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const data = await apiSend<{ transfer: ApiTransfer; message: string }>(
        "/api/transferts",
        "POST",
        {
          channel,
          provider: channel === "MOBILE" ? provider : banque,
          destinationName,
          destinationNumber,
          amountFcfa: Number(amount),
        }
      );
      setConfirmation(data.transfer);
      setAmount("");
      setDestinationName("");
      setDestinationNumber("");
      await charger();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Transfert impossible.");
    } finally {
      setEnCours(false);
    }
  }

  if (chargement) return (<AppShell><Chargement /></AppShell>);

  /* ---------- Page de félicitations ---------- */
  if (confirmation) {
    return (
      <AppShell>
        <section className="carte mt-4 text-center">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 size={34} aria-hidden />
          </span>
          <h1 className="mt-4 text-2xl font-black">Félicitations ! 🎉</h1>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-700 dark:text-slate-200">
            Votre transfert de <strong>{formatFcfa(confirmation.amountFcfa)}</strong> a bien
            été initié vers{" "}
            <strong>
              {confirmation.destinationName} (
              {confirmation.channel === "MOBILE"
                ? formatTogoPhone(confirmation.destinationNumber)
                : confirmation.destinationNumber}
              {confirmation.provider ? ` — ${confirmation.provider}` : ""})
            </strong>
            .
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            La direction vous contactera pour finaliser le transfert. Votre solde
            sera débité au moment de la validation. Vous pouvez suivre l&apos;état de
            la demande ci-dessous ou écrire à la direction via Messages.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => setConfirmation(null)} className="btn-principal">
              Faire un autre transfert
            </button>
            <Link href="/tableau-de-bord" className="btn-secondaire">
              <ArrowLeft size={18} aria-hidden /> Retour à l&apos;accueil
            </Link>
          </div>
        </section>
        <ListeTransferts transfers={transfers} />
      </AppShell>
    );
  }

  /* ---------- Formulaire ---------- */
  return (
    <AppShell>
      <h1 className="text-2xl font-black">Transfert</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Vers votre compte Mobile Money ou votre compte bancaire. La direction
        valide puis finalise chaque transfert avec vous.
      </p>

      {wallet ? (
        <section className="carte mt-4 !p-4">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span>Solde : <strong>{formatFcfa(wallet.balanceFcfa)}</strong></span>
            <span>En attente : <strong>{formatFcfa(wallet.pendingTransfersFcfa)}</strong></span>
            <span>Transferable : <strong className="text-brand-green">{formatFcfa(wallet.availableFcfa)}</strong></span>
          </div>
          {wallet.bonusLockedFcfa > 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Dont bonus de bienvenue de {formatFcfa(wallet.bonusLockedFcfa)} transférable
              après votre premier crédit accordé.
            </p>
          ) : null}
        </section>
      ) : null}

      {erreur ? <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div> : null}

      <form onSubmit={soumettre} className="carte mt-4 space-y-5">
        <div className="grid grid-cols-2 gap-3" role="tablist" aria-label="Type de transfert">
          <button
            type="button"
            onClick={() => setChannel("MOBILE")}
            className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 font-bold transition ${channel === "MOBILE" ? "border-brand-blue bg-brand-blue/10 text-brand-blue dark:border-brand-sky dark:text-brand-sky" : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}
          >
            <Smartphone size={20} aria-hidden /> Mobile Money
          </button>
          <button
            type="button"
            onClick={() => setChannel("BANQUE")}
            className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 font-bold transition ${channel === "BANQUE" ? "border-brand-blue bg-brand-blue/10 text-brand-blue dark:border-brand-sky dark:text-brand-sky" : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}
          >
            <Building2 size={20} aria-hidden /> Banque
          </button>
        </div>

        {channel === "MOBILE" ? (
          <div>
            <label htmlFor="operateur" className="libelle">Opérateur Mobile Money</label>
            <select id="operateur" className="champ" value={provider} onChange={(e) => setProvider(e.target.value)}>
              {MOBILE_PROVIDERS.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor="banque" className="libelle">Nom de la banque</label>
            <input
              id="banque"
              className="champ"
              placeholder="Ex : Ecobank, Orabank, BOA, UTB, Coris Bank..."
              value={banque}
              onChange={(e) => setBanque(e.target.value)}
              required={channel === "BANQUE"}
            />
          </div>
        )}

        <div>
          <label htmlFor="beneficiaire" className="libelle">Nom du bénéficiaire</label>
          <input
            id="beneficiaire"
            className="champ"
            placeholder="Nom complet du titulaire du compte"
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
            required
            minLength={3}
          />
        </div>

        <div>
          <label htmlFor="numero" className="libelle">
            {channel === "MOBILE" ? "Numéro Mobile Money (togolais)" : "Numéro de compte bancaire"}
          </label>
          <input
            id="numero"
            className="champ"
            inputMode={channel === "MOBILE" ? "tel" : "text"}
            placeholder={channel === "MOBILE" ? "98 00 01 01" : "Ex : TG38 ................"}
            value={destinationNumber}
            onChange={(e) => setDestinationNumber(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="montantTransfert" className="libelle">Montant (FCFA)</label>
          <input
            id="montantTransfert"
            type="number"
            inputMode="numeric"
            min={100}
            step={100}
            className="champ text-lg font-bold"
            placeholder="Ex : 25 000"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
          {wallet ? (
            <button
              type="button"
              className="mt-2 text-sm font-bold text-brand-blue dark:text-brand-sky"
              onClick={() => setAmount(wallet.availableFcfa)}
            >
              Transférer le maximum ({formatFcfa(wallet.availableFcfa)})
            </button>
          ) : null}
        </div>

        <button type="submit" disabled={enCours} className="btn-principal w-full">
          <Send size={19} aria-hidden />
          {enCours ? "Envoi en cours..." : "Valider le transfert"}
        </button>
        <p className="text-center text-xs leading-relaxed text-slate-500">
          Aucun débit immédiat : la direction vérifie et valide votre transfert,
          puis vous contacte pour le finaliser.
        </p>
      </form>

      <ListeTransferts transfers={transfers} />
    </AppShell>
  );
}

function ListeTransferts({ transfers }: { transfers: ApiTransfer[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-black">Mes transferts</h2>
      {transfers.length === 0 ? (
        <div className="mt-3"><EtatVide titre="Aucun transfert" texte="Vos demandes de transfert apparaîtront ici." /></div>
      ) : (
        <ul className="mt-3 space-y-3">
          {transfers.map((t) => (
            <li key={t.id} className="carte !p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{formatFcfa(t.amountFcfa)}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t.channel === "MOBILE" ? "📱 " : "🏦 "}
                    {t.provider ?? t.channel} • {t.destinationName} •{" "}
                    {t.channel === "MOBILE" ? formatTogoPhone(t.destinationNumber) : t.destinationNumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(t.createdAt)}</p>
                  {t.adminNote ? (
                    <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                      <strong>Direction :</strong> {t.adminNote}
                    </p>
                  ) : null}
                </div>
                <BadgeStatut statut={t.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
