-- ================================================================
-- Roomora Database Migration — v1
-- Run this SQL in your Supabase SQL editor (or via migration tool)
-- ================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- PROFILES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  age INTEGER CHECK (age IS NULL OR (age >= 16 AND age <= 80)),
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')),
  occupation TEXT,
  institution TEXT,
  city TEXT,
  budget_min INTEGER CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max INTEGER CHECK (budget_max IS NULL OR budget_max >= 0),
  move_in_date DATE,
  accommodation_type TEXT CHECK (accommodation_type IN ('PG', 'Flat', 'Studio', 'Private Room', 'Shared Room')),
  sharing_preference TEXT CHECK (sharing_preference IN ('Single Room', 'Twin Sharing', 'Triple Sharing', 'Flexible')),
  sleep_schedule TEXT CHECK (sleep_schedule IN ('Early Bird', 'Night Owl', 'Flexible')),
  cleanliness INTEGER CHECK (cleanliness BETWEEN 1 AND 5),
  food_preference TEXT CHECK (food_preference IN ('Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan')),
  smoking_drinking TEXT CHECK (smoking_drinking IN ('Never', 'Occasionally', 'Fine')),
  noise_tolerance TEXT CHECK (noise_tolerance IN ('Low/Quiet', 'Moderate', 'High/Lively')),
  guest_policy TEXT CHECK (guest_policy IN ('Rarely', 'Weekends Only', 'Flexible')),
  privacy_needs TEXT CHECK (privacy_needs IN ('High', 'Moderate', 'Low')),
  bio TEXT CHECK (length(bio) <= 500),
  target_localities TEXT[] DEFAULT ARRAY[]::TEXT[],
  hobbies TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Demo/real classification
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  demo_label TEXT, -- 'AI-generated demo profile' for synthetic profiles
  -- Privacy settings
  profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'connections_only', 'private')),
  show_budget_publicly BOOLEAN NOT NULL DEFAULT TRUE,
  show_sleep_schedule_publicly BOOLEAN NOT NULL DEFAULT TRUE,
  show_contact_publicly BOOLEAN NOT NULL DEFAULT FALSE,
  -- Matching weights (JSON: sleepWeight, cleanlinessWeight, etc.)
  weights JSONB DEFAULT '{"sleepWeight":4,"cleanlinessWeight":5,"foodWeight":3,"guestWeight":3,"noiseWeight":4,"habitsWeight":5}'::JSONB,
  strict_budget BOOLEAN NOT NULL DEFAULT FALSE,
  strict_move_in_date BOOLEAN NOT NULL DEFAULT FALSE,
  strict_gender_policy BOOLEAN NOT NULL DEFAULT FALSE,
  -- Profile status
  profile_completed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- AADHAAR VERIFICATION RECORDS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.aadhaar_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'verified', 'failed', 'unavailable')),
  provider_reference TEXT, -- UIDAI reference ID (no Aadhaar numbers stored)
  verified_at TIMESTAMPTZ,
  failed_reason TEXT,
  is_mock BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE = dev sandbox mock, NEVER production
  consent_given_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ================================================================
-- TOKEN SYSTEM
-- ================================================================
CREATE TABLE IF NOT EXISTS public.token_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_granted INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('grant', 'deduction', 'reversal', 'adjustment')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  reference_id TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- CONNECTIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.roommate_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  token_transaction_id UUID REFERENCES public.token_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(initiator_id, recipient_id),
  CONSTRAINT no_self_connection CHECK (initiator_id <> recipient_id)
);

-- ================================================================
-- CONVERSATIONS & MESSAGES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.roommate_connections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(connection_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- SUBSCRIPTIONS & PAYMENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'monthly', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  tokens_per_period INTEGER, -- NULL = unlimited during period
  provider TEXT DEFAULT 'razorpay',
  provider_subscription_id TEXT,
  provider_order_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT UNIQUE,
  provider_payment_id TEXT,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  webhook_verified BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key TEXT UNIQUE,
  plan TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- REPORTS & BLOCKS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'fake_profile', 'inappropriate_content', 'other')),
  details TEXT CHECK (length(details) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

-- ================================================================
-- SAVED ROOMMATES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.saved_roommates (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roommate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, roommate_id),
  CONSTRAINT no_self_save CHECK (user_id <> roommate_id)
);

