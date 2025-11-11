-- Add missing settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notification_budget_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_transaction_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_savings_milestones BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS security_app_lock BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS security_hide_balance BOOLEAN DEFAULT false;