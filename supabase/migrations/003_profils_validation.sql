-- Ajout du champ de validation Biz sur les profils
ALTER TABLE profils_envoyes 
ADD COLUMN statut_validation TEXT CHECK (statut_validation IN ('attente_biz', 'rejete_biz', 'envoye_client')) DEFAULT 'attente_biz';

-- Mettre à jour les anciens pour éviter les bugs (on assume qu'ils étaient envoyés au client)
UPDATE profils_envoyes SET statut_validation = 'envoye_client' WHERE statut_validation = 'attente_biz';
