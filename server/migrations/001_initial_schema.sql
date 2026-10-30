CREATE TABLE games (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, week INT DEFAULT 1, season_label TEXT, tension INT DEFAULT 40, crisis_count INT DEFAULT 0, status TEXT, settings JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE nations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), key TEXT NOT NULL, name TEXT NOT NULL, playable BOOLEAN DEFAULT true, ai_controlled BOOLEAN DEFAULT false, login_hash TEXT, login_enc BYTEA, government TEXT, neutrality TEXT, ic INT, treasury_m INT, manpower INT, stability INT, diplomacy INT, tech_rank INT, at_war BOOLEAN DEFAULT false, uranium_access BOOLEAN DEFAULT false, military_cap_pct INT, sea_trade_pct INT, resources JSONB, tokens JSONB, version INT DEFAULT 1, UNIQUE(game_id, key));

CREATE TABLE units (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nation_id UUID REFERENCES nations(id), name TEXT NOT NULL, type TEXT NOT NULL, exp TEXT, location TEXT, str_pct INT, commander TEXT, year_formed INT, intel_note TEXT, status TEXT);

CREATE TABLE colonies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nation_id UUID REFERENCES nations(id), name TEXT NOT NULL, status TEXT, leader TEXT, master_nation_id UUID REFERENCES nations(id), local_ic INT, local_nt INT, notes TEXT);

CREATE TABLE factories (nation_id UUID REFERENCES nations(id), location TEXT, count INT, PRIMARY KEY (nation_id, location));

CREATE TABLE research (nation_id UUID REFERENCES nations(id), branch TEXT, level INT, PRIMARY KEY (nation_id, branch));

CREATE TABLE chaos_events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), scope TEXT CHECK (scope IN ('local', 'global')), nation_id UUID REFERENCES nations(id), text TEXT NOT NULL, effects JSONB, active BOOLEAN DEFAULT true);

CREATE TABLE orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), nation_id UUID REFERENCES nations(id), season INT, status TEXT CHECK (status IN ('draft', 'submitted', 'late', 'standing')), payload JSONB, reflection TEXT, submitted_at TIMESTAMPTZ, version INT DEFAULT 1, UNIQUE(nation_id, season));

CREATE TABLE messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), kind TEXT, from_nation UUID REFERENCES nations(id), to_nation UUID REFERENCES nations(id), season INT, body TEXT, cipher_shift INT DEFAULT 4, flagged BOOLEAN DEFAULT false, flag_reason TEXT, reviewed BOOLEAN DEFAULT false, at TIMESTAMPTZ DEFAULT now());

CREATE TABLE trades (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), from_nation UUID REFERENCES nations(id), to_nation UUID REFERENCES nations(id), status TEXT, give JSONB, ask JSONB, season INT, settled_at TIMESTAMPTZ);

CREATE TABLE treaties (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), type TEXT, secret BOOLEAN DEFAULT false, terms TEXT, status TEXT, created_by UUID REFERENCES nations(id), season INT);

CREATE TABLE treaty_signatories (treaty_id UUID REFERENCES treaties(id), nation_id UUID REFERENCES nations(id), signed_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (treaty_id, nation_id));

CREATE TABLE battle_rows (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), season INT, kind TEXT, participants JSONB, odds JSONB, seed TEXT, roll JSONB, result JSONB, override JSONB, status TEXT);

CREATE TABLE reports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), season INT, kind TEXT, nation_id UUID REFERENCES nations(id), body TEXT, data JSONB);

CREATE TABLE forge_issues (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), season INT, headline TEXT, body JSONB, pdf_file_id UUID, image_file_ids JSONB, published_at TIMESTAMPTZ);

CREATE TABLE objectives (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nation_id UUID REFERENCES nations(id), text TEXT NOT NULL, status TEXT);

CREATE TABLE snapshots (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), season INT, state JSONB, created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE event_log (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), season INT, actor UUID REFERENCES nations(id), act_as UUID REFERENCES nations(id), kind TEXT, payload JSONB, at TIMESTAMPTZ DEFAULT now());

CREATE TABLE ai_requests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), purpose TEXT, prompt_version TEXT, started_at TIMESTAMPTZ, duration_ms INT, tokens INT, status TEXT, error TEXT);

CREATE TABLE ai_chat (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), season INT, role TEXT, text TEXT, at TIMESTAMPTZ DEFAULT now());

CREATE TABLE rulings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), season INT, text TEXT NOT NULL, source_msg_id UUID REFERENCES messages(id), active BOOLEAN DEFAULT true);

CREATE TABLE jobs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), kind TEXT, status TEXT, progress INT, result JSONB, error TEXT, created_at TIMESTAMPTZ DEFAULT now());

CREATE TABLE files (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), game_id UUID REFERENCES games(id), kind TEXT, storage_key TEXT NOT NULL, mime TEXT, bytes BIGINT, created_by UUID REFERENCES nations(id), at TIMESTAMPTZ DEFAULT now());

CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, role TEXT, nation_id UUID REFERENCES nations(id), expires_at TIMESTAMPTZ);

CREATE TABLE login_attempts (key TEXT, at TIMESTAMPTZ DEFAULT now(), ok BOOLEAN); 