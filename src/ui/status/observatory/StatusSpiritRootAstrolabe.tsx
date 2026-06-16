import { useId, type CSSProperties } from 'react';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { useObservatoryMotion } from './useObservatoryMotion.js';
import { useRitualMotion } from './fx/useRitualMotion.js';
import {
  arcPath,
  donutPath,
  parseLeadingInt,
  polar,
} from './observatoryAstrolabeGeometry.js';

type AstrolabeSurface = StatusObservatorySurfaceV1['rootLawInstrument']['astrolabe'];

export interface StatusSpiritRootAstrolabeProps {
  surface: AstrolabeSurface;
}

const C = 168;
const R_RIM = 160;
const R_TICK = 148;
const R_PUR = 140;
const R_GLYPH = 124;
const R_BAND1 = 84;
const R_BAND2 = 104;
const R_CORE = 54;
const PA0 = -58;
const PA1 = 58;
const KAI = 'var(--kai, "Kaiti SC", "STKaiti", serif)';

const GLYPH: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水', wind: '風', lightning: '雷',
  ice: '冰', light: '光', shadow: '影', soul: '魂', void: '虛', time: '時', astral: '星',
};

// Needle drawn pointing UP (0deg); the .__needle SCSS rotates it to the fit
// angle via --needle-target-deg so the rotation can ease on change.
const N_TIP = polar(C, C, R_BAND1 - 2, 0);
const N_L = polar(C, C, 28, -90);
const N_R = polar(C, C, 28, 90);
const N_TAIL = polar(C, C, 34, 180);
const p = (xy: [number, number]) => `${xy[0].toFixed(1)},${xy[1].toFixed(1)}`;

