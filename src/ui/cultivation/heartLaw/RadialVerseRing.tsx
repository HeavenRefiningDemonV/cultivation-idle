import './RadialVerseRing.scss';

const DEFAULT_LABELS = ['I', 'II', 'III', 'IV', 'V'];
const BASE_ANGLES = [270, 0, 90, 135, 180];
const GAP_DEG = 4;
const CX = 100;
const CY = 100;
const RING_R = 62;
const STROKE_W = 10;
const NODE_R = RING_R + STROKE_W / 2 + 12;
const NODE_SIZE = 30;

type RadialVerseRingProps = {
  currentVerse: number;
  selectedVerse: number;
  progressToNextPct: number;
  onSelectVerse: (verse: number) => void;
  verseLabels?: string[];
  className?: string;
};

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle % 360);
  const end = polarToCartesian(cx, cy, r, startAngle % 360);
  const sweep = endAngle - startAngle;
  const largeArcFlag = sweep <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function unwrapAngles(angles: number[]): number[] {
  const result = [angles[0]];
  for (let i = 1; i < angles.length; i += 1) {
    let next = angles[i];
    const prev = result[i - 1];
    while (next <= prev) {
      next += 360;
    }
    result.push(next);
  }
  result.push(result[0] + 360);
  return result;
}

export function RadialVerseRing({
  currentVerse,
  selectedVerse,
  progressToNextPct,
  onSelectVerse,
  verseLabels = DEFAULT_LABELS,
  className,
}: RadialVerseRingProps) {
  const clampedProgress = clamp(progressToNextPct, 0, 100);
  const angles = unwrapAngles(BASE_ANGLES);
  const segments = angles.slice(0, -1).map((start, index) => {
    const end = angles[index + 1];
    const drawStart = start + GAP_DEG / 2;
    const drawEnd = end - GAP_DEG / 2;
    return {
      verse: index + 1,
      start: drawStart,
      end: drawEnd,
    };
  });

  return (
    <div className={`radialVerseRing${className ? ` ${className}` : ''}`}>
      <svg className="radialVerseRing__svg" viewBox="0 0 200 200" aria-hidden="true">
        {segments.map((segment) => (
          <path
            key={`base-${segment.verse}`}
            className="radialVerseRing__segment radialVerseRing__segment--base"
            d={describeArc(CX, CY, RING_R, segment.start, segment.end)}
          />
        ))}
        {segments
          .filter((segment) => segment.verse < currentVerse)
          .map((segment) => (
            <path
              key={`complete-${segment.verse}`}
              className="radialVerseRing__segment radialVerseRing__segment--complete"
              d={describeArc(CX, CY, RING_R, segment.start, segment.end)}
            />
          ))}
        {segments
          .filter((segment) => segment.verse === selectedVerse)
          .map((segment) => (
            <path
              key={`selected-${segment.verse}`}
              className="radialVerseRing__segment radialVerseRing__segment--selected"
              d={describeArc(CX, CY, RING_R, segment.start, segment.end)}
            />
          ))}
        {segments
          .filter((segment) => segment.verse === currentVerse && clampedProgress > 0)
          .map((segment) => {
            const progressEnd = segment.start + (segment.end - segment.start) * (clampedProgress / 100);
            const markerPoint = polarToCartesian(CX, CY, RING_R, progressEnd % 360);
            return (
              <g key={`progress-${segment.verse}`}>
                <path
                  className="radialVerseRing__segment radialVerseRing__segment--progress"
                  d={describeArc(CX, CY, RING_R, segment.start, progressEnd)}
                />
                <circle className="radialVerseRing__marker" cx={markerPoint.x} cy={markerPoint.y} r="2.8" />
              </g>
            );
          })}
        {segments.map((segment) => (
          <path
            key={`hit-${segment.verse}`}
            className="radialVerseRing__segmentHit"
            d={describeArc(CX, CY, RING_R, segment.start, segment.end)}
            onClick={() => onSelectVerse(segment.verse)}
          />
        ))}
      </svg>
      <div className="radialVerseRing__nodes" role="group" aria-label="Verse selection">
        {BASE_ANGLES.map((angle, index) => {
          const verse = index + 1;
          const position = polarToCartesian(CX, CY, NODE_R, angle);
          const isCompleted = verse < currentVerse;
          const isCurrent = verse === currentVerse;
          const isSelected = verse === selectedVerse;
          const label = verseLabels[index] ?? String(verse);
          const stateClass = [
            isCompleted ? 'is-complete' : 'is-locked',
            isCurrent ? 'is-current' : '',
            isSelected ? 'is-selected' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={`node-${verse}`}
              type="button"
              className={`radialVerseRing__nodeBtn ${stateClass}`}
              style={{
                left: `${position.x - NODE_SIZE / 2}px`,
                top: `${position.y - NODE_SIZE / 2}px`,
                width: `${NODE_SIZE}px`,
                height: `${NODE_SIZE}px`,
              }}
              onClick={() => onSelectVerse(verse)}
              aria-label={`Select Verse ${label}`}
              aria-pressed={isSelected}
            >
              <span className="radialVerseRing__nodeLabel">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
