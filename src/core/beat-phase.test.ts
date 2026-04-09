import { describe, expect, it } from "vitest";
import {
  BeatTickTracker,
  beatsPerSecond,
  getBeatPhase,
  heartbeatEnvelope,
  samplePlanetHeartbeat,
  samplePlanetHeartbeatInto,
} from "./beat-phase.js";
import { CONFIG } from "../config/config.js";

describe("beatsPerSecond", () => {
  it("matches BPM / 60", () => {
    expect(beatsPerSecond(120)).toBe(2);
    expect(beatsPerSecond(60)).toBe(1);
  });
});

describe("getBeatPhase", () => {
  it("wraps at each beat for 120 BPM", () => {
    const bpm = 120;
    expect(getBeatPhase(0, bpm)).toBeCloseTo(0, 6);
    expect(getBeatPhase(0.5, bpm)).toBeCloseTo(0, 6);
    expect(getBeatPhase(0.5 - 1e-9, bpm)).toBeLessThan(1);
    expect(getBeatPhase(1, bpm)).toBeCloseTo(0, 6);
    expect(getBeatPhase(1.25, bpm)).toBeCloseTo(0.5, 6);
  });
});

describe("heartbeatEnvelope", () => {
  it("ramps up during attack and down during decay", () => {
    const amp = 1;
    expect(heartbeatEnvelope(0, 0.1, 0.2, amp)).toBeCloseTo(0, 6);
    expect(heartbeatEnvelope(0.05, 0.1, 0.2, amp)).toBeCloseTo(0.5, 6);
    expect(heartbeatEnvelope(0.1, 0.1, 0.2, amp)).toBeCloseTo(1, 6);
    expect(heartbeatEnvelope(0.2, 0.1, 0.2, amp)).toBeCloseTo(0.5, 6);
    expect(heartbeatEnvelope(0.3, 0.1, 0.2, amp)).toBeCloseTo(0, 6);
  });

  it("zero attack uses decay-from-peak at phase 0", () => {
    expect(heartbeatEnvelope(0, 0, 0.25, 1)).toBeCloseTo(1, 6);
    expect(heartbeatEnvelope(0.25, 0, 0.25, 1)).toBeCloseTo(0, 6);
  });
});

describe("BeatTickTracker", () => {
  it("does not fire on the first sample (seeds beat index)", () => {
    const t = new BeatTickTracker();
    expect(t.consumeBeatTick(0, 120)).toBe(false);
    expect(t.consumeBeatTick(0, 120)).toBe(false);
  });

  it("fires once per beat interval after seed", () => {
    const t = new BeatTickTracker();
    expect(t.consumeBeatTick(0, 120)).toBe(false);
    expect(t.consumeBeatTick(0.1, 120)).toBe(false);
    expect(t.consumeBeatTick(0.5, 120)).toBe(true);
    expect(t.consumeBeatTick(0.51, 120)).toBe(false);
  });

  it("handles large audioTime jumps with a single tick for the new index", () => {
    const t = new BeatTickTracker();
    expect(t.consumeBeatTick(0, 120)).toBe(false);
    expect(t.consumeBeatTick(10, 120)).toBe(true);
    expect(t.consumeBeatTick(10, 120)).toBe(false);
  });

  it("does not emit beat tick on backward time jump", () => {
    const t = new BeatTickTracker();
    expect(t.consumeBeatTick(1.0, 120)).toBe(false);
    expect(t.consumeBeatTick(1.5, 120)).toBe(true);
    expect(t.consumeBeatTick(0.2, 120)).toBe(false);
    expect(t.consumeBeatTick(0.25, 120)).toBe(false);
    expect(t.consumeBeatTick(0.6, 120)).toBe(true);
  });
});

describe("samplePlanetHeartbeat", () => {
  it("uses CONFIG.PLANET_HEARTBEAT", () => {
    const s = samplePlanetHeartbeat(
      0,
      CONFIG.RHYTHM.BPM,
      CONFIG.PLANET_HEARTBEAT,
    );
    expect(s.phase).toBeCloseTo(0, 6);
    expect(s.envelope).toBeGreaterThanOrEqual(0);
  });
});

describe("samplePlanetHeartbeatInto", () => {
  it("matches samplePlanetHeartbeat without allocating a new result each call", () => {
    const hb = CONFIG.PLANET_HEARTBEAT;
    const bpm = CONFIG.RHYTHM.BPM;
    const out = { phase: 0, envelope: 0 };
    samplePlanetHeartbeatInto(0.37, bpm, hb, out);
    const boxed = samplePlanetHeartbeat(0.37, bpm, hb);
    expect(out.phase).toBeCloseTo(boxed.phase, 6);
    expect(out.envelope).toBeCloseTo(boxed.envelope, 6);
  });
});
