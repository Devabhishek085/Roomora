# Roomora — Full-Stack Roommate Matching Platform

> **Compatibility-first roommate finding.** Find someone you'll actually like — not just someone who replied to your post.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Ready-0C2340?logo=razorpay)](https://razorpay.com/)

---

## Quick Start

```bash
# 1. Clone & install dependencies
git clone https://github.com/Devabhishek085/Roomora.git
cd Roomora
npm install

# 2. Configure environment
cp .env.example .env.local
# → Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and VITE_RAZORPAY_KEY_ID

# 3. Set up the database in Supabase SQL Editor
# → Run in order:
#   1. supabase/migrations/001_initial_schema.sql
#   2. supabase/migrations/002_add_flat_images.sql

# 4. (Optional) Seed demo profiles for local testing
VITE_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo-profiles.mjs

# 5. Start frontend dev server
npm run dev
# → http://localhost:5173/

# 6. Start sidecar server (Razorpay / UIDAI webhooks — separate terminal)
cd sidecar && npm install && npm run dev
# → http://localhost:3001/
```

---

## Architecture

```
Roomora/
├── src/
│   ├── pages/                   # React pages (lazy-loaded / routed)
│   │   ├── LandingPage.tsx       ← Roommate-first hero, top matches preview, PG secondary
│   │   ├── MatchesPage.tsx       ← Real roommate discovery, city filters, compatibility
│   │   ├── RegisterPage.tsx      ← Auth: create account (Email + Password / OTP)
│   │   ├── LoginPage.tsx         ← Auth: sign in
│   │   ├── ConnectionsPage.tsx   ← Active accepted connections list
│   │   ├── MessagesPage.tsx      ← Real-time chat (Supabase Realtime)
│   │   ├── SubscriptionPage.tsx  ← Razorpay plan selection + sandbox simulation mode
│   │   ├── DashboardPage.tsx     ← User profile, room photo manager, saved roommates
│   │   ├── OnboardingPage.tsx    ← 4-step lifestyle quiz + flat photo upload
│   │   ├── ExplorePage.tsx       ← Interactive map & PG discovery (Overpass API)
│   │   ├── PropertyDetailsPage.tsx
│   │   └── SafetyCenterPage.tsx
│   ├── services/
│   │   ├── profiles.ts           ← Real user DB fetch, filters, and mapping
│   │   ├── connections.ts        ← Token deduction, messaging, blocks & reports
│   │   ├── compatibility.ts      ← Transparent weighted scoring engine + demo data
│   │   ├── aadhaar.ts            ← UIDAI integration boundary (Surepass adapter)
│   │   ├── subscriptions.ts      ← Subscription plans configuration
│   │   ├── listings-generator.ts ← Deterministic PG & flat demo listings
│   │   └── overpass.ts           ← POI and local amenity discovery
│   ├── store/
│   │   ├── useAuthStore.ts       ← Supabase auth state, user profile, tokens
│   │   └── useAppStore.ts        ← UI preferences, saved items, location state
│   ├── components/
│   │   ├── Navbar.tsx            ← Roommate-first navigation & token balance
│   │   ├── RoommateCard.tsx      ← 3D tilt interactive card with photo badges
│   │   ├── RoommateProfileModal.tsx ← Pop-up profile, room photos gallery & lightbox
│   │   ├── ConnectModal.tsx      ← Token-gated connection flow & chat launch
│   │   ├── AadhaarVerificationCard.tsx ← In-app Aadhaar OTP identity verification
│   │   ├── LocationSearchBar.tsx ← City & locality search with quick city pills
│   │   └── 3d/HeroScene.tsx      ← Three.js WebGL hero animation
│   ├── lib/
│   │   └── supabase.ts           ← Supabase client instance (anon key only)
│   └── types/index.ts            ← Comprehensive TypeScript types
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    ← Full database schema, RLS, triggers & RPCs
│   │   └── 002_add_flat_images.sql   ← Flat & room photos array column
├── sidecar/
│   └── index.js                  ← Express server: Razorpay & UIDAI webhooks
├── scripts/
│   └── seed-demo-profiles.mjs    ← Seeds 20 labeled AI demo profiles
└── .env.example                  ← Environment variable template
```

---

## Features Implemented

### ✅ Authentication (Supabase Auth)
- Email/password sign-up & sign-in with JWT session management.
- Magic link and email OTP verification fallback.
- Auto-initializes profile and grants **10 free connection tokens** on registration via database trigger.
- Password visibility toggle, live form validation, and active session caching.

### ✅ Database & Migrations (PostgreSQL + Supabase)
- **14 relational tables**: `profiles`, `token_balances`, `token_transactions`, `roommate_connections`, `conversations`, `messages`, `subscriptions`, `payment_transactions`, `aadhaar_verifications`, `saved_roommates`, `user_blocks`, `user_reports`, `audit_events`.
- **Row-Level Security (RLS)** strictly enforced on all tables.
- **Atomic token deduction** via `deduct_connection_token()` stored procedure to eliminate race conditions.
- **Migration 002**: `flat_images TEXT[]` for multi-photo room and flat listings.

### ✅ Room & Flat Photo Uploads with Interactive Gallery
- Users can upload multiple room and flat pictures during onboarding and manage them inside the Dashboard.
- **Interactive Lightbox**: Fullscreen modal view with previous/next navigation and zoom.
- Photos appear directly on the roommate card (`X Photos` badge) and in the profile pop-up.

