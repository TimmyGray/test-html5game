import { Assets, Texture } from "pixi.js";
import asteroid1 from "../../../assets/asteroid_1.png";
import asteroid2 from "../../../assets/asteroid_2.png";
import asteroid3 from "../../../assets/asteroid_3.png";
import asteroid4 from "../../../assets/asteroid_4.png";
import goldenAsteroid1 from "../../../assets/golden_asteroid_1.png";
import goldenAsteroid2 from "../../../assets/golden_asteroid_2.png";
import goldenAsteroid3 from "../../../assets/golden_asteroid_3.png";
import goldenAsteroid4 from "../../../assets/golden_asteroid_4.png";
import planet from "../../../assets/planet.png";

const PLANET_ALIAS = "gameplay:planet";
const NORMAL_ALIASES = Object.freeze([
  "gameplay:asteroid:1",
  "gameplay:asteroid:2",
  "gameplay:asteroid:3",
  "gameplay:asteroid:4",
]);
const GOLD_ALIASES = Object.freeze([
  "gameplay:golden-asteroid:1",
  "gameplay:golden-asteroid:2",
  "gameplay:golden-asteroid:3",
  "gameplay:golden-asteroid:4",
]);

/** Pixi `Assets` alias keys registered by `ensureGameplayVisualAssetsLoaded` (tests + tooling). */
export const GAMEPLAY_ASSET_ALIASES = Object.freeze({
  planet: PLANET_ALIAS,
  normal: NORMAL_ALIASES,
  gold: GOLD_ALIASES,
});

let initialized = false;

/**
 * Purpose: clamp debris sprite variant index to the configured normal/gold sprite slot count.
 * Inputs assumptions: `variantIndex` may be fractional or out of range from RNG callers.
 * Outputs contract: integer in `[0, NORMAL_ALIASES.length - 1]`.
 * Side effects: none.
 * Failure modes: non-finite input floors to 0 via `Math.floor` then clamp.
 */
export function clampDebrisVisualVariantIndex(variantIndex: number): number {
  const n = NORMAL_ALIASES.length;
  return Math.max(0, Math.min(n - 1, Math.floor(variantIndex)));
}

/**
 * Purpose: pre-register and load gameplay sprite assets before scene bootstrap.
 * Inputs assumptions: called once during startup; repeated calls are safe no-ops.
 * Outputs contract: resolves when all planet and asteroid textures are in Pixi Assets cache.
 * Side effects: mutates global `Assets` cache entries for gameplay aliases.
 * Failure modes: propagates loading errors so bootstrap can surface startup diagnostics.
 */
export async function ensureGameplayVisualAssetsLoaded(): Promise<void> {
  if (!initialized) {
    Assets.add({ alias: PLANET_ALIAS, src: planet });
    Assets.add({ alias: NORMAL_ALIASES[0], src: asteroid1 });
    Assets.add({ alias: NORMAL_ALIASES[1], src: asteroid2 });
    Assets.add({ alias: NORMAL_ALIASES[2], src: asteroid3 });
    Assets.add({ alias: NORMAL_ALIASES[3], src: asteroid4 });
    Assets.add({ alias: GOLD_ALIASES[0], src: goldenAsteroid1 });
    Assets.add({ alias: GOLD_ALIASES[1], src: goldenAsteroid2 });
    Assets.add({ alias: GOLD_ALIASES[2], src: goldenAsteroid3 });
    Assets.add({ alias: GOLD_ALIASES[3], src: goldenAsteroid4 });
    initialized = true;
  }

  await Assets.load([PLANET_ALIAS, ...NORMAL_ALIASES, ...GOLD_ALIASES]);
}

export function getPlanetTexture(): Texture {
  return (Assets.get<Texture>(PLANET_ALIAS) ?? Texture.WHITE) as Texture;
}

export function getDebrisTexture(
  goldVariant: boolean,
  variantIndex: number,
): Texture {
  const aliases = goldVariant ? GOLD_ALIASES : NORMAL_ALIASES;
  const idx = clampDebrisVisualVariantIndex(variantIndex);
  const alias = aliases[idx]!;
  return (Assets.get<Texture>(alias) ?? Texture.WHITE) as Texture;
}
