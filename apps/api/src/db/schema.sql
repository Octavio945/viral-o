-- Schéma PostgreSQL pour Viraleo

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  clerk_id    TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Profils entreprise (1 par utilisateur)
CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name        TEXT NOT NULL,
  sector              TEXT NOT NULL,
  target_audience     TEXT NOT NULL,
  products_services   TEXT NOT NULL,
  communication_style TEXT NOT NULL CHECK (communication_style IN ('humoristique','inspirant','pédagogique','brut')),
  social_networks     TEXT[] DEFAULT '{}',
  brand_colors        TEXT[] DEFAULT '{}',
  logo_url            TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Idées de vidéos générées
CREATE TABLE IF NOT EXISTS ideas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme           TEXT NOT NULL,
  title           TEXT NOT NULL,
  hook            TEXT NOT NULL,
  hashtags        TEXT[] DEFAULT '{}',
  estimated_duration INTEGER,
  network         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Scripts générés
CREATE TABLE IF NOT EXISTS scripts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id     UUID REFERENCES ideas(id) ON DELETE SET NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  network     TEXT NOT NULL,
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft','validated','archived')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Vidéos générées
CREATE TABLE IF NOT EXISTS videos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id     UUID REFERENCES scripts(id) ON DELETE SET NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','published','error')),
  file_url      TEXT,
  thumbnail_url TEXT,
  network       TEXT,
  published_at  TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
