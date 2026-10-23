/**
 * Migrations SQL versionnees (PostgreSQL standard).
 * Le meme SQL tourne sur le PostgreSQL embarque local (PGlite)
 * et sur un serveur PostgreSQL de production.
 * Ne modifiez jamais une migration deja appliquee : ajoutez-en une nouvelle.
 */
export interface Migration {
  id: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: "0001_init",
    sql: /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  full_name     TEXT NOT NULL,
  phone         TEXT UNIQUE,
  email         TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','ADMIN')),
  balance_fcfa  INTEGER NOT NULL DEFAULT 0 CHECK (balance_fcfa >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS uploaded_files (
  id             TEXT PRIMARY KEY,
  owner_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose        TEXT NOT NULL CHECK (purpose IN ('PORTRAIT','CNI_RECTO','CNI_VERSO','MESSAGE')),
  original_name  TEXT NOT NULL,
  stored_name    TEXT NOT NULL UNIQUE,
  mime_type      TEXT NOT NULL,
  size_bytes     INTEGER NOT NULL,
  storage_driver TEXT NOT NULL DEFAULT 'local',
  storage_path   TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_files_owner ON uploaded_files(owner_id);

CREATE TABLE IF NOT EXISTS profiles (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth       DATE,
  address             TEXT,
  city                TEXT,
  profession          TEXT,
  monthly_income_fcfa INTEGER CHECK (monthly_income_fcfa IS NULL OR monthly_income_fcfa >= 0),
  portrait_file_id    TEXT REFERENCES uploaded_files(id) ON DELETE SET NULL,
  cni_front_file_id   TEXT REFERENCES uploaded_files(id) ON DELETE SET NULL,
  cni_back_file_id    TEXT REFERENCES uploaded_files(id) ON DELETE SET NULL,
  witness_name        TEXT,
  witness_relation    TEXT,
  witness_phone       TEXT,
  completion_percent  INTEGER NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
  status              TEXT NOT NULL DEFAULT 'INCOMPLET' CHECK (status IN ('INCOMPLET','APPROUVE')),
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loan_requests (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_fcfa          INTEGER NOT NULL CHECK (amount_fcfa BETWEEN 50000 AND 10000000),
  duration_years       INTEGER NOT NULL CHECK (duration_years BETWEEN 1 AND 15),
  annual_rate_percent  DOUBLE PRECISION NOT NULL CHECK (annual_rate_percent >= 0),
  monthly_payment_fcfa INTEGER NOT NULL,
  total_interest_fcfa  INTEGER NOT NULL,
  total_repay_fcfa     INTEGER NOT NULL,
  reason               TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (status IN ('EN_ATTENTE','APPROUVE','REFUSE')),
  admin_note           TEXT,
  decided_at           TIMESTAMPTZ,
  decided_by_id        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loan_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_status_date ON loan_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS transfer_requests (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel            TEXT NOT NULL CHECK (channel IN ('MOBILE','BANQUE')),
  provider           TEXT,
  destination_name   TEXT NOT NULL,
  destination_number TEXT NOT NULL,
  amount_fcfa        INTEGER NOT NULL CHECK (amount_fcfa > 0),
  status             TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (status IN ('EN_ATTENTE','APPROUVE','REFUSE')),
  admin_note         TEXT,
  decided_at         TIMESTAMPTZ,
  decided_by_id      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transfers_user_status ON transfer_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transfers_status_date ON transfer_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS transactions (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference           TEXT NOT NULL UNIQUE,
  type                TEXT NOT NULL CHECK (type IN ('BONUS_BIENVENUE','CREDIT_ACCORDE','TRANSFERT_ENVOYE')),
  label               TEXT NOT NULL,
  amount_fcfa         INTEGER NOT NULL,
  balance_after_fcfa  INTEGER NOT NULL CHECK (balance_after_fcfa >= 0),
  loan_request_id     TEXT,
  transfer_request_id TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id                   TEXT PRIMARY KEY,
  conversation_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role          TEXT NOT NULL CHECK (sender_role IN ('USER','ADMIN')),
  content              TEXT NOT NULL DEFAULT '',
  attachment_file_id   TEXT REFERENCES uploaded_files(id) ON DELETE SET NULL,
  read_by_user         BOOLEAN NOT NULL DEFAULT FALSE,
  read_by_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_msg_conversation ON messages(conversation_user_id, created_at);

CREATE TABLE IF NOT EXISTS settings (
  id                  INTEGER PRIMARY KEY CHECK (id = 1),
  annual_rate_percent DOUBLE PRECISION NOT NULL DEFAULT 2 CHECK (annual_rate_percent >= 0 AND annual_rate_percent <= 100),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
  },
];
