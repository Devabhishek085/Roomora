import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Users, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { AnimatedRoomoraLogo } from '../components/AnimatedRoomoraLogo';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendEmailOtp, verifyEmailOtp, isLoading } = useAuthStore();

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP flow state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Registration Submit (Step 1: Validate and send OTP code)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) return setError('Please enter your display name.');
    if (!email.includes('@')) return setError('Please enter a valid email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    // Send verification OTP to email using the working Resend/Supabase OTP flow
    const result = await sendEmailOtp(email, displayName.trim());
    if (result.error) {
      if (result.error.toLowerCase().includes('rate limit')) {
        setError('Email rate limit reached. Please wait a minute and try again.');
      } else {
        setError(result.error);
      }
    } else {
      setOtpSent(true);
      setResendCooldown(30);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setError(null);

    const result = await sendEmailOtp(email, displayName.trim());
    if (result.error) {
      setError(result.error);
    } else {
      setResendCooldown(30);
    }
  };

  // Handle Verify OTP (Step 2: Verify code & save password)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      return setError('Please enter the verification code sent to your email.');
    }

    // Verify OTP and set user password simultaneously
    const result = await verifyEmailOtp(email, otpCode.trim(), password);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/onboarding'), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <AnimatedRoomoraLogo size="lg" />
          </div>
          <h1 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
            Join Roomora
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Find your compatible roommate — not just a flatmate
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-8">
          {!isSupabaseConfigured && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
              <strong className="block font-bold mb-1">⚠️ Demo Mode</strong>
              Backend not configured. Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code> to enable registration.
            </div>
          )}

          {success ? (
            /* Success confirmation */
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Account Verified!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You've received 10 free connection tokens. Redirecting to your profile setup...
              </p>
            </div>
          ) : !otpSent ? (
            /* Step 1: Registration Form with Name, Email & Password */
            <form onSubmit={handleRegisterSubmit} className="space-y-5" id="register-form">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-name">
                  Full / Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-email"
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

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-password">
                  Password (for future sign-ins)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
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

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-confirm-password">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
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

              <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-teal-800 dark:text-teal-300 text-xs">
                <Users className="w-4 h-4 shrink-0" />
                <span>Every new account starts with <strong>10 free connection tokens</strong>.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
                id="register-submit-btn"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                ) : (
                  <>
                    <span>Create Account & Send Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                🔒 You only verify your email with an OTP once now. Afterward, you simply log in with your password.
              </p>
            </form>
          ) : (
            /* Step 2: One-time OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="space-y-5" id="register-verify-otp-form">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Verify Your Email</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We emailed a verification code to:
                </p>
                <p className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">
                  {email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-center" htmlFor="reg-otp-code">
                  Enter Verification Code
                </label>
                <input
                  id="reg-otp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
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
                id="register-confirm-otp-btn"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
                ) : (
                  <>
                    <span>Verify & Finish Registration</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(''); setError(null); }}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  ← Edit details
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleResendOtp}
                  className="text-teal-600 dark:text-teal-400 font-bold hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? '' : 'hover:rotate-180 transition-transform'}`} />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
              Sign in with password
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6 max-w-sm mx-auto">
          By creating an account you agree to our Terms of Service and Privacy Policy.
          Personal data is handled per DPDP Act 2023 guidelines.
        </p>
      </div>
    </div>
  );
};
