/**
 * Test de fumée end-to-end MUTUEL TOGO.
 * Prérequis : serveur démarré (npm run dev) et variables
 * ADMIN_EMAIL / ADMIN_PASSWORD correspondant à l'admin seedé.
 * Usage : node --env-file-if-exists=.env.local scripts/smoke-test.mjs
 */
import assert from "node:assert/strict";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
assert.ok(ADMIN_EMAIL && ADMIN_PASSWORD, "ADMIN_EMAIL / ADMIN_PASSWORD requis (voir .env.local)");

let etapes = 0;
function ok(label) {
  etapes += 1;
  console.log(`  ✓ ${label}`);
}

function cookieFrom(res) {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  const session = setCookies.find((c) => c.startsWith("mutuel_session="));
  return session ? session.split(";")[0] : null;
}

async function call(path, { method = "GET", body, cookie, form } = {}) {
  const headers = {};
  if (cookie) headers.cookie = cookie;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* binaire */ }
  return { res, json, cookie: cookieFrom(res), text };
}

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAwMCAO+ip1sAAAAASUVORK5CYII=",
  "base64"
);
function fichierPng(name) {
  return new File([PNG_1X1], name, { type: "image/png" });
}

async function main() {
  console.log(`\n=== MUTUEL TOGO — smoke test sur ${BASE} ===`);

  const sante = await call("/api/sante");
  assert.equal(sante.res.status, 200);
  ok("API santé en ligne");

  const phone = `9${String(Date.now()).slice(-7)}`;
  const motDePasse = "TestClient2026!";
  const inscription = await call("/api/auth/inscription", {
    method: "POST",
    body: { fullName: "Cliente Test Smoke", phone, password: motDePasse, confirmPassword: motDePasse },
  });
  assert.equal(inscription.res.status, 201, JSON.stringify(inscription.json));
  assert.equal(inscription.json.data.user.balanceFcfa, 500);
  const clientCookie = inscription.cookie;
  assert.ok(clientCookie);
  ok(`Inscription (${phone}) : bonus 500 FCFA crédité, session ouverte`);

  const dash1 = await call("/api/tableau-de-bord", { cookie: clientCookie });
  assert.equal(dash1.json.data.WalletInfo.balanceFcfa, 500);
  assert.equal(dash1.json.data.WalletInfo.availableFcfa, 0, "bonus verrouillé avant 1er crédit");
  assert.equal(dash1.json.data.transactions.length, 1);
  assert.equal(dash1.json.data.transactions[0].type, "BONUS_BIENVENUE");
  ok("Dashboard : historique réel = bonus uniquement, bonus non retirable");

  const transfertTropTot = await call("/api/transferts", {
    method: "POST", cookie: clientCookie,
    body: { channel: "MOBILE", provider: "TMoney (Togocom)", destinationName: "Cliente Test", destinationNumber: phone, amountFcfa: 500 },
  });
  assert.equal(transfertTropTot.res.status, 400);
  ok("Transfert du bonus avant crédit : refusé");

  const creditTropTot = await call("/api/credits", {
    method: "POST", cookie: clientCookie,
    body: { amountFcfa: 500000, durationYears: 2, reason: "Achat de matériel pour ma boutique" },
  });
  assert.equal(creditTropTot.res.status, 403);
  ok("Crédit avant profil APPROUVÉ : refusé");

  const patchProfil = await call("/api/profil", {
    method: "PATCH", cookie: clientCookie,
    body: {
      email: "cliente.smoke@example.tg", dateOfBirth: "1990-05-14",
      address: "Rue 10, Tokoin", city: "Lomé", profession: "Commerçante",
      monthlyIncomeFcfa: 300000, witnessName: "Kossi Smoke",
      witnessRelation: "Frère", witnessPhone: "90112233",
    },
  });
  assert.equal(patchProfil.res.status, 200, JSON.stringify(patchProfil.json));
  ok(`Profil KYC (textes) : ${patchProfil.json.data.percent} %`);

  for (const usage of ["PORTRAIT", "CNI_RECTO", "CNI_VERSO"]) {
    const form = new FormData();
    form.set("usage", usage);
    form.set("file", fichierPng(`${usage.toLowerCase()}.png`));
    const up = await call("/api/profil/fichier", { method: "POST", cookie: clientCookie, form });
    assert.equal(up.res.status, 201, JSON.stringify(up.json));
    if (usage === "CNI_VERSO") {
      assert.equal(up.json.data.percent, 100);
      assert.equal(up.json.data.status, "APPROUVE");
    }
  }
  ok("Documents KYC envoyés : profil 100 % → APPROUVÉ automatique");

  const credit1 = await call("/api/credits", {
    method: "POST", cookie: clientCookie,
    body: { amountFcfa: 500000, durationYears: 2, reason: "Achat de matériel pour ma boutique" },
  });
  assert.equal(credit1.res.status, 201, JSON.stringify(credit1.json));
  const credit2 = await call("/api/credits", {
    method: "POST", cookie: clientCookie,
    body: { amountFcfa: 100000, durationYears: 1, reason: "Petit fonds de roulement saisonnier" },
  });
  assert.equal(credit2.res.status, 201);
  ok(`Deux demandes simultanées acceptées (mensualité 1 : ${credit1.json.data.loan.monthlyPaymentFcfa} FCFA)`);

  const adminLogin = await call("/api/auth/admin-connexion", {
    method: "POST", body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  assert.equal(adminLogin.res.status, 200, JSON.stringify(adminLogin.json));
  const adminCookie = adminLogin.cookie;
  ok("Connexion administrateur");

  const refus = await call(`/api/admin/credits/${credit2.json.data.loan.id}`, {
    method: "PATCH", cookie: adminCookie,
    body: { decision: "REFUSE", adminNote: "Second prêt refusé le temps d'honorer le premier (test)." },
  });
  assert.equal(refus.res.status, 200);
  const appro = await call(`/api/admin/credits/${credit1.json.data.loan.id}`, {
    method: "PATCH", cookie: adminCookie, body: { decision: "APPROUVE" },
  });
  assert.equal(appro.res.status, 200, JSON.stringify(appro.json));
  ok("Admin : 1 crédit approuvé, 1 refusé");

  const dash2 = await call("/api/tableau-de-bord", { cookie: clientCookie });
  assert.equal(dash2.json.data.WalletInfo.balanceFcfa, 500500);
  assert.equal(dash2.json.data.WalletInfo.bonusLockedFcfa, 0);
  ok("Solde après approbation : 500 500 FCFA, bonus déverrouillé");

  const transfert = await call("/api/transferts", {
    method: "POST", cookie: clientCookie,
    body: { channel: "MOBILE", provider: "TMoney (Togocom)", destinationName: "Cliente Test", destinationNumber: phone, amountFcfa: 10000 },
  });
  assert.equal(transfert.res.status, 201, JSON.stringify(transfert.json));
  assert.match(transfert.json.data.message, /Félicitations/);
  const valTransfert = await call(`/api/admin/transferts/${transfert.json.data.transfer.id}`, {
    method: "PATCH", cookie: adminCookie, body: { decision: "APPROUVE" },
  });
  assert.equal(valTransfert.res.status, 200, JSON.stringify(valTransfert.json));
  const dash3 = await call("/api/tableau-de-bord", { cookie: clientCookie });
  assert.equal(dash3.json.data.WalletInfo.balanceFcfa, 490500);
  assert.equal(dash3.json.data.transactions.length, 3);
  ok("Transfert initié (page félicitations) puis débité après validation admin : 490 500 FCFA");

  const msgForm = new FormData();
  msgForm.set("content", "Bonjour, merci pour le crédit accordé !");
  msgForm.set("file", fichierPng("justificatif.png"));
  const msgClient = await call("/api/messages", { method: "POST", cookie: clientCookie, form: msgForm });
  assert.equal(msgClient.res.status, 201, JSON.stringify(msgClient.json));
  const clientId = inscription.json.data.user.id;
  const reponseAdmin = await call(`/api/admin/messages/${clientId}`, {
    method: "POST", cookie: adminCookie, body: { content: "Avec plaisir, nous restons disponibles." },
  });
  assert.equal(reponseAdmin.res.status, 201);
  const filClient = await call("/api/messages", { cookie: clientCookie });
  assert.equal(filClient.json.data.messages.length, 2);
  ok("Messagerie client ↔ admin avec piece jointe");

  const mauvaiseConnexion = await call("/api/auth/connexion", {
    method: "POST", body: { phone, password: "mauvais-mot-de-passe" },
  });
  assert.equal(mauvaiseConnexion.res.status, 401);
  const sansSession = await call("/api/tableau-de-bord");
  assert.equal(sansSession.res.status, 401);
  ok("Sécurité : mauvais mot de passe et accès sans session refusés");

  console.log(`\n=== SMOKE TEST RÉUSSI : ${etapes} étapes validées ===\n`);
}

main().catch((error) => {
  console.error("\n=== SMOKE TEST ÉCHOUÉ ===");
  console.error(error);
  process.exit(1);
});
