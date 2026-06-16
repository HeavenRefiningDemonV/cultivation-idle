import { useId } from 'react';
import { buildJaggedPath, buildShallowSPath, jaggedPoints } from './bridgeThreadGeometry.js';
import { useRitualMotion } from './useRitualMotion.js';
import './observatoryFx.scss';

export interface BridgeThreadProps {
  /** maps 1:1 to rootLawInstrument.bridge.broken later. */
  broken: boolean;
  /** intact-thread tone; default 'jade'. */
  tone?: 'jade' | 'gold';
  width: number;
  height: number;
  /** optional explicit intact-form path `d`. */
  path?: string;
  /** ember-mote count, clamped 0..10; default 6. */
  emberCount?: number;
  /** deterministic jag + mote layout. */
  seed?: number;
  className?: string;
  /** e.g. "Root and Law fit: opposed" — the broken/intact truth must also be
   *  carried by the consumer's visible text, never by this primitive alone. */
  ariaLabel: string;
}

const EMBER_SEGMENTS = 9;

function safeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * The hero duality primitive (VFX-02): an intact jade-gold thread or, when
 * `broken`, the same endpoints re-routed as a jagged ember crack venting
 * motes. One `<svg>` renders both forms; motion is gated by data-attributes.
 */
export function BridgeThread({
  broken,
  tone = 'jade',
  width,
  height,
  path,
  emberCount = 6,
  seed = 1,
  className,
  ariaLabel,
}: BridgeThreadProps) {
  const { animate, flourish } = useRitualMotion();
  const uid = safeId(useId());
  const gradientId = `obsBridgeGrad-${uid}`;
  const intactBlurId = `obsBridgeIntactBlur-${uid}`;
  const crackBlurId = `obsBridgeCrackBlur-${uid}`;

  const clampedEmber = Math.max(0, Math.min(10, Math.round(emberCount)));
  const intactPath = path ?? buildShallowSPath(width, height);
  const crackPath = buildJaggedPath(width, height, EMBER_SEGMENTS, seed);
  const vertices = jaggedPoints(width, height, EMBER_SEGMENTS, seed).slice(1, -1);
  const moteCount = animate ? clampedEmber : Math.min(3, clampedEmber);
  const motes = Array.from({ length: moteCount }, (_, index) =>
    vertices.length > 0 ? vertices[index % vertices.length] : { x: width / 2, y: height / 2 },
  );

  const classes = [
    'obsFxBridgeThread',
    `obsFxBridgeThread--${broken ? 'broken' : 'intact'}`,
    `obsFxBridgeThread--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      className={classes}
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      preserveAspectRatio="none"
      data-animate={animate ? 'true' : 'false'}
      data-flourish={flourish ? 'true' : 'false'}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--paper-jade-bright)" />
          <stop offset="100%" stopColor="var(--paper-gold-leaf)" />
        </linearGradient>
        <filter id={intactBlurId} x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={crackBlurId} x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="2.1" />
        </filter>
      </defs>

      {broken ? (
        <g className="obsFxBridgeThread__brokenGroup">
          <path className="obsFxBridgeThread__crackHalo" d={crackPath} filter={`url(#${crackBlurId})`} />
          <path className="obsFxBridgeThread__crackBase" d={crackPath} />
          <path className="obsFxBridgeThread__crackCore" d={crackPath} />
          {motes.map((mote, index) => (
            <circle
              key={index}
              className={`obsFxBridgeThread__ember obsFxBridgeThread__ember--${index % 2 === 0 ? 'hot' : 'mid'}`}
              cx={mote.x}
              cy={mote.y}
              r={1 + (index % 3) * 0.75}
              style={{ animationDelay: `${(index % 5) * 0.6}s` }}
            />
          ))}
        </g>
      ) : (
        <g className="obsFxBridgeThread__intactGroup">
          <path className="obsFxBridgeThread__glow" d={intactPath} filter={`url(#${intactBlurId})`} />
          <path className="obsFxBridgeThread__line" d={intactPath} stroke={`url(#${gradientId})`} />
        </g>
      )}
    </svg>
  );
}
