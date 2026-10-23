# API MUTUEL TOGO

Toutes les réponses suivent le format `{ "data": ... }` en succès et
`{ "error": "message en français", "details": ... }` en échec.
L'authentification repose sur un cookie de session `httpOnly` posé à la
connexion (JWT signé, 7 jours, rôle vérifié en base à chaque appel).
Ces API sont pensées pour être réutilisées par une future application mobile.

## Publique

| Méthode & route | Description |
|---|---|
| `GET /api/sante` | État du service et de la base de données. |
| `POST /api/auth/inscription` | `{ fullName, phone, password, confirmPassword? }` → crée le compte, crédite le **bonus de 500 FCFA**, ouvre la session. |
| `POST /api/auth/connexion` | `{ phone, password }` — numéro togolais (toutes formes : `98000101`, `+228 98 00 01 01`…). |
| `POST /api/auth/admin-connexion` | `{ email, password }` — back-office. |
| `POST /api/auth/deconnexion` | Ferme la session. |
| `GET /api/auth/moi` | Utilisateur de session (`null` si déconnecté) + résumé de profil. |

## Client (rôle USER)

| Méthode & route | Description |
|---|---|
| `GET /api/tableau-de-bord` | Utilisateur, portefeuille (solde, disponible, bonus verrouillé), stats, historique réel (30 dernières), crédits récents, taux en vigueur, score de profil. |
| `GET /api/profil` | Dossier KYC complet + pourcentage, statut, éléments manquants/cochés. |
| `PATCH /api/profil` | Met à jour nom/email/naissance/adresse/ville/profession/revenu/témoin. Recalcule le score ; **APPROUVÉ automatique à 100 %**. |
| `POST /api/profil/fichier` | Multipart `{ usage: PORTRAIT\|CNI_RECTO\|CNI_VERSO, file }` (JPG/PNG/WEBP/PDF, 5 Mo par défaut). |
| `GET /api/credits` | Mes demandes de crédit. |
| `POST /api/credits` | `{ amountFcfa (50 000 → 10 000 000), durationYears (1 → 15), reason }`. Exige un profil APPROUVÉ. Le calcul (mensualité, intérêts) est fait côté serveur au taux en vigueur. |
| `GET /api/transferts` | Mes transferts + portefeuille. |
| `POST /api/transferts` | `{ channel: MOBILE\|BANQUE, provider, destinationName, destinationNumber, amountFcfa }`. Crée une demande ** EN_ATTENTE** ; aucun débit immédiat. Contrôle du « disponible » : solde − transferts en attente − bonus verrouillé (avant le 1er crédit). |
| `GET /api/messages` | Ma conversation avec la direction (marque les messages admin comme lus). |
| `POST /api/messages` | JSON `{ content }` ou multipart `{ content?, file? }`. |
| `GET /api/fichiers/[id]` | Document privé. Accès : propriétaire, admin, ou client de la conversation pour une pièce jointe de l'admin. |

## Administration (rôle ADMIN)

| Méthode & route | Description |
|---|---|
| `GET /api/admin/tableau` | Indicateurs : clients, profils approuvés, encours des soldes, crédits/transferts par statut, messages non lus, derniers inscrits, taux. |
| `GET /api/admin/utilisateurs` | Clients + score de dossier + compteurs (crédits, attentes, non-lus). |
| `GET /api/admin/utilisateurs/[id]` | Dossier complet : KYC, documents, crédits, transferts, historique financier. |
| `GET /api/admin/credits?statut=EN_ATTENTE\|APPROUVE\|REFUSE` | Demandes de crédit (avec client et score de profil). |
| `PATCH /api/admin/credits/[id]` | `{ decision: APPROUVE\|REFUSE, adminNote? }`. **APPROUVE crédite le solde** du client et écrit l'historique (transaction atomique). |
| `GET /api/admin/transferts?statut=...` | Demandes de transfert (avec solde client). |
| `PATCH /api/admin/transferts/[id]` | `{ decision, adminNote? }`. **APPROUVE débite le solde** + historique ; l'envoi réel vers Mobile Money/banque est finalisé par la direction hors plateforme. |
| `GET /api/admin/messages` | Conversations (dernier message, non lus par client). |
| `GET/POST /api/admin/messages/[userId]` | Fil de discussion d'un client / répondre (texte et/ou pièce jointe). |
| `GET/PATCH /api/admin/parametres` | Taux annuel des nouveaux crédits (`annualRatePercent`). |
| `POST /api/admin/mot-de-passe` | `{ currentPassword, newPassword, confirmPassword }`. |

Codes d'erreur fréquents : `400` données invalides, `401` session,
`403` rôle ou profil non APPROUVÉ, `404` introuvable, `409` conflit
(numéro déjà utilisé, demande déjà traitée, solde insuffisant), `429` trop
de tentatives de connexion.
