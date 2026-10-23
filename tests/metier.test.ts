import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeTogoPhone, formatTogoPhone } from "../src/lib/phone";
import { computeLoan } from "../src/lib/loan";
import { computeProfileCompletion } from "../src/lib/profile-completion";

describe("normalizeTogoPhone", () => {
  it("accepte les formes courantes togolaises", () => {
    assert.equal(normalizeTogoPhone("98 00 01 01"), "+22898000101");
    assert.equal(normalizeTogoPhone("98000101"), "+22898000101");
    assert.equal(normalizeTogoPhone("+228 98 00 01 01"), "+22898000101");
    assert.equal(normalizeTogoPhone("22898000101"), "+22898000101");
    assert.equal(normalizeTogoPhone("0022898000101"), "+22898000101");
  });
  it("refuse les formats invalides", () => {
    assert.equal(normalizeTogoPhone("9800010"), null);
    assert.equal(normalizeTogoPhone("980001010"), null);
    assert.equal(normalizeTogoPhone("+33123456789"), null);
    assert.equal(normalizeTogoPhone(""), null);
    assert.equal(normalizeTogoPhone(null), null);
  });
  it("formate pour l'affichage", () => {
    assert.equal(formatTogoPhone("+22898000101"), "+228 98 00 01 01");
  });
});

describe("computeLoan", () => {
  it("calcule une mensualite coherente a 2 %/an", () => {
    const r = computeLoan(1_000_000, 5, 2);
    assert.equal(r.numberOfPayments, 60);
    // Mensualite theorique ~17 528 FCFA pour 1 000 000 FCFA a 2 %/an sur 5 ans
    assert.ok(r.monthlyPaymentFcfa >= 17_500 && r.monthlyPaymentFcfa <= 17_560);
    assert.equal(r.totalRepayFcfa, r.monthlyPaymentFcfa * 60);
    assert.equal(r.totalInterestFcfa, r.totalRepayFcfa - 1_000_000);
  });
  it("gere un taux a zero", () => {
    const r = computeLoan(120_000, 1, 0);
    assert.equal(r.monthlyPaymentFcfa, 10_000);
    assert.equal(r.totalInterestFcfa, 0);
  });
});

describe("computeProfileCompletion", () => {
  it("donne APPROUVE uniquement a 100 %", () => {
    const complet = computeProfileCompletion({
      fullName: "Adjoua Mensah",
      email: "adjoua@example.tg",
      dateOfBirth: "1992-04-12",
      address: "Rue 12, Bè",
      city: "Lomé",
      profession: "Commerçante",
      monthlyIncomeFcfa: 250_000,
      portraitFileId: "f1",
      cniFrontFileId: "f2",
      cniBackFileId: "f3",
      witnessName: "Kofi Mensah",
      witnessRelation: "Frère",
      witnessPhone: "90 10 20 30",
    });
    assert.equal(complet.percent, 100);
    assert.equal(complet.status, "APPROUVE");
    assert.deepEqual(complet.missingLabels, []);
  });
  it("liste les elements manquants", () => {
    const partiel = computeProfileCompletion({ fullName: "Adjoua Mensah" });
    assert.ok(partiel.percent < 100);
    assert.equal(partiel.status, "INCOMPLET");
    assert.ok(partiel.missingLabels.includes("Photo portrait"));
  });
  it("refuse un telephone de temoin invalide", () => {
    const r = computeProfileCompletion({ witnessPhone: "123" });
    assert.ok(r.missingLabels.includes("Temoin — telephone".normalize()) || r.percent < 100);
  });
});
