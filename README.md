# AI Disaster Response Resource Optimizer (Frontend)

> **Main Concept:** Right Resource → Right Person → Right Place → Right Time.
> **Core Flow:** Request → Priority Detection → Resource Matching → Location Check → Allocation → Real-time Update

A responsive, high-performance, and offline-resilient web frontend application built strictly according to the project specification document.

---

## 🚀 Quick Start / How to Run

1. Navigate to the project folder:
   `C:\Users\HomePC\.gemini\antigravity\scratch\disaster-response-optimizer\`
2. Double-click **`index.html`** or right-click and open with any modern web browser (Google Chrome, Microsoft Edge, Brave, Firefox).
3. **No installation or build steps required!** All libraries (Tailwind CSS, Leaflet.js, Chart.js, Font Awesome) load smoothly via high-speed CDNs.

---

## 🌟 Key Features Implemented

### 1. Multi-Channel Emergency Request Intake (Section 2)
- **Public Emergency Form**: Direct citizen submission with GPS location helper, urgency selector, people count, and item requests.
- **Operator Helpline Desk**: Fast-entry form for call center dispatchers taking distress phone calls.
- **Voice & SMS AI Transcription Simulator**: Converts raw voice notes and unstructured SMS texts into structured emergency parameters with confidence scoring.
- **Village Volunteer Portal**: Mobile-tailored interface designed for on-ground field workers with offline local caching.

### 2. Offline Mode & Automatic Cloud Sync (Section 3 & 13)
- **Network Status Simulator**: Easily toggle between **Online** and **Offline** states via the header switch.
- **Offline Storage**: When disconnected, volunteer submissions are stored locally in the browser (`localStorage`/IndexedDB) with `Offline Pending` status.
- **Auto-Sync Engine**: When connectivity is restored, requests are automatically synchronized to central command with real-time status updates (`Synced` → `Processing` → `Assigned`).

### 3. AI Priority Scoring Engine (Section 9)
- Implements the mathematical scoring model:
  $$\text{Priority Score} = (w_1 \cdot \text{Severity}) + (w_2 \cdot \text{Urgency}) + (w_3 \cdot \text{People Count}) + (w_4 \cdot \text{Waiting Time})$$
- **Configurable Weights**: Accessible via the **"AI Weights"** button in the header with interactive sliders.
- **Transparent Triage Explanations**: Hover over any score to inspect the exact mathematical breakdown.
- **Official Incident Commander Override**: Supports manual prioritization when field conditions dictate.

### 4. Smart Resource Optimization & Allocation (Section 10)
- **Haversine Distance Calculation**: Automatically calculates spatial distance (in km) between distress coordinates and available depots.
- **Capacity & Stock Limits**: Allocations strictly honor available inventory.
- **Partial Fulfillment Engine**: When demand exceeds warehouse stock (e.g. demand 50, stock 30), it fulfills 30 units and logs the remaining 20 units as unmet demand in a tracked waitlist.
- **Dynamic Reallocation**: Automatically triggers when a new life-safety critical request is logged or when an active depot is flooded/compromised.

### 5. Interactive GIS Disaster Map (Section 5 & 12)
- High-contrast interactive map centered over the active flood basin (Adyar - Velachery - Saidapet - Tambaram).
- **Radar Pulsing Markers**: Critical emergencies pulse in red, high-priority in amber, depots in green/slate.
- **Route Polylines**: Animated transit routes connecting supplying depots to emergency locations with distance and ETA tooltips.
- **Inundation Hazard Zones**: Visual flood risk water-level circles.

### 6. Interactive 10-Step Flood Disaster Demo Scenario (Section 15)
Click the **"10-Step Demo Walkthrough"** button in the header to launch an interactive guided presentation mode that demonstrates:
1. **Step 1:** Create 3 baseline requests (Critical Medical, High Food, Medium Shelter).
2. **Step 2:** Stock disaster resources across regional depots.
3. **Step 3:** Run AI Priority Engine and calculate weighted scores.
4. **Step 4:** Verify Critical Medical request is prioritized first (#1).
5. **Step 5:** Match nearest available resource and draw routing polylines on the map.
6. **Step 6:** Inspect updated dashboard status and KPI counters.
7. **Step 7:** Inject sudden surge critical emergency (`REQ-CRIT-99`: ICU power loss / trapped).
8. **Step 8:** Trigger dynamic reallocation alert and execute revised distribution plan.
9. **Step 9:** Simulate depot flood outage (`RES-101`) and watch the system automatically fallback to `RES-107`.
10. **Step 10:** Cut connectivity, submit volunteer request offline, restore connectivity, and watch automatic background sync!

---

## 📁 File Structure

```
disaster-response-optimizer/
├── index.html                 # Master Single Page Application
├── README.md                  # System documentation & execution guide
├── css/
│   └── styles.css             # Disaster Command Center theme, animations & radar glows
└── js/
    ├── data.js                # Initial disaster requests & resource depots dataset
    ├── priorityEngine.js      # AI scoring algorithm & weight configuration
    ├── optimizerEngine.js     # Nearest-neighbor matching, partial allocation & reallocation
    ├── offlineStorage.js      # LocalStorage queue, network listeners & auto-sync
    ├── mapController.js       # Leaflet.js GIS map, custom markers, routes & hazard zones
    ├── demoScenario.js        # Section 15 Flood Disaster 10-step demo runner
    └── app.js                 # Central application coordinator, charts & UI state
```
