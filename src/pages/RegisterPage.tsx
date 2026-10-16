import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { isSupabaseConfigured } from '../lib/supabase';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuthStore();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.displayName.trim()) return setError('Please enter your display name.');
    if (!form.email.includes('@')) return setError('Please enter a valid email address.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    const result = await signUp(form.email, form.password, form.displayName.trim());
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white text-3xl shadow-lg shadow-teal-500/20 mb-4">
            🏡
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
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Account Created!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You've received 10 free connection tokens. Redirecting to your profile setup...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" id="register-form">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-name">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    value={form.displayName}
                    onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="Your first name or nickname"
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
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reg-password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
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
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
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

              {/* Free tokens info */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-teal-800 dark:text-teal-300 text-xs">
                <Users className="w-4 h-4 shrink-0" />
                <span>Every new account starts with <strong>10 free connection tokens</strong> — no credit card required.</span>
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
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6 max-w-sm mx-auto">
          By creating an account you agree to our Terms of Service and Privacy Policy.
          Personal data is handled per DPDP Act 2023 guidelines.
        </p>
      </div>
    </div>
  );
};
