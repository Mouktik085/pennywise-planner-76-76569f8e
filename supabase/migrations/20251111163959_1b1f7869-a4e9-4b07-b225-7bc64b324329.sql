-- Add icon column to accounts table
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '💼';