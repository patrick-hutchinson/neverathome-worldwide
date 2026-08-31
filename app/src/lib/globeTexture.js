export function getGlobeTextureUrl(textureUrl) {
  if (!textureUrl) return undefined;

  try {
    const url = new URL(textureUrl);

    if (url.hostname === "cdn.sanity.io") {
      return `/api/globe-texture?url=${encodeURIComponent(textureUrl)}`;
    }
  } catch {
    return undefined;
  }

  return textureUrl;
}
