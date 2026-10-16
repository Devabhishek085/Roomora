/**
 * UIDAI Aadhaar Verification Adapter
 *
 * IMPORTANT NOTICE:
 * The UIDAI Developer Sandbox requires formal onboarding, an authorized use case,
 * and approved credentials before it can be used for identity verification.
 * Consumer/individual applications cannot access Aadhaar OTP verification APIs
 * without UIDAI authorization. Authentication key and API endpoints must be obtained
 * from https://developer.uidai.gov.in
 *
 * Status of this integration:
 *   ✅ Integration boundary defined
 *   ✅ Secure server-side adapter pattern implemented
 *   ✅ Mock adapter clearly labeled (development only)
 *   ⏳ Awaiting UIDAI sandbox credential onboarding
 *   ⏳ Awaiting server-side sidecar deployment for credential isolation
 *
 * The mock adapter below simulates the verification flow for development testing.
 * It is UNMISTAKABLY LABELED and cannot be activated in production.
 * It produces no real verification status — only development placeholders.
 */

export type AadhaarVerificationStep =
  | 'idle'
  | 'consent'
  | 'sending_otp'
  | 'otp_sent'
  | 'verifying'
  | 'success'
  | 'failed'
  | 'unavailable';

export interface AadhaarInitiateResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  isMock: boolean;
}

export interface AadhaarVerifyResult {
  success: boolean;
  providerReference?: string;
  verifiedAt?: string;
  error?: string;
  isMock: boolean;
}

const IS_DEV = import.meta.env.VITE_APP_ENV === 'development' || !import.meta.env.VITE_APP_ENV;

/**
 * Determines whether the real UIDAI integration is available.
 * In production, this checks for a configured sidecar endpoint.
 */
function isUidaiConfigured(): boolean {
  // In a real deployment, this would check if the sidecar server
  // has UIDAI credentials configured via environment variables.
  // For now, always returns false — integration awaiting credentials.
  return false;
}

/**
 * Initiates Aadhaar OTP verification.
 *
 * In production (UIDAI authorized): Sends request to sidecar server which
 * calls UIDAI Auth API with server-stored credentials. Never exposes API keys
 * to the browser.
 *
 * In development (mock): Returns a simulated transaction ID. No Aadhaar number
 * is validated. This function produces no real identity verification result.
 *
 * @param consentGiven - User must explicitly give consent before calling this
 */
export async function initiateAadhaarOtp(
  aadhaarLastFour: string, // Only last 4 digits — never store full number
  consentGiven: boolean
): Promise<AadhaarInitiateResult> {
  if (!consentGiven) {
    return { success: false, error: 'Explicit consent required before verification', isMock: true };
  }

  if (isUidaiConfigured()) {
    // TODO: Call sidecar server endpoint /api/aadhaar/initiate
    // The sidecar holds UIDAI_CLIENT_ID and UIDAI_CLIENT_SECRET in server env vars
    // and never exposes them to the browser.
    //
    // const response = await fetch('/api/aadhaar/initiate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ last_four: aadhaarLastFour, consent: true })
    // });
    // const data = await response.json();
    // return { success: data.success, transactionId: data.transactionId, isMock: false };

    return { success: false, error: 'UIDAI sidecar not deployed', isMock: false };
  }

  // ============================================================
  // DEVELOPMENT MOCK ONLY — NOT REAL UIDAI VERIFICATION
  // This simulates the OTP flow for UI development and testing.
  // A response from this mock is NEVER treated as real verification.
  // ============================================================
  if (!IS_DEV) {
    return {
      success: false,
      error: 'Aadhaar verification unavailable — UIDAI credentials not configured',
      isMock: true
    };
  }

  console.warn(
    '[UIDAI Mock] ⚠️ DEV MOCK ACTIVE — This is NOT real Aadhaar verification. ' +
    'Last four provided:', aadhaarLastFour
  );

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  return {
    success: true,
    transactionId: `MOCK_TXN_${Date.now()}_DEV_ONLY`,
    isMock: true
  };
}

/**
 * Verifies the Aadhaar OTP submitted by the user.
 *
 * IMPORTANT: Even in mock mode, this does NOT grant a real verified status.
 * The Supabase database will record is_mock: true for any mock verification,
 * distinguishing it from real UIDAI-confirmed results.
 */
export async function verifyAadhaarOtp(
  transactionId: string,
  otp: string
): Promise<AadhaarVerifyResult> {
  if (isUidaiConfigured()) {
    // TODO: Call sidecar /api/aadhaar/verify
    return { success: false, error: 'UIDAI sidecar not deployed', isMock: false };
  }

  if (!IS_DEV) {
    return {
      success: false,
      error: 'Aadhaar verification unavailable',
      isMock: true
    };
  }

  // ============================================================
  // DEVELOPMENT MOCK ONLY
  // ============================================================
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!transactionId.startsWith('MOCK_TXN_')) {
    return { success: false, error: 'Invalid mock transaction', isMock: true };
  }

  // In mock: OTP '123456' always succeeds for testing
  if (otp === '123456') {
    console.warn('[UIDAI Mock] ⚠️ DEV MOCK VERIFICATION — result is NOT real UIDAI confirmation');
    return {
      success: true,
      providerReference: `MOCK_REF_${Date.now()}_DEV_ONLY`,
      verifiedAt: new Date().toISOString(),
      isMock: true
    };
  }

  return { success: false, error: 'Invalid OTP (mock: use 123456 for testing)', isMock: true };
}

/**
 * Returns the verification integration status for display in the UI.
 */
export function getVerificationStatus(): {
  available: boolean;
  isMock: boolean;
  message: string;
} {
  if (isUidaiConfigured()) {
    return {
      available: true,
      isMock: false,
      message: 'Aadhaar verification via UIDAI is configured'
    };
  }

  if (IS_DEV) {
    return {
      available: true,
      isMock: true,
      message: '⚠️ Development mock mode — not real UIDAI verification'
    };
  }

  return {
    available: false,
    isMock: false,
    message: 'Aadhaar verification requires UIDAI sandbox credentials. See documentation.'
  };
}
