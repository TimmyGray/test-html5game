import { Container, Particle, ParticleContainer, Text, Texture } from "pixi.js";
import { CONFIG } from "../config/config.js";
import type { ComboChangedPayload } from "../core/combo-engine.js";
import { gameEvents, EVENTS } from "../core/events.js";
import { pickBurstSlotIndicesInto } from "../vfx/impact-particle-burst.js";

function createSparkTexture(): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 5;
  canvas.height = 5;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(2.5, 2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  return Texture.from(canvas);
}

const FIREWORK_TINTS = [
  0xffdd66, 0xffaa44, 0xffeeaa, 0xffcc22, 0xaaddff, 0xffffff,
] as const;

const CF = CONFIG.COMBO_FIREWORKS;

/**
 * Pooled sparks + floating multiplier label on {@link EVENTS.COMBO_CHANGED} when the tier
 * rises (multiplier &gt; 1); bus emits on tier change only, not every deflection at max combo.
 * No per-frame allocations; burst uses fixed pool like {@link ImpactParticleBurst}.
 */
export class ComboFireworksOverlay {
  public readonly root: Container;

  private readonly texture: Texture;
  private readonly particles: Particle[];
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  private readonly life: Float32Array;
  private readonly spin: Float32Array;
  private readonly particleContainer: ParticleContainer;
  private readonly label: Text;
  private readonly slotPick: number[] = [];
  private needsParticleUpdate = false;
  private labelLifeSec = 0;
  private labelVelY = 0;
  private delayedBurstSec = 0;
  private delayedX = 0;
  private delayedY = 0;
  private pendingSecondBurst = false;

  private readonly getViewSize: () => { width: number; height: number };
  private readonly random01: () => number;

  private readonly onCombo = (payload: ComboChangedPayload): void => {
    if (payload.multiplier <= 1) {
      return;
    }
    const { width, height } = this.getViewSize();
    const cx = width * 0.5;
    const cy = height * CF.ANCHOR_Y_FRAC;
    this.armDelayedSecondBurst(cx, cy);
    this.spawnBurst(cx, cy, 1);
    this.popLabel(payload.multiplier, cx, cy);
  };

  public constructor(
    getViewSize: () => { width: number; height: number },
    random01?: () => number,
  ) {
    this.getViewSize = getViewSize;
    this.random01 = random01 ?? Math.random;
    this.texture = createSparkTexture();
    const n = CF.POOL_SIZE;
    const parts: Particle[] = [];
    for (let i = 0; i < n; i++) {
      parts.push(
        new Particle({
          texture: this.texture,
          x: -10_000,
          y: -10_000,
          alpha: 0,
          anchorX: 0.5,
          anchorY: 0.5,
          scaleX: 0.55,
          scaleY: 0.55,
        }),
      );
    }
    this.particles = parts;
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.life = new Float32Array(n);
    this.spin = new Float32Array(n);
    this.particleContainer = new ParticleContainer({
      texture: this.texture,
      particles: parts,
      dynamicProperties: {
        position: true,
        rotation: true,
        color: true,
      },
    });
    this.particleContainer.eventMode = "none";

    this.label = new Text({
      text: "",
      style: {
        fontFamily: "Segoe UI Black, Arial Black, sans-serif",
        fontSize: CF.LABEL_FONT_PX,
        fontWeight: "700",
        fill: 0xffee88,
        stroke: { color: 0x1a0a00, width: 5 },
        dropShadow: {
          alpha: 0.55,
          angle: Math.PI / 4,
          blur: 3,
          color: 0x000000,
          distance: 2,
        },
      },
    });
    this.label.anchor.set(0.5);
    this.label.alpha = 0;
    this.label.eventMode = "none";

    this.root = new Container();
    this.root.eventMode = "none";
    this.root.addChild(this.particleContainer);
    this.root.addChild(this.label);
  }

  public mount(parent: Container, index?: number): void {
    if (index === undefined) {
      parent.addChild(this.root);
    } else {
      parent.addChildAt(this.root, index);
    }
    gameEvents.on(EVENTS.COMBO_CHANGED, this.onCombo);
  }

  public update(dt: number): void {
    if (dt <= 0) {
      return;
    }
    if (this.pendingSecondBurst) {
      this.delayedBurstSec -= dt;
      if (this.delayedBurstSec <= 0) {
        this.pendingSecondBurst = false;
        this.spawnBurst(
          this.delayedX,
          this.delayedY,
          CF.SECOND_BURST_SPEED_SCALE,
        );
      }
    }
    this.updateParticles(dt);
    this.updateLabel(dt);
  }

