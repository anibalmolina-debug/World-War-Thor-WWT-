-- Minimal schema for slice S1. Applied locally when Postgres is available;
-- Netlify Database applies committed migrations on deploy.

CREATE TABLE IF NOT EXISTS games (
  id text PRIMARY KEY,
  name text NOT NULL,
  week int NOT NULL DEFAULT 1,
  season int NOT NULL DEFAULT 1,
  season_label text NOT NULL,
  tension int NOT NULL DEFAULT 40,
  crisis_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nations (
  id text PRIMARY KEY,
  game_id text NOT NULL REFERENCES games(id),
  key text NOT NULL,
  name text NOT NULL,
  playable boolean NOT NULL DEFAULT true,
  ai_controlled boolean NOT NULL DEFAULT false,
  login_hash text NOT NULL,
  login_enc text NOT NULL,
  government text NOT NULL,
  neutrality text NOT NULL DEFAULT 'none',
  ic int NOT NULL,
  treasury_m int NOT NULL,
  manpower int NOT NULL,
  stability int NOT NULL,
  diplomacy int NOT NULL,
  tech_rank int NOT NULL,
  at_war boolean NOT NULL DEFAULT false,
  uranium_access boolean NOT NULL DEFAULT false,
  military_cap_pct int NOT NULL DEFAULT 100,
  sea_trade_pct int NOT NULL DEFAULT 100,
  resources jsonb NOT NULL DEFAULT '{}'::jsonb,
  tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  version int NOT NULL DEFAULT 1,
  UNIQUE (game_id, key)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  role text NOT NULL,
  nation_id text REFERENCES nations(id),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id bigserial PRIMARY KEY,
  key text NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS event_log (
  id bigserial PRIMARY KEY,
  game_id text NOT NULL REFERENCES games(id),
  season int NOT NULL,
  actor text NOT NULL,
  act_as text,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_log_game_idx ON event_log (game_id, at);
