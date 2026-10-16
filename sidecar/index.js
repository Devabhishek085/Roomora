/**
 * Roomora Sidecar Server
 * ─────────────────────────────────────────────────────────────
 * Express server that handles operations requiring server-side credentials:
 *   1. Razorpay order creation and webhook verification
 *   2. UIDAI Aadhaar verification API calls (credentials never go to browser)
 *   3. Supabase service-role operations (admin-level tasks)
 *
 * Security architecture:
 *   - Razorpay Key Secret: ONLY here, never in frontend .env
 *   - UIDAI credentials: ONLY here, never in browser
 *   - Supabase Service Role Key: ONLY here, bypasses RLS only for admin ops
 *   - All frontend API calls verified against Supabase JWT before processing
 *
 * REQUIRED environment variables (sidecar/.env):
 *   SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *   SUPABASE_JWT_SECRET=your-jwt-secret
 *   RAZORPAY_KEY_ID=rzp_test_your_key_id
 *   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
 *   UIDAI_CLIENT_ID=your-uidai-sandbox-client-id
 *   UIDAI_CLIENT_SECRET=your-uidai-sandbox-client-secret
 *   UIDAI_BASE_URL=https://developer.uidai.gov.in/sandbox
 *   PORT=3001
 *   FRONTEND_ORIGIN=http://localhost:5173
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Validate required env vars ────────────────────────────────────────────
const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.warn(`[Sidecar] ⚠️  Missing env vars: ${missing.join(', ')}`);
  console.warn('[Sidecar] Some endpoints may be unavailable until configured.');
}

const RAZORPAY_CONFIGURED = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const UIDAI_CONFIGURED = Boolean(process.env.UIDAI_CLIENT_ID && process.env.UIDAI_CLIENT_SECRET);

// ─── Supabase admin client (service role — bypasses RLS for admin ops) ─────
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Raw body for Razorpay webhook signature verification
app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));
app.use(express.json());

// ─── JWT Auth Middleware ────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = auth.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    razorpay: RAZORPAY_CONFIGURED ? 'configured' : 'not_configured',
    uidai: UIDAI_CONFIGURED ? 'configured' : 'not_configured',
    supabase: !missing.includes('SUPABASE_URL') ? 'configured' : 'not_configured',
    timestamp: new Date().toISOString()
  });
});

// ═══════════════════════════════════════════════════════════════
// RAZORPAY PAYMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order server-side (never from frontend).
 * Returns order_id and amount to frontend for checkout initialization.
 */
