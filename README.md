# Roommate.com — Find Your Place. Find Your People.

> **Award-Winning 3D-Animated Student Housing & Roommate Discovery Platform**  
> *Engineered for KIET Innotech 2026 (National-Level College Tech Fest)*

---

## 🌟 Executive Overview & Hackathon Pitch

### 1. Problem Statement
Finding housing near college campuses (like KIET Ghaziabad, DU North Campus, or Koramangala Bengaluru) is broken:
- **Broker Exploitation**: Unverified brokers demand ₹2,000–₹5,000 "token advances" before viewings, leading to high scam rates.
- **Random Roommate Lottery**: Students sign 11-month leases with strangers having incompatible circadian cycles (Night Owls vs Early Birds), differing cleanliness standards, or mismatched study habits, resulting in severe academic stress.
- **Zero Transparency**: Commercial aggregators conceal true commute times and lack explainability.

### 2. Innovation & Solution
**Roommate.com** is a 100% frontend-only, client-side, privacy-preserving platform delivering:
1. **Interactive 3D WebGL Hero Canvas**: A real-time Three.js/Fiber/Drei isometric student campus city block with glowing windows, interactive location pins, ambient dust, and mouse parallax.
2. **Deterministic Geocoded Listings Generator**: Generates realistic demo PG and flat listings around any queried coordinates (lat/lng) using seeded random algorithms. The same coordinates yield identical results with realistic rent, deposit, amenities, and photo galleries.
3. **Live Overpass API Essentials**: Fetches real colleges, transit stops, hospitals, supermarkets, ATMs, and cafes around your coordinates, computing commute distances via the **Haversine formula**.
4. **Transparent & Explainable Compatibility Engine**: Pure TypeScript deterministic algorithm pairing roommates on sleep cycles, chores, noise tolerance, and budget. Includes unit tests with Vitest, factor breakdowns, strengths, points of discussion, and ethical non-discriminatory boundaries.
5. **Anti-Scam Safety Center**: Student pre-payment verification checklist and local report filing mechanism.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended, tested on Node v24)
- npm (v9+)

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the local development server
npm run dev

# 3. Run compatibility engine unit tests
npx vitest run

# 4. Production build
npm run build
```

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies & Purpose |
| :--- | :--- |
| **Framework & Language** | React 19, Vite, TypeScript |
| **Styling & Design System** | Tailwind CSS v4, custom glassmorphism, Google Fonts (`Fraunces` editorial serif & `Plus Jakarta Sans`) |
| **3D & WebGL Engine** | Three.js, `@react-three/fiber`, `@react-three/drei`, mouse parallax, low-poly isometric city block |
| **Mapping & Geocoding** | Leaflet, `react-leaflet`, OpenStreetMap Nominatim API, Overpass QL API |
| **State & Persistence** | Zustand with `persist` middleware storing data in `localStorage` |
| **Smooth Motion & UX** | Lenis smooth scrolling, canvas-confetti, magnetic custom cursor |
| **Unit Testing** | Vitest testing suite for compatibility scoring mathematics |

---

## 📍 How Location Search & POI Discovery Works

1. **Debounced Nominatim Geocoding**:
   - Location queries (e.g. "KIET Ghaziabad", "Koramangala", "Mathura") are debounced at 400ms.
   - Strictly throttled to `<= 1 request per second` to respect OpenStreetMap Nominatim fair usage policies.
   - Dual-layer caching: in-memory `Map` + `localStorage` cache.
   - Offline fallback: Includes a curated database of top Indian student hubs (KIET Muradnagar, Knowledge Park Greater Noida, DU North Campus, Hinjewadi Pune, etc.).

2. **Browser Geolocation API**:
   - "Near Me" button resolves the user's GPS position with fallback to reverse geocoding (`/reverse`).

3. **Deterministic Seeded Listings Generator (`listings-generator.ts`)**:
   - Computes an integer seed: `Math.floor(Math.abs(lat * 1000 + lng * 1000))`.
   - Distributes realistic PGs and flats within the user's radius slider (1–12 km).
   - Accurately computes distance in km via the **Haversine formula**.
   - All listings are clearly stamped with a **"Demo Listing"** tag.

4. **Live Overpass API Essentials (`overpass.ts`)**:
   - Live query to `https://overpass-api.de/api/interpreter` fetching nearby colleges, bus stops, metro stations, hospitals, and ATMs.
   - Graceful timeout (4.5s) with realistic fallback POIs so the UI never hangs.

---

## 🧠 Explainable Compatibility Engine

- Located in `src/services/compatibility.ts` with unit tests in `src/services/compatibility.test.ts`.
- **Score calculation (0 to 100)**:
  $$\text{Score} = \frac{\sum (\text{CategoryScore}_i \times \text{Weight}_i)}{\sum \text{Weight}_i}$$
- **Hard Constraints**:
  - Flags non-overlapping budget brackets when `strictBudget` is toggled.
  - Caps mismatch score at $\le 42\%$ to alert students.
- **Explainability**:
  - Breaks down matching factors: Sleep Schedule, Cleanliness & Chores, Diet & Kitchen, Smoking/Substances, Noise Tolerance, and Visitor Rules.
  - Highlights "Core Synergy" and "Discuss Before Moving In".
  - **Ethical Safeguard**: Never uses religion, caste, race, or discriminatory proxies.

---

## 🛡️ Limitations & Future Scope

### Current Prototype Limitations
1. No backend or database: Inquiries, saved items, and user answers are stored locally in the browser's `localStorage`.
2. Mock listings: Real estate listings are deterministically generated demo models since no free nationwide PG database exists.
3. Verification is simulated for the hackathon demonstration.

### Future Roadmap (Production Scope)
1. **Real Backend**: NestJS / Supabase with PostgreSQL and Row-Level Security.
2. **Biometric Verification**: Digilocker / Aadhaar OTP verification for student IDs and landlord title deed checking.
3. **Campus Partnerships**: Formal integration with college student welfare committees (KIET Innotech campus housing cell).
4. **Real-Time Group Chat**: WebSockets / Matrix protocol for end-to-end encrypted roommate chat before lease signing.

---

## 🏆 Hackathon Project Information
- **Event**: KIET Innotech 2026 (National Level Tech Fest)
- **Track**: Web3 / Smart Living / EdTech / Student Infrastructure
- **Team**: Roommate.com Engineering
- **Status**: 100% Functional Client-Side Demo
