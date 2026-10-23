import AppShell from "@/components/AppShell";
import Chat from "@/components/Chat";

export default function PageMessages() {
  return (
    <AppShell>
      <h1 className="text-2xl font-black">Messages</h1>
      <p className="mb-4 mt-1 text-sm text-slate-600 dark:text-slate-400">
        Discussion directe avec la direction de MUTUEL TOGO.
      </p>
      <Chat
        loadUrl="/api/messages"
        postUrl="/api/messages"
        ownRole="USER"
        titreVide="Aucun message pour le moment"
        texteVide="Écrivez à la direction : question sur un crédit, transfert, document à envoyer..."
      />
    </AppShell>
  );
}
