-- Add icon column to savings_goals table
ALTER TABLE public.savings_goals 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🎯';