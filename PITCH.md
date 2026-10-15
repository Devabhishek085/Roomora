# 🎙️ KIET Innotech 2026 — Product Pitch

## **Roommate.com**
### *Find Your Place. Find Your People.*

---

### 1. The Hook (The Problem We Faced at Campus)
Every year at colleges like KIET, thousands of students from across India travel to Muradnagar/Ghaziabad looking for safe housing:
- Local brokers charge **heavy brokerage** (half to one full month rent) and demand upfront "token money" before students even step foot in the room.
- College students get randomly assigned flatmates with conflicting lifestyle rhythms: a coder coding till 4 AM sharing a room with a civil engineering student waking up for 6 AM lab work. This sparks conflict, sleep deprivation, and broken leases.

### 2. The Solution
**Roommate.com** solves both halves of the student equation simultaneously:
1. **The Place**: Interactive OpenStreetMap discovery around any college campus with Overpass API live essentials (metro, bus stops, hospitals, ATMs) and zero brokerage.
2. **The People**: A transparent, weighted lifestyle compatibility engine that pairs students based on circadian rhythm, cleanliness standards, and budget with explainable breakdown cards.

### 3. Engineering Innovations
- **WebGL 3D Storytelling**: Real-time Three.js isometric student campus block with glowing windows, interactive location pin drop, and dynamic mouse parallax.
- **Deterministic Seeded Engine**: Lat/lng coordinate hash generates consistent, realistic demo PG listings anywhere in India with Haversine distance computations.
- **Zero Paid APIs**: Runs seamlessly using OpenStreetMap Nominatim, Overpass API, and browser APIs.
- **Explainable Mathematics**: 0–100 compatibility with pure TypeScript logic and Vitest unit testing.
- **Privacy & Safety by Design**: 100% client-side persistence in localStorage, with interactive scam prevention checklists.

### 4. Live Demo Walkthrough for Judges
1. **Hero**: Observe the real-time 3D canvas rotating gently and responding to mouse hover.
2. **Search**: Type `KIET Ghaziabad` or `Koramangala Bengaluru` in the search bar. Watch the Nominatim autocomplete resolve in real time.
3. **Explore**: Pan the Leaflet map and click "Search This Area". Notice the Overpass POI layers (colleges, bus stops, hospitals).
4. **Property Modal**: Click "Details" to view the image gallery, rules, and send an inquiry (with confetti!).
5. **Roommate Quiz & 3D Tilt**: Navigate to "Roommates" or take the "Match Quiz". Hover over cards to see the 3D perspective glare and click "Why This Match?" to see the breakdown.
6. **Dashboard**: Visit your student dashboard to see your saved listings, inquiries, and connection requests stored in localStorage.
7. **Theme**: Toggle Dark/Light mode anytime from the top navbar.
