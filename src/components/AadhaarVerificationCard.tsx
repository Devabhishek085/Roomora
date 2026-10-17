import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  KeyRound,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  initiateAadhaarVerification,
  confirmAadhaarOtp,
  getVerificationStatus,
  checkSidecarHealth,
  type VerificationRecord,
  type SidecarHealth,
} from '../services/aadhaar';
import { useAuthStore } from '../store/useAuthStore';

type Step = 'idle' | 'consent' | 'enter_last4' | 'otp_sent' | 'confirming' | 'verified' | 'failed' | 'already_verified';

export const AadhaarVerificationCard: React.FC = () => {
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>('idle');
  const [last4, setLast4] = useState('');
  const [otp, setOtp] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<VerificationRecord | null>(null);
  const [health, setHealth] = useState<SidecarHealth | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // On mount: check current status and sidecar health
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      setLoadingStatus(true);
      const [status, sidecarHealth] = await Promise.all([
        getVerificationStatus(user.id),
        checkSidecarHealth(),
      ]);
      setRecord(status);
      setHealth(sidecarHealth);
      if (status?.status === 'verified') setStep('already_verified');
      setLoadingStatus(false);
    };

    init();
  }, [user]);

  const handleStart = () => setStep('consent');

  const handleConsentAccepted = () => setStep('enter_last4');

  const handleSendOtp = async () => {
    setError(null);
    if (!/^\d{4}$/.test(last4)) {
      setError('Enter exactly the last 4 digits of your Aadhaar number.');
      return;
    }

    setStep('otp_sent'); // optimistic — show spinner
    const result = await initiateAadhaarVerification(last4, true);

    if (!result.success) {
      setError(result.error ?? 'Failed to send OTP');
      if (result.setup_required) setStep('failed');
      else setStep('enter_last4');
      return;
    }

    setClientId(result.client_id ?? null);
    setStep('otp_sent');
  };

  const handleConfirmOtp = async () => {
    setError(null);
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit OTP from your registered mobile number.');
      return;
    }
    if (!clientId) {
      setError('Session expired. Please start over.');
      setStep('enter_last4');
      return;
    }

    setStep('confirming');
    const result = await confirmAadhaarOtp(clientId, otp);

    if (result.success) {
      setStep('verified');
      // Refresh DB record
      if (user) {
        const updated = await getVerificationStatus(user.id);
        setRecord(updated);
      }
    } else {
      setError(result.error ?? 'OTP verification failed');
      setStep('otp_sent');
    }
  };

  const handleRetry = () => {
    setStep('enter_last4');
    setOtp('');
    setClientId(null);
    setError(null);
  };

  if (!user) return null;

  // ─── Verified state ──────────────────────────────────────────────────────
  if (step === 'already_verified' || step === 'verified') {
    return (
      <div className="p-6 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-teal-900 dark:text-teal-100 text-sm">Aadhaar Verified ✓</h3>
            <p className="text-xs text-teal-700 dark:text-teal-300">
              Your identity is verified via Surepass (licensed UIDAI partner).
              {record?.verified_at && (
                <> Verified on {new Date(record.verified_at).toLocaleDateString('en-IN')}.</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-teal-600 dark:text-teal-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Your Aadhaar number was never stored — only verification status is recorded.</span>
        </div>
      </div>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Checking verification status...</span>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Aadhaar Identity Verification
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Verify your identity via Surepass — a licensed UIDAI partner. Adds a ✓ badge to your profile.
          </p>
        </div>
      </div>

      {/* Sidecar health warning */}
      {health && !health.reachable && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Sidecar server not running. Start it with{' '}
            <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">cd sidecar &amp;&amp; npm run dev</code>
          </span>
        </div>
      )}

      {health?.reachable && !health.surepass_configured && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="block">Surepass not yet configured.</strong>
            <span>
              Add your token to{' '}
              <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">sidecar/.env</code>
              {' '}— get it at{' '}
              <a href="https://dashboard.surepass.io" target="_blank" rel="noopener noreferrer"
                className="underline font-semibold">dashboard.surepass.io</a>
            </span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ── STEP: Idle ─────────────────────────────────────────────────────── */}
      {step === 'idle' && (
        <button
          onClick={handleStart}
          disabled={health !== null && !health.reachable}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-950 disabled:text-slate-400 font-bold text-sm transition-all active:scale-95"
          id="start-aadhaar-verification-btn"
        >
          <span>Verify with Aadhaar (via Surepass)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* ── STEP: Consent ─────────────────────────────────────────────────── */}
      {step === 'consent' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <p className="font-bold text-slate-800 dark:text-white">Consent &amp; Privacy Notice</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your Aadhaar number is <strong>never stored</strong> by Roomora.</li>
              <li>Only the last 4 digits are used to initiate the OTP request.</li>
              <li>Verification is processed by <strong>Surepass</strong> — an authorized UIDAI partner.</li>
              <li>An OTP will be sent to your <strong>Aadhaar-registered mobile number</strong> by Surepass/UIDAI.</li>
              <li>Only your verification status (Verified / Not Verified) is stored.</li>
            </ul>
            <a
              href="https://surepass.io/privacy-policy"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold mt-1"
            >
              Surepass Privacy Policy <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('idle')}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
              Cancel
            </button>
            <button
              onClick={handleConsentAccepted}
              className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all"
              id="accept-aadhaar-consent-btn"
            >
              I Consent — Continue
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: Enter Last 4 Digits ─────────────────────────────────────── */}
      {step === 'enter_last4' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Last 4 digits of your Aadhaar
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="e.g. 1234"
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-teal-500 outline-none text-slate-900 dark:text-white font-mono text-base tracking-widest transition-all"
              id="aadhaar-last4-input"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Only last 4 digits needed — we never see your full Aadhaar number.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('consent')}
              className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
              Back
            </button>
            <button
              onClick={handleSendOtp}
              disabled={last4.length !== 4}
              className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 disabled:text-slate-400 font-bold text-xs transition-all"
              id="send-aadhaar-otp-btn"
            >
              Send OTP
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: OTP Sent — Enter OTP ─────────────────────────────────────── */}
      {(step === 'otp_sent' || step === 'confirming') && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800 text-xs text-teal-800 dark:text-teal-200">
            <strong>OTP sent!</strong> Check the mobile number registered with your Aadhaar. Valid for 10 minutes.
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Enter 6-digit OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="------"
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-teal-500 outline-none text-slate-900 dark:text-white font-mono text-lg tracking-[0.5em] text-center transition-all"
              id="aadhaar-otp-input"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              disabled={step === 'confirming'}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" />
              Resend
            </button>
            <button
              onClick={handleConfirmOtp}
              disabled={otp.length !== 6 || step === 'confirming'}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 disabled:text-slate-400 font-bold text-xs transition-all"
              id="confirm-aadhaar-otp-btn"
            >
              {step === 'confirming' ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...</>
              ) : (
                <><KeyRound className="w-3.5 h-3.5" /> Verify OTP</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP: Failed (setup required) ─────────────────────────────────── */}
      {step === 'failed' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800 text-xs space-y-2">
            <p className="font-bold text-rose-800 dark:text-rose-200">Surepass Not Configured</p>
            <ol className="list-decimal list-inside space-y-1 text-rose-700 dark:text-rose-300">
              <li>Go to <a href="https://dashboard.surepass.io" target="_blank" rel="noopener noreferrer" className="underline font-semibold">dashboard.surepass.io</a></li>
              <li>Sign up → copy your API token</li>
              <li>Add to <code className="bg-rose-100 dark:bg-rose-900/40 px-1 rounded font-mono">sidecar/.env</code>: <code className="font-mono">SUREPASS_TOKEN=your_token</code></li>
              <li>Restart the sidecar: <code className="font-mono">npm run dev</code></li>
            </ol>
          </div>
          <button onClick={() => setStep('idle')}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
            Go Back
          </button>
        </div>
      )}

      {/* Info footer */}
      {step === 'idle' && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Verification powered by Surepass — a licensed UIDAI authorized partner.
          Adds a ✓ Shield badge to your profile increasing match response rate.
        </p>
      )}
    </div>
  );
};
