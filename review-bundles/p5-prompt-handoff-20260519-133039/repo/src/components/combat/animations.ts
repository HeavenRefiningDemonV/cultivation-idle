/**
 * Animation helpers and easing functions
 */

/**
 * Easing functions for smooth animations
 */
export const Easing = {
  linear: (t: number) => t,

  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,

  easeOutElastic: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },

  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};

/**
 * Animation state
 */
export interface Animation {
  startValue: number;
  endValue: number;
  duration: number;
  elapsed: number;
  easing: (t: number) => number;
  active: boolean;
  onComplete?: () => void;
}

/**
 * Create a new animation
 */
export function createAnimation(
  startValue: number,
  endValue: number,
  duration: number,
  easing: (t: number) => number = Easing.easeOutQuad,
  onComplete?: () => void
): Animation {
  return {
    startValue,
    endValue,
    duration,
    elapsed: 0,
    easing,
    active: true,
    onComplete,
  };
}

/**
 * Update animation and return current value
 */
export function updateAnimation(anim: Animation, deltaTime: number): number {
  if (!anim.active) {
    return anim.endValue;
  }

  anim.elapsed += deltaTime;

  if (anim.elapsed >= anim.duration) {
    anim.elapsed = anim.duration;
    anim.active = false;
    if (anim.onComplete) {
      anim.onComplete();
    }
  }

  const t = anim.elapsed / anim.duration;
  const easedT = anim.easing(t);
  return anim.startValue + (anim.endValue - anim.startValue) * easedT;
}

/**
 * Sprite animation frame data
 */
export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Sprite animator for simple animations
 */
export class SpriteAnimator {
  private frames: SpriteFrame[] = [];
  private currentFrame: number = 0;
  private frameTime: number = 0;
  private frameDuration: number;
  private loop: boolean;
  private playing: boolean = false;

  constructor(frames: SpriteFrame[], frameDuration: number = 0.1, loop: boolean = true) {
    this.frames = frames;
    this.frameDuration = frameDuration;
    this.loop = loop;
  }

  /**
   * Start playing the animation
   */
  public play(): void {
    this.playing = true;
    this.currentFrame = 0;
    this.frameTime = 0;
  }

  /**
   * Stop the animation
   */
  public stop(): void {
    this.playing = false;
    this.currentFrame = 0;
    this.frameTime = 0;
  }

  /**
   * Update the animation
   */
  public update(deltaTime: number): void {
    if (!this.playing || this.frames.length === 0) return;

    this.frameTime += deltaTime;

    if (this.frameTime >= this.frameDuration) {
      this.frameTime = 0;
      this.currentFrame++;

      if (this.currentFrame >= this.frames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frames.length - 1;
          this.playing = false;
        }
      }
    }
  }

  /**
   * Get current frame
   */
  public getCurrentFrame(): SpriteFrame {
    return this.frames[this.currentFrame] || this.frames[0];
  }

  /**
   * Check if animation is playing
   */
  public isPlaying(): boolean {
    return this.playing;
  }
}

/**
 * Shake effect
 */
export class ScreenShake {
  private intensity: number = 0;
  private duration: number = 0;
  private elapsed: number = 0;

  /**
   * Trigger a screen shake
   */
  public shake(intensity: number = 10, duration: number = 0.3): void {
    this.intensity = intensity;
    this.duration = duration;
    this.elapsed = 0;
  }

  /**
   * Update shake effect
   */
  public update(deltaTime: number): void {
    if (this.elapsed >= this.duration) {
      this.intensity = 0;
      return;
    }

    this.elapsed += deltaTime;
  }

  /**
   * Get current shake offset
   */
  public getOffset(): { x: number; y: number } {
    if (this.intensity === 0) {
      return { x: 0, y: 0 };
    }

    const t = 1 - this.elapsed / this.duration;
    const currentIntensity = this.intensity * t;

    return {
      x: (Math.random() - 0.5) * currentIntensity,
      y: (Math.random() - 0.5) * currentIntensity,
    };
  }

  /**
   * Check if shaking
   */
  public isActive(): boolean {
    return this.intensity > 0 && this.elapsed < this.duration;
  }
}

/**
 * Flash effect
 */
export class FlashEffect {
  private alpha: number = 0;
  private duration: number = 0;
  private elapsed: number = 0;
  private color: string = '#ffffff';

  /**
   * Trigger a flash
   */
  public flash(color: string = '#ffffff', duration: number = 0.2): void {
    this.color = color;
    this.duration = duration;
    this.elapsed = 0;
    this.alpha = 1;
  }

  /**
   * Update flash effect
   */
  public update(deltaTime: number): void {
    if (this.alpha === 0) return;

    this.elapsed += deltaTime;
    this.alpha = Math.max(0, 1 - this.elapsed / this.duration);
  }

  /**
   * Render flash
   */
  public render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.alpha === 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  /**
   * Check if active
   */
  public isActive(): boolean {
    return this.alpha > 0;
  }
}

/**
 * Lerp between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
