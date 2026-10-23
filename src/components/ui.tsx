import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";

export function Chargement({ texte = "Chargement..." }: { texte?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-slate-500 dark:text-slate-400">
      <LoaderCircle className="animate-spin text-brand-blue dark:text-brand-sky" size={32} aria-hidden />
      <p className="text-sm font-medium">{texte}</p>
    </div>
  );
}

export function Alerte({
  type,
  children,
}: {
  type: "erreur" | "succes" | "info";
  children: ReactNode;
}) {
  const styles =
    type === "erreur"
      ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200"
      : type === "succes"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
        : "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-200";
  const Icone = type === "succes" ? CheckCircle2 : AlertTriangle;
  return (
    <div role="alert" className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${styles}`}>
      <Icone size={20} className="mt-0.5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

const STATUT_STYLES: Record<string, string> = {
  EN_ATTENTE:
    "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
  APPROUVE:
    "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
  REFUSE:
    "bg-red-100 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-800",
  INCOMPLET:
    "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700",
};

export function BadgeStatut({ statut, label }: { statut: string; label?: string }) {
  const texte =
    label ??
    ({ EN_ATTENTE: "En attente", APPROUVE: "Approuvé", REFUSE: "Refusé", INCOMPLET: "Incomplet" }[
      statut
    ] ?? statut);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${STATUT_STYLES[statut] ?? STATUT_STYLES.INCOMPLET}`}
    >
      {texte}
    </span>
  );
}

export function BarreProgression({ percent }: { percent: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full bg-brand-gradient transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function EtatVide({ titre, texte }: { titre: string; texte?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
      <p className="font-bold">{titre}</p>
      {texte ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{texte}</p> : null}
    </div>
  );
}
