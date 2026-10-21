import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Lock,
  Camera,
  Upload,
  User as UserIcon,
  MapPin,
  Building,
  Home,
  Image as ImageIcon,
  Plus,
  Trash2,
  Zap,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore, createEmptyUserProfile } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import type { 
  UserOnboardingProfile, 
  AccommodationType 
} from '../types';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80'
];

const FLAT_PHOTO_PRESETS = [
  { name: 'Cozy Bedroom', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80' },
  { name: 'Sunny Living Area', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80' },
  { name: 'Modern Studio', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80' },
  { name: 'Balcony View', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' }
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding, userProfile } = useAppStore();
  const { user, dbProfile, updateProfile } = useAuthStore();

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const flatPhotosInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize completely clean for the active user (no pre-filled mock values!)
  const [form, setForm] = useState<UserOnboardingProfile>(() => {
    const initialName = dbProfile?.display_name || user?.user_metadata?.display_name || '';
    const clean = createEmptyUserProfile(initialName);

    // If this existing user already previously filled parts of their DB profile, restore it
    if (dbProfile && dbProfile.profile_completed_at) {
      return {
        ...clean,
        name: dbProfile.display_name || initialName,
        avatarUrl: dbProfile.avatar_url || '',
        age: dbProfile.age ?? 20,
        gender: (dbProfile.gender as any) || 'Male',
        occupation: (dbProfile.occupation as any) || 'College Student',
        institution: dbProfile.institution || '',
        city: dbProfile.city || '',
        budgetMin: dbProfile.budget_min ?? 5000,
        budgetMax: dbProfile.budget_max ?? 15000,
        moveInDate: dbProfile.move_in_date || '',
        accommodationType: (dbProfile.accommodation_type as any) || 'PG',
        sharingPreference: (dbProfile.sharing_preference as any) || 'Twin Sharing',
        sleepSchedule: (dbProfile.sleep_schedule as any) || 'Flexible',
        cleanliness: dbProfile.cleanliness ?? 3,
        foodPreference: (dbProfile.food_preference as any) || 'Vegetarian',
        smokingDrinking: (dbProfile.smoking_drinking as any) || 'Never',
        noiseTolerance: (dbProfile.noise_tolerance as any) || 'Moderate',
        guestPolicy: (dbProfile.guest_policy as any) || 'Rarely',
        privacyNeeds: (dbProfile.privacy_needs as any) || 'Moderate',
        bio: dbProfile.bio || '',
        flatImages: dbProfile.flat_images || userProfile.flatImages || [],
      };
    }
    return {
      ...clean,
      flatImages: userProfile.flatImages || []
    };
  });

  // Handle local photo upload with canvas resize for crisp, lightweight storage
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setForm(prev => ({ ...prev, avatarUrl: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle flat/room photo upload with canvas resize
  const handleFlatPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            setForm((prev) => ({
              ...prev,
              flatImages: [...(prev.flatImages || []), dataUrl].slice(0, 8)
            }));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFlatPhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      flatImages: (prev.flatImages || []).filter((_, i) => i !== index)
    }));
  };

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
          avatar_url: form.avatarUrl || null,
          flat_images: form.flatImages || [],
          age: form.age || 20,
          gender: form.gender,
          occupation: form.occupation,
          institution: form.institution,
          city: form.city,
          budget_min: form.budgetMin,
          budget_max: form.budgetMax,
          move_in_date: form.moveInDate || null,
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
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step {step} of {totalSteps}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
            {step === 1 && 'Your Academic & Housing Profile'}
            {step === 2 && 'Daily Lifestyle & Circadian Routine'}
            {step === 3 && 'Importance Weights & Hard Limits'}
            {step === 4 && 'Your Bio & Privacy Preferences'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            {step === 1 && 'Add your photo and basic college details so potential roommates recognize you.'}
            {step === 2 && 'Prevent roommate conflict over lights-out hours and daily habits.'}
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

        {/* Main 2-Column Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Live Matching Insights & Dynamic Stats */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-4 space-y-5 lg:sticky lg:top-24">
            
            {/* Step Navigation Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Quiz Progress
              </h3>
              <div className="space-y-2">
                {[
                  { num: 1, title: 'Academic & Housing', desc: 'College, location & budget' },
                  { num: 2, title: 'Lifestyle & Habits', desc: 'Sleep, cleanliness & diet' },
                  { num: 3, title: 'Weights & Non-Negotiables', desc: 'Custom compatibility factors' },
                  { num: 4, title: 'Bio & Verification', desc: 'Photos, intro & privacy' },
                ].map((s) => (
                  <div
                    key={s.num}
                    onClick={() => setStep(s.num)}
                    className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      step === s.num
                        ? 'bg-teal-50 dark:bg-teal-950/60 border border-teal-500/30 text-teal-900 dark:text-teal-200 shadow-sm'
                        : step > s.num
                        ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        : 'text-slate-400 dark:text-slate-500 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        step === s.num
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : step > s.num
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {step > s.num ? '✓' : s.num}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{s.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Algorithm Match Forecast */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-teal-500/10 via-slate-900/5 to-emerald-500/10 dark:from-teal-950/40 dark:via-slate-900 dark:to-emerald-950/30 border border-teal-500/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  Live Match Index
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black">
                  {form.sleepSchedule === 'Flexible' ? '94%' : '88%'} Match Potential
                </span>
              </div>

              <div>
                <p className="text-xl font-black font-heading text-slate-900 dark:text-white">
                  {form.city ? `High Density in ${form.city}` : 'Targeting Delhi-NCR & Metro'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Based on your routine ({form.sleepSchedule}, cleanliness {form.cleanliness}/5), our matching algorithm is narrowing down students with compatible habits.
                </p>
              </div>

              {/* Dynamic Routine Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {form.sleepSchedule === 'Early Bird' && '🌅 Early Riser'}
                  {form.sleepSchedule === 'Night Owl' && '🦉 Late Night Studies'}
                  {form.sleepSchedule === 'Flexible' && '⚖️ Adaptable Routine'}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  ✨ Cleanliness: {form.cleanliness}/5
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  🥗 {form.foodPreference}
                </span>
              </div>
            </div>

            {/* Why Lifestyle Matters Insight */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-teal-500" />
                <span>Zero Roommate Surprises</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Over 68% of roommate dropouts are caused by conflicting sleep hours, uncommunicated guest visits, or hygiene disputes. Answering honestly saves you time, lease disputes, and stress.
              </p>
            </div>

          </div>

          {/* Right Column: Expanded Form Container */}
          <div className="lg:col-span-8 xl:col-span-8 p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          {/* STEP 1: Academic & Housing + Photo */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Profile Photo Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Profile Photo
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Photo Preview Circle */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-teal-500 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {form.avatarUrl ? (
                        <img src={form.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                          <Camera className="w-6 h-6 mb-0.5" />
                          <span className="text-[9px] font-medium">Add Photo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Presets */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Device</span>
                      </button>
                      {form.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, avatarUrl: '' }))}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-500 text-xs transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="pt-0.5">
                      <span className="text-[10px] text-slate-400 block mb-1">Or pick a quick avatar:</span>
                      <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, avatarUrl: preset }))}
                            className={`w-8 h-8 rounded-lg overflow-hidden border transition-all ${
                              form.avatarUrl === preset
                                ? 'border-teal-500 ring-2 ring-teal-500/40 scale-105'
                                : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={preset} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abhishek"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min={17}
                    max={50}
                    placeholder="21"
                    value={form.age || ''}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* College & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    College / Institution
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Delhi University / IIT / St. Stephen's"
                      value={form.institution}
                      onChange={(e) => setForm({ ...form, institution: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City / Target Area
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. New Delhi, Bengaluru, Mumbai"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full text-xs pl-9 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Occupation & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                    className="w-full text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
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
                      min={3000}
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
                      min={6000}
                      max={35000}
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

              {/* Flat / Room Photos Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Home className="w-4 h-4 text-teal-500" />
                      <span>Pictures of your Flat / Room (Optional)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Upload photos of your room, bed, or flat. Potential roommates can view these when inspecting your profile.
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 w-fit">
                    {(form.flatImages || []).length} / 8 Photos
                  </span>
                </div>

                <input
                  type="file"
                  ref={flatPhotosInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleFlatPhotoUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => flatPhotosInputRef.current?.click()}
                    className="px-3.5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Room / Flat Pictures</span>
                  </button>
                  <span className="text-[10px] text-slate-400">Up to 8 photos (JPEG, PNG)</span>
                </div>

                {/* Thumbnail Grid */}
                {(form.flatImages || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {(form.flatImages || []).map((imgUrl, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-video shadow-sm">
                        <img src={imgUrl} alt={`Room photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFlatPhoto(idx)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/70 hover:bg-rose-500 text-white transition active:scale-90"
                          title="Remove picture"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/70 text-[9px] font-bold text-white">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Presets */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-400 block mb-1.5">Or pick aesthetic room presets:</span>
                  <div className="flex flex-wrap gap-2">
                    {FLAT_PHOTO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!(form.flatImages || []).includes(preset.url)) {
                            setForm((prev) => ({
                              ...prev,
                              flatImages: [...(prev.flatImages || []), preset.url].slice(0, 8)
                            }));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700/70 hover:bg-teal-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 text-[10px] font-semibold transition"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Lifestyle & Habits */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Sleep schedule */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Circadian Routine / Sleep Schedule
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Early Bird', 'Night Owl', 'Flexible'] as const).map((sched) => (
                    <button
                      key={sched}
                      type="button"
                      onClick={() => setForm({ ...form, sleepSchedule: sched })}
                      className={`py-3 rounded-2xl text-xs font-bold border transition-all ${
                        form.sleepSchedule === sched
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sched === 'Early Bird' && '🌅 Early Bird'}
                      {sched === 'Night Owl' && '🦉 Night Owl'}
                      {sched === 'Flexible' && '⚖️ Flexible'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cleanliness Level */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cleanliness Standard (1 = Relaxed, 5 = Deep-Clean Fanatic)
                  </label>
                  <span className="text-teal-500 font-bold text-xs">{form.cleanliness} / 5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={form.cleanliness}
                  onChange={(e) => setForm({ ...form, cleanliness: Number(e.target.value) })}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>

              {/* Food Preference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Dietary Preference
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan'] as const).map((food) => (
                    <button
                      key={food}
                      type="button"
                      onClick={() => setForm({ ...form, foodPreference: food })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        form.foodPreference === food
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {food}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smoking/Drinking */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Smoking / Social Drinking
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Never', 'Occasionally', 'Fine'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm({ ...form, smokingDrinking: opt })}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        form.smokingDrinking === opt
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {opt === 'Never' && '🚫 Non-Smoker'}
                      {opt === 'Occasionally' && '🍻 Occasionally'}
                      {opt === 'Fine' && '👍 Smoker/Social'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Policy */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Guest Policy (Friends / Sleepovers)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Rarely', 'Weekends Only', 'Flexible'] as const).map((guest) => (
                    <button
                      key={guest}
                      type="button"
                      onClick={() => setForm({ ...form, guestPolicy: guest })}
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        form.guestPolicy === guest
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {guest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Weights & Hard Limits */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  How much does each factor matter to you? (1 = Low, 5 = Critical)
                </h3>

                {/* Sleep weight */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Sleep Schedule Match Importance</span>
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
                  placeholder="Tell potential roommates about your hobbies, routine, and what kind of living space you enjoy..."
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
  </div>
);
};
