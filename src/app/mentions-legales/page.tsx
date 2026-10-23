import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de la plateforme MUTUEL TOGO.",
};

export default function PageMentionsLegales() {
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black">Mentions légales</h1>
        <div className="prose-sm mt-6 space-y-6 leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Éditeur</h2>
            <p>
              {SITE.name} — {SITE.slogan}.<br />
              {SITE.baseline}.<br />
              Lomé, Togo.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contact</h2>
            <p>
              Téléphone :{" "}
              <a className="font-semibold text-brand-blue dark:text-brand-sky" href={`tel:${SITE.phoneE164}`}>
                {SITE.phoneDisplay}
              </a>
              <br />
              Email :{" "}
              <a className="font-semibold text-brand-blue dark:text-brand-sky" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Activité</h2>
            <p>
              MUTUEL TOGO propose aux particuliers et aux PME du Togo de déposer des
              demandes de crédit en ligne (50 000 à 10 000 000 FCFA, durée de 1 à 15
              ans). Toute demande est étudiée par la direction ; l&apos;acceptation
              n&apos;est jamais automatique et reste soumise à l&apos;analyse du dossier
              du demandeur.
            </p>
            <p>
              Un crédit vous engage et doit être remboursé. Vérifiez votre capacité de
              remboursement avant de vous engager.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Données personnelles</h2>
            <p>
              Les informations et pièces transmises via la plateforme (identité, photo,
              carte d&apos;identité, coordonnées d&apos;un témoin) servent uniquement à la
              gestion de votre compte et à l&apos;étude de vos demandes. Elles ne sont
              accessibles qu&apos;à vous-même et à l&apos;administration de MUTUEL TOGO.
              Pour toute demande relative à vos données, écrivez à {SITE.email}.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Propriété intellectuelle</h2>
            <p>
              Le nom, le logo et les contenus de MUTUEL TOGO sont protégés. Toute
              reproduction sans autorisation écrite préalable est interdite.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
