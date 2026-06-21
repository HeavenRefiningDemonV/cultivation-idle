import type { ReactElement } from 'react';

/**
 * F2.UI — rite scene 4 "ROOT UPGRADE" (洗髓 / marrow-cleansing), ported 1:1 from
 * modal-stage.html `sceneRootUpgrade()` (L1094–1128). Twin before→after root-wheels under a
 * descending crucible. Deterministic — no failure branch. Token-only; no raw hex.
 */
export function SceneRootUpgrade({
  fromGrade,
  toGrade,
}: {
  fromGrade: number;
  toGrade: number;
}): ReactElement {
  // helper: a small root-wheel with element glyphs (artifact local `rootWheel`)
  function rootWheel(cx: number, cy: number, grade: number, lit: boolean): ReactElement {
    const R = 78;
    const els = ['金', '木', '水', '火', '土'];
    return (
      <g>
        <circle cx={cx} cy={cy} r={R + 6} fill="url(#rsQiAura)" opacity={lit ? 0.7 : 0.35} />
        <circle
          className={lit ? 'ritualScene__spin' : 'ritualScene__spinR'}
          style={{ transformBox: 'view-box', transformOrigin: `${cx}px ${cy}px` }}
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={lit ? 'url(#rsGoldG)' : 'var(--paper-bronze-lo)'}
          strokeOpacity={lit ? 1 : 0.5}
          strokeWidth={lit ? 5 : 3}
          strokeDasharray={lit ? 'none' : '3 5'}
        />
        {Array.from({ length: 5 }, (_, i) => {
          const a = ((i * 72 - 90) * Math.PI) / 180;
          const x = cx + Math.cos(a) * R;
          const y = cy + Math.sin(a) * R;
          const on = i < grade;
          return (
            <g key={i}>
              <circle
                cx={Number(x.toFixed(1))}
                cy={Number(y.toFixed(1))}
                r={15}
                fill={on ? (lit ? 'url(#rsJadeRad)' : 'var(--obs-void-deep)') : 'var(--obs-void-deep)'}
                fillOpacity={on ? 1 : 0.5}
                stroke={on ? (lit ? 'var(--paper-jade-bright)' : 'var(--paper-gold-strong)') : 'var(--paper-bronze-lo)'}
                strokeOpacity={on ? 1 : 0.5}
                strokeWidth={on ? 2 : 1}
              />
              <text
                x={Number(x.toFixed(1))}
                y={Number((y + 5).toFixed(1))}
                textAnchor="middle"
                fontFamily="serif"
                fontSize={14}
                fill={on ? (lit ? 'var(--paper-jade-muted)' : 'var(--paper-gold-deep)') : 'var(--paper-bronze-lo)'}
                fillOpacity={on ? 1 : 0.6}
              >
                {els[i]}
              </text>
            </g>
          );
        })}
        <circle
          cx={cx}
          cy={cy}
          r={26}
          fill="url(#rsInkDisc)"
          stroke={lit ? 'url(#rsGoldG)' : 'var(--paper-gold-deep)'}
          strokeOpacity={lit ? 1 : 0.6}
          strokeWidth={2.5}
        />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize={13}
          fontWeight={800}
          fill={lit ? 'var(--paper-gold-leaf-hi)' : 'var(--paper-gold-pale)'}
          fillOpacity={lit ? 1 : 0.7}
        >
          Grade
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontFamily="serif"
          fontSize={15}
          fill={lit ? 'var(--paper-gold-leaf-hi)' : 'var(--paper-gold-pale)'}
          fillOpacity={lit ? 1 : 0.7}
        >
          {grade >= 4 ? '天' : grade >= 3 ? '玄' : grade >= 2 ? '地' : '凡'}
        </text>
      </g>
    );
  }

  return (
    <svg className="ritualScene__svg" viewBox="0 0 1080 466" preserveAspectRatio="xMidYMid slice">
      {/* descending cleansing light column from a crucible above */}
      <rect x={510} y={40} width={60} height={380} fill="url(#rsThresholdLight)" opacity={0.55} className="ritualScene__threshold" />
      <ellipse cx={540} cy={60} rx={64} ry={22} fill="url(#rsJadeDawn)" className="ritualScene__breathe" opacity={0.85} />
      {/* the crucible vessel at the top */}
      <path d="M500,38 q40,-26 80,0 l-10,30 q-30,12 -60,0 z" fill="url(#rsGoldRad)" stroke="var(--paper-gold-deep)" strokeWidth={1.6} />
      <ellipse cx={540} cy={40} rx={40} ry={10} fill="var(--obs-void-deep)" stroke="var(--paper-gold-deep)" strokeWidth={1.4} />
      {/* before (lower grade, dim) and after (higher grade, lit) */}
      {rootWheel(290, 250, fromGrade, false)}
      {rootWheel(790, 250, toGrade, true)}
      {/* the transformation arrow */}
      <path d="M392,250 h280" stroke="url(#rsGoldG)" strokeWidth={3} fill="none" className="ritualScene__glow" />
      <path d="M660,238 l18,12 l-18,12" fill="none" stroke="var(--paper-gold-leaf)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <text x={540} y={238} textAnchor="middle" fontFamily="serif" fontSize={20} fill="var(--paper-gold-pale)" fillOpacity={0.7} letterSpacing={6}>
        洗髓
      </text>
      <text x={540} y={318} textAnchor="middle" fontSize={10} fontWeight={800} letterSpacing=".14em" fill="var(--paper-gold-pale)" fillOpacity={0.6} fontFamily="serif">
        MARROW-CLEANSING · DETERMINISTIC
      </text>
      {/* certainty motes between */}
      {Array.from({ length: 7 }, (_, i) => {
        const x = 420 + i * 36;
        return (
          <circle
            key={i}
            className="ritualScene__mote"
            cx={x}
            cy={250}
            r={2.4}
            fill="var(--paper-jade-muted)"
            filter="url(#rsGlowJ)"
            style={{ animationDelay: `${(i * 0.4).toFixed(1)}s` }}
          />
        );
      })}
    </svg>
  );
}
