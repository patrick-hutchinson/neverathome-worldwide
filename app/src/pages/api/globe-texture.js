const SANITY_IMAGE_HOST = "cdn.sanity.io";
const SANITY_IMAGE_PATH_PREFIX = "/images/aw4em3wa/production/";

export default async function handler(req, res) {
  const textureUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;

  if (!textureUrl) {
    res.status(400).json({ error: "Missing texture URL" });
    return;
  }

  let url;

  try {
    url = new URL(textureUrl);
  } catch {
    res.status(400).json({ error: "Invalid texture URL" });
    return;
  }

  if (url.protocol !== "https:" || url.hostname !== SANITY_IMAGE_HOST || !url.pathname.startsWith(SANITY_IMAGE_PATH_PREFIX)) {
    res.status(400).json({ error: "Unsupported texture URL" });
    return;
  }

  const textureResponse = await fetch(url);

  if (!textureResponse.ok) {
    res.status(textureResponse.status).json({ error: "Failed to load texture" });
    return;
  }

  const contentType = textureResponse.headers.get("content-type") || "image/jpeg";
  const cacheControl =
    textureResponse.headers.get("cache-control") || "public, max-age=31536000, immutable";
  const textureBuffer = Buffer.from(await textureResponse.arrayBuffer());

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", cacheControl);
  res.status(200).send(textureBuffer);
}
