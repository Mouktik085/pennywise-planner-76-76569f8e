-- First, drop the existing foreign key constraints on transfers table
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_from_account_id_fkey;
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_to_account_id_fkey;

-- Add type columns to track what kind of entity we're transferring from/to
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS from_type text NOT NULL DEFAULT 'account';
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS to_type text NOT NULL DEFAULT 'account';

-- Rename the columns to be more generic
ALTER TABLE transfers RENAME COLUMN from_account_id TO from_id;
ALTER TABLE transfers RENAME COLUMN to_account_id TO to_id;

-- Add check constraints to ensure valid types
ALTER TABLE transfers ADD CONSTRAINT transfers_from_type_check CHECK (from_type IN ('account', 'savings'));
ALTER TABLE transfers ADD CONSTRAINT transfers_to_type_check CHECK (to_type IN ('account', 'savings'));