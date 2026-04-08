/**
 * Pure helpers for Story 1.4 tutorial planet resolution (centered planet, circular debris).
 */
export function isDebrisPlanetImpact(
  debrisX: number,
  debrisY: number,
  planetCenterX: number,
  planetCenterY: number,
  planetRadius: number,
  debrisRadius: number,
): boolean {
  const dx = debrisX - planetCenterX;
  const dy = debrisY - planetCenterY;
  return Math.hypot(dx, dy) <= planetRadius + debrisRadius;
}

/**
 * Whether storm debris should be OOB-recycled this frame.
 * When `tutorialFirstWaveActive`, recycle is suppressed only if planet impact can still
 * resolve the tutorial (see `planetHitResolutionEnabled`); if planet checks are off,
 * OOB is allowed so the piece cannot strand off-screen forever.
 */
export function shouldStormRecycleForOob(
  outOfView: boolean,
  tutorialFirstWaveActive: boolean,
  planetHitResolutionEnabled = true,
): boolean {
  if (!outOfView) {
    return false;
  }
  if (!tutorialFirstWaveActive) {
    return true;
  }
  if (planetHitResolutionEnabled) {
    return false;
  }
  return true;
}
