import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Check, 
  HelpCircle, 
  ShieldCheck, 
  Sliders, 
  Lock, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import type { 
  UserOnboardingProfile, 
  SleepSchedule, 
  FoodPreference, 
  SmokingDrinking, 
  NoiseTolerance, 
  GuestPolicy,
  AccommodationType 
} from '../types';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, completeOnboarding } = useAppStore();
  const { user, updateProfile } = useAuthStore();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [form, setForm] = useState<UserOnboardingProfile>({ ...userProfile });

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Save profile locally
      completeOnboarding(form);

      // Sync to Supabase if logged in
      if (user) {
        updateProfile({
          display_name: form.name,
          age: form.age,
          gender: form.gender,
          occupation: form.occupation,
          institution: form.institution,
          city: form.city,
          budget_min: form.budgetMin,
          budget_max: form.budgetMax,
          move_in_date: form.moveInDate,
          accommodation_type: form.accommodationType,
          sharing_preference: form.sharingPreference,
          sleep_schedule: form.sleepSchedule,
          cleanliness: form.cleanliness,
          food_preference: form.foodPreference,
          smoking_drinking: form.smokingDrinking,
          noise_tolerance: form.noiseTolerance,
          guest_policy: form.guestPolicy,
          privacy_needs: form.privacyNeeds,
          bio: form.bio,
          show_budget_publicly: form.showBudgetPublicly,
          show_sleep_schedule_publicly: form.showSleepSchedulePublicly,
          show_contact_publicly: form.showContactPublicly,
          weights: form.weights,
          strict_budget: form.strictBudget,
          strict_move_in_date: form.strictMoveInDate,
          strict_gender_policy: form.strictGenderPolicy,
          profile_completed_at: new Date().toISOString(),
          is_active: true
        });
      }

      try {
        confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      } catch {}
      navigate('/matches');
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Progress Bar & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step {step} of {totalSteps}</span>
          </div>

          <h1 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            {step === 1 && 'Your Academic & Housing Profile'}
            {step === 2 && 'Daily Lifestyle & Circadian Routine'}
            {step === 3 && 'Importance Weights & Hard Limits'}
            {step === 4 && 'Your Bio & Privacy Preferences'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {step === 1 && 'Basic details so fellow students know your college and target budget.'}
            {step === 2 && 'We ask these to prevent roommate conflict over lights-out hours and dishes.'}
            {step === 3 && 'Choose which lifestyle factors matter most to you, and mark non-negotiables.'}
            {step === 4 && 'Add a friendly student bio and control what appears on your public card.'}
          </p>

          {/* Progress track */}
          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
            <div
              className="h-full bg-teal-500 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          {/* STEP 1: Academic & Housing */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min={17}
                    max={35}
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    College / Institution
                  </label>
                  <input
                    type="text"
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Occupation / Status
                  </label>
                  <select
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value as any })}
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="College Student">College Student</option>
                    <option value="Intern">Tech Intern</option>
                    <option value="Working Professional">Working Professional</option>
                    <option value="Freelancer">Freelancer</option>
                  </select>
                </div>
              </div>

              {/* Budget Range */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Monthly Budget Range</span>
                  <span className="text-teal-600 dark:text-teal-400 font-black">
                    ₹{form.budgetMin.toLocaleString()} - ₹{form.budgetMax.toLocaleString()}/mo
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Minimum Budget</span>
                    <input
                      type="range"
                      min={4000}
                      max={15000}
                      step={500}
                      value={form.budgetMin}
                      onChange={(e) => setForm({ ...form, budgetMin: Number(e.target.value) })}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">Maximum Budget</span>
                    <input
                      type="range"
                      min={7000}
                      max={30000}
                      step={500}
                      value={form.budgetMax}
                      onChange={(e) => setForm({ ...form, budgetMax: Number(e.target.value) })}
                      className="w-full accent-teal-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Accommodation Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Preferred Accommodation Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PG', 'Flat', 'Studio'] as AccommodationType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, accommodationType: type })}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        form.accommodationType === type
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Lifestyle & Habits */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Sleep schedule */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Sleep Schedule (Circadian Rhythm)
                  </label>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400">Why? Aligns lights-out hours</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['Night Owl', 'Early Bird', 'Flexible'] as SleepSchedule[]).map((sched) => (
                    <button
                      key={sched}
                      type="button"
                      onClick={() => setForm({ ...form, sleepSchedule: sched })}
                      className={`p-3 rounded-xl text-xs font-bold border text-center transition-all ${
                        form.sleepSchedule === sched
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {sched === 'Night Owl' && '🦉 '}
                      {sched === 'Early Bird' && '🌅 '}
                      {sched === 'Flexible' && '⚖️ '}
                      {sched}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cleanliness rating */}
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Cleanliness & Tidiness Standard</span>
                  <span className="text-teal-600 dark:text-teal-400 font-black">{form.cleanliness} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.cleanliness}
                  onChange={(e) => setForm({ ...form, cleanliness: Number(e.target.value) })}
                  className="w-full accent-teal-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 (Relaxed / Casual)</span>
                  <span>3 (Moderate)</span>
                  <span>5 (Spotless / Daily Chores)</span>
                </div>
              </div>

              {/* Food preference */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dietary / Cooking Preference
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan'] as FoodPreference[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setForm({ ...form, foodPreference: f })}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                        form.foodPreference === f
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smoking / Alcohol */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Smoking & Alcohol Tolerance in Shared Room
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Never', 'Occasionally', 'Fine'] as SmokingDrinking[]).map((hab) => (
                    <button
                      key={hab}
                      type="button"
                      onClick={() => setForm({ ...form, smokingDrinking: hab })}
                      className={`p-2.5 text-center rounded-xl text-xs font-bold border transition-all ${
                        form.smokingDrinking === hab
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {hab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Policy */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Friends / Guest Policy in Room
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Rarely', 'Weekends Only', 'Flexible'] as GuestPolicy[]).map((gp) => (
                    <button
                      key={gp}
                      type="button"
                      onClick={() => setForm({ ...form, guestPolicy: gp })}
                      className={`p-2.5 text-center rounded-xl text-xs font-bold border transition-all ${
                        form.guestPolicy === gp
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {gp}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Importance Weights & Hard Constraints */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Set Factor Importance Weights (1 to 5)
                </h3>

                {/* Sleep weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Sleep Schedule Importance</span>
                    <strong className="text-teal-500">{form.weights.sleepWeight} / 5</strong>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={form.weights.sleepWeight}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weights: { ...form.weights, sleepWeight: Number(e.target.value) }
                      })
                    }
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>

                {/* Cleanliness weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Cleanliness & Chores Importance</span>
                    <strong className="text-teal-500">{form.weights.cleanlinessWeight} / 5</strong>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={form.weights.cleanlinessWeight}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weights: { ...form.weights, cleanlinessWeight: Number(e.target.value) }
                      })
                    }
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>

                {/* Habits weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Smoking/Substances Preference Importance</span>
                    <strong className="text-teal-500">{form.weights.habitsWeight} / 5</strong>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={form.weights.habitsWeight}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weights: { ...form.weights, habitsWeight: Number(e.target.value) }
                      })
                    }
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Hard Constraints Toggles */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Hard Constraints (Non-Negotiables)</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  If enabled, roommates whose profiles violate these boundaries will be heavily penalized in compatibility rankings.
                </p>

                <div className="space-y-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40">
                  <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                    <span>Strict Budget Boundary</span>
                    <input
                      type="checkbox"
                      checked={form.strictBudget}
                      onChange={(e) => setForm({ ...form, strictBudget: e.target.checked })}
                      className="accent-teal-500 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                    <span>Strict Same-Gender Flat Preference</span>
                    <input
                      type="checkbox"
                      checked={form.strictGenderPolicy}
                      onChange={(e) => setForm({ ...form, strictGenderPolicy: e.target.checked })}
                      className="accent-teal-500 w-4 h-4 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Bio & Privacy Preferences */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Introduce Yourself (Bio for Potential Roommates)
                </label>
                <textarea
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell potential roommates about your study routine, hobbies, and what kind of space you enjoy..."
                  className="w-full text-xs p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              {/* Public Privacy Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                  <span>Public Profile Privacy Controls</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Choose which aspects of your survey are visible on your public card vs kept strictly for mathematical matching.
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                    <span>Display budget publicly on card</span>
                    <input
                      type="checkbox"
                      checked={form.showBudgetPublicly}
                      onChange={(e) => setForm({ ...form, showBudgetPublicly: e.target.checked })}
                      className="accent-teal-500 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs font-medium cursor-pointer">
                    <span>Display sleep schedule publicly on card</span>
                    <input
                      type="checkbox"
                      checked={form.showSleepSchedulePublicly}
                      onChange={(e) => setForm({ ...form, showSleepSchedulePublicly: e.target.checked })}
                      className="accent-teal-500 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <span>{step === totalSteps ? 'Save Profile & See Matches' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
