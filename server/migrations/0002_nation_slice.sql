-- Units, colonies and chaos for slice S2. Memory store already seeds these.

CREATE TABLE IF NOT EXISTS units (
  id text PRIMARY KEY,
  nation_id text NOT NULL REFERENCES nations(id),
  name text NOT NULL,
  type text NOT NULL,
  exp text NOT NULL,
  location text NOT NULL,
  str_pct int NOT NULL,
  commander text,
  year_formed int,
  intel_note text,
  status text NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS colonies (
  id text PRIMARY KEY,
  nation_id text NOT NULL REFERENCES nations(id),
  name text NOT NULL,
  status text NOT NULL,
  leader text,
  master_nation_id text REFERENCES nations(id),
  local_ic int NOT NULL DEFAULT 0,
  local_nt int NOT NULL DEFAULT 0,
  notes text
);

CREATE TABLE IF NOT EXISTS chaos_events (
  id text PRIMARY KEY,
  game_id text NOT NULL REFERENCES games(id),
  scope text NOT NULL,
  nation_id text REFERENCES nations(id),
  text text NOT NULL,
  effects jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true
);
