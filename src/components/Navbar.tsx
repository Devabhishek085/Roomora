import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  MessageSquare,
  Heart,
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
  User
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { darkMode, toggleDarkMode, savedProperties, savedRoommates } = useAppStore();
  const { user, tokenBalance, signOut } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalSaved = savedProperties.length + savedRoommates.length;

  // PRIORITY: Roommate matching first, PG discovery secondary
  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/matches', label: 'Find Roommates', icon: Users },
    { to: '/connections', label: 'Connections', icon: MessageSquare },
    { to: '/explore', label: 'PGs & Flats', icon: Compass },
    { to: '/safety', label: 'Safety', icon: ShieldCheck },
    { to: '/dashboard', label: 'Dashboard', icon: UserCheck },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 glass-nav transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl">🏡</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
                  Roomora
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-md bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  BETA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-1 hidden sm:block">
                Find Your Roommate. Find Your Place.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-full border border-slate-200/60 dark:border-slate-800">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Token Balance (when authenticated) */}
            {user && tokenBalance !== null && (
              <Link
                to="/subscribe"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-950 transition-colors"
                title={`${tokenBalance.balance} connection tokens remaining`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>{tokenBalance.balance} tokens</span>
              </Link>
            )}

            {/* Saved shortcut (for unauthenticated/demo usage) */}
            {!user && (
              <Link
                to="/dashboard"
                className="relative p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                title="Saved Places & Profiles"
              >
                <Heart className="w-5 h-5 text-rose-500" />
                {totalSaved > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {totalSaved}
                  </span>
                )}
              </Link>
            )}

            {/* Dark mode switch */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Toggle dark mode"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>

            {/* Auth CTA */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs transition-all"
                >
                  <User className="w-3.5 h-3.5 text-teal-500" />
                  <span>{user.email?.split('@')[0] || 'Profile'}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 dark:bg-teal-500 hover:bg-slate-800 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-semibold text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Primary CTA: Find Roommates */}
            <Link
              to="/matches"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Find Roommates</span>
            </Link>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-4 duration-200">
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
            {/* Token balance in mobile */}
            {user && tokenBalance !== null && (
              <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-700 dark:text-teal-300">
                <Coins className="w-4 h-4" />
                <span>{tokenBalance.balance} of {tokenBalance.lifetime_granted} free connections remaining</span>
              </div>
            )}

            {user ? (
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/matches"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-md"
                >
                  <Users className="w-4 h-4" />
                  <span>Find Roommates</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
