-- Carry the plantel through the parental-consent flow.
--
-- Under-13 plays go through email consent. On confirmation the landing page
-- redirects the adult back into the odyssey, but it only knew the tenant slug,
-- not the plantel the play link came from, so the child landed in the
-- institution without a plantel membership. Storing team_slug lets the
-- consent-landing redirect return to /play/<slug>/<team_slug> and re-attach.
ALTER TABLE public.parental_consents ADD COLUMN IF NOT EXISTS team_slug text;

NOTIFY pgrst, 'reload schema';
