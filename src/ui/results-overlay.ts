import { buildGladosEvaluationLine } from "../core/glados-evaluation.js";
import {
  gameEvents,
  EVENTS,
  type SessionEndedPayload,
} from "../core/events.js";
import { readStoredHighScore } from "../core/high-score-storage.js";

/**
 * Purpose: DOM results surface for Story 4.1 (glass panel + safe-area + replay CTA); Story 4.2 GLaDOS line; Story 4.3 score + best.
 * Run/Best numbers use `en-US` grouping to match `mountHighScoreLandingLabel` in `main.ts`.
 * Inputs: mount host (typically `#app`), replay callback; subscribes to `SESSION_ENDED` only.
 * Outputs: shows/hides overlay; outcome + stats come from payload — overlay does not recompute session state.
 * Side effects: mutates DOM; registers one event listener until `dispose`.
 * Failure modes: missing host throws; replay throws propagate to caller.
 * CSS: `.rp-results-root` uses `display:flex`; pair with `.rp-results-root[hidden]{display:none !important}`
 * or `[hidden]` will not visually hide (author `display` wins over the attribute alone).
 */
export class ResultsOverlayController {
  private readonly _host: HTMLElement;
  private readonly _onReplay: () => void;
  private readonly _root: HTMLDivElement;
  private readonly _backdrop: HTMLDivElement;
  private readonly _panel: HTMLDivElement;
  private readonly _title: HTMLHeadingElement;
  private readonly _stats: HTMLParagraphElement;
  private readonly _body: HTMLParagraphElement;
  private readonly _glados: HTMLParagraphElement;
  private readonly _cta: HTMLButtonElement;
  private readonly _onSessionEnded = (p: SessionEndedPayload): void => {
    this.show(p);
  };

  public constructor(host: HTMLElement, onReplay: () => void) {
    this._host = host;
    this._onReplay = onReplay;

    this._backdrop = document.createElement("div");
    this._backdrop.className = "rp-results-backdrop";
    this._backdrop.setAttribute("role", "presentation");
    this._backdrop.hidden = true;

    this._panel = document.createElement("div");
    this._panel.className = "rp-results-panel";
    this._panel.setAttribute("role", "dialog");
    this._panel.setAttribute("aria-modal", "true");

    this._title = document.createElement("h2");
    this._title.className = "rp-results-title";

    this._stats = document.createElement("p");
    this._stats.className = "rp-results-stats";

    this._body = document.createElement("p");
    this._body.className = "rp-results-body";

    this._glados = document.createElement("p");
    this._glados.className = "rp-results-glados";

    this._cta = document.createElement("button");
    this._cta.type = "button";
    this._cta.className = "rp-results-cta";
    this._cta.textContent = "One More Try";
    this._cta.addEventListener("click", () => {
      this.hide();
      this._onReplay();
    });

    this._panel.appendChild(this._title);
    this._panel.appendChild(this._stats);
    this._panel.appendChild(this._body);
    this._panel.appendChild(this._glados);
    this._panel.appendChild(this._cta);

    this._root = document.createElement("div");
    this._root.className = "rp-results-root";
    this._root.hidden = true;
    this._root.appendChild(this._backdrop);
    this._root.appendChild(this._panel);
    this._host.appendChild(this._root);

    gameEvents.on(EVENTS.SESSION_ENDED, this._onSessionEnded);
  }

  public dispose(): void {
    gameEvents.off(EVENTS.SESSION_ENDED, this._onSessionEnded);
    this._root.remove();
  }

  /** @internal tests */
  public get isVisibleForTesting(): boolean {
    return !this._root.hidden;
  }

  private show(payload: SessionEndedPayload): void {
    const best = readStoredHighScore();
    const fmt = (n: number): string => n.toLocaleString("en-US");
    this._stats.textContent = `Run ${fmt(payload.totalScore)} · Best ${fmt(best)}`;
    const v = payload.outcome === "victory";
    this._title.textContent = v ? "Victory Pulse" : "Shattered";
    this._body.textContent = v
      ? "You held the line through the full pressure cycle. The planet still beats."
      : "The atmosphere broke. Regroup and deflect with the rhythm.";
    this._glados.textContent = buildGladosEvaluationLine(payload);
    this._root.hidden = false;
    this._backdrop.hidden = false;
  }

  private hide(): void {
    this._root.hidden = true;
    this._backdrop.hidden = true;
  }
}
