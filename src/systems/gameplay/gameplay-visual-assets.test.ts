import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  GAMEPLAY_ASSET_ALIASES,
  clampDebrisVisualVariantIndex,
} from "./gameplay-visual-assets.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("gameplay-visual-assets alias wiring (Story 5.3)", () => {
  it("registers four normal and four gold asteroid aliases disjoint from planet", () => {
    expect(GAMEPLAY_ASSET_ALIASES.normal).toHaveLength(4);
    expect(GAMEPLAY_ASSET_ALIASES.gold).toHaveLength(4);
    expect(GAMEPLAY_ASSET_ALIASES.planet).toMatch(/^gameplay:/);
    const all = new Set<string>([
      GAMEPLAY_ASSET_ALIASES.planet,
      ...GAMEPLAY_ASSET_ALIASES.normal,
      ...GAMEPLAY_ASSET_ALIASES.gold,
    ]);
    expect(all.size).toBe(9);
  });

  it("uses gameplay:asteroid:N and gameplay:golden-asteroid:N naming", () => {
    expect(GAMEPLAY_ASSET_ALIASES.normal[0]).toBe("gameplay:asteroid:1");
    expect(GAMEPLAY_ASSET_ALIASES.normal[3]).toBe("gameplay:asteroid:4");
    expect(GAMEPLAY_ASSET_ALIASES.gold[0]).toBe("gameplay:golden-asteroid:1");
    expect(GAMEPLAY_ASSET_ALIASES.gold[3]).toBe("gameplay:golden-asteroid:4");
  });

  it("clamps variant indices consistently for both pools", () => {
    expect(clampDebrisVisualVariantIndex(-99)).toBe(0);
    expect(clampDebrisVisualVariantIndex(2.7)).toBe(2);
    expect(clampDebrisVisualVariantIndex(99)).toBe(3);
  });

  it("loads gameplay sprites before initGameplay in main entry (regression)", () => {
    const mainPath = join(__dirname, "..", "..", "..", "src", "main.ts");
    const src = readFileSync(mainPath, "utf8");
    const loadIdx = src.indexOf("ensureGameplayVisualAssetsLoaded");
    const initIdx = src.indexOf("initGameplay(");
    expect(loadIdx).toBeGreaterThan(-1);
    expect(initIdx).toBeGreaterThan(-1);
    expect(loadIdx).toBeLessThan(initIdx);
  });
});
