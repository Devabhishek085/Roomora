import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';
import { useAppStore } from './store/useAppStore';
import { useAuthStore } from './store/useAuthStore';

// Lazy-loaded routes for optimal bundle chunking and performance
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const ExplorePage = lazy(() => import('./pages/ExplorePage').then(m => ({ default: m.ExplorePage })));
const PropertyDetailsPage = lazy(() => import('./pages/PropertyDetailsPage').then(m => ({ default: m.PropertyDetailsPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const MatchesPage = lazy(() => import('./pages/MatchesPage').then(m => ({ default: m.MatchesPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SafetyCenterPage = lazy(() => import('./pages/SafetyCenterPage').then(m => ({ default: m.SafetyCenterPage })));
// New pages
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage').then(m => ({ default: m.ConnectionsPage })));
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));

function PageLoadingFallback() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 animate-ping" />
        <div className="w-16 h-16 rounded-full border-4 border-t-teal-500 border-r-transparent border-b-teal-500/20 border-l-transparent animate-spin" />
      </div>
      <p className="mt-4 font-bold text-xs uppercase tracking-widest text-teal-600 dark:text-teal-400">
        Loading Roomora...
      </p>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

export function App() {
  const { darkMode } = useAppStore();
  const { initialize, isInitialized } = useAuthStore();

  // Initialize auth session on app load
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const animId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animId);
      lenis.destroy();
    };
  }, []);

  // Sync dark mode class on mount and update
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Show minimal loading state until auth is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0D14] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-t-teal-500 border-r-transparent border-b-teal-500/20 border-l-transparent animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      <CustomCursor />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Primary: Roommate Matching */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/messages/:conversationId" element={<MessagesPage />} />

              {/* Auth */}
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Profile & Onboarding */}
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Monetization */}
              <Route path="/subscribe" element={<SubscriptionPage />} />

              {/* Secondary: PG Discovery */}
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/property/:id" element={<PropertyDetailsPage />} />

              {/* Safety */}
              <Route path="/safety" element={<SafetyCenterPage />} />

              {/* Fallback */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
