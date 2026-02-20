# EcoFlow — Smart Drainage System

**Front-end simulator & operations dashboard** for urban drainage networks — sensors, incidents, valve commands, risk scoring, and predictive maintenance.

[Live demo (GitHub Pages)](https://vishh70.github.io/smart-drainge-system-Eco-FLow/) · [Source (GitHub)](https://github.com/Vishh70/smart-drainge-system-Eco-FLow)

---

## Badges

`![Status](https://img.shields.io/badge/status-active-brightgreen)` `![License](https://img.shields.io/badge/license-MIT-blue)`
(Replace with real shields as desired.)

---

## Table of Contents

* [About](#about)
* [Demo & Links](#demo--links)
* [Tech Stack](#tech-stack)
* [Main Features](#main-features)
* [Project Structure](#project-structure)
* [Installation & Run (A → Z)](#installation--run-a--z)
* [Configuration & Data](#configuration--data)
* [Deployment (GitHub Pages)](#deployment-github-pages)
* [Update Workflow](#update-workflow-every-time-you-change-files)
* [Troubleshooting](#troubleshooting)
* [Contributing & License](#contributing--license)
* [Author](#author)

---

## About

EcoFlow is a single-page front-end app that simulates IoT sensors and operations for a drainage network. It’s built with lightweight web tech and intentionally designed to run from static hosting (GitHub Pages) or a local static server.

---

## Demo & Links

* **Repository:** [https://github.com/Vishh70/smart-drainge-system-Eco-FLow](https://github.com/Vishh70/smart-drainge-system-Eco-FLow)
* **Live (Pages):** [https://vishh70.github.io/smart-drainge-system-Eco-FLow/](https://vishh70.github.io/smart-drainge-system-Eco-FLow/)

---

## Tech Stack

* HTML5, CSS3, Vanilla JavaScript
* Leaflet (map rendering via CDN)
* Chart.js (analytics via CDN)
* OpenStreetMap tiles for basemap (attribution required) — OpenStreetMap
* Browser `localStorage` for persistence

---

## Main Features

* Real-time simulation tick (every 2 seconds)
* Three main routes (hash routing): `#/dashboard`, `#/analytics`, `#/admin`
* KPI strip (health, alerts, affected zones, uptime)
* Interactive Leaflet map with toggles:

  * Sensors
  * Incidents
  * Flow paths
  * Risk heat layer
* Analytics:

  * Network load line chart
  * Area risk stacked bar chart (click to focus)
  * Maintenance mix donut chart
  * Sortable operations table
  * Snapshot JSON download
* Admin controls:

  * Scenario switching (`normal_ops`, `heavy_rain`, `blockage_cascade`, `pump_failure`)
  * Start / Pause simulation
  * Valve command queue with retry logic
  * Mitigation actions
  * Predictive maintenance queue + operation logs

---

## Project Structure

```
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

---

## Installation & Run (A → Z)

1. **Prereqs**

   * Git
   * Modern browser (Chrome/Edge/Firefox)
   * Optional local static server:

     * Python 3, or
     * Node.js (npm)

2. **Clone**

```bash
git clone https://github.com/Vishh70/smart-drainge-system-Eco-FLow.git
cd smart-drainge-system-Eco-FLow
```

3. **Run local server (recommended)**

* Option A — Python:

```bash
python -m http.server 5500
```

* Option B — Node (serve):

```bash
npx serve . -l 5500
```

4. **Open in browser**

```
http://localhost:5500/
```

5. **Direct route shortcuts**

* Dashboard: `http://localhost:5500/index.html#/dashboard`
* Analytics: `http://localhost:5500/index.html#/analytics`
* Admin: `http://localhost:5500/index.html#/admin`

---

## Configuration & Data

* Core data lives in `data.js` — drainage points, zones, default sensors.
* Simulation scenarios are in `js/sim/scenarios.js`:

  * `normal_ops`
  * `heavy_rain`
  * `blockage_cascade`
  * `pump_failure`
* Local storage keys:

  * `ecoflow.app.state.v1`
  * `ecoflow.app.settings.v1`
    To reset state, clear site `localStorage` (via DevTools Application → Clear Storage).

---

## Deployment (GitHub Pages) — Full Steps

1. Commit & push changes to `main`.
2. Open the repository on GitHub → **Settings** → **Pages**.
3. Under **Build and deployment**:

   * Source: **Deploy from a branch**
   * Branch: `main`
   * Folder: `/ (root)`
4. Save — wait for build (GitHub will show status).
5. Verify at: `https://<your-username>.github.io/<repo>/` — for this repo: `https://vishh70.github.io/smart-drainge-system-Eco-FLow/`

---

## Update Workflow (Every time you change files)

```bash
git status
git add -A
git commit -m "Describe your update"
git push origin main
```

Then refresh the live site after GitHub Pages finishes deploying.

---

## Troubleshooting

* **Blank map / charts**

  * Confirm internet access (Leaflet/Chart.js loaded from CDN).
  * Check browser console for runtime errors.
* **Old UI / data shown**

  * Hard refresh (`Ctrl + F5`) or clear site `localStorage`.
* **Route not opening**

  * Ensure you use hash routes (`#/dashboard`, `#/analytics`, `#/admin`).
* **Valve queue or simulation issues**

  * Check `js/sim/engine.js` for tick logic and queue retry parameters.

---

## Contributing

* Please **do not copy or reuse** without permission. Contact first at `vishnuaware7066@gmail.com`.
* If you want to contribute: open an issue describing the change, then a PR from a feature branch. Keep changes isolated to one logical feature per PR.

---

## License

* Default: `MIT` (change as desired). Include a `LICENSE` file when publishing.

---

## Author

Author / maintainer: Vishnu Aware — `vishnuaware7066@gmail.com`

---
