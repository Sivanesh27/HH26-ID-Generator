# Hacker House Goa 2026 — Builder ID Site

A single, dependency-free static site that:

- Explains the selection framework (Open Trials → Partner Trials → RSVP & Stake → Residency), lifted straight from the official "Road to 247" doc.
- Lets every visitor build their own laminated **Builder ID** badge — name, role, build track, team, and a photo they upload themselves.
- Lets a team (1–3 people, matching the real rules) add each member's ID to a roster, then download each badge (or all of them) as a PNG.

No backend, no build step, no npm install. It's plain HTML/CSS/JS, so it deploys as-is.

## File structure

```
index.html        → all markup & copy
css/style.css      → design tokens + styling
js/main.js         → form logic, live preview, roster, confetti, PNG export
```

The only external dependencies are loaded from CDN in `index.html`:
- Google Fonts (Anton, Space Grotesk, Space Mono)
- [html2canvas](https://html2canvas.hertzen.com/) (used only when someone clicks "Download")

## Run it locally

No build tools needed — just serve the folder statically, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` (or whatever port).

## Deploy on GitHub + Netlify

1. Push this folder to a new GitHub repo (keep `index.html` at the repo root).
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build settings:
   - **Build command:** leave blank
   - **Publish directory:** `.` (repo root)
4. Deploy. That's it — it's a static site, so there's nothing to build.

If you'd rather skip GitHub, you can also drag-and-drop this folder straight onto Netlify's "Deploys" page.

## Notes on the "seats claimed" counter

The counter on the homepage is a **front-end simulation** — it interpolates a plausible number of claimed seats between the Open Trials start (Aug 2026) and the RSVP & Stake deadline (late Sept 2026), then adds however many IDs the *current visitor* has generated (stored in their browser's `localStorage`). It's there to make the countdown feel alive without needing a backend.

If you want a **real, shared** counter across all visitors (e.g. "214 people have created an ID so far, for real"), you'll need a tiny bit of backend — the simplest options:
- A [Netlify Function](https://docs.netlify.com/functions/overview/) + a lightweight store (Netlify Blobs, Supabase, Airtable, or a Google Sheet).
- Increment a counter on submit, read it on load.

Everything else (the ID cards, the uploaded photo, the roster) is stored only in the visitor's own browser — nothing is uploaded anywhere, which keeps the whole thing zero-backend and privacy-friendly by default.

## Customizing

- **Colors / fonts:** all defined as CSS variables at the top of `css/style.css` (`:root`).
- **Copy:** all page text lives in `index.html`, matching the official selection-framework document.
- **Total seats / team size:** `TOTAL_SEATS` and `MAX_TEAM` constants at the top of `js/main.js`.
