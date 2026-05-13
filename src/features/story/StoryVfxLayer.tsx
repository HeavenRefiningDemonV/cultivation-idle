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
};

const PARTICLE_BUDGET: Record<StoryFxQuality, number> = {
  high: 150,
  medium: 86,
  low: 32,
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

function budgetForPreset(preset: StoryFxPreset, quality: StoryFxQuality, transitionActive: boolean) {
  const base = PARTICLE_BUDGET[quality];
  if (base === 0) return 0;
  const multiplier = preset === 'nameAshfall' ? 1 : preset === 'pinewindMist' ? 0.34 : 0.62;
  return Math.round(base * multiplier * (transitionActive ? 1.18 : 1));
}

function resetParticle(particle: Particle, preset: StoryFxPreset, rng: () => number, width: number, height: number, initial = false) {
  const topBand = preset === 'nameAshfall' ? -height * 0.14 : height * 0.08;
  const lowerBand = preset === 'pinewindMist' ? height * 0.74 : height * 0.48;
  particle.x = rng() * width;
  particle.y = initial ? rng() * height : topBand + rng() * lowerBand;
  particle.age = rng() * -1.2;
  particle.life = preset === 'nameAshfall' ? 5.4 + rng() * 4.2 : 7.8 + rng() * 5.6;
  particle.size = preset === 'nameAshfall' ? 0.9 + rng() * 2.4 : 1 + rng() * 2;
  particle.alpha = preset === 'pinewindMist' ? 0.12 + rng() * 0.2 : 0.18 + rng() * 0.42;
  particle.warm = preset === 'pinewindMist' || preset === 'returningPageGlow' ? rng() : 0;
  particle.streak = preset === 'nameAshfall' && rng() > 0.76;

  if (preset === 'nameAshfall') {
    particle.vx = -8 - rng() * 22;
    particle.vy = 18 + rng() * 42;
  } else if (preset === 'gateCensusMotes') {
    particle.vx = -4 + rng() * 8;
    particle.vy = -10 - rng() * 16;
  } else {
    particle.vx = -5 + rng() * 10;
    particle.vy = -4 + rng() * 8;
  }
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle, preset: StoryFxPreset) {
  if (particle.age < 0) return;
  const progress = Math.min(1, particle.age / particle.life);
  const fade = Math.sin(progress * Math.PI);
  const alpha = particle.alpha * fade;
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
    ctx.lineWidth = Math.max(0.7, particle.size * 0.36);
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.ellipse(particle.x, particle.y, particle.size * 0.62, particle.size, Math.PI * 0.18, 0, Math.PI * 2);
  ctx.fill();
}

export function StoryVfxLayer({ preset, quality, transitionActive = false, reducedMotion }: StoryVfxLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const movingParticles = !reducedMotion && quality !== 'off' && quality !== 'reduced' && preset !== 'none';

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
      const budget = budgetForPreset(preset, quality, transitionActive);
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

      if (preset === 'pinewindMist' || preset === 'pathBannerMist') {
        const mistAlpha = preset === 'pinewindMist' ? 0.05 : 0.065;
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
        if (particle.age > particle.life || particle.y > rect.height + 32 || particle.x < -32 || particle.x > rect.width + 32) {
          resetParticle(particle, preset, rng, rect.width, rect.height);
        }
        drawParticle(ctx, particle, preset);
      }
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
  }, [movingParticles, preset, quality, transitionActive]);

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
