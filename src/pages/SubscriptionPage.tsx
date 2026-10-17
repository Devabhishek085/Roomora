import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Crown, ArrowRight, Star, ShieldCheck } from 'lucide-react';
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

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string;
  const isRazorpayConfigured = Boolean(razorpayKeyId && !razorpayKeyId.includes('YOUR_KEY'));

  const handleSubscribe = async (planId: string, amountPaise: number) => {
    if (!user) {
      alert('Please sign in to subscribe.');
      return;
    }

    if (!isSupabaseConfigured || !isRazorpayConfigured) {
      alert(
        'Payment integration requires configuration.\n\n' +
        'To enable payments:\n' +
        '1. Set VITE_RAZORPAY_KEY_ID in .env.local\n' +
        '2. Configure the sidecar server with your Razorpay Key Secret\n' +
        '3. Set up webhook endpoints\n\n' +
        'See .env.example for details.'
      );
      return;
    }

    setIsProcessing(planId);

    try {
      // Step 1: Create order on server (never on frontend)
      // In production, this calls the sidecar server which uses Razorpay API secret
      // For now, simulate order creation
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ plan: planId, amount_paise: amountPaise })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      const { order_id, amount, currency } = await orderResponse.json();

      // Step 2: Open Razorpay Checkout
      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Roomora',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — Monthly`,
        order_id,
        prefill: {
          email: user.email
        },
        theme: { color: '#14B8A6' },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Step 3: Verify payment on server (never trust frontend)
          // The sidecar verifies Razorpay signature before activating subscription
          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId
            })
          });

          if (verifyResponse.ok) {
            setSuccessPlan(planId);
            await refreshTokenBalance();
          } else {
            alert('Payment verification failed. Please contact support if payment was deducted.');
          }
        },
        modal: {
          ondismiss: () => setIsProcessing(null)
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed';
      alert(msg);
    } finally {
      setIsProcessing(null);
    }
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
            Every new account gets 10 free connections. Upgrade when you're ready to connect with more people.
          </p>

          {/* Current balance display */}
          {user && tokenBalance && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold">
              <span className="text-teal-600 dark:text-teal-400 font-black">{tokenBalance.balance}</span>
              <span className="text-slate-600 dark:text-slate-400">of {tokenBalance.lifetime_granted} free connections remaining</span>
            </div>
          )}
        </div>

        {!isRazorpayConfigured && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm text-center">
            ⚠️ <strong>Payment integration not configured.</strong> Set <code>VITE_RAZORPAY_KEY_ID</code> in <code>.env.local</code> to enable real payments.
          </div>
        )}

        {successPlan && (
          <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-center">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-teal-600 dark:text-teal-400" />
            <strong className="block text-lg font-bold mb-1">Subscription Activated!</strong>
            <span className="text-sm">Your {successPlan} plan is now active. Enjoy unlimited connections!</span>
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
                  onClick={() => handleSubscribe(plan.id, plan.pricePaise)}
                  disabled={isProcessing === plan.id}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
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
    </div>
  );
};
