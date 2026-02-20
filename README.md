# EcoFlow Smart Drainage System

EcoFlow is a front-end smart drainage operations dashboard that simulates IoT sensor behavior, risk scoring, incidents, valve commands, and predictive maintenance for urban drainage networks.

## Live Links

- GitHub Repository: `https://github.com/Vishh70/smart-drainge-system-Eco-FLow`
- GitHub Pages: `https://vishh70.github.io/smart-drainge-system-Eco-FLow/`

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- Leaflet (map rendering via CDN)
- Chart.js (analytics charts via CDN)
- OpenStreetMap tiles for basemap
- Browser `localStorage` for persistence

## Main Features

- Real-time simulation tick (every 2 seconds)
- Three primary routes:
  - `#/dashboard`
  - `#/analytics`
  - `#/admin`
- KPI strip (health, alerts, affected zones, uptime)
- Interactive map with layer toggles:
  - Sensors
  - Incidents
  - Flow paths
  - Risk heat
- Analytics:
  - Network load line chart
  - Area risk stacked bar chart (click zone to focus)
  - Maintenance mix donut chart
  - Sortable operations table
  - Snapshot JSON download
- Admin controls:
  - Scenario switching
  - Start/Pause simulation
  - Valve command queue with retry logic
  - Mitigation actions
  - Predictive maintenance queue and operation logs

## Project Structure

```text
website/
  index.html
  data.js
  design-system.css
  admin_index.html
  aindex.html
  js/
    app.js
    core/
      events.js
      store.js
      router.js
      persistence.js
    sim/
      scenarios.js
      rules.js
      engine.js
    views/
      dashboardView.js
      analyticsView.js
      adminView.js
    widgets/
      mapWidget.js
      chartsWidget.js
      toast.js
  styles/
    base.css
    components.css
    tokens.css
    views.css
```

## A to Z Installation and Run Guide

1. Install prerequisites:
   - Git
   - A modern browser (Chrome, Edge, Firefox)
   - Optional local server runtime:
     - Python 3 (recommended), or
     - Node.js (alternative)

2. Clone repository:

```bash
git clone https://github.com/Vishh70/smart-drainge-system-Eco-FLow.git
```

3. Go to project folder:

```bash
cd smart-drainge-system-Eco-FLow
```

4. Run local server (recommended).

Option A (Python):

```bash
python -m http.server 5500
```

Option B (Node.js):

```bash
npx serve . -l 5500
```

5. Open app in browser:

```text
http://localhost:5500/
```

6. Open direct route pages (optional):

- Dashboard: `http://localhost:5500/index.html#/dashboard`
- Analytics: `http://localhost:5500/index.html#/analytics`
- Admin: `http://localhost:5500/index.html#/admin`

7. Optional shortcuts:

- `aindex.html` redirects to Analytics
- `admin_index.html` redirects to Admin

## Configuration and Data

- Drainage points and zones are defined in `data.js`.
- Simulation scenarios are defined in `js/sim/scenarios.js`:
  - `normal_ops`
  - `heavy_rain`
  - `blockage_cascade`
  - `pump_failure`
- Local persistence keys:
  - `ecoflow.app.state.v1`
  - `ecoflow.app.settings.v1`

To reset saved state, clear browser localStorage for the site.

## Deployment (GitHub Pages) - Full Steps

1. Commit and push your latest code to `main`.
2. Open repository on GitHub.
3. Go to `Settings` -> `Pages`.
4. Under `Build and deployment`, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Save settings.
6. Wait for deployment to complete.
7. Open:
   - `https://vishh70.github.io/smart-drainge-system-Eco-FLow/`

## Update Workflow (Every Time You Change Files)

```bash
git status
git add -A
git commit -m "Describe your update"
git push origin main
```

Then verify the live site after deployment refreshes.

## Troubleshooting

- Blank map/charts:
  - Check internet access (Leaflet/Chart.js are loaded from CDN).
  - Open browser console for runtime errors.
- Old UI/data shown:
  - Hard refresh (`Ctrl + F5`).
  - Clear site localStorage.
- Route not opening:
  - Ensure URL uses hash route format (`#/dashboard`, `#/analytics`, `#/admin`).

Do not copy or reuse this project without my permission; contact first at vishnuaware7066@gmail.com.
