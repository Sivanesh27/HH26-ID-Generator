// netlify/functions/share-upload.js
//
// Accepts a generated badge image (as a base64 data URL) plus a little
// metadata, stores it in Netlify Blobs, and returns a clean shareable URL
// (/s/<id>) whose Open Graph tags point at the stored image. That URL is
// what gets passed to the X ("Twitter") share intent, so the link preview
// shows the actual badge instead of a blank thumbnail.

const { getStore } = require("@netlify/blobs");

const MAX_BYTES = 4_500_000; // keep comfortably under the function payload limit

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { Allow: "POST, OPTIONS" }, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Malformed JSON body" });
  }

  const { image, name, role, track, team } = payload;
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return json(400, { error: "Missing or invalid image data" });
  }

  const match = image.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!match) {
    return json(400, { error: "Unsupported image format" });
  }
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");

  if (buffer.length === 0) {
    return json(400, { error: "Empty image" });
  }
  if (buffer.length > MAX_BYTES) {
    return json(413, { error: "Image too large" });
  }

  try {
    const store = getStore("hh-goa-shares");
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

    await store.set(`${id}.img`, buffer, { metadata: { mime } });
    await store.setJSON(`${id}.meta`, {
      name: String(name || "Builder").slice(0, 40),
      role: String(role || "").slice(0, 30),
      track: String(track || "").slice(0, 30),
      team: String(team || "").slice(0, 30),
      createdAt: Date.now(),
    });

    const origin = process.env.URL || `https://${event.headers.host}`;

    return json(200, {
      id,
      shareUrl: `${origin}/s/${id}`,
      imageUrl: `${origin}/img/${id}`,
    });
  } catch (err) {
    console.error("share-upload error:", err);
    return json(500, { error: "Could not store image" });
  }
};
