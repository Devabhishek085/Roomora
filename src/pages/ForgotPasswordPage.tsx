import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { AnimatedRoomoraLogo } from '../components/AnimatedRoomoraLogo';

type RecoveryStep = 'email' | 'otp' | 'new_password' | 'success';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendPasswordResetEmail, verifyPasswordResetOtp, updatePassword, isLoading } = useAuthStore();

  const [step, setStep] = useState<RecoveryStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus OTP input when entering 'otp' step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Detect if user landed from an email reset link
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const hash = window.location.hash;
      const isRecovery =
        location.pathname === '/reset-password' ||
        hash.includes('type=recovery') ||
        hash.includes('access_token') ||
        Boolean(code);

      if (!isRecovery) return;

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError) {
            setStep('new_password');
            setStatusNote('Verified! Enter your new password below.');
            return;
          }
        } catch (e) {
          console.warn('[Recovery] PKCE code exchange note:', e);
        }
      }

      if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
        setStep('new_password');
        setStatusNote('Verified! Enter your new password below.');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStep('new_password');
        setStatusNote('Verified! Enter your new password below.');
      }
    };

    handleAuthRedirect();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && (window.location.hash.includes('recovery') || window.location.search.includes('code')))
      ) {
        setStep('new_password');
        setStatusNote('Verified! Enter your new password below.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send recovery email and directly show OTP input page
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      return setError('Please enter a valid email address.');
    }

    const result = await sendPasswordResetEmail(cleanEmail);
    if (result.error) {
      if (result.error.toLowerCase().includes('rate limit')) {
        setError('Too many requests. Please wait a minute before requesting another code.');
      } else {
        setError(result.error);
      }
    } else {
      // DIRECTLY show the OTP entering page!
      setStep('otp');
      setResendCooldown(30);
      setStatusNote(`Enter the 6-digit code sent to ${cleanEmail}`);
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const result = await sendPasswordResetEmail(cleanEmail);
    if (result.error) {
      setError(result.error);
    } else {
      setResendCooldown(30);
      setStatusNote('A fresh 6-digit code has been sent to your email.');
    }
  };

  // Step 2: Verify OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      return setError('Please enter the 6-digit verification code.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = await verifyPasswordResetOtp(cleanEmail, cleanCode);
    if (result.error) {
      setError('Invalid or expired code. Please check and try again.');
    } else {
      setStep('new_password');
      setStatusNote('Code verified! Please create your new password.');
    }
  };

  // Step 3: Set new password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    const result = await updatePassword(newPassword);
    if (result.error) {
      setError(result.error);
    } else {
      setStep('success');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <AnimatedRoomoraLogo size="lg" />
          </div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
            {step === 'email' && 'Forgot password?'}
            {step === 'otp' && 'Enter 6-digit code'}
            {step === 'new_password' && 'Set new password'}
            {step === 'success' && 'Password updated!'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {step === 'email' && "Enter your email to receive a 6-digit recovery code"}
            {step === 'otp' && `We've sent a 6-digit code to ${email || 'your email'}`}
            {step === 'new_password' && 'Create a strong password for your Roomora account'}
            {step === 'success' && 'Your account password has been updated successfully'}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-8 transition-all">
          {!isSupabaseConfigured && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
              <strong className="block font-bold mb-1">⚠️ Demo Mode</strong>
              Backend not configured. Configure Supabase credentials to enable live password reset.
            </div>
          )}

          {statusNote && step !== 'success' && (
            <div className="mb-5 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-medium flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>{statusNote}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 'email' && (
            <form onSubmit={handleSendEmail} className="space-y-5" id="forgot-password-form">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reset-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
                id="send-reset-btn"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                ) : (
                  <>
                    <span>Get 6-Digit Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: DIRECT OTP ENTERING PAGE */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5" id="verify-otp-form">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="otp-code">
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setOtpCode(''); setError(null); }}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                  >
                    Change email
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={otpInputRef}
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setOtpCode(val);
                    }}
                    placeholder="••••••"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xl font-mono font-bold tracking-[0.4em] text-center outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>

                <div className="flex items-center justify-between mt-2.5 px-1">
                  <span className="text-[11px] text-slate-400">
                    Sent to {email}
                  </span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isLoading}
                    onClick={handleResend}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50 disabled:no-underline"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'}`} />
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otpCode.trim().length < 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
                id="verify-code-btn"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 'new_password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4" id="new-password-form">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="confirm-new-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="confirm-new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95 mt-2"
                id="save-new-password-btn"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                ) : (
                  <>
                    <span>Save New Password & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success Screen */}
          {step === 'success' && (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 dark:bg-teal-950/70 border border-teal-300 dark:border-teal-700/60 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                  You're all set! 🎉
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your password has been successfully reset. You can now sign in to your Roomora account using your new password.
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
                id="login-after-reset-btn"
              >
                <span>Sign In to Roomora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
