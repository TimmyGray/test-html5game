import { CONFIG } from "../config/config.js";

export type IntensityStage = "arrival" | "flow" | "climax";

export type IntensityShatterPhase = "playing" | "victory" | "shatter";

/**
 * Session pacing + fail-state bridge (Story 3.4).
 * Stage is derived from SyncClock session elapsed; shatter is authoritative on health ≤ 0 (idempotent).
 */
export function intensityStageForElapsedSec(
  elapsedSessionSec: number,
): IntensityStage {
  const s = CONFIG.INTENSITY_STAGES;
  if (elapsedSessionSec < s.FLOW_AT_ELAPSED_SEC) {
    return "arrival";
  }
  if (elapsedSessionSec < s.CLIMAX_AT_ELAPSED_SEC) {
    return "flow";
  }
  return "climax";
}

export function spawnIntervalScaleForStage(stage: IntensityStage): number {
  const s = CONFIG.INTENSITY_STAGES;
  switch (stage) {
    case "arrival":
      return s.ARRIVAL.SPAWN_INTERVAL_SCALE;
    case "flow":
      return s.FLOW.SPAWN_INTERVAL_SCALE;
    default:
      return s.CLIMAX.SPAWN_INTERVAL_SCALE;
  }
}

export function oscillationIntensityForStage(stage: IntensityStage): number {
  const s = CONFIG.INTENSITY_STAGES;
  switch (stage) {
    case "arrival":
      return s.ARRIVAL.OSCILLATION_INTENSITY;
    case "flow":
      return s.FLOW.OSCILLATION_INTENSITY;
    default:
      return s.CLIMAX.OSCILLATION_INTENSITY;
  }
}

export function spectacleIntensityForStage(stage: IntensityStage): number {
  const s = CONFIG.INTENSITY_STAGES;
  switch (stage) {
    case "arrival":
      return s.ARRIVAL.SPECTACLE_INTENSITY;
    case "flow":
      return s.FLOW.SPECTACLE_INTENSITY;
    default:
      return s.CLIMAX.SPECTACLE_INTENSITY;
  }
}

export type IntensityShatterSyncResult = {
  phase: IntensityShatterPhase;
  /** Stage implied by session time while playing; frozen at latch for victory/shatter. */
  stage: IntensityStage;
  stageChanged: boolean;
  enteredShatter: boolean;
  /** One-shot when survival time threshold is met with health remaining (Story 4.1). */
  enteredVictory: boolean;
  spawnIntervalScale: number;
  oscillationIntensity: number;
  spectacleIntensity: number;
};

export class IntensityShatterFsm {
  private _phase: IntensityShatterPhase = "playing";
  private _stage: IntensityStage = "arrival";
  private _shatterLatched = false;
  private _victoryLatched = false;

  public reset(): void {
    this._phase = "playing";
    this._stage = "arrival";
    this._shatterLatched = false;
    this._victoryLatched = false;
  }

  public get phase(): IntensityShatterPhase {
    return this._phase;
  }

  public get stage(): IntensityStage {
    return this._stage;
  }

  /**
   * Call after atmospheric health mutations for the tick.
   * Time advances {@link _stage} while playing; health ≤ 0 latches shatter once (idempotent);
   * elapsed ≥ `VICTORY_AT_ELAPSED_SEC` with health > 0 latches victory once (Story 4.1).
   */
  public sync(
    elapsedSessionSec: number,
    healthAfterImpacts: number,
  ): IntensityShatterSyncResult {
    if (this._phase === "shatter") {
      return {
        phase: "shatter",
        stage: this._stage,
        stageChanged: false,
        enteredShatter: false,
        enteredVictory: false,
        spawnIntervalScale: spawnIntervalScaleForStage(this._stage),
        oscillationIntensity: oscillationIntensityForStage(this._stage),
        spectacleIntensity: spectacleIntensityForStage(this._stage),
      };
    }

    if (this._phase === "victory") {
      return {
        phase: "victory",
        stage: this._stage,
        stageChanged: false,
        enteredShatter: false,
        enteredVictory: false,
        spawnIntervalScale: spawnIntervalScaleForStage(this._stage),
        oscillationIntensity: oscillationIntensityForStage(this._stage),
        spectacleIntensity: spectacleIntensityForStage(this._stage),
      };
    }

    const timeStage = intensityStageForElapsedSec(elapsedSessionSec);
    const prevStage = this._stage;
    this._stage = timeStage;
    const stageChanged = timeStage !== prevStage;

    if (healthAfterImpacts <= 0 && !this._shatterLatched) {
      this._shatterLatched = true;
      this._phase = "shatter";
      return {
        phase: "shatter",
        stage: this._stage,
        stageChanged,
        enteredShatter: true,
        enteredVictory: false,
        spawnIntervalScale: spawnIntervalScaleForStage(this._stage),
        oscillationIntensity: oscillationIntensityForStage(this._stage),
        spectacleIntensity: spectacleIntensityForStage(this._stage),
      };
    }

    const victoryAt = CONFIG.INTENSITY_STAGES.VICTORY_AT_ELAPSED_SEC;
    if (
      elapsedSessionSec >= victoryAt &&
      healthAfterImpacts > 0 &&
      !this._victoryLatched
    ) {
      this._victoryLatched = true;
      this._phase = "victory";
      return {
        phase: "victory",
        stage: this._stage,
        stageChanged,
        enteredShatter: false,
        enteredVictory: true,
        spawnIntervalScale: spawnIntervalScaleForStage(this._stage),
        oscillationIntensity: oscillationIntensityForStage(this._stage),
        spectacleIntensity: spectacleIntensityForStage(this._stage),
      };
    }

    return {
      phase: "playing",
      stage: this._stage,
      stageChanged,
      enteredShatter: false,
      enteredVictory: false,
      spawnIntervalScale: spawnIntervalScaleForStage(this._stage),
      oscillationIntensity: oscillationIntensityForStage(this._stage),
      spectacleIntensity: spectacleIntensityForStage(this._stage),
    };
  }
}
