export const isNewerRelease = (candidate: string, current: string) => {
  const candidateParts = candidate.split(".").map(Number);
  const currentParts = current.split(".").map(Number);
  if (
    candidateParts.some((part) => !Number.isFinite(part)) ||
    currentParts.some((part) => !Number.isFinite(part))
  ) return false;
  const length = Math.max(candidateParts.length, currentParts.length);
  for (let index = 0; index < length; index += 1) {
    const next = candidateParts[index] || 0;
    const active = currentParts[index] || 0;
    if (next !== active) return next > active;
  }
  return false;
};

// GitHub Pages can serve version.json before its HTML or bundled script has
// reached the same cache edge. Never reload into a partially published build.
export const isReleaseReady = async (
  baseUrl: string,
  script: string | undefined,
  nonce: string,
  signal?: AbortSignal,
) => {
  if (!script) return false;
  const base = new URL(baseUrl);
  const page = new URL(`index.html?release_check=${encodeURIComponent(nonce)}`, base);
  const response = await fetch(page, { cache: "no-store", signal });
  if (!response.ok) return false;
  const html = await response.text();
  const htmlScript = html.match(/<script\b[^>]*\bsrc="([^"]+)"/i)?.[1];
  if (!htmlScript || new URL(htmlScript, base).href !== new URL(script, base).href) {
    return false;
  }
  const asset = await fetch(new URL(script, base), {
    method: "HEAD",
    cache: "no-store",
    signal,
  });
  return asset.ok;
};
