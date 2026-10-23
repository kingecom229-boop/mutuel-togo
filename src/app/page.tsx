import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Banknote,
  ClipboardCheck,
  Landmark,
  Mail,
  MessagesSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import SiteFooter from "@/components/SiteFooter";
import { LogoComplet } from "@/components/Logo";
import { SITE } from "@/lib/constants";

const ETAPES = [
  {
    Icone: UserPlus,
    titre: "1. Créez votre compte",
    texte: "Numéro togolais + mot de passe. Bonus de bienvenue de 500 FCFA offert.",
  },
  {
    Icone: ClipboardCheck,
    titre: "2. Complétez votre profil",
    texte: "Identité, photo, carte d'identité et témoin : à 100 %, mention APPROUVÉ automatique.",
  },
  {
    Icone: Banknote,
    titre: "3. Demandez votre crédit",
    texte: "De 50 000 à 10 000 000 FCFA, de 1 à 15 ans, taux dès 2 % par an. Motif libre.",
  },
  {
    Icone: BadgeCheck,
    titre: "4. Recevez la décision",
    texte: "La direction étudie votre dossier. Crédit approuvé = montant sur votre solde, transférable vers Mobile Money ou votre banque.",
  },
];

const AVANTAGES = [
  {
    Icone: Sparkles,
    titre: "Simple et 100 % en ligne",
    texte: "Tout se fait depuis votre téléphone, à Lomé comme partout au Togo.",
  },
  {
    Icone: ShieldCheck,
    titre: "Documents protégés",
    texte: "Photo et carte d'identité stockées en privé, visibles uniquement par vous et la direction.",
  },
  {
    Icone: MessagesSquare,
    titre: "Direction joignable",
    texte: "Messagerie directe avec l'administration, pièces jointes acceptées.",
  },
  {
    Icone: Landmark,
    titre: "Particuliers et PME",
    texte: "Commerce, habitat, équipement, scolarité, fonds de roulement... un seul compte pour vos projets.",
  },
];

export default function PageAccueil() {
  return (
    <div className="min-h-dvh">
      <PublicHeader />

      <main className="mx-auto max-w-5xl px-4">
        {/* HERO */}
        <section className="pb-10 pt-8 text-center sm:pt-12">
          <div className="mx-auto max-w-xl">
            <LogoComplet />
          </div>
          <h1 className="mx-auto mt-8 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">
            Votre crédit en ligne,{" "}
            <span className="text-brand-gradient">simplement.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            {SITE.baseline}. De <strong>50 000 à 10 000 000 FCFA</strong>, de{" "}
            <strong>1 à 15 ans</strong>, taux dès <strong>2 % par an</strong> — sans
            vous déplacer.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/inscription" className="btn-principal w-full sm:w-auto">
              <UserPlus size={20} aria-hidden /> Ouvrir mon compte gratuit
            </Link>
            <Link href="/connexion" className="btn-secondaire w-full sm:w-auto">
              J&apos;ai déjà un compte
            </Link>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
            🎁 500 FCFA offerts à l&apos;inscription
          </p>
        </section>

        {/* PHOTOS */}
        <section aria-label="Des familles financées par MUTUEL TOGO" className="grid gap-5 pb-12 sm:grid-cols-2">
          <figure className="overflow-hidden rounded-3xl shadow-doux">
            <Image
              src="/images/famille-credit.jpg"
              alt="Une famille togolaise heureuse devant sa boutique financée grâce à un crédit"
              width={1536}
              height={1024}
              className="aspect-[3/2] w-full object-cover"
              priority
            />
            <figcaption className="bg-white px-5 py-4 dark:bg-slate-900">
              <p className="font-bold">Leur rêve, financé.</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Une famille de Lomé développe sa boutique grâce à son crédit MUTUEL TOGO.
              </p>
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-3xl shadow-doux">
            <Image
              src="/images/famille-maison.jpg"
              alt="Une famille togolaise qui emménage dans sa nouvelle maison"
              width={1536}
              height={1024}
              className="aspect-[3/2] w-full object-cover"
            />
            <figcaption className="bg-white px-5 py-4 dark:bg-slate-900">
              <p className="font-bold">Une nouvelle maison.</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Le premier carton dans un nouveau chez-soi, financé sereinement sur la durée.
              </p>
            </figcaption>
          </figure>
        </section>

        {/* COMMENT CA MARCHE */}
        <section className="pb-12">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Comment ça marche ?</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPES.map(({ Icone, titre, texte }) => (
              <article key={titre} className="carte">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white">
                  <Icone size={23} aria-hidden />
                </span>
                <h3 className="mt-4 font-bold">{titre}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{texte}</p>
              </article>
            ))}
          </div>
        </section>

        {/* AVANTAGES */}
        <section className="pb-12">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Pourquoi MUTUEL TOGO ?</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {AVANTAGES.map(({ Icone, titre, texte }) => (
              <article key={titre} className="carte flex gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue dark:bg-brand-sky/15 dark:text-brand-sky">
                  <Icone size={23} aria-hidden />
                </span>
                <span>
                  <h3 className="font-bold">{titre}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{texte}</p>
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section className="pb-14">
          <div className="rounded-3xl bg-brand-gradient p-6 text-white shadow-carte sm:p-8">
            <h2 className="text-2xl font-black">Une question sur votre crédit ?</h2>
            <p className="mt-2 max-w-lg text-white/90">
              Notre équipe à Lomé vous répond et vous accompagne dans votre demande,
              pour les particuliers comme pour les PME.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${SITE.phoneE164}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-brand-deep"
              >
                <Phone size={19} aria-hidden /> {SITE.phoneDisplay}
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950/25 px-5 py-3 font-bold text-white ring-1 ring-white/50"
              >
                <Mail size={19} aria-hidden /> {SITE.email}
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
