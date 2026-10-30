-- Weekly orders for slice S3.

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  game_id text NOT NULL REFERENCES games(id),
  nation_id text NOT NULL REFERENCES nations(id),
  season int NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  reflection text,
  submitted_at timestamptz,
  version int NOT NULL DEFAULT 1,
  UNIQUE (nation_id, season)
);

CREATE TABLE IF NOT EXISTS research (
  nation_id text NOT NULL REFERENCES nations(id),
  branch text NOT NULL,
  level int NOT NULL DEFAULT 0,
  PRIMARY KEY (nation_id, branch)
);

CREATE TABLE IF NOT EXISTS factories (
  nation_id text NOT NULL REFERENCES nations(id),
  location text NOT NULL,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (nation_id, location)
);
