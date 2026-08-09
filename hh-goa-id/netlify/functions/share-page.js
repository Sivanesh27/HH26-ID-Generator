// netlify/functions/share-page.js
//
// Serves a small branded HTML page at /s/<id>. Its only real job is to
// carry correct Open Graph / Twitter Card meta tags pointing at the stored
// badge image, so that when this URL is shared on X (or anywhere else),
// the link preview shows the actual generated graphic — not a blank or
// default thumbnail. It also links back to the main tool, so anyone who
// sees a friend's badge can go make their own.

const { getStore } = require("@netlify/blobs");

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPage({ origin, id, meta, found }) {
  const name = escapeHtml(meta && meta.name ? meta.name : "A builder");
  const role = escapeHtml(meta && meta.role ? meta.role : "Builder");
  const track = escapeHtml(meta && meta.track ? meta.track : "");
  const imageUrl = `${origin}/img/${id}`;
  const pageUrl = `${origin}/s/${id}`;
  const homeUrl = `${origin}/#create`;

  const title = found
    ? `${name}'s Builder ID — Hacker House Goa 2026`
    : "Hacker House Goa 2026 — Builder ID";
  const description = found
    ? `${name} is building toward a seat at Hacker House Goa 2026${track ? ` on the ${track} track` : ""}. #FrameInGoa`
    : "Build your own Builder ID for Hacker House Goa 2026. #FrameInGoa";

  const ogImageTags = found
    ? `
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="960" />
    <meta property="og:image:height" content="1380" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${imageUrl}" />`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Hacker House Goa 2026" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${pageUrl}" />
${ogImageTags}

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

<style>
  :root{
    --forest-900:#062c1d; --forest-800:#0b4a30; --cream:#f5f1e4;
    --yellow:#f4d91f; --pink:#ec1e79; --white:#fdfcf6;
  }
  *{box-sizing:border-box;}
  body{
    margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:26px; padding:48px 20px;
    background:radial-gradient(90% 70% at 100% 0%, rgba(236,30,121,.18), transparent 50%), linear-gradient(180deg,var(--forest-800),var(--forest-900));
    color:var(--white); font-family:'Space Grotesk', sans-serif; text-align:center;
  }
  img{max-width:320px; width:80vw; border-radius:22px; box-shadow:0 30px 60px -20px rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.1);}
  h1{font-family:'Anton', sans-serif; text-transform:uppercase; font-weight:400; font-size:clamp(1.6rem,5vw,2.4rem); color:var(--yellow); margin:0;}
  p{max-width:420px; line-height:1.6; color:#d9ecdf; margin:0; font-size:.95rem;}
  .hashtag{font-family:'Space Mono', monospace; color:var(--pink); font-weight:700; letter-spacing:.03em;}
  .btn{
    display:inline-block; margin-top:6px; background:var(--pink); color:var(--white); text-decoration:none;
    font-family:'Space Mono', monospace; font-weight:700; text-transform:uppercase; letter-spacing:.05em; font-size:.85rem;
    padding:15px 26px; border-radius:999px; box-shadow:0 10px 26px -10px rgba(236,30,121,.55);
  }
</style>
</head>
<body>
  ${found ? `<img src="${imageUrl}" alt="${name}'s Hacker House Goa 2026 Builder ID" />` : ""}
  <h1>${found ? `${name}&rsquo;s Builder ID` : "Badge not found"}</h1>
  <p>${found ? description : "This badge link has expired or doesn't exist. You can still build your own below."}</p>
  ${found ? `<p class="hashtag">#FrameInGoa</p>` : ""}
  <a class="btn" href="${homeUrl}">Build your own ID →</a>
</body>
</html>`;
}

exports.handler = async (event) => {
  const id = event.queryStringParameters && event.queryStringParameters.id;
  const origin = process.env.URL || `https://${event.headers.host}`;

  if (!id) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html" },
      body: renderPage({ origin, id: "", meta: null, found: false }),
    };
  }

  try {
    const store = getStore("hh-goa-shares");
    const meta = await store.get(`${id}.meta`, { type: "json" });

    if (!meta) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "text/html" },
        body: renderPage({ origin, id, meta: null, found: false }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: renderPage({ origin, id, meta, found: true }),
    };
  } catch (err) {
    console.error("share-page error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html" },
      body: renderPage({ origin, id, meta: null, found: false }),
    };
  }
};