/** Jagged cinnabar bolt along the active angle — the diegetic "opposed" signal. */
function fracturePath(aAng: number): string {
  let d = '';
  const segs = 5;
  for (let i = 0; i <= segs; i++) {
    const r = R_CORE + ((R_BAND2 - R_CORE) * i) / segs;
    const jitter = i === 0 || i === segs ? 0 : i % 2 === 0 ? 7 : -7;
    const [x, y] = polar(C, C, r, aAng + jitter);
    d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d.trim();
}

export function StatusSpiritRootAstrolabe({ surface }: StatusSpiritRootAstrolabeProps) {
  const uid = useId().replace(/[:]/g, '');
  const ritual = useRitualMotion();

  const activeNotch = surface.notches.find((notch) => notch.active);
  const aAng = activeNotch?.angleDeg ?? 0;
  const tier = surface.fitTier;
  const opposed = tier === 'opposed';
  const needleCol =
    opposed ? 'var(--paper-stamp)'
      : tier === 'strained' ? 'var(--paper-amber)'
      : tier === 'unknown' ? 'var(--paper-ink-45)'
      : 'var(--paper-jade-bright)';
  const glow = opposed ? 'glowR' : 'glowJ';

  const purityPct = parseLeadingInt(surface.purityLabel);
  const pp = purityPct == null ? PA0 : PA0 + (PA1 - PA0) * (purityPct / 100);
  const pcol =
    purityPct == null ? 'var(--paper-ink-25)'
      : purityPct > 70 ? 'var(--paper-jade-bright)'
      : purityPct > 45 ? 'var(--paper-amber)'
      : 'var(--paper-stamp)';
  const [pex, pey] = polar(C, C, R_PUR, pp);

  const motion = useObservatoryMotion({
    purityPct,
    fitAngleDeg: aAng,
    qiPerSecond: null,
    cultivationRate: null,
  });

  // single-band tiers (strained / compatible / aligned / unknown)
  const half = tier === 'strained' ? 44 : tier === 'compatible' ? 50 : tier === 'unknown' ? 40 : 56;
  const bandCol = tier === 'strained' ? 'var(--paper-amber)' : tier === 'unknown' ? 'var(--paper-ink-25)' : 'var(--paper-jade)';
  const bandOp = tier === 'aligned' ? 0.32 : 0.3;
  const bandLabel = tier === 'strained' ? 'STRAINED' : tier === 'compatible' ? 'COMPATIBLE' : tier === 'unknown' ? 'UNKNOWN' : 'ALIGNED';
  const labelCol = tier === 'strained' ? 'var(--paper-amber)' : tier === 'unknown' ? 'var(--paper-ink-70)' : 'var(--paper-jade-bright)';

  const ticks = Array.from({ length: 84 }, (_, i) => {
    const a0 = i * (360 / 84);
    const [x0, y0] = polar(C, C, R_TICK, a0);
    const [x1, y1] = polar(C, C, i % 7 ? R_TICK + 5 : R_TICK + 8, a0);
    return (
      <line key={i} x1={x0.toFixed(1)} y1={y0.toFixed(1)} x2={x1.toFixed(1)} y2={y1.toFixed(1)}
        stroke="rgba(74,51,14,.7)" strokeWidth={i % 7 ? 0.7 : 1.4} />
    );
  });

  return (
    <section
      className="statusSpiritRootAstrolabe"
      data-active-root-id={surface.activeRootId}
      data-fit-tier={surface.fitTier}
      data-tone={surface.spiritRoot.tone}
      data-animate={ritual.animate ? 'true' : undefined}
      aria-label={surface.ariaLabel}
    >
      <div className="statusSpiritRootAstrolabe__title">
        <span>Spirit Root Astrolabe</span>
        <strong>{surface.spiritRoot.elementLabel} Root</strong>
      </div>

      <div
        className="statusSpiritRootAstrolabe__ring"
        role="img"
        aria-label={surface.ariaLabel}
        style={motion as CSSProperties}
      >
        <svg viewBox="0 0 336 336" aria-hidden="true" focusable={false}>
          <circle cx={C} cy={C} r={R_RIM} fill="url(#goldG)" />
          <circle cx={C} cy={C} r={R_RIM} fill="none" stroke="rgba(74,51,14,.8)" strokeWidth={1.4} />
          <circle cx={C} cy={C} r={R_RIM - 6} fill="none" stroke="rgba(255,244,210,.5)" strokeWidth={1} />

          <g className="statusSpiritRootAstrolabe__spin">{ticks}</g>

          <circle cx={C} cy={C} r={R_TICK} fill="var(--paper-parchment-warm)" stroke="var(--paper-ink-25)" />
          <circle cx={C} cy={C} r={R_BAND1 - 4} fill="none" stroke="var(--paper-ink-12)" strokeDasharray="2 4" />
          <circle cx={C} cy={C} r={R_GLYPH} fill="none" stroke="rgba(162,113,42,.28)" />

          <path d={arcPath(C, C, R_PUR, PA0, PA1)} fill="none" stroke="rgba(120,90,46,.25)" strokeWidth={7} strokeLinecap="round" />
          {purityPct == null ? null : (
            <path className="statusSpiritRootAstrolabe__purity" d={arcPath(C, C, R_PUR, PA0, pp)} fill="none" stroke={pcol} strokeWidth={7} strokeLinecap="round" />
          )}
          <path id={`${uid}-pur`} d={arcPath(C, C, R_PUR + 10, -26, 26)} fill="none" />
          <text fontSize={8.5} fontWeight={800} letterSpacing={2.5} fill="var(--paper-ink-70)">
            <textPath href={`#${uid}-pur`} startOffset="8%">PURITY</textPath>
          </text>
          <g transform={`translate(${p([pex, pey])})`}>
            <circle r={11} fill="url(#goldRad)" stroke="var(--paper-gold-deep)" strokeWidth={1.3} />
            <text y={3.5} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="var(--paper-ink)">{purityPct ?? ''}</text>
          </g>

          {opposed ? (
            <>
              <path d={donutPath(C, C, R_BAND1, R_BAND2, aAng - 30, aAng + 30)} fill="var(--paper-stamp)" opacity={0.34} />
              <path d={donutPath(C, C, R_BAND1, R_BAND2, aAng - 30, aAng + 30)} fill="none" stroke="var(--paper-stamp)" strokeOpacity={0.5} />
              <path d={donutPath(C, C, R_BAND1, R_BAND2, aAng + 150, aAng + 290)} fill="var(--paper-jade)" opacity={0.24} />
              <path d={donutPath(C, C, R_BAND1, R_BAND2, aAng + 150, aAng + 290)} fill="none" stroke="var(--paper-jade)" strokeOpacity={0.5} />
              <path id={`${uid}-op`} d={arcPath(C, C, R_BAND1 + 10, aAng - 22, aAng + 22)} fill="none" />
              <text fontSize={9.5} fontWeight={800} letterSpacing={3} fill="var(--paper-stamp)">
                <textPath href={`#${uid}-op`} startOffset="7%">OPPOSED</textPath>
              </text>
              <path id={`${uid}-al`} d={arcPath(C, C, R_BAND1 + 10, aAng + 184, aAng + 256)} fill="none" />
              <text fontSize={9.5} fontWeight={800} letterSpacing={3} fill="var(--paper-jade-bright)">
                <textPath href={`#${uid}-al`} startOffset="14%">ALIGNED</textPath>
              </text>
            </>
          ) : (
            <>
              <path d={donutPath(C, C, R_BAND1, R_BAND2, aAng - half, aAng + half)} fill={bandCol} opacity={bandOp} />
              <path d={donutPath(C, C, R_BAND1, R_BAND2, aAng - half, aAng + half)} fill="none" stroke={bandCol} strokeOpacity={0.5} />
              <path id={`${uid}-band`} d={arcPath(C, C, R_BAND1 + 10, aAng - 34, aAng + 34)} fill="none" />
              <text fontSize={9.5} fontWeight={800} letterSpacing={3} fill={labelCol}>
                <textPath href={`#${uid}-band`} startOffset="16%">{bandLabel}</textPath>
              </text>
            </>
          )}

          {surface.notches.map((notch) => {
            const [nx, ny] = polar(C, C, R_GLYPH, notch.angleDeg);
            return (
              <g
                key={notch.id}
                className="statusSpiritRootAstrolabe__notch"
                data-root-id={notch.id}
                data-active={notch.active ? 'true' : 'false'}
                data-tone={notch.tone}
                aria-label={notch.ariaLabel}
                role="img"
                transform={`translate(${p([nx, ny])})`}
              >
                <circle r={13} fill={notch.active ? `var(--root-${notch.id})` : 'var(--paper-parchment)'} stroke={`var(--root-${notch.id})`} strokeWidth={notch.active ? 2.6 : 1.3} opacity={notch.active ? 1 : 0.85} />
                <circle r={13} fill="none" stroke="rgba(255,250,235,.4)" strokeWidth={0.7} />
                <text y={5} style={{ fontFamily: KAI }} fontSize={15} fontWeight={700} textAnchor="middle" fill={notch.active ? 'var(--paper-parchment)' : `var(--root-${notch.id})`}>
                  {GLYPH[notch.id] ?? ''}
                </text>
              </g>
            );
          })}

          <g className="statusSpiritRootAstrolabe__needle">
            <path d={`M${p(N_TIP)} L${p(N_L)} L${C},${C} L${p(N_R)} Z`} fill={needleCol} filter={`url(#${glow})`} />
            <path d={`M${p(N_TAIL)} L${p(N_L)} L${C},${C} L${p(N_R)} Z`} fill={needleCol} opacity={0.45} />
            <circle cx={N_TIP[0].toFixed(1)} cy={N_TIP[1].toFixed(1)} r={6.5} fill={needleCol} opacity={0.4} />
          </g>

          {opposed ? (
            <path className="statusSpiritRootAstrolabe__fracture" d={fracturePath(aAng)} stroke="var(--paper-stamp)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glowR)" opacity={0.6} />
          ) : null}

          <circle cx={C} cy={C} r={R_CORE + 6} fill="none" stroke="rgba(217,189,128,.5)" strokeWidth={1.6} className="statusSpiritRootAstrolabe__breath" />
          <g className="statusSpiritRootAstrolabe__core">
            <circle cx={C} cy={C} r={R_CORE} fill="url(#inkDisc)" stroke="url(#goldG)" strokeWidth={3} />
            <circle cx={C} cy={C} r={R_CORE - 7} fill="none" stroke="rgba(217,189,128,.3)" />
            <text x={C} y={C + 13} textAnchor="middle" style={{ fontFamily: KAI }} fontSize={56} fill="rgba(217,189,128,.08)">{GLYPH[surface.activeRootId] ?? ''}</text>
            <text x={C} y={C - 3} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--paper-parchment-soft)">{surface.spiritRoot.elementLabel}</text>
            <text x={C} y={C + 15} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--paper-parchment-soft)">Root</text>
            <circle cx={C} cy={C} r={3.5} fill="url(#goldRad)" stroke="var(--paper-gold-deep)" strokeWidth={0.8} />
          </g>
        </svg>
      </div>

      {/* Artifact buildRoot: under the dial sit just two small rchip pills
          (Grade, Total Mult.). Purity / Expression Cap / Root Proc / Run Validity /
          Root-Law Fit live in the full-width foot row owned by the instrument. */}
      <div className="statusSpiritRootAstrolabe__chips">
        <span className="statusSpiritRootAstrolabe__rchip">
          <i>Grade</i>
          <b>{surface.gradeLabel}</b>
        </span>
        {surface.totalMultiplierLabel ? (
          <span className="statusSpiritRootAstrolabe__rchip" data-fit-tier={surface.fitTier}>
            <i>Total Mult.</i>
            <b className="statusSpiritRootAstrolabe__mult">{surface.totalMultiplierLabel}</b>
          </span>
        ) : null}
      </div>
    </section>
  );
}
