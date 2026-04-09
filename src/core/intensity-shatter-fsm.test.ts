import { describe, it, expect, beforeEach } from "vitest";
import { CONFIG } from "../config/config.js";
import {
  IntensityShatterFsm,
  intensityStageForElapsedSec,
  spawnIntervalScaleForStage,
  oscillationIntensityForStage,
  spectacleIntensityForStage,
} from "./intensity-shatter-fsm.js";

describe("intensityStageForElapsedSec", () => {
  const flow = CONFIG.INTENSITY_STAGES.FLOW_AT_ELAPSED_SEC;
  const climax = CONFIG.INTENSITY_STAGES.CLIMAX_AT_ELAPSED_SEC;

  it("selects arrival below flow threshold", () => {
    expect(intensityStageForElapsedSec(0)).toBe("arrival");
    expect(intensityStageForElapsedSec(flow - 1e-6)).toBe("arrival");
  });

  it("selects flow at flow threshold until climax", () => {
    expect(intensityStageForElapsedSec(flow)).toBe("flow");
    expect(intensityStageForElapsedSec(flow + 3)).toBe("flow");
    expect(intensityStageForElapsedSec(climax - 1e-6)).toBe("flow");
  });

  it("selects climax at climax threshold and beyond (30s session design)", () => {
    expect(intensityStageForElapsedSec(climax)).toBe("climax");
    expect(
      intensityStageForElapsedSec(CONFIG.INTENSITY_STAGES.SESSION_DESIGN_SEC),
    ).toBe("climax");
  });
});

describe("IntensityShatterFsm", () => {
  let fsm: IntensityShatterFsm;

  beforeEach(() => {
    fsm = new IntensityShatterFsm();
  });

  it("orders transitions arrival → flow → climax with stageChanged flags", () => {
    const flow = CONFIG.INTENSITY_STAGES.FLOW_AT_ELAPSED_SEC;
    const climax = CONFIG.INTENSITY_STAGES.CLIMAX_AT_ELAPSED_SEC;

    let r = fsm.sync(0, 100);
    expect(r.phase).toBe("playing");
    expect(r.stage).toBe("arrival");
    expect(r.stageChanged).toBe(false);

    r = fsm.sync(flow, 100);
    expect(r.stage).toBe("flow");
    expect(r.stageChanged).toBe(true);
    expect(r.spawnIntervalScale).toBe(
      spawnIntervalScaleForStage("flow"),
    );
    expect(r.oscillationIntensity).toBe(
      oscillationIntensityForStage("flow"),
    );
    expect(r.spectacleIntensity).toBe(spectacleIntensityForStage("flow"));

    r = fsm.sync(flow + 1, 100);
    expect(r.stageChanged).toBe(false);

    r = fsm.sync(climax, 100);
    expect(r.stage).toBe("climax");
    expect(r.stageChanged).toBe(true);
    expect(r.spectacleIntensity).toBe(spectacleIntensityForStage("climax"));
  });

  it("enters shatter when health reaches zero (priority over long-run pacing)", () => {
    const r = fsm.sync(0, 0);
    expect(r.phase).toBe("shatter");
    expect(r.enteredShatter).toBe(true);
    expect(r.stage).toBe("arrival");
  });

  it("shatter transition is idempotent", () => {
    expect(fsm.sync(0, 0).enteredShatter).toBe(true);
    const r2 = fsm.sync(1, 0);
    expect(r2.phase).toBe("shatter");
    expect(r2.enteredShatter).toBe(false);
    const r3 = fsm.sync(999, 0);
    expect(r3.enteredShatter).toBe(false);
  });

  it("reset restores playing state from shatter", () => {
    fsm.sync(50, 0);
    expect(fsm.phase).toBe("shatter");
    fsm.reset();
    expect(fsm.phase).toBe("playing");
    expect(fsm.stage).toBe("arrival");
    const r = fsm.sync(6, 100);
    expect(r.stage).toBe("flow");
  });
});
