"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Bouton soleil/lune : mode clair par défaut, choix mémorisé sur l'appareil. */
export default function ThemeToggle() {
  const [sombre, setSombre] = useState(false);

  useEffect(() => {
    setSombre(document.documentElement.classList.contains("dark"));
  }, []);

  function basculer() {
    const nouveau = !sombre;
    setSombre(nouveau);
    document.documentElement.classList.toggle("dark", nouveau);
    try {
      localStorage.setItem("mutuel-theme", nouveau ? "dark" : "light");
    } catch {
      /* stockage indisponible : on ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={sombre ? "Passer en mode clair" : "Passer en mode sombre"}
      title={sombre ? "Mode clair" : "Mode sombre"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300"
    >
      {sombre ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  );
}
