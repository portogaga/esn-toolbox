CREATE TABLE semaines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(numero, annee)
);

CREATE TABLE besoins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semaine_id UUID REFERENCES semaines(id),
  poste TEXT NOT NULL,
  client TEXT NOT NULL,
  biz_owner TEXT NOT NULL,
  priorite TEXT CHECK (priorite IN ('P0','P1','P2')) DEFAULT 'P1',
  statut TEXT CHECK (statut IN ('nouveau','en_cours','envoye','feedback_attendu','bloque','clos')) DEFAULT 'nouveau',
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profils_envoyes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  besoin_id UUID REFERENCES besoins(id),
  recruteur TEXT NOT NULL,
  candidat TEXT NOT NULL,
  date_envoi DATE NOT NULL DEFAULT CURRENT_DATE,
  feedback_biz TEXT CHECK (feedback_biz IN ('en_attente','positif','negatif','hiring')) DEFAULT 'en_attente',
  commentaire TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semaine_id UUID REFERENCES semaines(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT CHECK (type IN ('biz','recruteur')) NOT NULL,
  recruteur TEXT,
  besoin_id UUID REFERENCES besoins(id),
  candidat TEXT,
  action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comptes_prospection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semaine_id UUID REFERENCES semaines(id),
  commercial TEXT NOT NULL,
  compte TEXT NOT NULL,
  statut TEXT DEFAULT 'a_prospecter',
  nb_rdv INTEGER DEFAULT 0,
  dates_rdv TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kickoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semaine_id UUID REFERENCES semaines(id),
  consultant TEXT NOT NULL,
  date_demarrage DATE,
  client TEXT NOT NULL,
  recruteur TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_type TEXT CHECK (mail_type IN ('daily','sprint','weekly')) UNIQUE,
  recipients TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  send_day TEXT DEFAULT 'friday',
  send_hour INTEGER DEFAULT 18
);

INSERT INTO email_settings (mail_type) VALUES ('daily'), ('sprint'), ('weekly');
