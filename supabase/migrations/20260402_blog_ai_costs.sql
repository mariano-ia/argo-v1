-- Track AI costs for blog post generation
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS ai_tokens_input  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_tokens_output integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_cost_usd      numeric(10,6) DEFAULT 0;
