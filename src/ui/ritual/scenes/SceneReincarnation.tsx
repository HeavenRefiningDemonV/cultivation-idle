import type { ReactElement } from 'react';

/**
 * F2.UI — rite scene 3 "REINCARNATION": the six-path wheel turning. Ported 1:1 from
 * modal-stage.html `sceneReincarnation()` (L1064–1092). Geometry/composition unchanged;
 * only JS-string→JSX syntax and raw hex→paperInkTokens vars. The great wheel spins around
 * its own scene centre (540,210) via the transform-box:view-box ring-fix.
 */
export function SceneReincarnation(): ReactElement {
  const C = 540;
  const CY = 210;
  const R = 158;
  const realms = ['天', '人', '修', '畜', '鬼', '狱'];
  return (
    <svg className="ritualScene__svg" viewBox="0 0 1080 466" preserveAspectRatio="xMidYMid slice">
      <ellipse cx={C} cy={CY} rx={240} ry={220} fill="url(#rsQiAura)" opacity={0.6} />
      {/* the great wheel (slow spin) */}
      <g
        className="ritualScene__spin"
        style={{ transformBox: 'view-box', transformOrigin: '540px 210px' }}
      >
        <circle
          cx={C}
          cy={CY}
          r={R + 8}
          fill="none"
          stroke="var(--paper-gold-deep)"
          strokeOpacity={0.5}
          strokeDasharray="2 7"
        />
        <circle cx={C} cy={CY} r={R} fill="none" stroke="url(#rsBrassH)" strokeWidth={9} />
        <circle
          cx={C}
          cy={CY}
          r={R - 6}
          fill="none"
          stroke="var(--paper-gold-deep)"
          strokeOpacity={0.5}
          strokeWidth={1.5}
        />
        {/* six spokes + the six realms (六道) */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = ((i * 60 - 90) * Math.PI) / 180;
          const x = C + Math.cos(a) * R;
          const y = CY + Math.sin(a) * R;
          const mx = C + Math.cos(a) * (R - 34);
          const my = CY + Math.sin(a) * (R - 34);
          return (
            <g key={i}>
              <line
                x1={C}
                y1={CY}
                x2={x.toFixed(1)}
                y2={y.toFixed(1)}
                stroke="url(#rsBrassH)"
                strokeWidth={5}
              />
              <circle
                cx={mx.toFixed(1)}
                cy={my.toFixed(1)}
                r={20}
                fill="url(#rsGoldRad)"
                stroke="var(--paper-gold-deep)"
                strokeWidth={1.6}
              />
              <text
                x={mx.toFixed(1)}
                y={(my + 6).toFixed(1)}
                textAnchor="middle"
                fontFamily="serif"
                fontSize={20}
                fill="var(--obs-void-deep)"
              >
                {realms[i]}
              </text>
            </g>
          );
        })}
      </g>
      {/* hub */}
      <circle cx={C} cy={CY} r={46} fill="url(#rsInkDisc)" stroke="url(#rsGoldG)" strokeWidth={4} />
      <circle
        cx={C}
        cy={CY}
        r={38}
        fill="none"
        stroke="var(--paper-gold-pale)"
        strokeOpacity={0.35}
      />
      <text
        x={C}
        y={CY - 2}
        textAnchor="middle"
        fontFamily="serif"
        fontSize={26}
        fill="var(--paper-gold-leaf-hi)"
      >
        輪迴
      </text>
      <text
        x={C}
        y={CY + 20}
        textAnchor="middle"
        fontSize={9}
        fontWeight={800}
        letterSpacing=".1em"
        fill="var(--paper-gold-pale)"
        opacity={0.7}
      >
        THE WHEEL
      </text>
      {/* the life's deeds, drawn inward as motes */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const rr = R - 20 - (i % 3) * 16;
        const x = C + Math.cos(a) * rr;
        const y = CY + Math.sin(a) * rr;
        return (
          <circle
            key={i}
            className="ritualScene__mote"
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r={2 + (i % 2)}
            fill="var(--paper-gold-leaf-hi)"
            filter="url(#rsGlowG)"
            style={{ animationDelay: `${(i * 0.5).toFixed(1)}s` }}
          />
        );
      })}
    </svg>
  );
}
