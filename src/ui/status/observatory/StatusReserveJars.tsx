import { memo } from 'react';
import type { CSSProperties } from 'react';
import { deepEqualProps } from './fx/memoProps.js';
import type { StatusLedgerFactRow, StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusObservatoryDrawerRequest,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { useObservatoryRoving } from './useObservatoryRoving.js';

export interface StatusReserveJarsProps {
  jars: StatusObservatorySurfaceV1['buildPreparation']['reserveJars'];
  rows: StatusLedgerFactRow[];
  onOpenDrawer?: (drawer: StatusObservatoryDrawerRequest) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function jarFillFromText(value: string | null, tone: StatusLedgerTone): number {
  const raw = value ?? '';
  const percent = raw.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percent) return clamp(Number(percent[1]), 0, 100);

  const ratio = raw.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (ratio) {
    const current = Number(ratio[1]);
    const maximum = Math.max(1, Number(ratio[2]));
    return clamp((current / maximum) * 100, 0, 100);
  }

  // Qualitative levels mirror the artifact jar levels (Empty/Low/Poor … Max/Full).
  const normalized = raw.toLowerCase();
  if (/empty/.test(normalized)) return 8;
  if (/\b(max|full)\b/.test(normalized)) return 94;
  if (/good|sufficient|healthy|stable|available/.test(normalized)) return 72;
  if (/poor/.test(normalized)) return 20;
  if (/low/.test(normalized)) return 26;

  if (tone === 'danger') return 18;
  if (tone === 'warning') return 36;
  if (tone === 'success' || tone === 'jade') return 78;
  if (tone === 'gold' || tone === 'info') return 58;
  return 42;
}

/* Kind is informational only (data-jar-kind + a stable key); it is NO LONGER the
   source of the glyph/colour. The old loose regex collided multiple real-data
   labels onto one kind (e.g. "pouch"/"fit" and "heal"/"reserve"), which duplicated
   the 囊/療 glyphs. Glyph + liquid colour are now driven purely by POSITION (see
   JAR_POSITION_GLYPH / JAR_POSITION_COLOR), so no two visible jars can ever share
   a glyph regardless of label. */
function jarKind(label: string): string {
  const normalized = label.toLowerCase();
  if (/merit/.test(normalized)) return 'merit-reserve';
  if (/spirit stone|stone/.test(normalized)) return 'spirit-stones';
  if (/medicine/.test(normalized)) return 'medicine-pouch';
  if (/pouch|fit/.test(normalized)) return 'pouch-fit';
  if (/heal|reserve/.test(normalized)) return 'healing-reserve';
  return 'reserve';
}

function toneLabel(tone: StatusLedgerTone): string {
  if (tone === 'danger') return 'Low';
  if (tone === 'warning') return 'Strained';
  if (tone === 'success' || tone === 'jade') return 'Healthy';
  if (tone === 'gold') return 'Sufficient';
  if (tone === 'muted') return 'Unknown';
  return 'Available';
}

/* The value reads cinnabar when the reserve is bad (low / empty / strained), else
   ink — matching the artifact j.bad colouring. */
function jarBad(value: string | null, tone: StatusLedgerTone): boolean {
  const raw = (value ?? '').toLowerCase();
  if (/empty|low|poor/.test(raw)) return true;
  return tone === 'danger' || tone === 'warning' || tone === 'muted';
}

/* Decorative Kai-ti label glyph + liquid tint keyed on the jar's POSITION, exactly
   like the artifact (fixed per-slot 功 石 藥 囊 療 with gold / blue / red / earth /
   cinnabar liquid). Driving these from the index — not jarKind — guarantees every
   visible jar gets a distinct glyph + colour even when real-data labels collide
   (the old kind-regex duplicated 囊/療). The jar label + value + tone stay the
   data truth; the glyph/colour are decorative-by-position. Position 5+ falls back
   to a neutral 備 reserve mark, but the real game only ever shows ≤5 jars. */
const JAR_POSITION_GLYPH = ['功', '石', '藥', '囊', '療'] as const;
const JAR_POSITION_COLOR = ['#c79a45', '#5a8bb0', '#a44731', '#8d642d', '#9c4a3e'] as const;
const JAR_RESERVE_GLYPH = '備';
const JAR_RESERVE_COLOR = '#7f9a86';

function jarGlyphForIndex(index: number): string {
  return JAR_POSITION_GLYPH[index] ?? JAR_RESERVE_GLYPH;
}

function jarColorForIndex(index: number): string {
  return JAR_POSITION_COLOR[index] ?? JAR_RESERVE_COLOR;
}

function jarStyle(fill: number, color: string): CSSProperties {
  return { '--jar-fill': `${fill}%`, '--jar-color': color } as CSSProperties;
}

export const StatusReserveJars = memo(StatusReserveJarsBase, deepEqualProps);

function StatusReserveJarsBase({ jars, rows, onOpenDrawer }: StatusReserveJarsProps) {
  const exactRowCount = rows.length;
  const jarsRoving = useObservatoryRoving(jars.length);

  return (
    <div
      className="statusReserveJars"
      data-testid="status-reserve-jars"
      data-s7-instrument="reserve-jars"
      data-reserve-count={jars.length}
      aria-label={`${jars.length} reserve jars. ${exactRowCount} exact build and reserve rows available.`}
    >
      <div
        className="statusReserveJars__shelf"
        aria-label="Physical reserve jar shelf"
        onKeyDown={jarsRoving.onKeyDown}
      >
        {/* Artifact wood shelf board the jars stand on (sprite #plank gradient). */}
        <svg
          className="statusReserveJars__plank"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable={false}
        >
          <rect x="0" y="0" width="100" height="100" fill="url(#plank)" />
        </svg>
        {jars.map((jar, index) => {
          const fill = jarFillFromText(jar.value, jar.tone);
          const state = toneLabel(jar.tone);
          const kind = jarKind(jar.label);
          const color = jarColorForIndex(index);
          const glyph = jarGlyphForIndex(index);
          const bad = jarBad(jar.value, jar.tone);

          return (
            <button
              key={jar.id}
              type="button"
              className="statusReserveJars__jar"
              data-tone={jar.tone}
              data-reserve-id={jar.id}
              data-jar-kind={kind}
              data-bad={bad ? 'true' : 'false'}
              style={jarStyle(fill, color)}
              aria-label={`${jar.label}, ${state}, ${jar.value ?? jar.detail}. ${jar.detail}. Source ${jar.sourceLabel}. Opens exact reserve rows.`}
              onClick={() => onOpenDrawer?.({ kind: 'buildPreparation', sourceId: jar.id })}
              {...jarsRoving.getItemProps(index)}
            >
              {/* Artifact glass bottle: jw58 jh126 topY14 in a 58×140 box (cork above
                  the rim). The liquid rect rides --jar-fill from the jar bottom inside
                  a clip of the bottle body; a parchment label band carries the glyph. */}
              <svg
                className="statusReserveJars__bottle"
                viewBox="0 0 58 140"
                preserveAspectRatio="xMidYMax meet"
                aria-hidden="true"
                focusable={false}
              >
                <defs>
                  <clipPath id={`jarClip-${jar.id}`}>
                    <path d="M6,14 Q0,14 0,24 L0,132 Q0,140 8,140 L50,140 Q58,140 58,132 L58,24 Q58,14 52,14 Z" />
                  </clipPath>
                </defs>
                {/* glass body */}
                <path
                  d="M6,14 Q0,14 0,24 L0,132 Q0,140 8,140 L50,140 Q58,140 58,132 L58,24 Q58,14 52,14 Z"
                  fill="url(#glass)"
                  stroke="rgba(120,130,120,.45)"
                  strokeWidth="1.3"
                />
                {/* liquid: a full-interior column tinted to the jar color, revealed
                    from the bottom by the CSS clip-path driven by --jar-fill. The
                    meniscus rides the same clipped element's top edge. */}
                <g clipPath={`url(#jarClip-${jar.id})`}>
                  <g className="statusReserveJars__liquid">
                    <rect x="0" y="16" width="58" height="124" fill={color} opacity="0.82" />
                    <rect className="statusReserveJars__meniscus" x="2" y="16" width="54" height="3" fill="rgba(255,255,255,.3)" />
                  </g>
                </g>
                {/* vertical highlight streak */}
                <rect x="7" y="26" width="6" height="96" rx="3" fill="rgba(255,255,255,.3)" />
                {/* cork stopper + neck band above the rim */}
                <path d="M10,2 L48,2 L45,16 L13,16 Z" fill="url(#cork)" stroke="#4a330e" strokeWidth="1" />
                <rect x="13" y="-1" width="32" height="5" rx="2" fill="#8a6a3a" stroke="#4a330e" strokeWidth="0.8" />
                {/* parchment label band at ~42% height with the Kai-ti glyph in jar color */}
                <rect x="5" y="67" width="48" height="24" rx="2" fill="rgba(245,238,220,.92)" stroke="rgba(120,90,46,.5)" />
                {glyph ? (
                  <text
                    className="statusReserveJars__glyph"
                    x="29"
                    y="83"
                    textAnchor="middle"
                    fill={color}
                  >
                    {glyph}
                  </text>
                ) : null}
              </svg>
              {/* One bold value beneath the shelf. Real-data values can be long
                  ("0 (below minimum)", "Auto-use disabled · 0/3 slots filled"); the
                  class clamps to 2 lines with ellipsis so it never overflows the
                  jar slot. Cinnabar when the reserve is bad, ink otherwise. */}
              <strong className="statusReserveJars__value">{jar.value ?? state}</strong>
            </button>
          );
        })}
      </div>

      {/* Artifact bottom-right detail hint; reaches the exact reserve rows drawer
          (onOpenDrawer with kind: 'buildPreparation'). */}
      <button
        type="button"
        className="statusReserveJars__detail"
        aria-haspopup="dialog"
        aria-label={`Reserve detail. ${exactRowCount} exact rows.`}
        onClick={() => onOpenDrawer?.({ kind: 'buildPreparation' })}
      >
        Detail ⤢
      </button>
    </div>
  );
}
