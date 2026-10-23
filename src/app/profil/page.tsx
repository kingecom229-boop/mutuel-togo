"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Camera,
  Check,
  CircleDashed,
  FileText,
  IdCard,
  LogOut,
  Save,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { Alerte, BarreProgression, Chargement } from "@/components/ui";
import { apiGet, apiSend, apiUpload } from "@/lib/api";
import { formatTogoPhone } from "@/lib/phone";
import { KYC_FIELDS } from "@/lib/profile-completion";
import type { ApiProfile, ApiUser } from "@/lib/types";

interface ProfileData {
  user: ApiUser;
  profile: ApiProfile;
  percent: number;
  status: string;
  missingLabels: string[];
  completedLabels: string[];
}

export default function PageProfil() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    dateOfBirth: "",
    address: "",
    city: "",
    profession: "",
    monthlyIncomeFcfa: "",
    witnessName: "",
    witnessRelation: "",
    witnessPhone: "",
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const appliquer = useCallback((nouveau: ProfileData) => {
    setData(nouveau);
    setForm({
      fullName: nouveau.user.fullName ?? "",
      email: nouveau.user.email ?? "",
      dateOfBirth: nouveau.profile.dateOfBirth ? String(nouveau.profile.dateOfBirth).slice(0, 10) : "",
      address: nouveau.profile.address ?? "",
      city: nouveau.profile.city ?? "",
      profession: nouveau.profile.profession ?? "",
      monthlyIncomeFcfa: nouveau.profile.monthlyIncomeFcfa ? String(nouveau.profile.monthlyIncomeFcfa) : "",
      witnessName: nouveau.profile.witnessName ?? "",
      witnessRelation: nouveau.profile.witnessRelation ?? "",
      witnessPhone: nouveau.profile.witnessPhone ?? "",
    });
  }, []);

  const charger = useCallback(async () => {
    appliquer(await apiGet<ProfileData>("/api/profil"));
  }, [appliquer]);

  useEffect(() => {
    charger().catch((e) => setErreur(e instanceof Error ? e.message : "Chargement impossible."));
  }, [charger]);

  function maj(champ: keyof typeof form, valeur: string) {
    setForm((ancien) => ({ ...ancien, [champ]: valeur }));
  }

  async function enregistrer(event: FormEvent) {
    event.preventDefault();
    setErreur(null);
    setSucces(null);
    setEnCours(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (payload.monthlyIncomeFcfa) payload.monthlyIncomeFcfa = Number(payload.monthlyIncomeFcfa);
      else delete payload.monthlyIncomeFcfa;
      for (const cle of Object.keys(payload)) {
        if (payload[cle] === "") delete payload[cle];
      }
      const res = await apiSend<ProfileData & { message: string }>("/api/profil", "PATCH", payload);
      appliquer(res);
      setSucces(res.message);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  async function deconnexion() {
    await apiSend("/api/auth/deconnexion", "POST").catch(() => null);
    router.replace("/connexion");
    router.refresh();
  }

  if (!data && !erreur) return (<AppShell><Chargement /></AppShell>);
  if (!data) return (<AppShell>{erreur ? <Alerte type="erreur">{erreur}</Alerte> : null}</AppShell>);

  return (
    <AppShell>
      <h1 className="text-2xl font-black">Mon profil</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {data.user.fullName} • {formatTogoPhone(data.user.phone)}
      </p>

      {/* SCORE KYC */}
      <section className="carte mt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">Dossier client (KYC)</h2>
          {data.status === "APPROUVE" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-black text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200">
              <BadgeCheck size={16} aria-hidden /> APPROUVÉ
            </span>
          ) : (
            <span className="text-lg font-black text-brand-blue dark:text-brand-sky">{data.percent} %</span>
          )}
        </div>
        <div className="mt-3"><BarreProgression percent={data.percent} /></div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {data.status === "APPROUVE"
            ? "Votre profil est complet et APPROUVÉ : vous pouvez demander un crédit."
            : "À 100 %, la mention APPROUVÉ est automatique et débloque la demande de crédit. Aucune information n'est obligatoire dès l'ouverture du compte : complétez à votre rythme."}
        </p>
        <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
          {KYC_FIELDS.map(({ label }) => {
            const fait = data.completedLabels.includes(label);
            return (
              <li key={label} className={`flex items-center gap-2 ${fait ? "font-semibold text-emerald-700 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"}`}>
                {fait ? <Check size={16} aria-hidden /> : <CircleDashed size={16} aria-hidden />}
                {label}
              </li>
            );
          })}
        </ul>
      </section>

      {erreur ? <div className="mt-4"><Alerte type="erreur">{erreur}</Alerte></div> : null}
      {succes ? <div className="mt-4"><Alerte type="succes">{succes}</Alerte></div> : null}

      {/* DOCUMENTS */}
      <section className="carte mt-5">
        <h2 className="font-bold">Mes documents (privés)</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Photo JPG/PNG/WEBP ou PDF, 5 Mo maximum. Visibles uniquement par vous et la direction.
        </p>
        <div className="mt-4 grid gap-3">
          <EnvoiDocument
            Icone={Camera}
            titre="Photo portrait"
            usage="PORTRAIT"
            fileId={data.profile.portraitFileId}
            onDone={(message) => { setSucces(message); void charger().catch(() => null); }}
            onError={setErreur}
          />
          <EnvoiDocument
            Icone={IdCard}
            titre="Carte d'identité — recto"
            usage="CNI_RECTO"
            fileId={data.profile.cniFrontFileId}
            onDone={(message) => { setSucces(message); void charger().catch(() => null); }}
            onError={setErreur}
          />
          <EnvoiDocument
            Icone={IdCard}
            titre="Carte d'identité — verso"
            usage="CNI_VERSO"
            fileId={data.profile.cniBackFileId}
            onDone={(message) => { setSucces(message); void charger().catch(() => null); }}
            onError={setErreur}
          />
        </div>
      </section>

      {/* FORMULAIRE */}
      <form onSubmit={enregistrer} className="carte mt-5 space-y-4">
        <h2 className="font-bold">Mes informations</h2>
        <div>
          <label htmlFor="fullName" className="libelle">Nom complet</label>
          <input id="fullName" className="champ" value={form.fullName} onChange={(e) => maj("fullName", e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className="libelle">Adresse email</label>
          <input id="email" type="email" className="champ" placeholder="vous@exemple.com" value={form.email} onChange={(e) => maj("email", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dob" className="libelle">Date de naissance</label>
            <input id="dob" type="date" className="champ" value={form.dateOfBirth} onChange={(e) => maj("dateOfBirth", e.target.value)} />
          </div>
          <div>
            <label htmlFor="city" className="libelle">Ville</label>
            <input id="city" className="champ" placeholder="Ex : Lomé" value={form.city} onChange={(e) => maj("city", e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="address" className="libelle">Adresse (quartier, rue)</label>
          <input id="address" className="champ" placeholder="Ex : Tokoin, rue 12, maison n° 45" value={form.address} onChange={(e) => maj("address", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profession" className="libelle">Profession / activité</label>
            <input id="profession" className="champ" placeholder="Ex : Commerçante, chauffeur, couturier..." value={form.profession} onChange={(e) => maj("profession", e.target.value)} />
          </div>
          <div>
            <label htmlFor="revenu" className="libelle">Revenu mensuel (FCFA)</label>
            <input id="revenu" type="number" inputMode="numeric" min={0} step={1000} className="champ" placeholder="Ex : 250000" value={form.monthlyIncomeFcfa} onChange={(e) => maj("monthlyIncomeFcfa", e.target.value)} />
          </div>
        </div>

        <h3 className="pt-2 font-bold">Personne témoin à contacter</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wName" className="libelle">Nom complet du témoin</label>
            <input id="wName" className="champ" value={form.witnessName} onChange={(e) => maj("witnessName", e.target.value)} />
          </div>
          <div>
            <label htmlFor="wRelation" className="libelle">Lien avec vous</label>
            <input id="wRelation" className="champ" placeholder="Ex : frère, épouse, collègue..." value={form.witnessRelation} onChange={(e) => maj("witnessRelation", e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="wPhone" className="libelle">Téléphone du témoin (togolais)</label>
          <input id="wPhone" type="tel" inputMode="tel" className="champ" placeholder="90 00 00 00" value={form.witnessPhone} onChange={(e) => maj("witnessPhone", e.target.value)} />
        </div>

        <button type="submit" disabled={enCours} className="btn-principal w-full">
          <Save size={19} aria-hidden />
          {enCours ? "Enregistrement..." : "Enregistrer mon profil"}
        </button>
      </form>

      <button
        type="button"
        onClick={deconnexion}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
      >
        <LogOut size={19} aria-hidden /> Se déconnecter
      </button>
    </AppShell>
  );
}

function EnvoiDocument({
  Icone,
  titre,
  usage,
  fileId,
  onDone,
  onError,
}: {
  Icone: typeof Camera;
  titre: string;
  usage: "PORTRAIT" | "CNI_RECTO" | "CNI_VERSO";
  fileId: string | null;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [enCours, setEnCours] = useState(false);
  const [apercuCasse, setApercuCasse] = useState(false);

  async function envoyer(file: File) {
    setEnCours(true);
    try {
      const form = new FormData();
      form.set("usage", usage);
      form.set("file", file);
      const res = await apiUpload<{ message: string }>("/api/profil/fichier", form);
      setApercuCasse(false);
      onDone(res.message);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center gap-3">
        {fileId && !apercuCasse ? (
          // Document privé servi par l'API (pas d'optimisation Next).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/fichiers/${fileId}`}
            alt={titre}
            className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            onError={() => setApercuCasse(true)}
            loading="lazy"
          />
        ) : (
          <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Icone size={24} aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{titre}</p>
          <p className="text-xs text-slate-500">
            {fileId ? "Document enregistré ✓" : "Aucun document pour le moment"}
          </p>
          {fileId && apercuCasse ? (
            <a href={`/api/fichiers/${fileId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue dark:text-brand-sky">
              <FileText size={13} aria-hidden /> Ouvrir le document (PDF)
            </a>
          ) : null}
        </div>
        <label className="btn-secondaire shrink-0 cursor-pointer !px-3.5 text-sm">
          {enCours ? "Envoi..." : fileId ? "Remplacer" : "Choisir"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            disabled={enCours}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void envoyer(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}
