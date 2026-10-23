import Link from "next/link";
import Image from "next/image";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="overflow-hidden rounded-3xl bg-black shadow-doux">
        <Image src="/brand/icon.png" alt="MUTUEL TOGO" width={168} height={112} priority />
      </div>
      <div>
        <p className="text-brand-gradient text-6xl font-black">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page introuvable</h1>
        <p className="mt-2 max-w-sm text-slate-600 dark:text-slate-300">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Link href="/" className="btn-principal">
        <Home size={20} aria-hidden /> Retour à l&apos;accueil
      </Link>
    </main>
  );
}
