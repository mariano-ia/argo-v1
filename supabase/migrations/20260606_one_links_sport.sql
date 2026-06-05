-- Argo One: the sport is now chosen by the buyer when generating each play
-- link (one sport per child), instead of being asked during the child's game
-- onboarding. Store it on the link so it can be shown read-only at play time
-- and saved with the resulting session.
ALTER TABLE public.one_links
    ADD COLUMN IF NOT EXISTS sport text;
