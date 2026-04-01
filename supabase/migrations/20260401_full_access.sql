-- Add full_access flag to sessions (admin can unlock full report for trial users)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS full_access boolean NOT NULL DEFAULT false;