### ✅ Roommate Profile Pop-up Modal (`RoommateProfileModal`)
- Clicking any profile card opens a rich modal showing:
  - User details (Age, Gender, Occupation, Institution, Aadhaar verification badge).
  - High-resolution **Photos of Room / Flat** carousel with thumbnail preview.
  - Detailed budget, move-in date, accommodation type, and room sharing preferences.
  - Circadian sleep schedule, cleanliness rating, food habits, smoking/drinking, and noise tolerance.
  - Hobbies and personal interests.
  - Explainable compatibility breakdown and engine verdict.
  - Direct **"Connect"** and **"Save Roommate"** action buttons.

### ✅ Token-Based Connection System
- Every new user receives **10 free connection tokens** upon registration.
- Each new connection request atomically deducts **1 token** from the balance.
- Built-in idempotency keys prevent duplicate deductions.
- `ConnectModal` handles token verification, demo profile protection, and subscription upgrade transitions.

### ✅ Location Discovery & Clean Filtering
- Location search with quick city filters for **Delhi NCR, Bengaluru, Mumbai, Pune, Hyderabad, Chennai, Kolkata**, and more.
- Clean Max Budget slider and lifestyle filters without redundant radius controls.
- Find Roommates feed strictly displays authentic registered user profiles.

### ✅ Real-time Messaging (Supabase Realtime)
- Full end-to-end chat subscribing to `postgres_changes` on the `messages` table.
- Message delivery indicators and read receipts (`✓` / `✓✓`).
- User block and report mechanisms with audit logging.
- RLS safeguards ensuring only connection participants can read or send messages.

### ✅ Subscription & Payments (Razorpay + Sandbox Simulation)
- **Starter**: Free, 10 connection tokens.
- **Connect+**: ₹199/month, unlimited connections.
- **Premium**: ₹499/month, unlimited connections + featured placement.
- **Client & Server Integration**: Dynamic Razorpay SDK loading, client-side test checkout, and sidecar webhook HMAC verification.
- **Sandbox Simulation Mode**: Built-in test activation so evaluators and testers can try unlimited connections without payment gateway setup.

### ✅ Identity Verification (Aadhaar / Surepass Adapter)
- `src/services/aadhaar.ts` & `AadhaarVerificationCard.tsx` provide a verified identity flow.
- Verified accounts receive the `✓ Aadhaar Verified` badge on cards and profiles.
- Secure adapter pattern with mock OTP `123456` in development; real UIDAI / Surepass credentials isolated server-side.

---

## Compatibility Engine

The weighted compatibility engine is 100% transparent and explainable — no black-box algorithms:

```
Score = Σ(CategoryScore × UserWeight) / Σ(Weights)

Evaluated Categories:
1. Circadian Sleep Schedule (Early Bird vs. Night Owl)
2. Cleanliness & Chore Discipline (1 to 5 scale)
3. Food Habits (Veg, Non-Veg, Vegan, Eggetarian)
4. Guest Policy (Rarely, Weekends, Flexible)
5. Noise Tolerance (Quiet, Moderate, Lively)
6. Social & Living Habits (Smoking, Drinking, Privacy Needs)
```

Hard constraints (budget limits, move-in timelines, and gender policies) trigger warnings before weighted scoring is calculated.

---

## Security Architecture

| Layer | Implementation |
|---|---|
| **Token Deduction** | Atomic PostgreSQL stored procedure (`SELECT ... FOR UPDATE`) |
| **Row-Level Security** | Enforced across all tables — users access only their own data |
| **Authentication** | Supabase PKCE flow with auto-refreshing JWTs |
| **Payment Verification** | Razorpay HMAC SHA256 signature verification server-side |
| **Credential Safety** | Razorpay Secret & UIDAI keys kept strictly off frontend |
| **Realtime Security** | Realtime channels protected by Postgres RLS policies |
| **Audit Trails** | Connections, payments, and account actions recorded in `audit_events` |

---

## Environment Variables

### Frontend (`.env.local` or Vercel Environment Variables)

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Razorpay (Public Key)
VITE_RAZORPAY_KEY_ID=rzp_test_...

# Sidecar Server (Optional if running Express sidecar)
VITE_SIDECAR_URL=http://localhost:3001
```

### Sidecar Server (`sidecar/.env` — Backend Only)

```bash
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

UIDAI_CLIENT_ID=...
UIDAI_CLIENT_SECRET=...
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 8](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15 + Supabase Auth) |
| **Realtime** | Supabase Realtime (`postgres_changes`) |
| **3D Graphics** | [Three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/) + [@react-three/drei](https://github.com/pmndrs/drei) |
| **Mapping & Geospatial** | [Leaflet](https://leafletjs.com/) + [React-Leaflet](https://react-leaflet.js.org/) + OpenStreetMap / Overpass API |
| **Payments** | [Razorpay Checkout SDK](https://razorpay.com/) + Express Webhook Sidecar |
| **Identity Verification** | Surepass / UIDAI Sandbox Adapter |
| **Animations & Smooth Scroll** | [Lenis](https://lenis.darkroom.engineering/) + [Motion](https://motion.dev/) + [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run `supabase/migrations/001_initial_schema.sql` to establish tables, stored procedures, triggers, and RLS policies.
4. Run `supabase/migrations/002_add_flat_images.sql` to support roommate flat/room photo uploads.
5. Copy your **Project URL** and **Anon Key** into `.env.local` (and into Vercel Settings &rarr; Environment Variables for production).

---

*Built with ❤️ for modern, transparent roommate and co-living discovery.*
