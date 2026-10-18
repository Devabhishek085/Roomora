-- ================================================================
-- Roomora Database Migration — 004_add_profile_email.sql
-- Adds email to public.profiles and syncs it on user creation
-- Enables connection request email notifications
-- ================================================================

-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill email for existing registered users from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Update handle_new_user to automatically copy email to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with email
  INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  -- Grant 10 free tokens
  INSERT INTO public.token_balances (user_id, balance, lifetime_granted, updated_at)
  VALUES (NEW.id, 10, 10, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Record grant transaction
  INSERT INTO public.token_transactions (user_id, type, amount, reason, idempotency_key)
  VALUES (NEW.id, 'grant', 10, 'Initial 10 free connection tokens for new account', 'initial_grant_' || NEW.id::TEXT)
  ON CONFLICT DO NOTHING;

  -- Initialize free subscription record
  INSERT INTO public.subscriptions (user_id, plan, status, tokens_per_period, current_period_start)
  VALUES (NEW.id, 'free', 'active', 10, NOW())
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