app.post('/api/payments/create-order', requireAuth, async (req, res) => {
  if (!RAZORPAY_CONFIGURED) {
    return res.status(503).json({ error: 'Razorpay not configured on server' });
  }

  const { plan, amount_paise } = req.body;
  const validPlans = ['monthly', 'premium'];

  if (!plan || !validPlans.includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  if (!amount_paise || amount_paise <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Generate idempotency key
  const idempotencyKey = `order_${req.userId}_${plan}_${Date.now()}`;

  try {
    // Import Razorpay dynamically (only available when installed)
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount_paise,
      currency: 'INR',
      receipt: idempotencyKey.substring(0, 40),
      notes: { user_id: req.userId, plan }
    });

    // Record pending payment in DB
    await supabaseAdmin.from('payment_transactions').insert({
      user_id: req.userId,
      provider: 'razorpay',
      provider_order_id: order.id,
      amount_paise,
      currency: 'INR',
      status: 'created',
      plan,
      idempotency_key: idempotencyKey,
      metadata: { order }
    });

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error('[Payment] Order creation failed:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature and activates subscription.
 * NEVER trust the frontend for this — always verify server-side.
 */
app.post('/api/payments/verify', requireAuth, async (req, res) => {
  if (!RAZORPAY_CONFIGURED) {
    return res.status(503).json({ error: 'Razorpay not configured on server' });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification parameters' });
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    console.warn(`[Payment] Signature mismatch for user ${req.userId}`);
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  try {
    // Mark payment as verified in DB
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        provider_payment_id: razorpay_payment_id,
        status: 'paid',
        webhook_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('provider_order_id', razorpay_order_id);

    // Activate / upsert subscription
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: req.userId,
        plan,
        status: 'active',
        tokens_per_period: null, // unlimited for paid plans
        provider: 'razorpay',
        provider_order_id: razorpay_order_id,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString()
      }, { onConflict: 'user_id' });

    // Grant 100 extra tokens for paid subscription
    await supabaseAdmin.rpc('grant_tokens', {
      p_user_id: req.userId,
      p_amount: 100,
      p_reason: `${plan} subscription activated`,
      p_idempotency_key: `sub_tokens_${razorpay_payment_id}`
    });

    // Audit
    await supabaseAdmin.from('audit_events').insert({
      user_id: req.userId,
      event_type: 'subscription_activated',
      metadata: { plan, razorpay_payment_id, razorpay_order_id }
    });

    res.json({ success: true, plan });
  } catch (err) {
    console.error('[Payment] Verification processing error:', err);
    res.status(500).json({ error: 'Payment recorded but subscription activation failed. Contact support.' });
  }
});

/**
 * POST /api/webhooks/razorpay
 * Handles Razorpay server-to-server webhook events.
 * Uses raw body for signature verification.
 */
app.post('/api/webhooks/razorpay', (req, res) => {
  if (!RAZORPAY_CONFIGURED) {
    return res.status(200).send('Webhook received (Razorpay not configured)');
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature check');
  } else {
    const signature = req.headers['x-razorpay-signature'];
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (signature !== expectedSig) {
      console.warn('[Webhook] Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  const event = JSON.parse(req.body.toString());
  console.log(`[Webhook] Razorpay event: ${event.event}`);

  // Handle payment failures
  if (event.event === 'payment.failed') {
    const orderId = event.payload?.payment?.entity?.order_id;
    if (orderId) {
      supabaseAdmin
        .from('payment_transactions')
        .update({ status: 'failed' })
        .eq('provider_order_id', orderId)
        .then(() => console.log(`[Webhook] Marked order ${orderId} as failed`))
        .catch(console.error);
    }
  }

  res.status(200).json({ received: true });
});

// ═══════════════════════════════════════════════════════════════
// UIDAI AADHAAR VERIFICATION ENDPOINTS
// (Credentials ONLY on server — never exposed to frontend)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/aadhaar/initiate
 * Initiates Aadhaar OTP via UIDAI sandbox API.
 * NOTE: Full UIDAI integration requires authorized sandbox credentials.
 */
app.post('/api/aadhaar/initiate', requireAuth, async (req, res) => {
  if (!UIDAI_CONFIGURED) {
    return res.status(503).json({
      error: 'UIDAI credentials not configured on server',
      setup_required: true
    });
  }

  const { last_four, consent } = req.body;

  if (!consent) {
    return res.status(400).json({ error: 'Explicit consent required' });
  }

  if (!last_four || !/^\d{4}$/.test(last_four)) {
    return res.status(400).json({ error: 'Invalid last four digits' });
  }

  // Record consent in DB before making any UIDAI calls
  await supabaseAdmin
    .from('aadhaar_verifications')
    .upsert({
      user_id: req.userId,
      status: 'in_progress',
      consent_given_at: new Date().toISOString(),
      is_mock: false
    }, { onConflict: 'user_id' });

  try {
    // TODO: Call UIDAI sandbox API
    // This requires approved credentials from https://developer.uidai.gov.in
    // The API endpoint, payload structure, and auth headers are
    // defined by UIDAI's API specification available after onboarding.
    //
    // Example structure (verify against actual UIDAI API spec):
    // const response = await fetch(`${process.env.UIDAI_BASE_URL}/auth/...`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.UIDAI_CLIENT_SECRET}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ client_id: process.env.UIDAI_CLIENT_ID, ... })
    // });

    console.log(`[UIDAI] Initiate verification for user ${req.userId} (last 4: ${last_four})`);

    return res.status(503).json({
      error: 'UIDAI sandbox credentials obtained but API integration pending formal onboarding',
      uidai_dashboard: 'https://developer.uidai.gov.in'
    });
  } catch (err) {
    console.error('[UIDAI] Initiate error:', err);
    res.status(500).json({ error: 'Aadhaar verification initiation failed' });
  }
});

/**
 * POST /api/aadhaar/verify
 * Verifies Aadhaar OTP via UIDAI sandbox API.
 */
app.post('/api/aadhaar/verify', requireAuth, async (req, res) => {
  if (!UIDAI_CONFIGURED) {
    return res.status(503).json({ error: 'UIDAI credentials not configured on server' });
  }

  const { transaction_id, otp } = req.body;

  if (!transaction_id || !otp) {
    return res.status(400).json({ error: 'Missing transaction_id or otp' });
  }

  // TODO: Call UIDAI OTP verification endpoint
  // On success:
  //   1. Update aadhaar_verifications table: status='verified', verified_at=NOW(), provider_reference=...
  //   2. Audit the verification event
  // On failure:
  //   1. Update aadhaar_verifications table: status='failed', failed_reason=...

  res.status(503).json({
    error: 'UIDAI OTP verification pending formal API onboarding',
    uidai_dashboard: 'https://developer.uidai.gov.in'
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Roomora Sidecar Server running on port ${PORT}`);
  console.log(`   Razorpay: ${RAZORPAY_CONFIGURED ? '✅ Configured' : '⚠️  Not configured (set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET)'}`);
  console.log(`   UIDAI:    ${UIDAI_CONFIGURED ? '✅ Configured' : '⚠️  Not configured (requires UIDAI developer onboarding)'}`);
  console.log(`   Supabase: ${!missing.includes('SUPABASE_URL') ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`\n   Health check: http://localhost:${PORT}/health\n`);
});
