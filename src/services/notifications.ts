/**
 * Roomora Notifications Service
 * Dispatches email notifications when users send connection invitations.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface SendConnectionNotificationParams {
  recipientId: string;
  recipientName?: string;
  recipientEmail?: string;
  initiatorName: string;
  initiatorOccupation?: string;
  initiatorCity?: string;
}

export async function sendConnectionInvitationEmail(
  params: SendConnectionNotificationParams
): Promise<{ success: boolean; error?: string; reason?: string }> {
  // 1. Resolve recipient email
  let targetEmail = params.recipientEmail;

  if (!targetEmail && isSupabaseConfigured) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('id', params.recipientId)
        .single();

      if (profile?.email) {
        targetEmail = profile.email;
      }
    } catch (e) {
      console.warn('[Notification] Error looking up recipient email:', e);
    }
  }

  const recipientName = params.recipientName || 'Roommate';
  const initiatorName = params.initiatorName || 'A Roomora user';
  const sidecarUrl = import.meta.env.VITE_SIDECAR_URL || 'http://localhost:3001';
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

  // 2. Try sidecar server first if running
  try {
    const response = await fetch(`${sidecarUrl}/api/notifications/connection-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        recipientEmail: targetEmail
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[Notification] Sidecar response:', data);
      if (data.sent) {
        return { success: true };
      }
    }
  } catch {
    // Sidecar is offline, proceed to fallback delivery or logging
  }

  // 3. Direct delivery via Resend API if VITE_RESEND_API_KEY is configured
  if (resendApiKey && targetEmail) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://roomora.vercel.app';
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">Roomora</h1>
          <p style="color: #ccfbf1; font-size: 14px; margin: 0; font-weight: 500;">Smart Roommate Finding Platform</p>
        </div>
        <div style="padding: 32px 28px;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin: 0 0 16px 0;">New Connection Invitation! 🤝</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
            Hi <strong>${recipientName}</strong>,
          </p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
            <strong>${initiatorName}</strong> (${[params.initiatorOccupation, params.initiatorCity].filter(Boolean).join(' • ')}) wants to connect with you on Roomora!
          </p>
          <div style="background: #f8fafc; border-radius: 12px; padding: 18px 20px; border-left: 4px solid #14b8a6; margin-bottom: 24px;">
            <p style="color: #334155; font-size: 14px; margin: 0; font-weight: 500;">
              🔒 For mutual privacy and safety, you must accept their connection invitation before chatting begins.
            </p>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${origin}/connections" style="background: #14b8a6; color: #022c22; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(20, 184, 166, 0.25);">
              Review & Accept Invitation
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center; margin: 24px 0 0 0;">
            You can view or decline this invitation anytime on your Roomora Connections page.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Roomora. All rights reserved.
          </p>
        </div>
      </div>
    `;

    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Roomora <onboarding@resend.dev>',
          to: [targetEmail],
          subject: `🤝 New Roommate Connection Request from ${initiatorName} on Roomora`,
          html: emailHtml
        })
      });

      if (resendRes.ok) {
        console.log('[Notification] Email dispatched successfully to:', targetEmail);
        return { success: true };
      }
    } catch (sendErr) {
      console.warn('[Notification] Error calling Resend API directly:', sendErr);
    }
  }

  console.warn('[Notification] Real email was not sent because VITE_RESEND_API_KEY is not configured in .env.local', {
    recipientEmail: targetEmail || 'Not found in profiles',
    recipient: recipientName,
    initiator: initiatorName
  });

  return {
    success: false,
    reason: !targetEmail ? 'recipient_email_not_found' : 'missing_resend_api_key'
  };
}
