-- Persist a preferred language per tenant and per Argo One purchase so every
-- lifecycle email (trial, subscription, purchase, play link) can be sent in the
-- user's language instead of defaulting to Spanish. Applied to prod via MCP
-- 2026-06-11. Default 'es'; best-effort backfill from country for existing tenants.
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS lang text NOT NULL DEFAULT 'es';
ALTER TABLE one_purchases ADD COLUMN IF NOT EXISTS lang text NOT NULL DEFAULT 'es';

UPDATE tenants SET lang = CASE
  WHEN country = 'brazil' THEN 'pt'
  WHEN country = 'usa' THEN 'en'
  ELSE 'es'
END
WHERE lang = 'es';
