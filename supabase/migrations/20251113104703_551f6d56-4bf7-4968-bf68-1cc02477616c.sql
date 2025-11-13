-- Add recurring and planned transfer columns to transfers table
ALTER TABLE public.transfers 
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_frequency text,
ADD COLUMN IF NOT EXISTS next_occurrence_date date,
ADD COLUMN IF NOT EXISTS last_processed_date date,
ADD COLUMN IF NOT EXISTS is_planned boolean DEFAULT false;