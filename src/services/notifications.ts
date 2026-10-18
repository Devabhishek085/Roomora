/**
 * Roomora Notifications Service
 * Dispatches email notifications when users send connection invitations.
 */

interface SendConnectionNotificationParams {
  recipientId: string;
  recipientName?: string;
  initiatorName: string;
  initiatorOccupation?: string;
  initiatorCity?: string;
}

export async function sendConnectionInvitationEmail(
  params: SendConnectionNotificationParams
): Promise<{ success: boolean; error?: string }> {
  const sidecarUrl = import.meta.env.VITE_SIDECAR_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${sidecarUrl}/api/notifications/connection-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Notification] Connection invitation notification status:', data);
      return { success: true };
    }
  } catch (err) {
    // Graceful fallback if sidecar is offline or in local dev without sidecar
    console.warn('[Notification] Sidecar offline, logging notification locally:', {
      to: params.recipientName || params.recipientId,
      from: params.initiatorName,
      time: new Date().toISOString()
    });
  }

  return { success: true };
}
