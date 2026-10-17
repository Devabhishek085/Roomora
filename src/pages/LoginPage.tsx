import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { isSupabaseConfigured } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email.includes('@')) return setError('Please enter a valid email address.');
    if (!form.password) return setError('Please enter your password.');

    const result = await signIn(form.email, form.password);
    if (result.error) {
      // Map common Supabase error messages to user-friendly text
      if (result.error.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(result.error);
      }
    } else {
      navigate('/matches');
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
            Welcome back
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in to continue finding your compatible roommate
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-8">
          {!isSupabaseConfigured && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
              <strong className="block font-bold mb-1">⚠️ Demo Mode</strong>
              Backend not configured. Set Supabase credentials in <code>.env.local</code> to enable sign-in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                  onClick={() => {
                    // TODO: Implement password reset via Supabase auth.resetPasswordForEmail
                    alert('Password reset: Contact support or check your email for a reset link.');
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Your password"
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

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
              id="login-submit-btn"
            >
              {isLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">
                Create one free
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
