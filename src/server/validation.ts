import { z } from "zod";
import { normalizeTogoPhone } from "@/lib/phone";
import {
  CREDIT_DUREE_MAX_ANNEES,
  CREDIT_DUREE_MIN_ANNEES,
  CREDIT_MAX_FCFA,
  CREDIT_MIN_FCFA,
  MOBILE_PROVIDERS,
} from "@/lib/constants";

const phoneTogo = z
  .string({ message: "Le numéro de téléphone est obligatoire." })
  .transform((value, ctx) => {
    const normalized = normalizeTogoPhone(value);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Numéro togolais invalide : 8 chiffres attendus après +228.",
      });
      return z.NEVER;
    }
    return normalized;
  });

const motDePasse = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(72, "Le mot de passe est trop long.");

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Indiquez votre nom complet.")
      .max(100, "Le nom est trop long."),
    phone: phoneTogo,
    password: motDePasse,
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.confirmPassword || data.confirmPassword === data.password,
    { message: "Les deux mots de passe ne correspondent pas.", path: ["confirmPassword"] }
  );

export const loginSchema = z.object({
  phone: phoneTogo,
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: z.string().min(1, "Le mot de passe est obligatoire."),
});

const optionalText = (label: string, max = 255) =>
  z
    .string()
    .trim()
    .max(max, `${label} est trop long.`)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(3, "Indiquez votre nom complet.").max(100).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Adresse email invalide.")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide.")
    .refine((value) => {
      const d = new Date(`${value}T12:00:00`);
      if (Number.isNaN(d.getTime())) return false;
      const aujourdHui = new Date();
      let age = aujourdHui.getFullYear() - d.getFullYear();
      const m = aujourdHui.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && aujourdHui.getDate() < d.getDate())) age -= 1;
      return age >= 18 && age <= 120;
    }, "Vous devez avoir au moins 18 ans.")
    .optional(),
  address: optionalText("L'adresse"),
  city: optionalText("La ville", 100),
  profession: optionalText("La profession", 100),
  monthlyIncomeFcfa: z.coerce
    .number()
    .int("Le revenu doit être un montant entier en FCFA.")
    .min(1, "Le revenu mensuel doit être supérieur à 0.")
    .max(1_000_000_000)
    .optional(),
  witnessName: optionalText("Le nom du témoin", 100),
  witnessRelation: optionalText("Le lien du témoin", 100),
  witnessPhone: z
    .string()
    .optional()
    .transform((value, ctx) => {
      if (!value || value.trim() === "") return undefined;
      const normalized = normalizeTogoPhone(value);
      if (!normalized) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Téléphone du témoin invalide (numéro togolais attendu).",
        });
        return z.NEVER;
      }
      return normalized;
    }),
});

export const loanSchema = z.object({
  amountFcfa: z.coerce
    .number()
    .int("Le montant doit être un nombre entier.")
    .min(CREDIT_MIN_FCFA, `Montant minimum : ${CREDIT_MIN_FCFA.toLocaleString("fr-FR")} FCFA.`)
    .max(CREDIT_MAX_FCFA, `Montant maximum : ${CREDIT_MAX_FCFA.toLocaleString("fr-FR")} FCFA.`),
  durationYears: z.coerce
    .number()
    .int("La durée doit être en années entières.")
    .min(CREDIT_DUREE_MIN_ANNEES, "Durée minimum : 1 an.")
    .max(CREDIT_DUREE_MAX_ANNEES, "Durée maximum : 15 ans."),
  reason: z
    .string()
    .trim()
    .min(10, "Décrivez le motif de votre crédit en quelques mots (10 caractères minimum).")
    .max(1000, "Le motif est trop long."),
});

export const transferSchema = z
  .object({
    channel: z.enum(["MOBILE", "BANQUE"], {
      message: "Choisissez Mobile Money ou Banque.",
    }),
    provider: z.string().trim().min(1, "Choisissez l'opérateur ou la banque.").max(100),
    destinationName: z
      .string()
      .trim()
      .min(3, "Indiquez le nom du bénéficiaire.")
      .max(120),
    destinationNumber: z.string().trim().min(6, "Numéro de destination invalide.").max(64),
    amountFcfa: z.coerce
      .number()
      .int("Le montant doit être un nombre entier.")
      .min(100, "Montant minimum de transfert : 100 FCFA.")
      .max(50_000_000),
  })
  .superRefine((data, ctx) => {
    if (data.channel === "MOBILE") {
      if (!(MOBILE_PROVIDERS as readonly string[]).includes(data.provider)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["provider"],
          message: "Choisissez TMoney (Togocom) ou Flooz (Moov Africa).",
        });
      }
      if (!normalizeTogoPhone(data.destinationNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["destinationNumber"],
          message: "Numéro Mobile Money togolais invalide (8 chiffres).",
        });
      }
    }
  })
  .transform((data) => ({
    ...data,
    destinationNumber:
      data.channel === "MOBILE"
        ? (normalizeTogoPhone(data.destinationNumber) as string)
        : data.destinationNumber.replace(/\s+/g, ""),
  }));

export const decisionSchema = z.object({
  decision: z.enum(["APPROUVE", "REFUSE"]),
  adminNote: z.string().trim().max(1000).optional(),
});

export const rateUpdateSchema = z.object({
  annualRatePercent: z.coerce
    .number()
    .min(0, "Le taux ne peut pas être négatif.")
    .max(100, "Le taux semble trop élevé (100 % maximum)."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Saisissez votre mot de passe actuel."),
    newPassword: motDePasse,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les deux mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
