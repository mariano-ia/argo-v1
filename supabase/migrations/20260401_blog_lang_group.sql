-- Add lang_group to link translated versions of the same article
BEGIN;

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS lang_group uuid;

CREATE INDEX IF NOT EXISTS idx_blog_posts_lang_group ON blog_posts (lang_group);

COMMIT;
