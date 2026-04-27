CREATE TABLE collaborateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  role TEXT CHECK (role IN ('biz', 'recruteur')) NOT NULL,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO collaborateurs (nom, role) VALUES 
('Adam', 'recruteur'),
('Inès', 'recruteur'),
('Youssef', 'recruteur'),
('Biz1', 'biz');
