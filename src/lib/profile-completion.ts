import { normalizeTogoPhone } from "./phone";

/**
 * KYC MUTUEL TOGO : la mention APPROUVE est AUTOMATIQUE a 100 %.
 * Les 13 elements ci-dessous doivent tous etre fournis.
 */
export interface ProfileCompletionInput {
  fullName?: string | null;
  email?: string | null;
  dateOfBirth?: string | Date | null;
  address?: string | null;
  city?: string | null;
  profession?: string | null;
  monthlyIncomeFcfa?: number | null;
  portraitFileId?: string | null;
  cniFrontFileId?: string | null;
  cniBackFileId?: string | null;
  witnessName?: string | null;
  witnessRelation?: string | null;
  witnessPhone?: string | null;
}

export const KYC_FIELDS: Array<{ key: keyof ProfileCompletionInput; label: string }> = [
  { key: "fullName", label: "Nom complet" },
  { key: "email", label: "Adresse email" },
  { key: "dateOfBirth", label: "Date de naissance" },
  { key: "address", label: "Adresse" },
  { key: "city", label: "Ville" },
  { key: "profession", label: "Profession" },
  { key: "monthlyIncomeFcfa", label: "Revenu mensuel (FCFA)" },
  { key: "portraitFileId", label: "Photo portrait" },
  { key: "cniFrontFileId", label: "Carte d'identité — recto" },
  { key: "cniBackFileId", label: "Carte d'identité — verso" },
  { key: "witnessName", label: "Témoin — nom complet" },
  { key: "witnessRelation", label: "Témoin — lien avec vous" },
  { key: "witnessPhone", label: "Témoin — téléphone" },
];

function isFilled(key: keyof ProfileCompletionInput, value: unknown): boolean {
  if (key === "monthlyIncomeFcfa") return typeof value === "number" && value > 0;
  if (key === "witnessPhone") return normalizeTogoPhone(String(value ?? "")) !== null;
  if (key === "email")
    return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  if (key === "dateOfBirth") {
    if (!value) return false;
    const d = value instanceof Date ? value : new Date(String(value));
    return !Number.isNaN(d.getTime());
  }
  return typeof value === "string" ? value.trim().length >= 2 : Boolean(value);
}

export function computeProfileCompletion(input: ProfileCompletionInput): {
  percent: number;
  completedLabels: string[];
  missingLabels: string[];
  status: "INCOMPLET" | "APPROUVE";
} {
  const completedLabels: string[] = [];
  const missingLabels: string[] = [];
  for (const field of KYC_FIELDS) {
    if (isFilled(field.key, input[field.key])) completedLabels.push(field.label);
    else missingLabels.push(field.label);
  }
  const percent = Math.round((completedLabels.length / KYC_FIELDS.length) * 100);
  return {
    percent,
    completedLabels,
    missingLabels,
    status: percent === 100 ? "APPROUVE" : "INCOMPLET",
  };
}
