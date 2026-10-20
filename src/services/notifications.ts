/**
 * Roomora Notifications Service
 * ─────────────────────────────────────────────────────────────
 * Sends email notifications via the Roomora sidecar server.
 * The sidecar uses Gmail SMTP (nodemailer) to deliver emails.
 *
 * Security:
 *   - All calls to sidecar are JWT-authenticated (Supabase token)
 *   - Recipient email is looked up server-side via Supabase Admin API
 *   - No email addresses are ever passed from the browser
 */
import { supabase } from '../lib/supabase';

const SIDECAR_URL = import.meta.env.VITE_SIDECAR_URL || 'http://localhost:3001';

interface SendConnectionNotificationParams {
  recipientId: string;
  initiatorName: string;
  initiatorAvatar?: string;
  initiatorOccupation?: string;
  initiatorCity?: string;
  connectionId?: string;
}

/**
 * Send a connection request email notification to the recipient.
 * Called fire-and-forget from ConnectModal after a successful connection.
 * Never throws — errors are logged and swallowed to not block the UI.
 */
export async function sendConnectionInvitationEmail(
  params: SendConnectionNotificationParams
): Promise<{ success: boolean; error?: string; reason?: string }> {
  try {
    // Get current user JWT token
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      console.warn('[Notification] No auth token — cannot send notification');
      return { success: false, reason: 'not_authenticated' };
    }

    const response = await fetch(`${SIDECAR_URL}/api/notify/connection-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        connectionId: params.connectionId,
        recipientId: params.recipientId,
        senderName: params.initiatorName,
        senderAvatar: params.initiatorAvatar,
        senderOccupation: params.initiatorOccupation,
        senderCity: params.initiatorCity,
      }),
    });

    const data = await response.json();

    if (data.sent) {
      console.log(`[Notification] ✉️  Email sent to recipient ${params.recipientId}`);
      return { success: true };
    }

    // Sidecar returned ok but didn't send (e.g. email not configured)
    console.warn('[Notification] Sidecar responded but email not sent:', data.reason);
    return { success: false, reason: data.reason };

  } catch (err) {
    // Sidecar offline — graceful degradation
    console.warn('[Notification] Sidecar unreachable — notification skipped:', err);
    return { success: false, reason: 'sidecar_offline' };
  }
}
