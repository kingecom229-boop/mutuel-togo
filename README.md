# MUTUEL TOGO — Votre crédit en ligne, simplement

Plateforme web (pensée mobile d'abord) de **demande de crédit en ligne pour les
particuliers et les PME du Togo** : inscription par numéro togolais, bonus de
bienvenue, dossier client (KYC) approuvé automatiquement à 100 %, demandes de
crédit de **50 000 à 10 000 000 FCFA** sur **1 à 15 ans** (taux configurable,
2 %/an par défaut), transferts Mobile Money / banque validés par la direction,
messagerie client ↔ administration avec Pièces jointes , et back-office complet.

- 📞 **+228 98 00 01 01** — ✉️ **credit@mutuel-togo.com** — Lomé, Togo

---

## Démarrage rapide (VS Code)

Prérequis : **Node.js 20+** (vérifiez avec `node --version`). Aucune base de
données à installer pour commencer.

```bash
# 1. Installer les dépendances
npm install

# 2. Créer votre configuration locale
cp .env.example .env.local        # Windows PowerShell : Copy-Item .env.example .env.local
```

Ouvrez `.env.local` et renseignez au minimum :

| Variable | Rôle |
|---|---|
| `JWT_SECRET` | Secret de session (32+ caractères). Générez-le : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` | Email de connexion du back-office |
| `ADMIN_PASSWORD` | Mot de passe admin initial (utilisé uniquement à la première création du compte admin ; modifiable ensuite dans le back-office, onglet **Paramètres**) |

```bash
# 3. Initialiser la base (migrations + compte admin) — facultatif,
#    fait aussi automatiquement au premier appel
npm run db:setup

# 4. Lancer le serveur de développement
npm run dev
```

Puis ouvrez **http://localhost:3000**.

### Tester sur vos téléphones (même Wi-Fi)

Le serveur écoute sur tout le réseau local (`0.0.0.0`) :

1. Trouvez l'IP locale de votre PC : `ipconfig` (Windows) → « Adresse IPv4 »,
   ex. `192.168.1.15`. Sur Mac/Linux : `ip a` ou Réglages → Wi-Fi.
2. Sur le téléphone connecté au **même Wi-Fi**, ouvrez `http://192.168.1.15:3000`.
3. Si Windows demande l'autorisation du pare-feu pour Node.js, acceptez sur le
   réseau **privé**.
4. Pour un rendu production : `npm run build` puis `npm run start`
   (même adresse). Mettez alors `NEXT_PUBLIC_SITE_URL=http://192.168.1.15:3000`
   dans `.env.local` avant le build pour un sitemap correct.

> Astuce mobile : depuis le navigateur du téléphone, « Ajouter à l'écran
> d'accueil » installe MUTUEL TOGO comme une application (manifeste PWA inclus).

---

## Parcours fonctionnel

### Client
1. **Accueil** → présentation, photos, coordonnées, mode clair/sombre (soleil/lune).
2. **Inscription** (nom, tél. togolais +228, mot de passe) → **+500 FCFA de bonus**
   (ligne d'historique réelle). À la connexion, le **numéro est pré-rempli**
   (mémorisé sur l'appareil — jamais le mot de passe, pour votre sécurité).
3. **Tableau de bord** : carte virtuelle (nom, date, solde FCFA, œil), bouton
   **DEMANDER UN CRÉDIT**, statistiques, **historique réel uniquement**
   (aucune opération fictive), navbar du bas : Accueil · Messages · Transfert · Profil.
4. **Profil** : email, naissance, adresse, ville, profession, revenu, **photo
   portrait**, **CNI recto/verso**, **témoin** (nom, lien, téléphone). Rien n'est
   obligatoire au départ ; à **100 % → mention APPROUVÉ automatique**, requise
   pour demander un crédit.
5. **Crédit** : montant, durée, motif, simulation en direct (mensualité au taux
   en vigueur). Plusieurs demandes simultanées possibles. **Approuvé = montant
   crédité sur le solde** + historique. Le bonus devient retirable après ce
   premier crédit accordé.
6. **Transfert** (Mobile Money TMoney/Flooz ou banque, sans API externe) :
   formulaire → écran « **Félicitations, votre transfert a bien été initié
   vers… La direction vous contactera pour finaliser le transfert** ». Le solde
   n'est **débité qu'après validation admin**.
7. **Messages** : discussion directe avec la direction, Pièces jointes  (photo/PDF).

### Administrateur (`/admin/connexion`)
- **Tableau** : clients, encours des soldes, demandes en attente, messages non lus.
- **Clients** : dossier complet de chacun (informations, documents, crédits,
  transferts, historique).
- **Crédits** : approuver (crédite le solde) ou refuser, avec note au client.
- **Transferts** : valider (débite le solde ; l'envoi réel est ensuite fait par
  la direction) ou refuser.
- **Messages** : une conversation par client, Pièces jointes .
- **Paramètres** : taux annuel des nouveaux crédits + changement du mot de
  passe admin.

---

## Architecture (pour les futurs développeurs)

Application **Next.js 15 (App Router) + TypeScript**, pensée « API d'abord » :
le frontend ne parle qu'aux routes `/api/*`, ce qui rendra la création d'une
**application mobile** (React Native, etc.) directe en réutilisant les mêmes API.

```
src/
  app/            Pages (accueil, espace client, /admin) + routes API
  components/     habillage (AppShell, AdminShell, BottomNav, Chat, Logo...)
  lib/            Règles partagées testées : téléphone TG, crédit, KYC, formats
  server/
    db/           Accès PostgreSQL + migrations SQL versionnées
    services/     Profil/KYC, portefeuille (règles d'argent)
    auth.ts       Sessions JWT cookie httpOnly, bcrypt
    validation.ts schémas Zod (messages FR)
    storage.ts    Fichiers privés (local aujourd'hui, cloud demain)
tests/            Tests unitaires des règles métier (node:test)
scripts/          db-setup, smoke test end-to-end
docs/             Base de données, API
```

### Base de données : PostgreSQL partout

- **Local** : PostgreSQL embarqué **PGlite** (zéro installation, données dans
  `./.data/pglite`, dossier ignoré par Git).
- **Production** : mettez `DATABASE_URL=postgresql://…` dans `.env.local` —
  **le même SQL** bascule sur un vrai serveur PostgreSQL (un
  `docker-compose.postgres.yml` est fourni pour tester ce mode).
- Schéma et règles d'argent : voir [`docs/BASE_DE_DONNEES.md`](docs/BASE_DE_DONNEES.md).

> Prisma avait été envisagé, mais son moteur binaire (téléchargé depuis un CDN
> dédié) empêchait les tests dans certains environnements et les démarrages
> « zéro installation ». SQL explicite + PGlite donnent le même schéma
> PostgreSQL, lisible et testable partout. Détails dans la note technique de la doc BDD.

### Sécurité (défaut)

Mots de passe **bcrypt**, sessions signées en **cookie httpOnly**, **aucun
secret dans le frontend** (tout passe par `.env.local`), validation Zod,
requêtes SQL paramétrées, mouvements d'argent en **transactions atomiques**,
documents servis uniquement après contrôle d'accès, limitation des tentatives
de connexion, en-têtes de sécurité, pages privées exclues du SEO
(`robots.txt`, sitemap limité aux pages publiques), 404 et redirections soignées.

### Commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | Développement sur http://localhost:3000 (réseau local inclus) |
| `npm run build` / `npm run start` | Build puis serveur de production |
| `npm run db:setup` | Migrations + paramètres + compte admin |
| `npm test` | Tests unitaires des règles métier |
| `node --env-file=.env.local scripts/smoke-test.mjs` | Parcours complet automatisé (serveur démarré requis) : inscription → KYC 100 % → crédit approuvé → transfert → messagerie |

### Variables d'environnement

Voir [`.env.example`](.env.example) (commenté). Points d'attention production :
`JWT_SECRET` fort, `COOKIE_SECURE=true` derrière HTTPS,
`NEXT_PUBLIC_SITE_URL` = domaine public, `DATABASE_URL` PostgreSQL,
sauvegarde régulière de la base et du dossier `uploads/` (documents clients).

---

## Et ensuite ?

- **Application mobile** : réutiliser les API existantes (`docs/API.md`).
- **Paiements réels** : brancher un agrégateur Mobile Money à la place de la
  finalisation manuelle, côté `src/app/api/admin/transferts` (débit interne
  déjà transactionnel).
- **Stockage cloud** : implémenter le pilote dans `src/server/storage.ts`.
- **OTP SMS** : ajouter une vérification du numéro à l'inscription.

*Bon développement — l'équipe MUTUEL TOGO.* 🇹🇬
