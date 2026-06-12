import './InkWaxSeal.scss';

export interface InkWaxSealProps {
  /** 1-4 CJK chars stamped vertically, e.g. "觀" or "勉強". */
  chars: string;
  /** px size of the square seal. */
  size: number;
  /** rotation in degrees (the hand-stamped tilt). */
  rotation?: number;
  variant: 'cinnabar' | 'jade';
  className?: string;
}

function buildRimPath(size: number): string {
  const C = size / 2;
  const r = size / 2 - 2;
  const N = 22;
  let p = '';
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * 2 * Math.PI;
    const rr = r * (0.9 + 0.06 * Math.sin(i * 2.7 + 1.3) + 0.04 * Math.cos(i * 1.6 + 0.5));
    const x = C + rr * Math.cos(a);
    const y = C + rr * Math.sin(a);
    p += (i ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
  }
  return p + 'Z';
}

/**
 * Irregular-rim wax-seal chop (artifact waxSeal()) with vertical Kai-ti glyphs.
 * Cinnabar (url(#cinnDisc)) or jade (url(#jadeRad)) disc — both from the shared
 * <InkObservatoryDefs/> sprite, which must be mounted in the subtree. Stroke,
 * inner outline and text colors are tokenized via the .scss variant classes.
 * Decorative: aria-hidden.
 */
export function InkWaxSeal({ chars, size, rotation = 0, variant, className }: InkWaxSealProps) {
  const C = size / 2;
  const cs = [...chars];
  const fs = size * (cs.length > 2 ? 0.27 : 0.32);
  const gap = fs * 1.02;
  const y0 = C - ((cs.length - 1) * gap) / 2;
  const path = buildRimPath(size);
  const innerTransform = `translate(${C} ${C}) scale(.82) translate(${-C} ${-C})`;
  return (
    <svg
      className={['inkWaxSeal', `inkWaxSeal--${variant}`, className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
      focusable={false}
    >
      <path className="inkWaxSeal__rim" d={path} />
      <path className="inkWaxSeal__inner" d={path} transform={innerTransform} />
      <text className="inkWaxSeal__text" textAnchor="middle" fontSize={fs.toFixed(1)}>
        {cs.map((c, i) => (
          <tspan key={i} x={C} y={(y0 + i * gap + fs * 0.34).toFixed(1)}>
            {c}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
