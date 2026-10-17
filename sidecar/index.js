/**
 * Roomora Sidecar Server
 * ─────────────────────────────────────────────────────────────
 * Handles all server-side-only credential operations:
 *   1. Razorpay order creation + HMAC webhook verification
 *   2. Identity verification — switchable provider:
 *      A. MSG91 Phone OTP  (instant signup at msg91.com)
 *      B. Surepass         (licensed UIDAI partner, 1-2 day approval)
 *      C. UIDAI Direct     (formal application — future)
 *   3. Supabase service-role admin operations
 *
 * Set VERIFICATION_PROVIDER=msg91|surepass|uidai in sidecar/.env
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
const MSG91_CONFIGURED = Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_OTP_TEMPLATE_ID);
const SUREPASS_CONFIGURED = Boolean(process.env.SUREPASS_TOKEN);
const VERIFICATION_PROVIDER = process.env.VERIFICATION_PROVIDER || 'msg91'; // msg91 | surepass | uidai

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
// IDENTITY VERIFICATION ENDPOINTS (provider-switchable)
// Current provider set via VERIFICATION_PROVIDER env var:
//   'msg91'    → Phone OTP (instant signup at msg91.com)
//   'surepass' → Aadhaar via licensed UIDAI partner (surepass.io)
//   'uidai'    → Direct UIDAI (requires formal onboarding)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/verify/phone/send
 * Send OTP to a phone number via MSG91.
 * Used for: phone number ownership verification.
 */
app.post('/api/verify/phone/send', requireAuth, async (req, res) => {
  if (VERIFICATION_PROVIDER !== 'msg91' && !MSG91_CONFIGURED) {
    return res.status(503).json({
      error: 'Phone OTP not configured',
      setup: 'Signup at msg91.com → get AUTH_KEY → set MSG91_AUTH_KEY in sidecar/.env'
    });
  }
  if (!MSG91_CONFIGURED) {
    return res.status(503).json({ error: 'MSG91 not configured. Set MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID.' });
  }

  const { phone } = req.body;
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid Indian phone number (10 digits, starts with 6-9)' });
  }

  try {
    // MSG91 Send OTP API
    const response = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_OTP_TEMPLATE_ID,
        mobile: `91${phone}`,
        otp_length: 6,
        otp_expiry: 10 // minutes
      })
    });

    const data = await response.json();
    if (data.type === 'error') {
      throw new Error(data.message);
    }

    // Store pending verification in DB
    await supabaseAdmin.from('aadhaar_verifications').upsert({
      user_id: req.userId,
      status: 'in_progress',
      consent_given_at: new Date().toISOString(),
      is_mock: false,
      provider_reference: `msg91_${phone}`
    }, { onConflict: 'user_id' });

    console.log(`[MSG91] OTP sent to +91${phone} for user ${req.userId}`);
    res.json({ success: true, message: `OTP sent to +91${phone}` });

  } catch (err) {
    console.error('[MSG91] Send OTP error:', err.message);
    res.status(500).json({ error: 'Failed to send OTP. Check MSG91 credentials.' });
  }
});

/**
 * POST /api/verify/phone/confirm
 * Verify the OTP the user received via MSG91.
 */
app.post('/api/verify/phone/confirm', requireAuth, async (req, res) => {
  if (!MSG91_CONFIGURED) {
    return res.status(503).json({ error: 'MSG91 not configured' });
  }

  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Missing phone or otp' });
  }

  try {
    // MSG91 Verify OTP API
    const url = `https://control.msg91.com/api/v5/otp/verify?authkey=${process.env.MSG91_AUTH_KEY}&mobile=91${phone}&otp=${otp}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.type !== 'success') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark as verified in DB
    await supabaseAdmin.from('aadhaar_verifications').upsert({
      user_id: req.userId,
      status: 'verified',
      verified_at: new Date().toISOString(),
      provider_reference: `msg91_phone_verified_${phone}`,
      is_mock: false
    }, { onConflict: 'user_id' });

    // Audit
    await supabaseAdmin.from('audit_events').insert({
      user_id: req.userId,
      event_type: 'phone_verified',
      metadata: { provider: 'msg91', phone_last4: phone.slice(-4) }
    });

    console.log(`[MSG91] Phone verified for user ${req.userId}`);
    res.json({ success: true, provider: 'msg91' });

  } catch (err) {
    console.error('[MSG91] Verify OTP error:', err.message);
    res.status(500).json({ error: 'OTP verification failed' });
  }
});

/**
 * POST /api/verify/aadhaar/initiate
 * Initiate Aadhaar OTP via Surepass (licensed UIDAI partner).
 * Signup at https://dashboard.surepass.io — sandbox available instantly.
 */
app.post('/api/verify/aadhaar/initiate', requireAuth, async (req, res) => {
  if (VERIFICATION_PROVIDER === 'surepass' && !SUREPASS_CONFIGURED) {
    return res.status(503).json({
      error: 'Surepass not configured',
      setup: 'Signup at dashboard.surepass.io → get API token → set SUREPASS_TOKEN in sidecar/.env'
    });
  }
  if (VERIFICATION_PROVIDER === 'uidai' && !UIDAI_CONFIGURED) {
    return res.status(503).json({
      error: 'UIDAI not configured. Requires formal onboarding at developer.uidai.gov.in',
      alternative: 'Set VERIFICATION_PROVIDER=surepass and add SUREPASS_TOKEN for faster access'
    });
  }

  const { aadhaar_last4, consent } = req.body;
  if (!consent) return res.status(400).json({ error: 'Explicit consent required' });
  if (!aadhaar_last4 || !/^\d{4}$/.test(aadhaar_last4)) {
    return res.status(400).json({ error: 'Provide last 4 digits of Aadhaar only' });
  }

  // Record consent
  await supabaseAdmin.from('aadhaar_verifications').upsert({
    user_id: req.userId,
    status: 'in_progress',
    consent_given_at: new Date().toISOString(),
    is_mock: false
  }, { onConflict: 'user_id' });

  if (VERIFICATION_PROVIDER === 'surepass' && SUREPASS_CONFIGURED) {
    try {
      // Surepass Aadhaar OTP Send
      // Docs: https://docs.surepass.io/aadhaar-verification
      const response = await fetch(`${process.env.SUREPASS_BASE_URL}/aadhaar-v2/generate-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUREPASS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_number: `XXXXXXXX${aadhaar_last4}` })
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Surepass OTP generation failed');
      }

      console.log(`[Surepass] OTP sent for user ${req.userId}`);
      return res.json({
        success: true,
        client_id: data.data?.client_id,
        provider: 'surepass'
      });
    } catch (err) {
      console.error('[Surepass] Error:', err.message);
      return res.status(500).json({ error: 'Aadhaar OTP initiation failed via Surepass' });
    }
  }

  // UIDAI direct — pending formal onboarding
  res.status(503).json({
    error: 'UIDAI direct integration pending formal onboarding',
    recommendation: 'Set VERIFICATION_PROVIDER=surepass for immediate access (1-2 day approval)',
    uidai_dashboard: 'https://developer.uidai.gov.in'
  });
});