  public dispose(): void {
    gameEvents.off(EVENTS.COMBO_CHANGED, this.onCombo);
    this.root.destroy({ children: true });
  }

  private armDelayedSecondBurst(cx: number, cy: number): void {
    this.delayedX = cx;
    this.delayedY = cy;
    this.delayedBurstSec = CF.SECOND_BURST_DELAY_SEC;
    this.pendingSecondBurst = true;
  }

  private popLabel(multiplier: number, cx: number, cy: number): void {
    this.label.text = `x${multiplier}`;
    this.label.position.set(cx, cy - CF.LABEL_OFFSET_Y_PX);
    this.label.alpha = 1;
    this.label.scale.set(0.35);
    this.labelLifeSec = CF.LABEL_DURATION_SEC;
    this.labelVelY = CF.LABEL_DRIFT_PX_PER_SEC;
  }

  private spawnBurst(worldX: number, worldY: number, speedScale: number): void {
    const span = CF.SPARK_MAX - CF.SPARK_MIN + 1;
    const want = CF.SPARK_MIN + Math.floor(this.random01() * span);
    pickBurstSlotIndicesInto(this.life, want, this.slotPick);
    const slots = this.slotPick;
    const m = slots.length;
    if (m === 0) {
      return;
    }
    const spMin = CF.SPEED_MIN * speedScale;
    const spMax = CF.SPEED_MAX * speedScale;
    for (let s = 0; s < m; s++) {
      const i = slots[s]!;
      const ang = this.random01() * Math.PI * 2;
      const sp = spMin + this.random01() * (spMax - spMin);
      this.vx[i] = Math.cos(ang) * sp;
      this.vy[i] = Math.sin(ang) * sp - CF.UPWARD_BIAS_PX_PER_SEC * 0.35;
      this.life[i] = CF.SPARK_LIFE_SEC;
      this.spin[i] = (this.random01() - 0.5) * CF.SPIN_MAX_RAD_PER_SEC;
      const p = this.particles[i]!;
      const jitter = (this.random01() - 0.5) * CF.BURST_JITTER_PX;
      const jy = (this.random01() - 0.5) * CF.BURST_JITTER_PX;
      p.x = worldX + jitter;
      p.y = worldY + jy;
      p.rotation = this.random01() * Math.PI * 2;
      p.alpha = 1;
      p.scaleX = p.scaleY =
        (CF.SPARK_SCALE_MIN +
          this.random01() * (CF.SPARK_SCALE_MAX - CF.SPARK_SCALE_MIN)) *
        (speedScale < 1 ? 0.85 : 1);
      p.color =
        FIREWORK_TINTS[Math.floor(this.random01() * FIREWORK_TINTS.length)]!;
    }
    this.needsParticleUpdate = true;
  }

  private updateParticles(dt: number): void {
    const n = this.particles.length;
    let any = false;
    for (let i = 0; i < n; i++) {
      let li = this.life[i]!;
      if (li <= 0) {
        continue;
      }
      any = true;
      li -= dt;
      this.life[i] = li;
      const p = this.particles[i]!;
      if (li <= 0) {
        p.alpha = 0;
        p.x = -10_000;
        p.y = -10_000;
        continue;
      }
      p.x += this.vx[i]! * dt;
      p.y += this.vy[i]! * dt;
      p.rotation += this.spin[i]! * dt;
      const fadeIn = Math.min(1, (CF.SPARK_LIFE_SEC - li) / 0.06);
      const fadeOut = Math.min(1, li / 0.14);
      p.alpha = Math.max(0, Math.min(1, fadeIn, fadeOut));
    }
    if (any || this.needsParticleUpdate) {
      this.particleContainer.update();
      this.needsParticleUpdate = false;
    }
  }

  private updateLabel(dt: number): void {
    if (this.labelLifeSec <= 0) {
      return;
    }
    this.labelLifeSec -= dt;
    this.label.y += this.labelVelY * dt;
    const t = Math.max(0, this.labelLifeSec / CF.LABEL_DURATION_SEC);
    const pop = 1 - t;
    const scale =
      0.35 + 0.75 * Math.sin(Math.min(1, (1 - t) * 3.2) * (Math.PI / 2));
    this.label.scale.set(scale);
    this.label.alpha = Math.min(1, pop * 3) * Math.min(1, t * 4);
    if (this.labelLifeSec <= 0) {
      this.label.alpha = 0;
    }
  }
}
