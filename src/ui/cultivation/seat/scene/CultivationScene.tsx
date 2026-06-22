import type { CultivationSeatSurfaceV1 } from '../../../../systems/ui/cultivation/cultivationSeatTypes.js';
import { buildSceneFieldSvg, skyWash, CULTIVATION_SEAT_SCENE_DEFS } from './cultivationSeatSceneSvg.js';

/**
 * M.II.3 Wave 2 — the full-bleed painting host. Renders the realm-aware sky wash, the injected
 * generative field SVG (the 7 layers), the vertical watermark inscription, the held-scrim, the
 * vignette, and the floating motes. Pure: reads only the surface (no store, no gameplay math).
 * The SVG is generated from trusted code (no user input) — the dangerouslySetInnerHTML pattern
 * mirrors src/ui/court/room/Room.tsx.
 */
export function CultivationScene({ surface }: { surface: CultivationSeatSurfaceV1 }) {
  const { meta, identity, scene, realmProgress } = surface;
  const reducedMotion = meta.reducedMotion;
  const field = buildSceneFieldSvg({
    path: meta.path,
    realmIndex1to7: identity.realmIndex,
    foreground: scene.foreground,
    reducedMotion,
    atPeak: identity.atPeak,
    realmPct: realmProgress.pct,
  });
  const sky = skyWash(meta.path, identity.realmIndex);
  const moteCount = reducedMotion ? 0 : scene.foreground === 'cultivating' ? 9 : scene.foreground === 'combat-held' ? 2 : 6;

  return (
    <div className="cultivationSeatScene" data-region="scene" data-path={meta.path} data-realm={identity.realmIndex} aria-hidden="true">
      <div className="cultivationSeatScene__defs" dangerouslySetInnerHTML={{ __html: CULTIVATION_SEAT_SCENE_DEFS }} />
      <div className="cultivationSeatScene__sky" style={{ background: sky }} />
      <div className="cultivationSeatScene__fieldHost" dangerouslySetInnerHTML={{ __html: field }} />
      <div className="cultivationSeatScene__watermark">
        {scene.watermarkZh.split('').map((ch, i) => (
          <span key={i}>{ch}</span>
        ))}
      </div>
      <div className="cultivationSeatScene__scrim" data-held={scene.foreground === 'combat-held' ? 'true' : 'false'} />
      <div className="cultivationSeatScene__vignette" />
      {!reducedMotion &&
        Array.from({ length: moteCount }).map((_, i) => (
          <span
            key={i}
            className="cultivationSeatMote"
            style={{ left: `${12 + ((i * 137) % 76)}%`, bottom: `${22 + ((i * 53) % 40)}%`, animationDelay: `${(i * 0.9).toFixed(1)}s` }}
          />
        ))}
    </div>
  );
}
