/**
 * Dossier client (KYC) : lecture, creation paresseuse et recalcul du score.
 * La mention APPROUVE est automatique quand les 13 elements sont fournis.
 */
import { randomUUID } from "node:crypto";
import { query, queryOne, type SqlExecutor } from "../db";
import { computeProfileCompletion } from "@/lib/profile-completion";
import type { SessionUser } from "../auth";

export interface ProfileRow {
  id: string;
  userId: string;
  dateOfBirth: string | null;
  address: string | null;
  city: string | null;
  profession: string | null;
  monthlyIncomeFcfa: number | null;
  portraitFileId: string | null;
  cniFrontFileId: string | null;
  cniBackFileId: string | null;
  witnessName: string | null;
  witnessRelation: string | null;
  witnessPhone: string | null;
  completionPercent: number;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PROFILE_SELECT = `
  id, user_id AS "userId", date_of_birth AS "dateOfBirth", address, city, profession,
  monthly_income_fcfa AS "monthlyIncomeFcfa",
  portrait_file_id AS "portraitFileId", cni_front_file_id AS "cniFrontFileId",
  cni_back_file_id AS "cniBackFileId",
  witness_name AS "witnessName", witness_relation AS "witnessRelation",
  witness_phone AS "witnessPhone",
  completion_percent AS "completionPercent", status, approved_at AS "approvedAt",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  return queryOne<ProfileRow>(
    `SELECT ${PROFILE_SELECT} FROM profiles WHERE user_id = $1`,
    [userId]
  );
}

export async function ensureProfile(
  q: SqlExecutor,
  userId: string
): Promise<ProfileRow> {
  const rows = await q<ProfileRow>(
    `SELECT ${PROFILE_SELECT} FROM profiles WHERE user_id = $1`,
    [userId]
  );
  if (rows[0]) return rows[0];
  const id = randomUUID();
  await q(`INSERT INTO profiles (id, user_id) VALUES ($1, $2)`, [id, userId]);
  const created = await q<ProfileRow>(
    `SELECT ${PROFILE_SELECT} FROM profiles WHERE id = $1`,
    [id]
  );
  return created[0];
}

export interface ProfileView {
  profile: ProfileRow;
  fullName: string;
  email: string | null;
  percent: number;
  status: string;
  missingLabels: string[];
  completedLabels: string[];
}

export function buildProfileView(user: SessionUser, profile: ProfileRow): ProfileView {
  const completion = computeProfileCompletion({
    fullName: user.fullName,
    email: user.email,
    dateOfBirth: profile.dateOfBirth,
    address: profile.address,
    city: profile.city,
    profession: profile.profession,
    monthlyIncomeFcfa: profile.monthlyIncomeFcfa,
    portraitFileId: profile.portraitFileId,
    cniFrontFileId: profile.cniFrontFileId,
    cniBackFileId: profile.cniBackFileId,
    witnessName: profile.witnessName,
    witnessRelation: profile.witnessRelation,
    witnessPhone: profile.witnessPhone,
  });
  return {
    profile,
    fullName: user.fullName,
    email: user.email,
    percent: completion.percent,
    status: completion.status,
    missingLabels: completion.missingLabels,
    completedLabels: completion.completedLabels,
  };
}

/** Recalcule et persiste le pourcentage + le statut a partir des donnees reelles. */
export async function recomputeProfile(
  q: SqlExecutor,
  user: SessionUser
): Promise<ProfileView> {
  const profile = await ensureProfile(q, user.id);
  const view = buildProfileView(user, profile);
  const approvedAt =
    view.status === "APPROUVE" ? (profile.approvedAt ?? new Date().toISOString()) : null;
  const updated = await q<ProfileRow>(
    `UPDATE profiles
       SET completion_percent = $1, status = $2, approved_at = $3, updated_at = NOW()
     WHERE user_id = $4
     RETURNING ${PROFILE_SELECT}`,
    [view.percent, view.status, approvedAt, user.id]
  );
  return { ...view, profile: updated[0] ?? profile };
}

export async function getProfileViewForUser(user: SessionUser): Promise<ProfileView> {
  const existing = await getProfile(user.id);
  if (existing) return buildProfileView(user, existing);
  const created = await ensureProfile(query, user.id);
  return buildProfileView(user, created);
}
