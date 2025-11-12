-- Drop the old type check constraint
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_type_check;

-- Add new constraint that includes credit_card
ALTER TABLE public.accounts 
ADD CONSTRAINT accounts_type_check 
CHECK (type IN ('cash', 'bank', 'card', 'credit_card', 'upi', 'savings', 'piggy_bank'));