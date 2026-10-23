import Image from "next/image";
import Link from "next/link";

/** Icône "M" fournie (fond noir d'origine) présentée dans une tuile arrondie + nom. */
export function LogoCompact({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="MUTUEL TOGO">
      <span className="block h-11 w-11 overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
        <Image
          src="/brand/icon.png"
          alt=""
          width={88}
          height={88}
          className="h-full w-full scale-[1.35] object-cover"
          priority
        />
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-black tracking-tight text-brand-blue dark:text-brand-sky">
          MUTUEL <span className="text-brand-green">TOGO</span>
        </span>
        <span className="mt-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">
          Votre crédit en ligne, simplement
        </span>
      </span>
    </Link>
  );
}

/** Logo complet fourni (utilisé sur la page d'accueil et les écrans d'accueil). */
export function LogoComplet({ className = "" }: { className?: string }) {
  return (
    <div className={`overflow-hidden rounded-3xl bg-black shadow-doux ${className}`}>
      <Image
        src="/brand/logo.png"
        alt="MUTUEL TOGO — Votre crédit en ligne, simplement. Financement des particuliers et PME en quelques clics"
        width={1200}
        height={600}
        className="h-auto w-full"
        priority
      />
    </div>
  );
}
