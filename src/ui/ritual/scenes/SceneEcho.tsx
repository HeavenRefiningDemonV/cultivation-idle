import type { ReactElement } from 'react';

/**
 * F2.UI — ECHO / KARMA-DECREE rite scene (modal-stage.html `sceneEcho()`, L1130).
 * A hanging cinnabar decree cloth + wax seal + slow karmic ring. Token-only fills; render-only.
 */
export function SceneEcho(): ReactElement {
  const C = 540;
  return (
    <svg
      className="ritualScene__svg"
      viewBox="0 0 1080 466"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* karmic ring behind, slow rotation */}
      <g
        className="ritualScene__spinR"
        style={{ transformBox: 'view-box', transformOrigin: '540px 220px' }}
      >
        <circle
          cx={C}
          cy={220}
          r={170}
          fill="none"
          stroke="var(--paper-gold-leaf)"
          strokeOpacity={0.3}
          strokeDasharray="3 9"
        />
        <circle
          cx={C}
          cy={220}
          r={150}
          fill="none"
          stroke="var(--paper-cinnabar-bright)"
          strokeOpacity={0.25}
          strokeDasharray="1 7"
        />
      </g>
      <ellipse cx={C} cy={210} rx={150} ry={160} fill="url(#rsQiAura)" opacity={0.4} />
      {/* the hanging rod */}
      <line
        x1={C - 90}
        y1={56}
        x2={C + 90}
        y2={56}
        stroke="url(#rsBrassH)"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <circle cx={C - 90} cy={56} r={8} fill="url(#rsGoldRad)" stroke="var(--paper-gold-deep)" />
      <circle cx={C + 90} cy={56} r={8} fill="url(#rsGoldRad)" stroke="var(--paper-gold-deep)" />
      {/* the decree cloth (cinnabar banner) */}
      <path
        d={`M${C - 66},62 h132 v260 l-66,28 l-66,-28 z`}
        fill="url(#rsBannerCloth)"
        stroke="var(--paper-cinnabar-deep)"
        strokeWidth={1.5}
        filter="url(#rsRough)"
      />
      <path
        d={`M${C - 58},70 h116 v246`}
        fill="none"
        stroke="var(--paper-parchment-soft)"
        strokeOpacity={0.3}
        strokeWidth={1}
      />
      {/* the decree glyphs (vertical) */}
      <text
        x={C}
        y={120}
        textAnchor="middle"
        fontFamily="serif"
        fontSize={30}
        fill="var(--paper-parchment-soft)"
        writingMode="tb"
        letterSpacing={14}
        style={{ textShadow: '0 1px 3px color-mix(in oklab, var(--obs-void-deep) 60%, transparent)' }}
      >
        天命之诏
      </text>
      {/* the wax seal at the foot (waxSeal helper drawn inline) */}
      <g transform={`translate(${C},300)`}>
        <circle r={20} fill="url(#rsCinnDisc)" stroke="var(--paper-cinnabar-deep)" />
        <circle
          r={14}
          fill="none"
          stroke="var(--paper-parchment-soft)"
          strokeOpacity={0.4}
          strokeDasharray="2 3"
        />
        <text
          x={0}
          y={6}
          textAnchor="middle"
          fontFamily="serif"
          fontSize={18}
          fill="var(--paper-parchment-soft)"
        >
          敕
        </text>
      </g>
      {/* hanging tassels */}
      <g transform={`translate(${C - 50},330)`}>
        <circle r={3} fill="var(--paper-gold-leaf)" />
        <path
          d="M-2,1 q-1,9 -2,14 M0,1 v14 M2,1 q1,9 2,14"
          stroke="var(--paper-gold-leaf)"
          strokeWidth={1.2}
          fill="none"
        />
      </g>
      <g transform={`translate(${C + 50},330)`}>
        <circle r={3} fill="var(--paper-gold-leaf)" />
        <path
          d="M-2,1 q-1,9 -2,14 M0,1 v14 M2,1 q1,9 2,14"
          stroke="var(--paper-gold-leaf)"
          strokeWidth={1.2}
          fill="none"
        />
      </g>
    </svg>
  );
}
