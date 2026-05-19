import { useEffect, useRef } from 'react';
import type { StoryFxPreset, StoryFxQuality } from './storyTypes.js';

type StoryVfxLayerProps = {
  preset: StoryFxPreset;
  quality: StoryFxQuality;
  transitionActive?: boolean;
  reducedMotion: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  age: number;
  life: number;
  warm: number;
  streak: boolean;
  rotation: number;
  spin: number;
  shape: 'mote' | 'ash' | 'fiber';
};

const PARTICLE_BUDGET: Record<StoryFxQuality, number> = {
  high: 240,
  medium: 170,
  low: 72,
  reduced: 0,
  off: 0,
};

function seedFromPreset(preset: StoryFxPreset) {
  let seed = 2166136261;
  for (let index = 0; index < preset.length; index += 1) {
    seed ^= preset.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

function createRng(seed: number) {
  let value = seed || 1;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function budgetForPreset(preset: StoryFxPreset, quality: StoryFxQuality) {
  const base = PARTICLE_BUDGET[quality];
  if (base === 0) return 0;
  const multiplier = preset === 'nameAshfall'
    ? 1
    : preset === 'returningPageGlow'
      ? 0.54
      : preset === 'pathBannerMist'
        ? 0.68
        : preset === 'pinewindMist'
          ? 0.4
          : 0.62;
  return Math.round(base * multiplier);
}

function resetParticle(particle: Particle, preset: StoryFxPreset, rng: () => number, width: number, height: number, initial = false) {
  particle.life = preset === 'nameAshfall' ? 5.8 + rng() * 4.8 : 8.4 + rng() * 5.8;
  particle.age = initial ? rng() * particle.life : -rng() * 0.42;
  particle.rotation = rng() * Math.PI * 2;
  particle.spin = (-0.45 + rng() * 0.9) * (preset === 'nameAshfall' ? 1.3 : 0.44);
  particle.shape = 'mote';
  particle.streak = false;
  particle.warm = preset === 'pinewindMist' || preset === 'returningPageGlow' || preset === 'pathBannerMist' ? rng() : 0;

  if (preset === 'nameAshfall') {
    const gateBand = rng();
    particle.x = gateBand > 0.28 ? width * (0.42 + rng() * 0.36) : rng() * width;
    particle.y = initial ? rng() * height * 0.9 : -height * (0.04 + rng() * 0.16);
    particle.vx = -20 - rng() * 42;
    particle.vy = 42 + rng() * 82;
    particle.size = rng() > 0.72 ? 3.2 + rng() * 5.4 : 1.8 + rng() * 3.4;
    particle.alpha = 0.62 + rng() * 0.36;
    particle.shape = rng() > 0.62 ? 'ash' : 'fiber';
    particle.streak = rng() > 0.68;
  } else if (preset === 'gateCensusMotes') {
    particle.x = width * (0.28 + rng() * 0.54);
    particle.y = initial ? height * (0.12 + rng() * 0.54) : height * (0.28 + rng() * 0.2);
    particle.vx = -5 + rng() * 10;
    particle.vy = -14 - rng() * 24;
    particle.size = 1.8 + rng() * 3.8;
    particle.alpha = 0.38 + rng() * 0.48;
  } else if (preset === 'returningPageGlow') {
    particle.x = width * (0.39 + rng() * 0.22);
    particle.y = initial ? height * (0.46 + rng() * 0.34) : height * (0.6 + rng() * 0.14);
    particle.vx = -12 + rng() * 24;
    particle.vy = -22 - rng() * 28;
    particle.size = 1.9 + rng() * 4;
    particle.alpha = 0.34 + rng() * 0.46;
  } else if (preset === 'pathBannerMist') {
    const column = Math.floor(rng() * 3);
    const centers = [0.25, 0.5, 0.74];
    particle.x = width * (centers[column] + (-0.055 + rng() * 0.11));
    particle.y = initial ? height * (0.2 + rng() * 0.58) : height * (0.66 + rng() * 0.16);
    particle.vx = -8 + rng() * 16;
    particle.vy = -18 - rng() * 28;
    particle.size = 1.9 + rng() * 4.4;
    particle.alpha = 0.32 + rng() * 0.44;
    particle.warm = column === 0 ? 0.18 : column === 1 ? 0.5 : 0.86;
  } else {
    particle.x = rng() * width;
    particle.y = initial ? height * (0.52 + rng() * 0.42) : height * (0.68 + rng() * 0.18);
    particle.vx = -7 + rng() * 14;
    particle.vy = -6 + rng() * 10;
    particle.size = 1.6 + rng() * 3.6;
    particle.alpha = preset === 'pinewindMist' ? 0.24 + rng() * 0.28 : 0.32 + rng() * 0.42;
  }
}

function drawAshShard(ctx: CanvasRenderingContext2D, particle: Particle, color: string) {
  const width = particle.size * 0.7;
  const height = particle.size * 1.85;
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(particle.rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -height);
  ctx.lineTo(width, -height * 0.08);
  ctx.lineTo(0, height);
  ctx.lineTo(-width * 0.72, height * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle, preset: StoryFxPreset, transitionActive: boolean) {
  if (particle.age < 0) return;
  const progress = Math.min(1, particle.age / particle.life);
  const fade = Math.sin(progress * Math.PI);
  const alpha = Math.min(0.96, particle.alpha * fade * (transitionActive ? 1.28 : 1));
  if (alpha <= 0.01) return;

  const warm = particle.warm;
  const color = preset === 'pathBannerMist'
    ? `rgba(${warm > 0.68 ? '214, 88, 72' : warm > 0.34 ? '228, 183, 106' : '214, 235, 243'}, ${alpha})`
    : warm > 0.72
      ? `rgba(235, 197, 122, ${alpha})`
      : `rgba(248, 246, 232, ${alpha})`;

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  if (particle.streak) {
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(particle.x - particle.vx * 0.06, particle.y - particle.vy * 0.08);
    ctx.lineWidth = Math.max(1.1, particle.size * 0.42);
    ctx.stroke();
    return;
  }

  if (particle.shape === 'ash') {
    drawAshShard(ctx, particle, color);
    return;
  }

  ctx.beginPath();
  ctx.ellipse(particle.x, particle.y, particle.size * 0.72, particle.size, particle.rotation, 0, Math.PI * 2);
  ctx.fill();
}

export function StoryVfxLayer({ preset, quality, transitionActive = false, reducedMotion }: StoryVfxLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const transitionActiveRef = useRef(transitionActive);
  const movingParticles = !reducedMotion && quality !== 'off' && quality !== 'reduced' && preset !== 'none';

  useEffect(() => {
    transitionActiveRef.current = transitionActive;
  }, [transitionActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !movingParticles) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const particles = particlesRef.current;

    const rng = createRng(seedFromPreset(preset));
    let frame = 0;
    let last = performance.now();
    let stopped = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const budget = budgetForPreset(preset, quality);
      particles.length = budget;
      for (let index = 0; index < budget; index += 1) {
        particles[index] ??= {} as Particle;
        resetParticle(particles[index], preset, rng, rect.width, rect.height, true);
      }
    };

    const tick = (now: number) => {
      if (stopped) return;
      frame = window.requestAnimationFrame(tick);
      if (document.hidden) {
        last = now;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const delta = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.globalCompositeOperation = 'lighter';

      if (preset === 'pinewindMist' || preset === 'pathBannerMist') {
        const mistAlpha = preset === 'pinewindMist' ? 0.09 : 0.1;
        const mist = ctx.createLinearGradient(0, rect.height * 0.72, rect.width, rect.height * 0.96);
        mist.addColorStop(0, `rgba(230, 226, 210, 0)`);
        mist.addColorStop(0.45, `rgba(230, 226, 210, ${mistAlpha})`);
        mist.addColorStop(1, `rgba(230, 226, 210, 0)`);
        ctx.fillStyle = mist;
        ctx.fillRect(0, rect.height * 0.64, rect.width, rect.height * 0.28);
      }

      for (const particle of particles) {
        particle.age += delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.rotation += particle.spin * delta;
        if (particle.age > particle.life || particle.y > rect.height + 32 || particle.x < -32 || particle.x > rect.width + 32) {
          resetParticle(particle, preset, rng, rect.width, rect.height);
        }
        drawParticle(ctx, particle, preset, transitionActiveRef.current);
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    resize();
    window.addEventListener('resize', resize);
    frame = window.requestAnimationFrame(tick);

    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [movingParticles, preset, quality]);

  return (
    <div
      className={`storyVfxLayer storyVfxLayer--${preset} storyVfxLayer--${quality}${transitionActive ? ' storyVfxLayer--transition' : ''}`}
      aria-hidden="true"
    >
      {movingParticles ? <canvas ref={canvasRef} className="storyVfxLayer__canvas" /> : null}
      <div className="storyVfxLayer__glow storyVfxLayer__glow--page" />
      <div className="storyVfxLayer__glow storyVfxLayer__glow--heaven" />
      <div className="storyVfxLayer__glow storyVfxLayer__glow--earth" />
      <div className="storyVfxLayer__glow storyVfxLayer__glow--martial" />
    </div>
  );
}
