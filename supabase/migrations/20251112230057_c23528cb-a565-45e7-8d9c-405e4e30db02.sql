-- Add last_notification_check column to profiles table to prevent notification spam
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_notification_check timestamp with time zone;