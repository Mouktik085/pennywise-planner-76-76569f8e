-- Add columns for recurring transactions automation
ALTER TABLE transactions 
ADD COLUMN last_processed_date DATE,
ADD COLUMN next_occurrence_date DATE;

-- Create index for efficient querying of recurring transactions
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(next_occurrence_date) 
WHERE is_recurring = true AND next_occurrence_date IS NOT NULL;

-- Add notification preference columns to profiles
ALTER TABLE profiles
ADD COLUMN phone_number TEXT,
ADD COLUMN email_notifications BOOLEAN DEFAULT true,
ADD COLUMN sms_notifications BOOLEAN DEFAULT false;

-- Remove theme customization columns (no longer needed)
ALTER TABLE profiles
DROP COLUMN IF EXISTS theme_primary_color,
DROP COLUMN IF EXISTS theme_accent_color;

-- Initialize next_occurrence_date for existing recurring transactions
UPDATE transactions
SET next_occurrence_date = date + INTERVAL '1 day'
WHERE is_recurring = true 
  AND recurring_frequency = 'daily'
  AND next_occurrence_date IS NULL;

UPDATE transactions
SET next_occurrence_date = date + INTERVAL '7 days'
WHERE is_recurring = true 
  AND recurring_frequency = 'weekly'
  AND next_occurrence_date IS NULL;

UPDATE transactions
SET next_occurrence_date = date + INTERVAL '1 month'
WHERE is_recurring = true 
  AND recurring_frequency = 'monthly'
  AND next_occurrence_date IS NULL;

UPDATE transactions
SET next_occurrence_date = date + INTERVAL '1 year'
WHERE is_recurring = true 
  AND recurring_frequency = 'yearly'
  AND next_occurrence_date IS NULL;