-- ================================================================
-- AUDIT LOG
-- ================================================================
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_is_demo ON public.profiles(is_demo);
CREATE INDEX IF NOT EXISTS idx_profiles_budget ON public.profiles(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_profiles_move_in ON public.profiles(move_in_date);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_convo ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_connections_initiator ON public.roommate_connections(initiator_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON public.roommate_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_token_tx_user ON public.token_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON public.audit_events(user_id, created_at DESC);

-- ================================================================
-- UPDATED_AT TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER aadhaar_updated_at BEFORE UPDATE ON public.aadhaar_verifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER connections_updated_at BEFORE UPDATE ON public.roommate_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER payment_tx_updated_at BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create empty profile
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );

  -- Grant 10 free tokens
  INSERT INTO public.token_balances (user_id, balance, lifetime_granted, updated_at)
  VALUES (NEW.id, 10, 10, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Record grant transaction
  INSERT INTO public.token_transactions (user_id, type, amount, reason, idempotency_key)
  VALUES (NEW.id, 'grant', 10, 'Initial 10 free connection tokens for new account', 'initial_grant_' || NEW.id::TEXT);

  -- Initialize free subscription record
  INSERT INTO public.subscriptions (user_id, plan, status, tokens_per_period, current_period_start)
  VALUES (NEW.id, 'free', 'active', 10, NOW())
  ON CONFLICT DO NOTHING;

  -- Audit
  INSERT INTO public.audit_events (user_id, event_type, metadata)
  VALUES (NEW.id, 'user_created', jsonb_build_object('email', NEW.email, 'granted_tokens', 10));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- ATOMIC TOKEN DEDUCTION FUNCTION
-- This runs in a transaction — prevents race conditions and double-spend
-- ================================================================
CREATE OR REPLACE FUNCTION public.deduct_connection_token(
  p_initiator_id UUID,
  p_recipient_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
  v_connection_id UUID;
  v_transaction_id UUID;
  v_existing_connection_id UUID;
BEGIN
  -- Check that initiator is not recipient
  IF p_initiator_id = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_connect_to_self');
  END IF;

  -- Check idempotency — if this key already succeeded, return existing result
  SELECT rc.id INTO v_existing_connection_id
  FROM public.token_transactions tt
  JOIN public.roommate_connections rc ON rc.token_transaction_id = tt.id
  WHERE tt.idempotency_key = p_idempotency_key;

  IF v_existing_connection_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'connection_id', v_existing_connection_id, 'idempotent', true);
  END IF;

  -- Check that connection does not already exist
  SELECT id INTO v_existing_connection_id
  FROM public.roommate_connections
  WHERE (initiator_id = p_initiator_id AND recipient_id = p_recipient_id)
     OR (initiator_id = p_recipient_id AND recipient_id = p_initiator_id);

  IF v_existing_connection_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'connection_already_exists', 'connection_id', v_existing_connection_id);
  END IF;

  -- Check recipient is real user (profile exists and is_active)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_recipient_id AND is_active = TRUE
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'recipient_not_found');
  END IF;

  -- Check recipient is not a demo profile (prevent paid connections to demo)
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_recipient_id AND is_demo = TRUE
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_connect_to_demo_profile');
  END IF;

  -- Check that recipient has not blocked initiator
  IF EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE blocker_id = p_recipient_id AND blocked_id = p_initiator_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_unavailable');
  END IF;

  -- Lock and check token balance (FOR UPDATE prevents race condition)
  SELECT balance INTO v_balance
  FROM public.token_balances
  WHERE user_id = p_initiator_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'token_balance_not_found');
  END IF;

  IF v_balance < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'insufficient_tokens', 'balance', v_balance);
  END IF;

  -- Deduct token
  UPDATE public.token_balances
  SET balance = balance - 1, updated_at = NOW()
  WHERE user_id = p_initiator_id;

  -- Record transaction
  INSERT INTO public.token_transactions (user_id, type, amount, reason, idempotency_key)
  VALUES (p_initiator_id, 'deduction', 1, 'Roommate connection initiated', p_idempotency_key)
  RETURNING id INTO v_transaction_id;

  -- Create connection
  INSERT INTO public.roommate_connections (initiator_id, recipient_id, status, token_transaction_id)
  VALUES (p_initiator_id, p_recipient_id, 'active', v_transaction_id)
  RETURNING id INTO v_connection_id;

  -- Create conversation
  INSERT INTO public.conversations (connection_id)
  VALUES (v_connection_id);

  -- Audit
  INSERT INTO public.audit_events (user_id, event_type, metadata)
  VALUES (p_initiator_id, 'connection_created', jsonb_build_object(
    'connection_id', v_connection_id,
    'recipient_id', p_recipient_id,
    'tokens_remaining', v_balance - 1
  ));

  RETURN jsonb_build_object(
    'success', true,
    'connection_id', v_connection_id,
    'tokens_remaining', v_balance - 1
  );
END;
$$;

-- ================================================================
-- ROW-LEVEL SECURITY (RLS)
-- ================================================================

-- Profiles: public can read public profiles; only owner can update
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are readable by all authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (profile_visibility = 'public' AND is_active = TRUE);

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Token balances: user can read their own
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own token balance"
  ON public.token_balances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Token transactions: user can read their own
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own token transactions"
  ON public.token_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Connections: user can see their own connections
ALTER TABLE public.roommate_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connections they are part of"
  ON public.roommate_connections FOR SELECT
  TO authenticated
  USING (initiator_id = auth.uid() OR recipient_id = auth.uid());

-- Conversations: only participants
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations from their connections"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roommate_connections rc
      WHERE rc.id = connection_id
        AND (rc.initiator_id = auth.uid() OR rc.recipient_id = auth.uid())
    )
  );

-- Messages: only participants
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.roommate_connections rc ON rc.id = c.connection_id
      WHERE c.id = conversation_id
        AND (rc.initiator_id = auth.uid() OR rc.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.roommate_connections rc ON rc.id = c.connection_id
      WHERE c.id = conversation_id
        AND (rc.initiator_id = auth.uid() OR rc.recipient_id = auth.uid())
        AND rc.status = 'active'
    )
  );

-- Saved roommates: own rows only
ALTER TABLE public.saved_roommates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own saved roommates"
  ON public.saved_roommates FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Aadhaar verification: own record only
ALTER TABLE public.aadhaar_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification status"
  ON public.aadhaar_verifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Subscriptions: own records
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Blocks: own rows
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own blocks"
  ON public.user_blocks FOR ALL
  TO authenticated
  USING (blocker_id = auth.uid())
  WITH CHECK (blocker_id = auth.uid());

-- Reports: users can insert
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can file reports"
  ON public.user_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());
