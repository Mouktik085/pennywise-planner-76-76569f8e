-- Add credit card fields to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS is_credit_card boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_used numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bill_date integer,
ADD COLUMN IF NOT EXISTS due_date integer;

-- Add recurring frequency to transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS recurring_frequency text CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly'));

-- Add currency and language to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

-- Add reminder settings to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS reminder_days_before integer DEFAULT 2;

-- Create index for better performance on recurring transactions
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON public.transactions(user_id, is_recurring, date) WHERE is_recurring = true;