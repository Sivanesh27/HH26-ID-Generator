# Hacker House Goa 2026 — Builder ID Site

A site that:

- Explains the selection framework (Open Trials → Partner Trials → RSVP & Stake → Residency), lifted straight from the official "Road to 247" doc.
- Lets every visitor build their own laminated **Builder ID** badge — name, role, build track, team, and a photo they upload themselves (jpg, png, and iPhone HEIC — with a friendly message if a browser can't preview HEIC).
- Lets a team (1–3 people, matching the real rules) add each member's ID to a roster, then **download** each badge as a PNG.
- Lets anyone **Share to X** with a pre-filled caption and the `#FrameInGoa` hashtag, as a link whose preview card shows the actual generated badge (not a blank thumbnail).

## File structure

```
index.html                  → all markup & copy
css/style.css                → design tokens + styling
js/main.js                   → form logic, live preview, roster, confetti, PNG export, X share
netlify.toml                 → clean URLs for share links + functions config
package.json                 → declares @netlify/blobs so Netlify installs it before building
netlify/functions/
  share-upload.js             → stores a generated badge, returns a shareable /s/<id> link
  share-image.js               → serves the raw badge PNG at /img/<id>
  share-page.js                 → serves the /s/<id> HTML page with correct OG/Twitter Card tags
```

The only external dependencies loaded from CDN in `index.html` are Google Fonts and [html2canvas](https://html2canvas.hertzen.com/) (used only when someone clicks Download or Share).

## Why the Share-to-X flow needs a backend

X's web share intent (`twitter.com/intent/tweet`) can't attach an image file directly via a URL parameter — that's been true for years. The only way a shared **link** shows the real generated image as its preview is if that link points to a page with correct `og:image` / `twitter:image` meta tags, and the image itself has to be hosted somewhere reachable.

So the flow is:
1. The browser renders the badge to a PNG (client-side, via html2canvas).
2. It's POSTed to a small Netlify Function (`share-upload.js`), which stores it in **Netlify Blobs** (object storage built into Netlify — no separate database or API keys needed) and returns a clean URL like `yoursite.netlify.app/s/ab12cd`.
3. That URL is what gets passed to the X share intent. When X's crawler fetches it, `share-page.js` returns HTML with `og:image` pointing at `yoursite.netlify.app/img/ab12cd` (served by `share-image.js`) — so the link preview shows the actual badge.

If the upload ever fails (offline, function not deployed yet, etc.), the site falls back gracefully: it downloads the PNG locally and opens a text-only tweet compose window instead, so the button never just does nothing.

## Run it locally (UI only, no share backend)

```bash
npx serve .
# or
python3 -m http.server 8080
```

This is fine for checking the design, the live preview, and Download. **Share to X will fall back to "download + text-only tweet"** locally, since the Netlify Functions only run once deployed (or via `netlify dev`, see below).

To test the full share flow locally, install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) and run:
```bash
npm install
netlify dev
```

## Deploy on GitHub + Netlify

**Important:** because this project now includes serverless Functions, it must be deployed through Netlify's Git-connected build (or `netlify deploy` via the CLI) — a plain drag-and-drop of the folder onto Netlify's UI will publish the static pages but **will not** bundle or run the Functions, so Share to X won't work.

1. Push this whole folder to a GitHub repo, with `index.html`, `netlify.toml`, `package.json`, and the `netlify/` folder all sitting at the **repo root** (not nested inside another folder of the same name — check this if you're reusing an existing repo).
2. In Netlify: **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build settings:
   - **Build command:** leave blank
   - **Publish directory:** `.`
   - Netlify will auto-detect `netlify/functions` from `netlify.toml` and bundle the functions during the build (it runs `npm install` first, which pulls in `@netlify/blobs`).
4. Deploy. Netlify Blobs works with zero extra configuration — it's enabled by default for every site.
5. Test the full loop on the live URL: build an ID → Download (should save a PNG) → Share (should open X with your caption, `#FrameInGoa`, and a link — paste that link anywhere to confirm the preview shows your badge).

## Requirements checklist (from the shortlisting brief)

| Requirement | Status |
|---|---|
| Upload photo (jpg/png/HEIC) | ✅ accepts all three; friendly fallback message if a browser can't preview HEIC |
| Format B fields: name, stack/role, team | ✅ name, role, build track, team name |
| Near-instant result | ✅ live preview updates as you type; PNG render is client-side and typically well under a second |
| Download real image file | ✅ PNG via html2canvas, triggered as a real file download |
| Share to X: pre-filled caption + `#FrameInGoa` | ✅ caption includes the hashtag; also passed via the intent's `hashtags` param |
| Link preview shows the actual graphic | ✅ via `/s/<id>` page with `og:image`/`twitter:image` pointing at the stored badge |
| No login wall / signup gate | ✅ none — works in one pass |
| Handles real photos (any crop/aspect ratio) | ✅ photo auto-crops to a centered square via `object-fit`-style cover, no pre-cropping required |
| On-brand | ✅ matches the official green/yellow/pink palette, typography, and the "गोवा" mark from the event doc |
| Mobile-friendly | ✅ responsive layout; share flow opens a new tab synchronously to avoid mobile popup blockers |

## Customizing

- **Colors / fonts:** CSS variables at the top of `css/style.css` (`:root`).
- **Copy / caption text:** `buildCaption()` in `js/main.js` for the tweet caption; page copy lives in `index.html`.
- **Total seats / team size:** `TOTAL_SEATS` and `MAX_TEAM` constants at the top of `js/main.js`.
- **How long shared badges stick around:** currently indefinite (Netlify Blobs has no built-in expiry) — add a cleanup routine if you want old shares to expire.

