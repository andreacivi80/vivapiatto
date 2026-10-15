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
