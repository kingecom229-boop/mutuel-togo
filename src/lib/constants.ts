/**
 * Constantes partagees entre le frontend et le backend.
 * Aucun secret ici : uniquement des informations publiques et des regles metier.
 */

export const SITE = {
  name: "MUTUEL TOGO",
  slogan: "Votre crédit en ligne, simplement",
  baseline: "Financement des particuliers et PME en quelques clics",
  phoneDisplay: "+228 98 00 01 01",
  phoneE164: "+22898000101",
  email: "credit@mutuel-togo.com",
} as const;

export const BONUS_BIENVENUE_FCFA = 500;

export const CREDIT_MIN_FCFA = 50_000;
export const CREDIT_MAX_FCFA = 10_000_000;
export const CREDIT_DUREE_MIN_ANNEES = 1;
export const CREDIT_DUREE_MAX_ANNEES = 15;
export const TAUX_ANNUEL_DEFAUT_POURCENT = 2;

export const ROLES = { USER: "USER", ADMIN: "ADMIN" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PROFIL_STATUTS = { INCOMPLET: "INCOMPLET", APPROUVE: "APPROUVE" } as const;

export const DEMANDE_STATUTS = {
  EN_ATTENTE: "EN_ATTENTE",
  APPROUVE: "APPROUVE",
  REFUSE: "REFUSE",
} as const;
export type DemandeStatut = (typeof DEMANDE_STATUTS)[keyof typeof DEMANDE_STATUTS];

export const DEMANDE_STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  APPROUVE: "Approuvé",
  REFUSE: "Refusé",
};

export const TRANSFERT_CANAUX = { MOBILE: "MOBILE", BANQUE: "BANQUE" } as const;
export const MOBILE_PROVIDERS = ["TMoney (Togocom)", "Flooz (Moov Africa)"] as const;

export const TRANSACTION_TYPES = {
  BONUS: "BONUS_BIENVENUE",
  CREDIT: "CREDIT_ACCORDE",
  TRANSFERT: "TRANSFERT_ENVOYE",
} as const;

export const FICHIER_USAGES = {
  PORTRAIT: "PORTRAIT",
  CNI_RECTO: "CNI_RECTO",
  CNI_VERSO: "CNI_VERSO",
  MESSAGE: "MESSAGE",
} as const;
