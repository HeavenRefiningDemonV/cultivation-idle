/**
 * Particle system with object pooling for performance
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  active: boolean;
}

/**
 * Particle pool for reusing particles
 */
export class ParticlePool {
  private particles: Particle[] = [];
  private poolSize: number;

  constructor(poolSize: number = 100) {
    this.poolSize = poolSize;
    this.initializePool();
  }

  /**
   * Initialize particle pool
   */
  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        color: '#ffffff',
        alpha: 1,
        active: false,
      });
    }
  }

  /**
   * Get an inactive particle from pool
   */
  public getParticle(): Particle | null {
    for (const particle of this.particles) {
      if (!particle.active) {
        particle.active = true;
        return particle;
      }
    }
    return null;
  }

  /**
   * Emit particles at a position
   */
  public emit(
    x: number,
    y: number,
    count: number,
    options: {
      color?: string;
      size?: number;
      speed?: number;
      life?: number;
      spread?: number;
    } = {}
  ): void {
    const {
      color = '#ffffff',
      size = 3,
      speed = 2,
      life = 1,
      spread = Math.PI * 2,
    } = options;

    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) break;

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * spread;
      const velocity = speed * (0.5 + Math.random() * 0.5);

      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * velocity;
      particle.vy = Math.sin(angle) * velocity;
      particle.life = life;
      particle.maxLife = life;
      particle.size = size;
      particle.color = color;
      particle.alpha = 1;
    }
  }

  /**
   * Update all active particles
   */
  public update(deltaTime: number): void {
    for (const particle of this.particles) {
      if (!particle.active) continue;

      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;

      // Apply gravity
      particle.vy += 0.2 * deltaTime;

      // Update life
      particle.life -= deltaTime;

      // Update alpha based on life
      particle.alpha = particle.life / particle.maxLife;

      // Deactivate if life is over
      if (particle.life <= 0) {
        particle.active = false;
      }
    }
  }

  /**
   * Render all active particles
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      if (!particle.active) continue;

      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /**
   * Get active particle count
   */
  public getActiveCount(): number {
    return this.particles.filter((p) => p.active).length;
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    for (const particle of this.particles) {
      particle.active = false;
    }
  }
}

/**
 * Damage number floating text
 */
export interface DamageNumber {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  active: boolean;
}

/**
 * Damage number pool
 */
export class DamageNumberPool {
  private numbers: DamageNumber[] = [];
  private poolSize: number;

  constructor(poolSize: number = 20) {
    this.poolSize = poolSize;
    this.initializePool();
  }

  /**
   * Initialize damage number pool
   */
  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.numbers.push({
        x: 0,
        y: 0,
        text: '',
        life: 0,
        maxLife: 1,
        color: '#ffffff',
        active: false,
      });
    }
  }

  /**
   * Spawn a damage number
   */
  public spawn(x: number, y: number, damage: number, isCrit: boolean = false): void {
    for (const num of this.numbers) {
      if (!num.active) {
        num.x = x + (Math.random() - 0.5) * 20;
        num.y = y;
        num.text = Math.floor(damage).toString();
        num.life = 1.5;
        num.maxLife = 1.5;
        num.color = isCrit ? '#ff6b00' : '#ffffff';
        num.active = true;
        break;
      }
    }
  }

  /**
   * Update all active damage numbers
   */
  public update(deltaTime: number): void {
    for (const num of this.numbers) {
      if (!num.active) continue;

      // Float upward
      num.y -= 50 * deltaTime;

      // Update life
      num.life -= deltaTime;

      // Deactivate if life is over
      if (num.life <= 0) {
        num.active = false;
      }
    }
  }

  /**
   * Render all active damage numbers
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (const num of this.numbers) {
      if (!num.active) continue;

      const alpha = num.life / num.maxLife;
      const scale = 1 + (1 - alpha) * 0.5; // Grow slightly as it fades

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = num.color;
      ctx.font = `bold ${16 * scale}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(num.text, num.x, num.y);

      // Fill
      ctx.fillText(num.text, num.x, num.y);
      ctx.restore();
    }
  }

  /**
   * Clear all damage numbers
   */
  public clear(): void {
    for (const num of this.numbers) {
      num.active = false;
    }
  }
}
