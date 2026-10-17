import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Heart, 
  Send, 
  History, 
  Shield, 
  CheckCircle2, 
  Trash2, 
  Building2, 
  Users, 
  ExternalLink,
  Lock,
  Compass,
  Camera
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { generateDemoListings } from '../services/listings-generator';
import { fetchProfileById, dbProfileToRoommateProfile } from '../services/profiles';
import { AadhaarVerificationCard } from '../components/AadhaarVerificationCard';
import type { RoommateProfile } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, dbProfile, updateProfile } = useAuthStore();
  const photoInputRef = React.useRef<HTMLInputElement | null>(null);
  const { 
    userProfile, 
    updateUserProfile, 
    savedProperties, 
    toggleSaveProperty,
    savedRoommates, 
    toggleSaveRoommate,
    inquiries, 
    roommateRequests,
    recentSearches,
    clearRecentSearches,
    selectedLocation,
    setSelectedLocation,
    loadUserScopedData
  } = useAppStore();

  useEffect(() => {
    if (user?.id) {
      loadUserScopedData(user.id);
    }
  }, [user?.id, loadUserScopedData]);

  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'inquiries' | 'requests' | 'privacy'>('overview');

  // Compute profile completion percentage
  const profileCompletion = useMemo(() => {
    let score = 0;
    if (userProfile.name) score += 20;
    if (userProfile.bio) score += 20;
    if (userProfile.institution) score += 20;
    if (userProfile.cleanliness) score += 20;
    if (userProfile.budgetMin && userProfile.budgetMax) score += 20;
    return score;
  }, [userProfile]);

  // Saved properties items
  const savedPropsList = useMemo(() => {
    const all = generateDemoListings(selectedLocation.lat, selectedLocation.lng, 15);
    return all.filter((p) => savedProperties.includes(p.id));
  }, [selectedLocation.lat, selectedLocation.lng, savedProperties]);

  // Saved real roommates items
  const [savedRoommatesList, setSavedRoommatesList] = useState<RoommateProfile[]>([]);

  useEffect(() => {
    if (savedRoommates.length === 0) {
      setSavedRoommatesList([]);
      return;
    }
    let isCurrent = true;
    const loadSaved = async () => {
      const loaded: RoommateProfile[] = [];
      for (const id of savedRoommates) {
        const p = await fetchProfileById(id);
        if (p) loaded.push(dbProfileToRoommateProfile(p));
      }
      if (isCurrent) setSavedRoommatesList(loaded);
    };
    loadSaved();
    return () => {
      isCurrent = false;
    };
  }, [savedRoommates]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          updateUserProfile({ avatarUrl: dataUrl });
          if (user) {
            updateProfile({ avatar_url: dataUrl });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Card Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-500/30">
                {(userProfile.avatarUrl || dbProfile?.avatar_url) ? (
                  <img
                    src={userProfile.avatarUrl || dbProfile?.avatar_url || ''}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{(userProfile.name || dbProfile?.display_name) ? (userProfile.name || dbProfile?.display_name || '')[0] : 'U'}</span>
                )}
              </div>
              <input
                type="file"
                ref={photoInputRef}
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                title="Change Photo"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shadow-md transition active:scale-95"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
                  {userProfile.name || dbProfile?.display_name || 'Student Profile'}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-bold">
                  {userProfile.occupation || dbProfile?.occupation || 'Student'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {userProfile.institution || dbProfile?.institution || 'College not set'} • {userProfile.city || dbProfile?.city || 'Location not set'}
              </p>
              {userProfile.bio || dbProfile?.bio ? (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-lg italic">
                  &ldquo;{userProfile.bio || dbProfile?.bio}&rdquo;
                </p>
              ) : null}
            </div>
          </div>

          {/* Profile Completeness Gauge */}
          <div className="w-full sm:w-56 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Profile Completeness</span>
              <span className="text-teal-600 dark:text-teal-400">{profileCompletion}%</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-300"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              {profileCompletion === 100 ? 'All parameters active!' : 'Complete onboarding for best matches'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'saved', label: `Saved (${savedProperties.length + savedRoommates.length})`, icon: Heart },
            { id: 'inquiries', label: `PG Inquiries (${inquiries.length})`, icon: Building2 },
            { id: 'requests', label: `Roommate Connects (${roommateRequests.length})`, icon: Send },
            { id: 'privacy', label: 'Privacy & Settings', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block">Saved Properties</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                  {savedProperties.length}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block">Saved Roommates</span>
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-heading">
                  {savedRoommates.length}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block">Inquiries Sent</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-heading">
                  {inquiries.length}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block">Connection Invites</span>
                <span className="text-2xl font-black text-indigo-500 font-heading">
                  {roommateRequests.length}
                </span>
              </div>
            </div>

            {/* Recent Searches */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-500" />
                  <span>Recent Location Searches</span>
                </h3>
                {recentSearches.length > 0 && (
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No recent searches yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {recentSearches.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{item.city}</p>
                      </div>
                      <Link
                        to="/explore"
                        onClick={() => setSelectedLocation(item)}
                        className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400"
                        title="Re-search location"
                      >
                        <Compass className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SAVED ITEMS */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            {/* Saved properties */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Saved Properties & PGs ({savedPropsList.length})
              </h3>
              {savedPropsList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  No properties saved. Click the heart icon on any property in Explore.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPropsList.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[150px]">
                            {p.title}
                          </h4>
                          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                            ₹{p.rent.toLocaleString()}/mo • {p.occupancy}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSaveProperty(p.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Roommates */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Saved Roommates ({savedRoommatesList.length})
              </h3>
              {savedRoommatesList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  No roommates saved yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedRoommatesList.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={r.avatarUrl}
                          alt={r.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                            {r.name}
                          </h4>
                          <p className="text-[11px] text-slate-500">{r.occupation}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSaveRoommate(r.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sent PG & Flat Inquiries
            </h3>
            {inquiries.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No inquiries sent yet.</p>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {inq.propertyTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        &ldquo;{inq.message}&rdquo;
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Date: {inq.createdAt} • Move-in: {inq.moveInDate}
                      </p>
                    </div>
                    <span className="self-start sm:self-center px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                      {inq.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REQUESTS */}
        {activeTab === 'requests' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sent Roommate Connect Invitations
            </h3>
            {roommateRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No connection requests sent yet.</p>
            ) : (
              <div className="space-y-3">
                {roommateRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Invited {req.roommateName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        &ldquo;{req.message}&rdquo;
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Sent on: {req.createdAt}
                      </p>
                    </div>
                    <span className="self-start sm:self-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PRIVACY & SETTINGS */}
        {activeTab === 'privacy' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Identity Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify your Aadhaar via Surepass (licensed UIDAI partner) to earn the ✓ badge on your profile.
              </p>
            </div>

            {/* Aadhaar verification card */}
            <AadhaarVerificationCard />

            <hr className="border-slate-200 dark:border-slate-800" />

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Local Privacy & Account Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Settings are saved in your browser. No external telemetry or cloud tracking.
              </p>
            </div>

            <div className="space-y-3 pt-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    Publicly display my budget on profile cards
                  </span>
                  <span className="text-[11px] text-slate-400">
                    If disabled, candidates only see that your budgets overlap.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={userProfile.showBudgetPublicly}
                  onChange={(e) => updateUserProfile({ showBudgetPublicly: e.target.checked })}
                  className="accent-teal-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 cursor-pointer">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    Publicly display my sleep schedule badge
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Whether to show Night Owl / Early Bird badge on card.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={userProfile.showSleepSchedulePublicly}
                  onChange={(e) => updateUserProfile({ showSleepSchedulePublicly: e.target.checked })}
                  className="accent-teal-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
