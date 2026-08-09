# Hacker House Goa 2026 — Builder ID Site

A single, dependency-free static site that:

- Explains the selection framework (Open Trials → Partner Trials → RSVP & Stake → Residency), lifted straight from the official "Road to 247" doc.
- Lets every visitor build their own laminated **Builder ID** badge — name, role, build track, team, and a photo they upload themselves (jpg, png, and iPhone HEIC — with a friendly message if a browser can't preview HEIC).
- Lets a team (1–3 people, matching the real rules) add each member's ID to a roster, then **download** each badge (or all of them) as a PNG.
- Lets anyone **Share to X**: the badge downloads automatically and X opens with a caption + `#FrameInGoa` already typed in — just attach the file that downloaded. On phones and browsers that support the native Share Sheet with files, it also offers the file there directly, so picking X can attach it without a manual step.

No backend, no build step, no npm install. It's plain HTML/CSS/JS, so it deploys as-is.

## File structure

```
index.html        → all markup & copy
css/style.css      → design tokens + styling
js/main.js         → form logic, live preview, roster, confetti, PNG export, X share
```

The only external dependencies are loaded from CDN in `index.html`:
- Google Fonts (Anton, Space Grotesk, Space Mono)
- [html2canvas](https://html2canvas.hertzen.com/) (used only when someone clicks Download or Share)

## How Share to X works

X's compose window can't pull an image attachment in from a URL on its own — there's no way for any website to make that happen automatically through the share-intent link alone. So the flow is built to be reliable rather than clever:

1. Clicking **Share** renders the badge to a PNG and downloads it immediately.
2. If the browser supports the native Share Sheet with files (`navigator.share`/`navigator.canShare` — most phones, some desktop browsers), the file is also offered there. Picking X from that sheet can attach it automatically.
3. Either way, X opens with the caption and `#FrameInGoa` already filled in. If step 2 wasn't available or was cancelled, the person just attaches the file that already downloaded in step 1.

This never depends on a network request succeeding, so it can't silently fail — worst case, X still opens with the caption ready.

## Run it locally

No build tools needed — just serve the folder statically, e.g.:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` (or whatever port).

## Deploy on GitHub + Netlify

1. Push this folder to a GitHub repo, keeping `index.html` at the repo root (not nested inside another folder of the same name).
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build settings:
   - **Build command:** leave blank
   - **Publish directory:** `.` (repo root)
4. Deploy. That's it — it's a static site, so there's nothing to build.

You can also skip GitHub entirely and drag-and-drop this folder onto [app.netlify.com/drop](https://app.netlify.com/drop) — since there's no backend anymore, that works just as well.

## Notes on the "seats claimed" counter

The counter on the homepage is a **front-end simulation** — it interpolates a plausible number of claimed seats between the Open Trials start (Aug 2026) and the RSVP & Stake deadline (late Sept 2026), then adds however many IDs the *current visitor* has generated (stored in their browser's `localStorage`). It's there to make the countdown feel alive without needing a backend.

Everything (the ID cards, the uploaded photo, the roster) is stored only in the visitor's own browser — nothing is uploaded anywhere.

## Requirements checklist (from the shortlisting brief)

| Requirement | Status |
|---|---|
| Upload photo (jpg/png/HEIC) | ✅ accepts all three; friendly fallback message if a browser can't preview HEIC |
| Format B fields: name, stack/role, team | ✅ name, role, build track, team name |
| Near-instant result | ✅ live preview updates as you type; PNG render is client-side and typically well under a second |
| Download real image file | ✅ PNG via html2canvas, triggered as a real file download |
| Share to X: pre-filled caption + `#FrameInGoa` | ✅ caption includes the hashtag; also passed via the intent's `hashtags` param |
| Image gets into the post | ✅ badge downloads automatically for manual attach; native file-share attempted first on supported devices |
| No login wall / signup gate | ✅ none — works in one pass |
| Handles real photos (any crop/aspect ratio) | ✅ photo auto-crops to a centered square via cover-fit, no pre-cropping required |
| On-brand | ✅ matches the official green/yellow/pink palette, typography, and the "गोवा" mark from the event doc |
| Mobile-friendly | ✅ responsive layout; share flow opens synchronously to avoid mobile popup blockers |

## Customizing

- **Colors / fonts:** all defined as CSS variables at the top of `css/style.css` (`:root`).
- **Copy / caption text:** `buildCaption()` in `js/main.js` for the tweet caption; page copy lives in `index.html`.
- **Total seats / team size:** `TOTAL_SEATS` and `MAX_TEAM` constants at the top of `js/main.js`.
