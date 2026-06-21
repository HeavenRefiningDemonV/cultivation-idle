import type { ReactElement } from 'react';
import { figure } from '../figure.js';

/**
 * F2.UI — BREAKTHROUGH rite scene (modal-stage.html `sceneBreakthrough`, L985). Stone gate threshold +
 * nine-stage ladder. Token-only fills; geometry/composition transcribed 1:1 from the artifact. The
 * artifact's hardcoded `stageNow` is replaced by the `stage` prop.
 */
export function SceneBreakthrough({ success, stage }: { success: boolean; stage: number }): ReactElement {
  const gap = success ? 70 : 14; // the light seam widens on success
  const bright = success ? 1 : 0.42;

  // gate pillars (stone)
  const pill = (x: number): ReactElement => (
    <g>
      <rect x={x} y={86} width={58} height={256} rx={3} fill="url(#rsStoneG)" stroke="var(--obs-void-deep)" strokeWidth={1.5} />
      <rect x={x + 5} y={92} width={48} height={244} fill="none" stroke="var(--paper-gold-strong)" strokeOpacity={0.28} strokeWidth={1} />
      <rect x={x + 3} y={300} width={52} height={10} fill="color-mix(in oklab, var(--obs-void-deep) 25%, transparent)" />
      <rect x={x + 3} y={190} width={52} height={8} fill="color-mix(in oklab, var(--obs-void-deep) 18%, transparent)" />
    </g>
  );

  // the nine-stage ladder along the base
  const lx = 372;
  const lw = 336;
  const step = lw / 8;

  return (
    <svg className="ritualScene__svg" viewBox="0 0 1080 466" preserveAspectRatio="xMidYMid slice">
      {/* distant glow behind the gate */}
      <ellipse className="ritualScene__glow" cx={540} cy={200} rx={success ? 260 : 150} ry={success ? 210 : 130} fill="url(#rsQiAura)" opacity={bright} />
      {/* the threshold light column between the pillars */}
      <rect x={540 - gap / 2} y={86} width={gap} height={252} fill="url(#rsThresholdLight)" className="ritualScene__threshold" opacity={bright} />
      {success && (
        <ellipse cx={540} cy={120} rx={46} ry={120} fill="url(#rsQiCore)" className="ritualScene__breathe" opacity={0.8} />
      )}
      {/* gate pillars (stone) */}
      {pill(420)}
      {pill(602)}
      {/* the lintel stone */}
      <rect x={404} y={56} width={272} height={40} rx={3} fill="url(#rsStoneG)" stroke="var(--obs-void-deep)" strokeWidth={1.5} />
      <rect x={410} y={61} width={260} height={30} fill="none" stroke="var(--paper-gold-strong)" strokeOpacity={0.3} strokeWidth={1} />
      <text x={540} y={84} textAnchor="middle" fontFamily="serif" fontSize={22} fill="var(--paper-gold-pale)" opacity={0.6} letterSpacing={8}>闯关</text>
      {/* carved corner brackets on the lintel */}
      <path d="M404,56 h14 M404,56 v14 M676,56 h-14 M676,56 v14" stroke="var(--paper-gold-leaf)" strokeWidth={2.5} fill="none" />
      {/* base dais */}
      <rect x={330} y={338} width={420} height={14} rx={3} fill="url(#rsStoneG)" stroke="var(--obs-void-deep)" />
      {/* the cultivator before the gate */}
      {figure(540, 338, 1.05, success ? 'var(--obs-void-deep)' : 'color-mix(in oklab, var(--obs-void-deep) 80%, var(--paper-bronze-lo))')}
      {/* rising qi motes through the seam */}
      {success &&
        Array.from({ length: 9 }, (_, i) => {
          const x = 540 + (((i % 3) - 1) * 18);
          const dl = (i * 0.5).toFixed(1);
          const sz = 2 + (i % 3);
          return (
            <circle
              key={i}
              className="ritualScene__mote"
              cx={x}
              cy={300 - i * 4}
              r={sz}
              fill="var(--paper-gold-leaf-hi)"
              style={{ animationDelay: `${dl}s` }}
              filter="url(#rsGlowG)"
            />
          );
        })}
      {/* mist at the base */}
      <rect x={300} y={320} width={480} height={48} fill="url(#rsMistG)" opacity={0.5} className="ritualScene__drift" />
      {/* the nine-stage ladder along the base */}
      <g transform="translate(0,402)">
        <line x1={lx} y1={0} x2={lx + lw} y2={0} stroke="var(--paper-gold-strong)" strokeOpacity={0.4} strokeWidth={1.5} />
        {Array.from({ length: 9 }, (_, i) => {
          const x = lx + step * i;
          const done = i < stage;
          const cur = i === stage - 1;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={0}
                r={cur ? 7 : 5}
                fill={done ? 'url(#rsGoldRad)' : 'var(--paper-bronze-lo)'}
                fillOpacity={done ? 1 : 0.4}
                stroke={done ? 'var(--paper-gold-deep)' : 'var(--paper-bronze-lo)'}
                strokeOpacity={done ? 1 : 0.6}
                strokeWidth={1.3}
                className={cur ? 'ritualScene__breathe' : undefined}
              />
              {cur && <circle cx={x} cy={0} r={11} fill="none" stroke="var(--paper-jade-bright)" strokeWidth={1.6} />}
            </g>
          );
        })}
        <text
          x={lx + lw / 2}
          y={22}
          textAnchor="middle"
          fontSize={9}
          fontWeight={800}
          letterSpacing=".2em"
          fill="var(--paper-gold-pale)"
          opacity={0.55}
          fontFamily="serif"
        >
          NINE STAGES · 九转
        </text>
      </g>
    </svg>
  );
}
