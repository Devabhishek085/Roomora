/**
 * Aadhaar / Identity Verification Service
 * ────────────────────────────────────────────────────────────
 * Calls the Roomora sidecar server which handles the actual
 * provider API call (Surepass → UIDAI licensed partner).
 *
 * Security:
 *   - SUREPASS_TOKEN stays in sidecar/.env — never in the browser
 *   - No Aadhaar number is ever sent to or stored by this frontend
 *   - Only the last 4 digits are accepted as input (privacy by design)
 *   - All calls require a valid Supabase JWT (requireAuth middleware)
 *
 * Provider: Surepass (https://surepass.io)
 *   - Licensed UIDAI authorized partner
 *   - Sandbox available instantly at surepass.io
 *   - Production approval: 1-2 business days
 */

import { supabase } from '../lib/supabase';

const SIDECAR_URL = import.meta.env.VITE_SIDECAR_URL || 'http://localhost:3001';

export type VerificationStatus =
  | 'not_started'
  | 'in_progress'
  | 'verified'
  | 'failed'
  | 'unavailable';

export interface VerificationRecord {
  status: VerificationStatus;
  verified_at: string | null;
  is_mock: boolean;
  provider_reference: string | null;
}

/** Get current auth token from Supabase session */
async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Helper: POST to sidecar with JWT auth */
async function sidecarPost(path: string, body: Record<string, unknown>) {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${SIDECAR_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Sidecar error ${res.status}`);
  }
  return data;
}

// ─── Step 1: Initiate Aadhaar OTP ────────────────────────────────────────────

export interface InitiateResult {
  success: boolean;
  client_id?: string;   // Surepass session ID — pass to confirmAadhaarOtp()
  provider?: string;
  error?: string;
  setup_required?: boolean;
}

/**
 * Initiates Aadhaar verification via Surepass.
 * User provides ONLY the last 4 digits of their Aadhaar (privacy by design).
 * An OTP is sent to the mobile number registered with Aadhaar by Surepass/UIDAI.
 *
 * @param aadhaar_last4 - Last 4 digits of Aadhaar number only
 * @param consent       - Must be true (explicit user consent required by law)
 */
export async function initiateAadhaarVerification(
  aadhaar_last4: string,
  consent: boolean
): Promise<InitiateResult> {
  if (!consent) {
    return { success: false, error: 'Explicit consent required before initiating verification' };
  }

  if (!/^\d{4}$/.test(aadhaar_last4)) {
    return { success: false, error: 'Enter only the last 4 digits of your Aadhaar number' };
  }

  try {
    const data = await sidecarPost('/api/verify/aadhaar/initiate', {
      aadhaar_last4,
      consent: true,
    });
    return { success: true, client_id: data.client_id, provider: data.provider };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification initiation failed';
    const setupRequired = message.includes('not configured') || message.includes('setup');
    return { success: false, error: message, setup_required: setupRequired };
  }
}

// ─── Step 2: Confirm OTP ─────────────────────────────────────────────────────

export interface ConfirmResult {
  success: boolean;
  provider?: string;
  error?: string;
}

/**
 * Submits the 6-digit OTP received by the user to Surepass.
 * On success, the aadhaar_verifications row is updated to status='verified'.
 * The Aadhaar number is NEVER stored anywhere.
 *
 * @param client_id - Session ID returned by initiateAadhaarVerification()
 * @param otp       - 6-digit OTP from the user's Aadhaar-registered phone
 */
export async function confirmAadhaarOtp(
  client_id: string,
  otp: string
): Promise<ConfirmResult> {
  if (!/^\d{6}$/.test(otp)) {
    return { success: false, error: 'OTP must be exactly 6 digits' };
  }

  try {
    const data = await sidecarPost('/api/verify/aadhaar/confirm', { client_id, otp });
    return { success: true, provider: data.provider };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'OTP verification failed';
    return { success: false, error: message };
  }
}

// ─── Fetch current verification status ───────────────────────────────────────

/**
 * Fetches the user's current verification record from Supabase.
 * Uses RLS — only returns the authenticated user's own record.
 */
export async function getVerificationStatus(userId: string): Promise<VerificationRecord | null> {
  const { data, error } = await supabase
    .from('aadhaar_verifications')
    .select('status, verified_at, is_mock, provider_reference')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as VerificationRecord;
}

// ─── Check sidecar is running and Surepass is configured ─────────────────────

export interface SidecarHealth {
  reachable: boolean;
  surepass_configured: boolean;
  verification_provider: string;
}

export async function checkSidecarHealth(): Promise<SidecarHealth> {
  try {
    const res = await fetch(`${SIDECAR_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { reachable: false, surepass_configured: false, verification_provider: 'unknown' };
    const data = await res.json();
    return {
      reachable: true,
      surepass_configured: data.surepass === 'configured',
      verification_provider: data.verification_provider ?? 'unknown',
    };
  } catch {
    return { reachable: false, surepass_configured: false, verification_provider: 'unknown' };
  }
}
