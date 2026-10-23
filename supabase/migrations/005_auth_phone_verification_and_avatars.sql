-- ================================================================
-- Roomora Database Migration — 005_auth_phone_verification_and_avatars.sql
-- Adds phone number verification, email verification timestamps,
-- uniqueness constraints, and pending registration management.
-- ================================================================

-- 1. Extend public.profiles with verification audit fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- 2. Audit existing database for duplicate or malformed identifiers before indexing
-- Ensure normalized uniqueness on active profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique 
  ON public.profiles (phone_number) 
  WHERE phone_number IS NOT NULL AND is_active = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique 
  ON public.profiles (email) 
  WHERE email IS NOT NULL AND is_active = TRUE;

-- 3. Create pending_registrations table for unverified multi-step signups
-- Pending registrations are isolated from active accounts and auto-expire
CREATE TABLE IF NOT EXISTS public.pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- OTP Security (Server-side hashed tokens, never stored in plain text)
  phone_otp_hash TEXT,
  phone_otp_expires_at TIMESTAMPTZ,
  phone_otp_attempts INTEGER NOT NULL DEFAULT 0,
  phone_verified_at TIMESTAMPTZ,
  
  email_otp_hash TEXT,
  email_otp_expires_at TIMESTAMPTZ,
  email_otp_attempts INTEGER NOT NULL DEFAULT 0,
  email_verified_at TIMESTAMPTZ,
  
  -- Rate limiting & cooldowns
  last_phone_otp_sent_at TIMESTAMPTZ,
  last_email_otp_sent_at TIMESTAMPTZ,
  
  -- Expiry of entire pending registration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookup and expiration cleanup
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON public.pending_registrations (email);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_phone ON public.pending_registrations (phone_number);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_expires ON public.pending_registrations (expires_at);

-- 4. Automatic cleanup function for expired registrations
CREATE OR REPLACE FUNCTION public.cleanup_expired_pending_registrations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.pending_registrations
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update handle_new_user trigger to preserve phone and verification fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create or update profile with email, phone, and verification timestamps
  INSERT INTO public.profiles (
    id, 
    email, 
    phone_number,
    phone_verified_at,
    email_verified_at,
    display_name, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number',
    CASE WHEN (NEW.raw_user_meta_data->>'phone_verified_at') IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'phone_verified_at')::TIMESTAMPTZ 
      ELSE NULL 
    END,
    COALESCE(
      NEW.email_confirmed_at,
      CASE WHEN (NEW.raw_user_meta_data->>'email_verified_at') IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'email_verified_at')::TIMESTAMPTZ 
        ELSE NOW() 
      END
    ),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    phone_number = COALESCE(EXCLUDED.phone_number, public.profiles.phone_number),
    phone_verified_at = COALESCE(EXCLUDED.phone_verified_at, public.profiles.phone_verified_at),
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, public.profiles.email_verified_at),
    updated_at = NOW();

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