/**
 * POST /api/verify/aadhaar/confirm
 * Confirm Aadhaar OTP via Surepass or UIDAI.
 */
app.post('/api/verify/aadhaar/confirm', requireAuth, async (req, res) => {
  const { client_id, otp } = req.body;
  if (!client_id || !otp) return res.status(400).json({ error: 'Missing client_id or otp' });

  if (VERIFICATION_PROVIDER === 'surepass' && SUREPASS_CONFIGURED) {
    try {
      const response = await fetch(`${process.env.SUREPASS_BASE_URL}/aadhaar-v2/submit-otp`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUREPASS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ client_id, otp })
      });
      const data = await response.json();

      if (!data.success) {
        await supabaseAdmin.from('aadhaar_verifications').upsert({
          user_id: req.userId, status: 'failed',
          failed_reason: data.message || 'OTP mismatch'
        }, { onConflict: 'user_id' });
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      // Mark verified — NEVER store Aadhaar number
      await supabaseAdmin.from('aadhaar_verifications').upsert({
        user_id: req.userId,
        status: 'verified',
        verified_at: new Date().toISOString(),
        provider_reference: client_id,
        is_mock: false
      }, { onConflict: 'user_id' });

      await supabaseAdmin.from('audit_events').insert({
        user_id: req.userId,
        event_type: 'aadhaar_verified',
        metadata: { provider: 'surepass' }
      });

      console.log(`[Surepass] Aadhaar verified for user ${req.userId}`);
      return res.json({ success: true, provider: 'surepass' });

    } catch (err) {
      console.error('[Surepass] Confirm error:', err.message);
      return res.status(500).json({ error: 'Aadhaar verification failed' });
    }
  }

  res.status(503).json({ error: 'No active Aadhaar provider configured' });
});

// ─── Health check update ─────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    razorpay: RAZORPAY_CONFIGURED ? 'configured' : 'not_configured',
    verification_provider: VERIFICATION_PROVIDER,
    msg91: MSG91_CONFIGURED ? 'configured' : 'not_configured',
    surepass: SUREPASS_CONFIGURED ? 'configured' : 'not_configured',
    uidai: UIDAI_CONFIGURED ? 'configured' : 'not_configured (requires formal onboarding)',
    supabase: !missing.includes('SUPABASE_URL') ? 'configured' : 'not_configured',
    timestamp: new Date().toISOString()
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Roomora Sidecar Server running on port ${PORT}`);
  console.log(`   Razorpay:     ${RAZORPAY_CONFIGURED ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`   Verification: ${VERIFICATION_PROVIDER.toUpperCase()} provider`);
  if (VERIFICATION_PROVIDER === 'msg91') {
    console.log(`   MSG91:        ${MSG91_CONFIGURED ? '✅ Configured (Phone OTP ready)' : '⚠️  Not configured — signup at msg91.com'}`);
  } else if (VERIFICATION_PROVIDER === 'surepass') {
    console.log(`   Surepass:     ${SUREPASS_CONFIGURED ? '✅ Configured (Aadhaar via licensed partner)' : '⚠️  Not configured — signup at dashboard.surepass.io'}`);
  } else {
    console.log(`   UIDAI:        ${UIDAI_CONFIGURED ? '✅ Configured' : '⚠️  Requires formal onboarding at developer.uidai.gov.in'}`);
  }
  console.log(`   Supabase:     ${!missing.includes('SUPABASE_URL') ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`\n   Health check: http://localhost:${PORT}/health\n`);
});


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
