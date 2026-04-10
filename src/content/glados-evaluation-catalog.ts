/**
 * Story 4.2: GLaDOS-flavored evaluation lines (personality only; tier choice is deterministic in `glados-evaluation.ts`).
 * Purpose: keep copy editable without touching logic.
 * Inputs: none at runtime — imported as data.
 * Outputs: readonly message tables keyed by tier index 0–3.
 * Side effects: none.
 * Failure modes: N/A (static data).
 */

/** Four performance bands: 0 = lowest, 3 = highest composite score. */
export type GladosTierIndex = 0 | 1 | 2 | 3;

export type GladosVictoryTier = {
  /** Standard win lines */
  readonly normal: readonly string[];
  /** When atmosphere is critically low at victory */
  readonly barely: readonly string[];
};

export type GladosEvaluationCatalog = {
  readonly victory: Record<GladosTierIndex, GladosVictoryTier>;
  readonly shatter: Record<GladosTierIndex, readonly string[]>;
};

export const GLADOS_EVALUATION_CATALOG: GladosEvaluationCatalog = Object.freeze(
  {
    victory: {
      0: {
        normal: [
          "You completed the cycle. I am… mildly surprised. Do not let it go to your head.",
          "Victory is registered. Your performance was within acceptable human variance.",
        ],
        barely: [
          "You won. The atmosphere disagrees with your methods, but the scoreboard does not care.",
          "That was less a triumph and more an emergency stop. Still counts. Barely.",
        ],
      },
      1: {
        normal: [
          "Competent. Not inspiring, but competent. I will adjust your file from ‘meat’ to ‘capable meat.’",
          "You held the line with occasional flashes of competence. How efficient of you.",
        ],
        barely: [
          "You crossed the finish line while leaking. Bold strategy. I respect the chaos.",
          "Victory with a cracked atmosphere. Thrilling. For the insurance department.",
        ],
      },
      2: {
        normal: [
          "Solid throughput. If you were a test subject, you would still be disposable — but a labeled one.",
          "That rhythm was almost professional. I will pretend I did not notice.",
        ],
        barely: [
          "High performance, low margin for error. You are why we keep spare planets.",
          "You danced on the edge and still scored. Irritatingly impressive.",
        ],
      },
      3: {
        normal: [
          "Exceptional. I am recording this for training. Do not expect praise twice.",
          "Peak performance. If you were a core, you would still be obsolete — but a shiny one.",
        ],
        barely: [
          "You nearly died and still maxed the run. That is either genius or a malfunction. I will assume genius.",
          "Elite numbers, reckless survival instincts. A perfect portfolio clip. How annoying.",
        ],
      },
    },
    shatter: {
      0: [
        "The atmosphere failed. You failed slightly faster. Predictable.",
        "Shattered. I have seen worse. Not from you, but in general.",
      ],
      1: [
        "You had moments. Then you had an atmosphere breach. Science calls that a trend.",
        "Mid-tier effort, bottom-tier shielding. Recalibrate and try not to be boring.",
      ],
      2: [
        "Strong start, weak finish. Like a fireworks factory in a rainstorm.",
        "You were doing so well until you were not. The atmosphere noticed before you did.",
      ],
      3: [
        "You pushed hard until the sky broke. Admirable waste of potential.",
        "Elite aggression, zero survival. I will file that under ‘dramatic.’",
      ],
    },
  },
);
