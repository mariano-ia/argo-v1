-- Blog SEO upgrade: add fields to blog_posts + create blog_topics table
BEGIN;

-- ─── Extend blog_posts with SEO fields ────────────────────────────────────────

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS seo_title       text,
  ADD COLUMN IF NOT EXISTS category        text,
  ADD COLUMN IF NOT EXISTS tags            text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS featured_image  text,
  ADD COLUMN IF NOT EXISTS reading_time    smallint,
  ADD COLUMN IF NOT EXISTS generated_by    text DEFAULT 'human',   -- 'human' | 'ai-cron' | 'ai-demand'
  ADD COLUMN IF NOT EXISTS topic_id        uuid;

-- ─── Content brain: blog_topics ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_topics (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text NOT NULL,
    description     text,
    pillar          text NOT NULL,           -- 'arquetipos', 'coaching', 'padres', 'disc', 'deporte', 'motivacion'
    audience        text NOT NULL DEFAULT 'coaches',  -- 'coaches', 'padres', 'instituciones'
    format          text NOT NULL DEFAULT 'guia',     -- 'guia', 'caso', 'opinion', 'analisis', 'comparativa'
    archetype_ref   text,                    -- optional: 'impulsor_dinamico', etc.
    relevance_score smallint DEFAULT 50,     -- 0-100, higher = publish sooner
    status          text NOT NULL DEFAULT 'pending',  -- 'pending', 'generating', 'generated', 'published', 'skipped'
    lang            text NOT NULL DEFAULT 'es',
    source          text DEFAULT 'pillar',   -- 'pillar' | 'demand' | 'seasonal'
    post_id         uuid REFERENCES blog_posts(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    generated_at    timestamptz,
    published_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_blog_topics_status ON blog_topics (status, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_blog_topics_pillar ON blog_topics (pillar);

-- RLS
ALTER TABLE blog_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full_access_topics" ON blog_topics FOR ALL USING (true) WITH CHECK (true);

COMMIT;
