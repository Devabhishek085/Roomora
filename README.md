# Roomora — Full-Stack Roommate Matching Platform

> **Compatibility-first roommate finding.** Find someone you'll actually like — not just someone who replied to your post.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

---

## Quick Start

```bash
# 1. Clone & install
git clone https://github.com/Devabhishek085/Roomora.git
cd Roomora
npm install

# 2. Configure environment
cp .env.example .env.local
# → Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Set up the database (run in Supabase SQL Editor)
# → Run: supabase/migrations/001_initial_schema.sql

# 4. Seed 20 demo profiles (optional)
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
│   ├── pages/           # React pages (lazy-loaded)
│   │   ├── LandingPage.tsx       ← Roommate-first hero, PG secondary
│   │   ├── MatchesPage.tsx       ← DB + demo profiles, compatibility
│   │   ├── RegisterPage.tsx      ← Auth: create account
│   │   ├── LoginPage.tsx         ← Auth: sign in
│   │   ├── ConnectionsPage.tsx   ← Active connections list
│   │   ├── MessagesPage.tsx      ← Real-time chat (Supabase Realtime)
│   │   ├── SubscriptionPage.tsx  ← Razorpay plan selection
│   │   ├── DashboardPage.tsx     ← Profile, saved, inquiries
│   │   ├── OnboardingPage.tsx    ← 4-step lifestyle quiz
│   │   ├── ExplorePage.tsx       ← PG map (Overpass API)
│   │   ├── PropertyDetailsPage.tsx
│   │   └── SafetyCenterPage.tsx
│   ├── services/
│   │   ├── profiles.ts           ← DB profile fetch + mapping
│   │   ├── connections.ts        ← Token deduction, messaging, blocks
│   │   ├── compatibility.ts      ← Weighted scoring engine + 20 demo profiles
│   │   ├── aadhaar.ts            ← UIDAI integration boundary (mock + real)
│   │   ├── subscriptions.ts      ← Plan configuration
│   │   ├── listings-generator.ts ← Deterministic PG demo listings
│   │   └── overpass.ts           ← POI discovery
│   ├── store/
│   │   ├── useAuthStore.ts       ← Supabase auth state (NEW)
│   │   └── useAppStore.ts        ← UI state + localStorage persist
│   ├── components/
│   │   ├── Navbar.tsx            ← Roommate-first nav + auth
│   │   ├── ConnectModal.tsx      ← Token-gated connection flow
│   │   ├── RoommateCard.tsx      ← Demo label + Aadhaar badge
│   │   └── 3d/HeroScene.tsx      ← Three.js WebGL hero
│   ├── lib/
│   │   └── supabase.ts           ← Supabase client (anon key only)
│   └── types/index.ts            ← Full TypeScript types
├── supabase/
│   └── migrations/001_initial_schema.sql  ← Full DB schema + RLS
├── sidecar/
│   └── index.js                  ← Express: Razorpay + UIDAI (server-only)
├── scripts/
│   └── seed-demo-profiles.mjs   ← Seeds 20 labeled AI demo profiles
└── .env.example                  ← Environment variable template
```

---

## Features Implemented

### ✅ Authentication (Supabase Auth)
- Email/password sign up & sign in
- JWT session management with auto-refresh
- PKCE flow
- Password visibility toggle, form validation
- Auto-creates profile + grants 10 free tokens on signup (database trigger)

### ✅ Database (PostgreSQL + Supabase)
- **14 tables**: profiles, token_balances, token_transactions, roommate_connections, conversations, messages, subscriptions, payment_transactions, aadhaar_verifications, saved_roommates, user_blocks, user_reports, audit_events
- **Row-Level Security (RLS)** enforced on every table
- **Atomic token deduction** via `deduct_connection_token()` stored procedure — prevents race conditions and double-spend
- **Auto-profile creation trigger**: on signup → creates profile + grants 10 tokens + records subscription

### ✅ Token-Based Connection System
- New users get **10 free connection tokens** (never credit card)
- Each new connection costs **1 token**, atomically deducted server-side
- Idempotency key prevents duplicate charges on double-click
- Demo profiles clearly blocked from consuming tokens
- Token balance visible in Navbar and MatchesPage
- `ConnectModal` handles: token gate, demo guard, auth gate, already-connected, no-tokens → paywall

