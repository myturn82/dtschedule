ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS extra_data JSONB DEFAULT '{}'::jsonb;
