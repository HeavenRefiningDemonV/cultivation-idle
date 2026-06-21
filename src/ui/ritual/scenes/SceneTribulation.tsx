import type { ReactElement } from 'react';
import { figure } from '../figure.js';

/**
 * F2.UI — TRIBULATION rite scene (modal-stage.html `sceneTribulation(success)`, L1034).
 * The gathering sky + the descending bolt + the ink peak. The ONE true-danger scene:
 * the base stakes glow is JADE on success, CINNABAR on failure (danger genuinely warranted).
 * Ported 1:1 from the artifact — geometry unchanged, raw hex mapped to paperInk tokens.
 */
export function SceneTribulation({ success }: { success: boolean }): ReactElement {
  const boltOp = success ? 1 : 0.7;
  return (
    <svg className="ritualScene__svg" viewBox="0 0 1080 466" preserveAspectRatio="xMidYMid slice">
      {/* gathering cloud bands */}
      {Array.from({ length: 5 }, (_, i) => {
        const y = 40 + i * 22;
        const op = 0.5 - i * 0.05;
        return (
          <ellipse
            key={i}
            className="ritualScene__drift"
            cx={360 + i * 70}
            cy={y}
            rx={280 - i * 20}
            ry={40 - i * 3}
            fill="url(#rsStormCloud)"
            opacity={op}
            style={{ animationDelay: `${i * 1.2}s` }}
          />
        );
      })}
      <rect x={0} y={0} width={1080} height={150} fill="url(#rsStormCloud)" opacity={0.4} />
      {/* success: the sky cracks to a jade-gold dawn */}
      {success ? (
        <>
          <ellipse cx={540} cy={120} rx={180} ry={150} fill="url(#rsJadeDawn)" className="ritualScene__breathe" opacity={0.9} />
          <path
            d="M540,40 L500,200 M540,40 L580,200 M540,40 L460,180 M540,40 L620,180"
            stroke="var(--paper-parchment-soft)"
            strokeOpacity={0.5}
            strokeWidth={2}
            opacity={0.7}
          />
        </>
      ) : null}
      {/* the descending bolt (a jagged path) — flickers; recedes on not-yet */}
      <path
        className="ritualScene__bolt"
        d="M540,70 L518,150 L548,160 L520,250 L556,235 L532,320"
        stroke="var(--paper-gold-leaf-hi)"
        strokeWidth={success ? 4 : 3}
        fill="none"
        filter="url(#rsGlowG)"
        opacity={boltOp}
        strokeLinejoin="round"
      />
      <path
        className="ritualScene__bolt"
        d="M540,70 L518,150 L548,160 L520,250 L556,235 L532,320"
        stroke="var(--paper-gold-leaf)"
        strokeWidth={success ? 7 : 5}
        fill="none"
        opacity={0.3}
        strokeLinejoin="round"
      />
      {/* the mountain peak (ink-wash) */}
      <path d="M300,420 L520,150 L560,150 L780,420 Z" fill="var(--obs-void-deep)" stroke="var(--obs-void-deep)" strokeWidth={1.5} />
      <path d="M520,150 L560,150 L600,230 L500,260 Z" fill="var(--paper-parchment-soft)" fillOpacity={0.08} />
      {/* the figure atop the peak */}
      {figure(540, 318, 0.7, 'var(--obs-void-deep)')}
      {/* cinnabar stakes glow at the base (danger genuinely warranted here) */}
      <ellipse
        cx={540}
        cy={430}
        rx={success ? 120 : 170}
        ry={success ? 20 : 30}
        fill={success ? 'var(--paper-jade-bright)' : 'var(--paper-cinnabar-bright)'}
        fillOpacity={success ? 0.35 : 0.4}
        filter="url(#rsSoft7)"
        className="ritualScene__glow"
      />
      {/* rain streaks */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = 120 + i * 64;
        const h = 18 + (i % 4) * 8;
        return (
          <line
            key={i}
            className="ritualScene__mote"
            x1={x}
            y1={150 + (i % 3) * 30}
            x2={x - 6}
            y2={150 + (i % 3) * 30 + h}
            stroke="var(--paper-jade-muted)"
            strokeOpacity={0.35}
            strokeWidth={1.4}
            style={{ animationDelay: `${(i * 0.3).toFixed(1)}s` }}
          />
        );
      })}
    </svg>
  );
}
