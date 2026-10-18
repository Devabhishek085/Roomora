-- ================================================================
-- Roomora Database Migration — 003_connection_invitations.sql
-- Enables invitation & acceptance flow for roommate connections
-- ================================================================

-- 1. Update status check constraint on roommate_connections
ALTER TABLE public.roommate_connections 
  DROP CONSTRAINT IF EXISTS roommate_connections_status_check;

ALTER TABLE public.roommate_connections 
  ADD CONSTRAINT roommate_connections_status_check 
  CHECK (status IN ('pending', 'accepted', 'active', 'declined', 'blocked'));

-- 2. Add RLS policy for recipients to respond to invitations
DROP POLICY IF EXISTS "Recipients can respond to connections" ON public.roommate_connections;

CREATE POLICY "Recipients can respond to connections"
  ON public.roommate_connections FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- 3. Update messages INSERT policy so messages are only allowed when connection is accepted or active
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

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
        AND rc.status IN ('accepted', 'active')
    )
  );

-- 4. Update atomic token deduction procedure to create connections as 'pending'
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
  v_existing_status TEXT;
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

  -- Check if connection already exists
  SELECT id, status INTO v_existing_connection_id, v_existing_status
  FROM public.roommate_connections
  WHERE (initiator_id = p_initiator_id AND recipient_id = p_recipient_id)
     OR (initiator_id = p_recipient_id AND recipient_id = p_initiator_id);

  IF v_existing_connection_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'connection_already_exists', 
      'connection_id', v_existing_connection_id,
      'status', v_existing_status
    );
  END IF;

  -- Check recipient is real user (profile exists and is_active)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_recipient_id AND is_active = TRUE
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'recipient_not_found');
  END IF;

  -- Check recipient is not a demo profile
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

  -- Lock and check token balance
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
  VALUES (p_initiator_id, 'deduction', 1, 'Roommate connection invitation sent', p_idempotency_key)
  RETURNING id INTO v_transaction_id;

  -- Create connection with 'pending' status
  INSERT INTO public.roommate_connections (initiator_id, recipient_id, status, token_transaction_id)
  VALUES (p_initiator_id, p_recipient_id, 'pending', v_transaction_id)
  RETURNING id INTO v_connection_id;

  -- Create conversation for this connection
  INSERT INTO public.conversations (connection_id)
  VALUES (v_connection_id);

  -- Audit event
  INSERT INTO public.audit_events (user_id, event_type, metadata)
  VALUES (p_initiator_id, 'connection_invitation_created', jsonb_build_object(
    'connection_id', v_connection_id,
    'recipient_id', p_recipient_id,
    'status', 'pending',
    'tokens_remaining', v_balance - 1
  ));

  RETURN jsonb_build_object(
    'success', true,
    'connection_id', v_connection_id,
    'tokens_remaining', v_balance - 1,
    'status', 'pending'
  );
END;
$$;

-- 5. RPC to respond to connection invitation (Accept or Decline)
CREATE OR REPLACE FUNCTION public.respond_to_connection_invitation(
  p_connection_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_id UUID;
  v_current_status TEXT;
BEGIN
  IF p_status NOT IN ('accepted', 'declined') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;

  SELECT recipient_id, status INTO v_recipient_id, v_current_status
  FROM public.roommate_connections
  WHERE id = p_connection_id;

  IF v_recipient_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'connection_not_found');
  END IF;

  IF v_recipient_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  IF v_current_status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_already_processed', 'status', v_current_status);
  END IF;

  -- Update connection status
  UPDATE public.roommate_connections
  SET status = p_status, updated_at = NOW()
  WHERE id = p_connection_id;

  -- Audit event
  INSERT INTO public.audit_events (user_id, event_type, metadata)
  VALUES (auth.uid(), 'connection_invitation_responded', jsonb_build_object(
    'connection_id', p_connection_id,
    'new_status', p_status
  ));

  RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;
