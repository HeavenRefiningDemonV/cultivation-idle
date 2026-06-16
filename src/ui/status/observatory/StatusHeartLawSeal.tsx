import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { InkTassel } from '../../ink/InkTassel.js';
import { polar } from './observatoryAstrolabeGeometry.js';
import { useRitualMotion } from './fx/useRitualMotion.js';

type SealSurface = StatusObservatorySurfaceV1['rootLawInstrument']['heartLawSeal'];

export interface StatusHeartLawSealProps {
  surface: SealSurface;
  /** True => the Root/Law fit is opposed; tints the book cinnabar + adds a crack. */
  distress?: boolean;
}

const C = 135;
const CY = 112;

export function StatusHeartLawSeal({ surface, distress }: StatusHeartLawSealProps) {
  const ritual = useRitualMotion();
  const red = distress ?? (surface.clarityLabel === 'Low' || surface.daoHeartStateLabel === 'Needs Work');

  const beads = surface.chapterBeads;
  const n = Math.max(beads.length, 1);
  const aura = red
    ? 'color-mix(in srgb, var(--paper-cinnabar-bright) 16%, transparent)'
    : 'color-mix(in srgb, var(--paper-gold-pale) 18%, transparent)';
  const bookFill = red ? 'url(#cinnDisc)' : 'url(#goldRad)';
  const bookStroke = red ? 'var(--paper-parchment-soft)' : 'var(--paper-ink)';
  const flame = red ? 'var(--paper-parchment-soft)' : 'var(--root-fire)';
  const pageFill = red
    ? 'color-mix(in srgb, var(--paper-cinnabar-deep) 25%, transparent)'
    : 'color-mix(in srgb, var(--paper-gold-deep) 25%, transparent)';
  const innerDash = red
    ? 'color-mix(in srgb, var(--paper-cinnabar-deep) 50%, transparent)'
    : 'color-mix(in srgb, var(--paper-gold-deep) 50%, transparent)';
  const tasselCol = red ? 'var(--paper-stamp)' : 'var(--paper-amber)';

  return (
    <section className="statusHeartLawSeal" data-animate={ritual.animate ? 'true' : undefined} aria-label={surface.ariaLabel}>
      <div className="statusHeartLawSeal__title">
        <span>Heart Law Seal</span>
        <strong>{surface.heartLawLabel}</strong>
      </div>

      <div className="statusHeartLawSeal__medallion" role="img" aria-label={`${surface.heartLawLabel} chapter seal`}>
        <svg viewBox="0 0 270 300" aria-hidden="true" focusable={false}>
          <circle className="statusHeartLawSeal__breath" cx={C} cy={CY} r={80} fill={aura} filter="url(#soft)" />
          <circle cx={C} cy={CY} r={86} fill="none" stroke="url(#goldG)" strokeWidth={2.5} />

          {beads.map((bead, i) => {
            const [bx, by] = polar(C, CY, 86, i * (360 / n));
            return (
              <circle
                key={bead.id}
                className="statusHeartLawSeal__bead"
                data-active={bead.active ? 'true' : 'false'}
                data-filled={bead.filled ? 'true' : 'false'}
                aria-label={bead.label}
                role="img"
                cx={bx.toFixed(1)}
                cy={by.toFixed(1)}
                r={bead.filled ? 6 : 5}
                fill={bead.filled ? 'url(#goldRad)' : 'var(--paper-parchment-deep)'}
                stroke={bead.filled ? 'var(--paper-gold-deep)' : 'var(--paper-ink-45)'}
                strokeWidth={1.3}
              />
            );
          })}

          <circle cx={C} cy={CY} r={70} fill={bookFill} stroke="url(#goldG)" strokeWidth={3.5} />
          <circle cx={C} cy={CY} r={62} fill="none" stroke="rgba(255,244,210,.4)" strokeWidth={1.2} />
          <circle cx={C} cy={CY} r={56} fill="none" stroke={innerDash} strokeDasharray="1 5" />

          <g transform={`translate(${C},114)`}>
            <path d="M-24,-2 C-32,-8 -39,-6 -41,-2 L-41,19 C-39,15 -32,13 -24,17 L-24,-2 Z" fill="none" stroke={bookStroke} strokeWidth={2} />
            <path d="M24,-2 C32,-8 39,-6 41,-2 L41,19 C39,15 32,13 24,17 L24,-2 Z" fill="none" stroke={bookStroke} strokeWidth={2} />
            <path d="M-24,-2 C-15,-6 -6,-6 0,-2 C6,-6 15,-6 24,-2 L24,17 C15,13 6,13 0,17 C-6,13 -15,13 -24,17 Z" fill={pageFill} stroke={bookStroke} strokeWidth={2} />
            <line x1={0} y1={-3} x2={0} y2={17} stroke={bookStroke} strokeWidth={1.6} />
            <g className="statusHeartLawSeal__flame">
              <path d="M0,-6 C-5,-14 4,-18 0,-27 C8,-21 7,-12 4,-8 C9,-10 10,-15 9,-19 C13,-12 9,-4 0,-6 Z" fill={flame} opacity={0.9} filter={`url(#${red ? 'glowJ' : 'glowR'})`} />
            </g>
          </g>

          {red ? (
            <path d={`M${C + 58},104 q22,6 33,25 q-4,-2 -13,4 q9,8 5,19`} stroke="var(--paper-stamp)" strokeWidth={2} fill="none" filter="url(#glowR)" opacity={0.7} />
          ) : null}

          <InkTassel x={C - 44} y={190} color={tasselCol} length={20} />
          <InkTassel x={C + 44} y={190} color={tasselCol} length={20} />
        </svg>
      </div>

      <div className="statusHeartLawSeal__state">
        <span>{surface.chapterLabel}</span>
        {surface.daoHeartStateLabel ? <strong>{surface.daoHeartStateLabel}</strong> : null}
        {surface.clarityLabel ? <small>Clarity {surface.clarityLabel}</small> : null}
        {surface.turbulenceLabel ? <small>Turbulence {surface.turbulenceLabel}</small> : null}
      </div>
      {/* The Dao Heart route now lives in the instrument's full-width foot row
          (artifact buildRoot footer), so the seal column ends at its state line. */}
    </section>
  );
}
