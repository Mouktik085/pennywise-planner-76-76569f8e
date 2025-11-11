-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add settings columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sms_auto_import BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_expenses BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_bills BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_goals BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS default_account_id UUID REFERENCES public.accounts(id),
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS theme_primary_color TEXT DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS theme_accent_color TEXT DEFAULT '#10B981';

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);