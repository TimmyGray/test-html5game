import { Particle, ParticleContainer, Texture, type Container } from "pixi.js";
import { CONFIG } from "../config/config.js";

/** Deterministic burst size in [BURST_MIN, BURST_MAX] for tests and controlled playback */
export function nextBurstParticleCount(random01: () => number): number {
  const { BURST_MIN, BURST_MAX } = CONFIG.PARTICLE_EJECTION;
  const span = BURST_MAX - BURST_MIN + 1;
  return BURST_MIN + Math.floor(random01() * span);
}

/**
 * Fills `out` with indices to (re)activate for a burst: dead slots first, then lowest remaining `life` (evict).
 * No allocations when `out` is reused. `out.length` becomes min(`want`, `life.length`).
 */
export function pickBurstSlotIndicesInto(
  life: ArrayLike<number>,
  want: number,
  out: number[],
): void {
  out.length = 0;
  const n = life.length;
  if (want <= 0 || n === 0) {
    return;
  }
  const target = Math.min(want, n);
  for (let i = 0; i < n && out.length < target; i++) {
    if (life[i]! <= 0) {
      out.push(i);
    }
  }
  while (out.length < target) {
    let best = -1;
    let bestL = Infinity;
    for (let i = 0; i < n; i++) {
      const L = life[i]!;
      if (L <= 0) {
        continue;
      }
      let taken = false;
      for (let k = 0; k < out.length; k++) {
        if (out[k] === i) {
          taken = true;
          break;
        }
      }
      if (taken) {
        continue;
      }
      if (L < bestL) {
        bestL = L;
        best = i;
      }
    }
    if (best < 0) {
      break;
    }
    out.push(best);
  }
}

function createShardTexture(): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 4, 4);
  }
  return Texture.from(canvas);
}

/**
 * Pooled geometric shards in a Pixi {@link ParticleContainer}. No per-hit allocation.
 */
export class ImpactParticleBurst {
  public readonly container: ParticleContainer;

  private readonly texture: Texture;
  private readonly particles: Particle[];
  /** Parallel kinematics (pool slots) */
  private readonly vx: Float32Array;
  private readonly vy: Float32Array;
  private readonly life: Float32Array;
  private readonly spin: Float32Array;
  private needsParticleUpdate = false;
  private readonly _slotPick: number[] = [];

  public constructor(texture?: Texture) {
    this.texture = texture ?? createShardTexture();
    const n = CONFIG.PARTICLE_EJECTION.POOL_SIZE;
    const parts: Particle[] = [];
    for (let i = 0; i < n; i++) {
      const p = new Particle({
        texture: this.texture,
        x: -10_000,
        y: -10_000,
        alpha: 0,
        anchorX: 0.5,
        anchorY: 0.5,
        scaleX: 0.35,
        scaleY: 0.55,
      });
      parts.push(p);
    }
    this.particles = parts;
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.life = new Float32Array(n);
    this.spin = new Float32Array(n);

    this.container = new ParticleContainer({
      texture: this.texture,
      particles: parts,
      dynamicProperties: {
        position: true,
        rotation: true,
        color: true,
      },
    });
    this.container.eventMode = "none";
  }

  public mount(parent: Container, index?: number): void {
    if (index === undefined) {
      parent.addChild(this.container);
    } else {
      parent.addChildAt(this.container, index);
    }
  }

  /**
   * Spawn a burst at world position. Prefers free slots; evicts lowest-life shards so count stays in [BURST_MIN,BURST_MAX] when pool allows.
   */
  public burstAt(worldX: number, worldY: number, random01: () => number): void {
    const want = nextBurstParticleCount(random01);
    const cap = CONFIG.PARTICLE_EJECTION.MAX_NEW_PER_BURST;
    const toSpawn = Math.min(want, cap);
    const cfg = CONFIG.PARTICLE_EJECTION;
    pickBurstSlotIndicesInto(this.life, toSpawn, this._slotPick);
    const slots = this._slotPick;
    const m = slots.length;
    if (m === 0) {
      return;
    }
    for (let s = 0; s < m; s++) {
      const i = slots[s]!;
      const ang = random01() * Math.PI * 2;
      const sp = cfg.SPEED_MIN + random01() * (cfg.SPEED_MAX - cfg.SPEED_MIN);
      this.vx[i] = Math.cos(ang) * sp;
      this.vy[i] = Math.sin(ang) * sp;
      this.life[i] = cfg.LIFE_SEC;
      this.spin[i] = (random01() - 0.5) * cfg.SPIN_MAX_RAD_PER_SEC;
      const p = this.particles[i]!;
      p.x = worldX;
      p.y = worldY;
      p.rotation = random01() * Math.PI * 2;
      p.alpha = 1;
      const tintRoll = random01();
      p.color =
        tintRoll < 0.33 ? 0xffcc88 : tintRoll < 0.66 ? 0xaaeeff : 0xffffff;
    }
    this.needsParticleUpdate = true;
  }

  /**
   * Gold-deflection burst: cooler metallic tints + slightly tighter speeds (same pool, no alloc).
   */
  public burstMetallicAt(
    worldX: number,
    worldY: number,
    random01: () => number,
  ): void {
    const want = nextBurstParticleCount(random01);
    const cap = CONFIG.PARTICLE_EJECTION.MAX_NEW_PER_BURST;
    const toSpawn = Math.min(want, cap);
    const cfg = CONFIG.PARTICLE_EJECTION;
    pickBurstSlotIndicesInto(this.life, toSpawn, this._slotPick);
    const slots = this._slotPick;
    const m = slots.length;
    if (m === 0) {
      return;
    }
    for (let s = 0; s < m; s++) {
      const i = slots[s]!;
      const ang = random01() * Math.PI * 2;
      const sp =
        cfg.SPEED_MIN * 1.08 +
        random01() * (cfg.SPEED_MAX * 1.05 - cfg.SPEED_MIN * 1.08);
      this.vx[i] = Math.cos(ang) * sp;
      this.vy[i] = Math.sin(ang) * sp;
      this.life[i] = cfg.LIFE_SEC * 1.05;
      this.spin[i] = (random01() - 0.5) * cfg.SPIN_MAX_RAD_PER_SEC * 1.15;
      const p = this.particles[i]!;
      p.x = worldX;
      p.y = worldY;
      p.rotation = random01() * Math.PI * 2;
      p.alpha = 1;
      const tintRoll = random01();
      p.color =
        tintRoll < 0.34 ? 0xffe066 : tintRoll < 0.67 ? 0xcfd8dc : 0xffb74d;
    }
    this.needsParticleUpdate = true;
  }

  public update(dt: number): void {
    if (dt <= 0) {
      return;
    }
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
      const fade = Math.min(1, li / 0.12);
      p.alpha = Math.max(0, Math.min(1, fade));
    }
    if (any || this.needsParticleUpdate) {
      this.container.update();
      this.needsParticleUpdate = false;
    }
  }

  public dispose(): void {
    this.container.destroy({ children: true });
  }
}
