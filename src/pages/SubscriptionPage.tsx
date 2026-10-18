import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Crown, ArrowRight, Star, ShieldCheck, AlertCircle, Sparkles, X, Copy, CheckCircle2, CreditCard } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../services/subscriptions';
import { useAuthStore } from '../store/useAuthStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export const SubscriptionPage: React.FC = () => {
  const { user, tokenBalance, refreshTokenBalance } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [pendingPlan, setPendingPlan] = useState<{ id: string; amountPaise: number } | null>(null);

  const razorpayKeyId = (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || '';
  const isRazorpayConfigured = Boolean(razorpayKeyId && !razorpayKeyId.includes('YOUR_KEY'));

  const grantSubscriptionTokens = async (planId: string) => {
    if (!user || !isSupabaseConfigured) return;
    const tokens = planId === 'premium' ? 9999 : 999;
    try {
      await supabase.from('token_balances').upsert({
        user_id: user.id,
        balance: tokens,
        lifetime_granted: tokens,
        updated_at: new Date().toISOString()
      });
      await refreshTokenBalance();
    } catch (err) {
      console.warn('[Subscription] Failed to update token_balances:', err);
    }
  };

  const handleSimulatePayment = async (planId: string) => {
    setIsProcessing(planId);
    setShowConfigModal(false);
    try {
      await grantSubscriptionTokens(planId);
      setSuccessPlan(planId);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSubscribe = async (planId: string, amountPaise: number) => {
    if (!user) {
      alert('Please sign in to subscribe.');
      return;
    }

    if (!isRazorpayConfigured) {
      setPendingPlan({ id: planId, amountPaise });
      setShowConfigModal(true);
      return;
    }

    setIsProcessing(planId);

    try {
      // Step 1: Attempt to create order via sidecar if available
      let orderId: string | undefined = undefined;
      const sidecarUrl = (import.meta.env.VITE_SIDECAR_URL as string) || '';

      if (sidecarUrl) {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          const orderResponse = await fetch(`${sidecarUrl}/api/payments/create-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token || ''}`
            },
            body: JSON.stringify({ plan: planId, amount_paise: amountPaise })
          });

          if (orderResponse.ok) {
            const data = await orderResponse.json();
            orderId = data.order_id;
          }
        } catch {
          // If sidecar is not running or unreachable, fallback to direct client-side test checkout
          console.warn('[Payment] Sidecar order endpoint unreachable. Falling back to direct checkout.');
        }
      }

      // Step 2: Open Razorpay Checkout
      const options: Record<string, unknown> = {
        key: razorpayKeyId,
        amount: amountPaise,
        currency: 'INR',
        name: 'Roomora',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — Monthly`,
        order_id: orderId,
        prefill: {
          email: user.email || ''
        },
        theme: { color: '#14B8A6' },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
          // Verify on server if sidecar is available
          if (sidecarUrl && response.razorpay_signature) {
            try {
              const session = (await supabase.auth.getSession()).data.session;
              await fetch(`${sidecarUrl}/api/payments/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session?.access_token || ''}`
                },
                body: JSON.stringify({
                  ...response,
                  plan: planId
                })
              });
            } catch (err) {
              console.warn('[Payment] Sidecar verify unreachable:', err);
            }
          }

          // Grant unlimited tokens & activate plan
          await grantSubscriptionTokens(planId);
          setSuccessPlan(planId);
          setIsProcessing(null);
        },
        modal: {
          ondismiss: () => setIsProcessing(null)
        }
      };

      if (typeof window.Razorpay !== 'undefined') {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Dynamic script loader fallback
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
        script.onerror = () => {
          throw new Error('Could not load Razorpay SDK. Please check your internet connection.');
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment initialization failed';
      console.error('[Payment error]', err);
      // Give user the option to activate in sandbox if checkout fails
      setPendingPlan({ id: planId, amountPaise });
      setShowConfigModal(true);
    } finally {
      setIsProcessing(null);
    }
  };

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText('VITE_RAZORPAY_KEY_ID=rzp_test_TohohECsENDOMG');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>Connect Without Limits</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
            Choose Your Plan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Every new account gets 10 free connections. Upgrade when you&apos;re ready to connect with unlimited roommates.
          </p>

          {/* Current balance display */}
          {user && tokenBalance && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold">
              <span className="text-teal-600 dark:text-teal-400 font-black">
                {tokenBalance.balance >= 999 ? '♾️ Unlimited' : tokenBalance.balance}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {tokenBalance.balance >= 999 ? 'connections active' : `of ${tokenBalance.lifetime_granted} free connections remaining`}
              </span>
            </div>
          )}
        </div>

        {/* Integration status banner */}
        {!isRazorpayConfigured ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-left text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                <strong className="block font-bold">Vercel Setup Notice: Payment Key Not Yet Added</strong>
                <span>Add <code>VITE_RAZORPAY_KEY_ID</code> in Vercel Project Settings for live test gateway, or test in Sandbox mode.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition shadow-sm"
            >
              Setup Guide / Sandbox
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 flex items-center justify-between text-xs text-teal-900 dark:text-teal-200">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>
                Razorpay Gateway: <strong className="font-bold">{razorpayKeyId.startsWith('rzp_test') ? 'Test Mode Active' : 'Live Mode'}</strong> ({razorpayKeyId.slice(0, 8)}...)
              </span>
            </div>
            <span className="text-[10px] bg-teal-100 dark:bg-teal-900 px-2 py-0.5 rounded-full font-bold">Ready</span>
          </div>
        )}

        {successPlan && (
          <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-center animate-in fade-in duration-300">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-teal-600 dark:text-teal-400" />
            <strong className="block text-lg font-bold mb-1">Subscription Activated!</strong>
            <span className="text-sm">Your {successPlan} plan is now active. Enjoy unlimited roommate connections!</span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl border-2 p-8 flex flex-col transition-all ${
                plan.highlighted
                  ? 'border-teal-500 bg-gradient-to-b from-teal-950/30 to-slate-900/50 shadow-2xl shadow-teal-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-teal-500 text-slate-950 text-xs font-black shadow-md">
                    <Star className="w-3 h-3 fill-slate-950" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {plan.id === 'premium' ? (
                    <Crown className="w-5 h-5 text-amber-400" />
                  ) : plan.id === 'monthly' ? (
                    <Zap className="w-5 h-5 text-teal-500" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-slate-400" />
                  )}
                  <h2 className="text-xl font-black font-heading text-slate-900 dark:text-white">
                    {plan.name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>

                <div className="mt-4">
                  {plan.priceMonthly === 0 ? (
                    <span className="text-3xl font-black text-slate-900 dark:text-white">Free</span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        ₹{plan.priceMonthly}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">/month</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
                  {plan.connectionsPerMonth === 'unlimited'
                    ? '♾️ Unlimited connections'
                    : `${plan.connectionsPerMonth} free connections`}
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Check className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                user ? (
                  <div className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
                    Current Plan
                  </div>
                ) : (
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.id, plan.pricePaise)}
                  disabled={isProcessing === plan.id}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 cursor-pointer ${
                    plan.highlighted
                      ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                  } disabled:opacity-60`}
                  id={`subscribe-${plan.id}-btn`}
                >
                  {isProcessing === plan.id ? (
                    <span className="animate-spin w-4 h-4 border-2 border-current/30 border-t-current rounded-full" />
                  ) : (
                    <>
                      <span>Subscribe</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 space-y-1">
          <p>🔒 Payments are processed securely via Razorpay. We never store your card details.</p>
          <p>Cancel subscriptions anytime from your account settings.</p>
          <p>Prices include applicable taxes. Subject to Razorpay Terms of Service.</p>
        </div>
      </div>

      {/* ════════════ CONFIG / SANDBOX MODAL ════════════ */}
      {showConfigModal && (
        <div
          onClick={() => setShowConfigModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-500" />
                <h3 className="text-base font-extrabold font-heading text-slate-900 dark:text-white">
                  Payment Setup &amp; Sandbox Testing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                To enable live/test Razorpay payments on your deployed Vercel site:
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <strong className="block font-bold text-slate-800 dark:text-slate-200">
                  Step 1: Add Environment Variable in Vercel
                </strong>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Go to <strong>Vercel Dashboard &rarr; roomora-pink &rarr; Settings &rarr; Environment Variables</strong></li>
                  <li>Key: <code>VITE_RAZORPAY_KEY_ID</code></li>
                  <li>Value: <code>rzp_test_TohohECsENDOMG</code> (or your Razorpay key)</li>
                  <li>Click <strong>Save</strong> and Redeploy.</li>
                </ol>
                <button
                  type="button"
                  onClick={copyEnvSnippet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold transition"
                >
                  {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied to Clipboard!' : 'Copy Variable Snippet'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <span>Instant Sandbox Mode (Test without keys)</span>
                </div>
                <p className="text-[11px] text-teal-700 dark:text-teal-300">
                  Want to test the full unlimited roommate connections right now? Activate the subscription immediately in sandbox mode:
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSimulatePayment(pendingPlan?.id || 'monthly')}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate &amp; Activate Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