### ✅ Roommate-First Navigation
- Homepage: Roommate matching is primary hero, PG discovery is secondary
- Navbar order: Home → **Find Roommates** → Connections → PGs & Flats → Safety → Dashboard
- Primary CTA: "Find My Roommate" (not "Find a Room")

### ✅ Demo Profile Labeling
- All 20 AI-generated profiles have `demoLabel: 'AI-generated demo profile'`
- Every `RoommateCard` shows visible **AI Demo** amber badge
- Demo profiles cannot receive real connections (blocked at DB function level)
- `MatchesPage` shows real vs demo counts prominently
- Seed script produces DiceBear avatars (no real faces)

### ✅ Real-time Messaging (Supabase Realtime)
- `MessagesPage` subscribes to `postgres_changes` on `messages` table
- Read receipts (✓ / ✓✓)
- Block user / Report user actions
- 2000-character limit enforced client + server
- Messages only visible to connection participants (RLS)

### ✅ Subscription Plans (Razorpay)
- **Starter** – Free, 10 tokens
- **Connect+** – ₹199/month, unlimited connections
- **Premium** – ₹499/month, unlimited + featured placement
- Sidecar server handles: order creation, HMAC signature verification, subscription activation
- Webhook handler for payment.failed events
- Payment never trusted from frontend — always server-verified

### ⚠️ UIDAI Aadhaar Verification (Integration Boundary Defined)
- `src/services/aadhaar.ts`: Full adapter pattern with clearly labeled mock mode
- `sidecar/index.js`: Server-side endpoint stubs for `POST /api/aadhaar/initiate` and `/verify`
- UIDAI credentials isolated server-side only — never exposed to browser
- Mock mode: OTP `123456` works in development, produces `is_mock: true` records only
- Production: requires formal UIDAI Developer Sandbox onboarding at https://developer.uidai.gov.in
- No real Aadhaar numbers are ever stored

---

## Compatibility Engine

The weighted scoring algorithm is fully transparent — no black-box AI:

```
Score = Σ(CategoryScore × UserWeight) / Σ(Weights)

Categories: Sleep Schedule, Cleanliness, Food Preference,
            Guest Policy, Noise Tolerance, Smoking/Drinking
```

Hard constraints (budget, move-in date, gender policy) trigger early exclusion before weighted scoring.

---

## Security Architecture

| Layer | Implementation |
|---|---|
| **Token deduction** | Atomic PostgreSQL stored procedure (`SELECT ... FOR UPDATE`) |
| **RLS** | All 14 tables — users can only read/write their own data |
| **Auth** | Supabase PKCE flow, JWT verified server-side for sidecar endpoints |
| **Payment** | Razorpay HMAC signature verified in sidecar — never frontend |
| **UIDAI** | Credentials only in sidecar `.env` — never in `VITE_` vars |
| **Demo isolation** | DB function blocks token deduction for `is_demo=true` profiles |
| **Audit log** | Every connection, signup, and payment recorded in `audit_events` |

---

## Environment Variables

```bash
# Copy and fill in:
cp .env.example .env.local

# Required for full functionality:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Payment (sidecar only — never VITE_):
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# UIDAI (sidecar only — requires formal onboarding):
UIDAI_CLIENT_ID=...
UIDAI_CLIENT_SECRET=...
```

> The app runs fully in **demo mode** without any configuration — all 20 labeled AI profiles are visible, compatibility scoring works, and the UI is fully interactive.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 (UI) + Supabase Auth (server state) |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Database | PostgreSQL (Supabase) |
| Realtime | Supabase Realtime (postgres_changes) |
| Mapping | Leaflet + Overpass API |
| Payments | Razorpay (server-side order + webhook) |
| Identity | UIDAI Developer Sandbox (integration boundary defined) |
| Scroll | Lenis smooth scroll |
| Testing | Vitest (compatibility engine unit tests) |

---

## Database Setup

1. Create a Supabase project at https://supabase.com
2. Open **SQL Editor** → paste contents of `supabase/migrations/001_initial_schema.sql` → Run
3. Copy your Project URL and anon key into `.env.local`
4. (Optional) Run the seed script to populate 20 demo profiles

---

*Built on the `feature/full-stack-platform` branch — incremental changes preserving the original hackathon frontend architecture.*
