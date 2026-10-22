import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  MessageSquare,
  Compass,
  ShieldCheck,
  UserCheck,
  Moon,
  Sun,
  Menu,
  X,
  Coins,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { motion, useReducedMotion } from 'motion/react';
import { AnimatedRoomoraLogo, NEON_SIGN_DURATION, NEON_KEYFRAME_TIMES } from './AnimatedRoomoraLogo';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const { darkMode, toggleDarkMode, userProfile } = useAppStore();
  const { user, dbProfile, tokenBalance, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Clean, focused core navigation
  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/matches', label: 'Roomies', icon: Users },
    { to: '/connections', label: 'Messages', icon: MessageSquare },
    { to: '/explore', label: 'Properties', icon: Compass },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleBrandClick = () => {
    if (typeof (window as any).__lenis?.scrollTo === 'function') {
      (window as any).__lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const displayName =
    dbProfile?.display_name ||
    userProfile?.name ||
    (user?.user_metadata?.display_name as string) ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    (user?.email ? user.email.split('@')[0] : 'User');
  const userInitial = (displayName || 'U').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 glass-nav transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={handleBrandClick}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <AnimatedRoomoraLogo size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <motion.span
                  className="font-heading font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white transition-colors"
                  animate={
                    shouldReduceMotion
                      ? { textShadow: '0 0 10px rgba(45, 212, 191, 0.35)' }
                      : {
                          textShadow: [
                            '0 0 10px rgba(45, 212, 191, 0.30), 0 0 20px rgba(20, 184, 166, 0.18)',
                            '0 0 15px rgba(45, 212, 191, 0.55), 0 0 28px rgba(20, 184, 166, 0.30)',
                            '0 0 11px rgba(45, 212, 191, 0.36), 0 0 22px rgba(20, 184, 166, 0.20)',
                            '0 0 8px rgba(45, 212, 191, 0.22), 0 0 16px rgba(20, 184, 166, 0.12)',
                            '0 0 14px rgba(45, 212, 191, 0.50), 0 0 26px rgba(20, 184, 166, 0.26)',
                            '0 0 11px rgba(45, 212, 191, 0.36), 0 0 22px rgba(20, 184, 166, 0.18)',
                            '0 0 10px rgba(45, 212, 191, 0.30), 0 0 20px rgba(20, 184, 166, 0.18)'
                          ]
                        }
                  }
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: NEON_SIGN_DURATION,
                          times: NEON_KEYFRAME_TIMES,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }
                  }
                >
                  Roomora
                </motion.span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-md bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  BETA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-1 hidden sm:block">
                Find Your Roommate. Find Your Place.
              </p>
            </div>
          </Link>

          {/* Compressed Center Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-800">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Theme Toggle + Profile / Sign In */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button - Centered between nav and profile */}
            <button
              onClick={toggleDarkMode}
              className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-xs"
              aria-label="Toggle dark mode"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200" />
              )}
            </button>

            {user ? (
              /* Authenticated User: Profile Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border transition-all ${
                    profileDropdownOpen
                      ? 'bg-slate-100 dark:bg-slate-800 border-teal-500/50 ring-2 ring-teal-500/20'
                      : 'bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700'
                  }`}
                  aria-expanded={profileDropdownOpen}
                  aria-label="User profile menu"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
                    {userInitial}
                  </div>
                  <span className="hidden sm:inline-block font-semibold text-xs text-slate-800 dark:text-slate-200 max-w-[110px] truncate">
                    {displayName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      profileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Floating Glass Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* User Identity Header */}
                    <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 mb-2 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-sm shrink-0 shadow-sm">
                          {userInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items in Dropdown */}
                    <div className="space-y-0.5">
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <UserCheck className="w-4 h-4 text-teal-500" />
                        <span>Profile</span>
                      </Link>

                      <Link
                        to="/safety"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-teal-500" />
                        <span>Safety Center</span>
                      </Link>

                      {/* Tokens Strip */}
                      {tokenBalance !== null && (
                        <Link
                          to="/subscribe"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 mb-1.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 hover:bg-teal-100/80 dark:hover:bg-teal-950/60 transition-colors group"
                        >
                          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300">
                            <Coins className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                            <span>{tokenBalance.balance} Tokens</span>
                          </div>
                          <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform">
                            Get More →
                          </span>
                        </Link>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

                    {/* Sign Out */}
                    <button
                      onClick={() => {
                        signOut();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated: Sign In */
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-teal-500 hover:bg-slate-800 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-semibold text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-teal-500" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 space-y-2 border-t border-slate-200 dark:border-slate-800 mt-2">
            {user ? (
              <>
                {/* Mobile Dashboard & Safety */}
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <UserCheck className="w-4 h-4 text-teal-500" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/safety"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ShieldCheck className="w-4 h-4 text-teal-500" />
                  <span>Safety Center</span>
                </Link>

                {/* Token balance */}
                {tokenBalance !== null && (
                  <Link
                    to="/subscribe"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-sm font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-teal-600" />
                      <span>{tokenBalance.balance} connection tokens</span>
                    </div>
                    <span className="text-xs text-teal-600">Get More →</span>
                  </Link>
                )}

                {/* Theme Switch */}
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span>Theme</span>
                  </div>
                  <span className="text-xs text-slate-500">{darkMode ? 'Dark' : 'Light'}</span>
                </button>

                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-slate-700" />}
                    <span>Theme</span>
                  </div>
                  <span className="text-xs text-slate-500">{darkMode ? 'Dark' : 'Light'}</span>
                </button>

                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold text-sm shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
