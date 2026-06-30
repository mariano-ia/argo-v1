-- Argo One: flag a purchase as the One + Puente combo so the responsible adult
-- gets a prepaid Puente after the child plays. Applied via MCP 2026-06-30.

ALTER TABLE public.one_purchases
  ADD COLUMN IF NOT EXISTS includes_puente boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.one_purchases.includes_puente IS 'true when the purchase is the Argo One + Puente combo (the responsible adult gets a prepaid Puente after the child plays).';
