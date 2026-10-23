# Base de données MUTUEL TOGO

## Choix technique

- **PostgreSQL partout**, SQL paramétré, aucune concaténation.
- **Local** : PostgreSQL embarqué **PGlite** (aucune installation, données dans `./.data/pglite`).
- **Production** : définissez `DATABASE_URL=postgresql://…` dans `.env.local` — le même code
  (`src/server/db/index.ts`) bascule automatiquement sur le pilote `pg`.
- Le schéma est versionné dans `src/server/db/migrations.ts`. Il est appliqué
  automatiquement au premier appel API, ou manuellement via `npm run db:setup`.

> Historique du choix : Prisma avait été envisagé, mais son moteur binaire
> (téléchargé depuis un CDN dédié) complique les environnements restreints et
> les tests « zéro installation ». SQL explicite + PGlite offrent le même
> schéma PostgreSQL, testable partout.

## Tables

| Table | Rôle |
|---|---|
| `users` | Clients (connexion téléphone) + admin (connexion email, `role=ADMIN`). Solde `balance_fcfa` (entier, ≥ 0). |
| `profiles` | Dossier KYC 1-1. `completion_percent` et `status` recalculés à chaque modification. `APPROUVE` automatique à 100 %. |
| `uploaded_files` | Métadonnées des fichiers privés (portrait, CNI, pièces jointes). Le contenu n'est servi que via `/api/fichiers/[id]` après contrôle d'accès. |
| `loan_requests` | Demandes de crédit 50 000 → 10 000 000 FCFA, 1 → 15 ans. Taux figé à la demande. Statuts : `EN_ATTENTE`, `APPROUVE`, `REFUSE`. Plusieurs demandes simultanées autorisées. |
| `transfer_requests` | Transferts Mobile Money / banque sans API externe. Le solde n'est débité qu'à la validation admin. |
| `transactions` | **Historique financier réel uniquement** : bonus de bienvenue (+500), crédit accordé, transfert validé. Montant signé + solde après opération. |
| `messages` | Conversation client ↔ admin, pièce jointe optionnelle, accusés de lecture par rôle. |
| `settings` | Paramètres back-office (ligne unique `id=1`) : taux annuel par défaut (2 %). |

## Règles d'argent (toujours en transaction atomique)

1. Inscription : `balance = 500` + transaction `BONUS_BIENVENUE`.
2. Le bonus n'est retirable qu'après le premier crédit accordé :
   tant qu'aucun prêt `APPROUVE`, le « solde disponible transfert »
   vaut `solde − 500 − transferts en attente`.
3. Approbation d'un crédit : `solde += montant` + transaction `CREDIT_ACCORDE` + statut.
4. Validation d'un transfert : re-vérification du solde, `solde -= montant`
   + transaction `TRANSFERT_ENVOYE` + statut. Refus : aucun mouvement.

## Sauvegarde (production PostgreSQL)

```bash
pg_dump "$DATABASE_URL" > backup_mutuel_togo.sql
```

En local PGlite, sauvegardez simplement le dossier `./.data/`.
