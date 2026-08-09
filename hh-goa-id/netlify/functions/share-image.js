// netlify/functions/share-image.js
//
// Serves the raw image bytes for a stored badge, at /img/<id>. This is the
// URL used as og:image / twitter:image on the /s/<id> share page.

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) {
    return { statusCode: 400, body: "Missing id" };
  }

  try {
    const store = getStore("hh-goa-shares");
    const result = await store.getWithMetadata(`${id}.img`, { type: "arrayBuffer" });

    if (!result || !result.data) {
      return { statusCode: 404, body: "Not found" };
    }

    const mime = (result.metadata && result.metadata.mime) || "image/png";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
      body: Buffer.from(result.data).toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("share-image error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};
