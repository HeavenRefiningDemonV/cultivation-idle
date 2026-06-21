import { useId } from 'react';

/**
 * F2.UI — ported treasure-record marks (modal-stage.html `waxSeal()` / `lockSeal()`), as small
 * presentational, decorative (aria-hidden) components. Token-only fills (no raw hex); each instance
 * mints a unique gradient id via useId so multiple seals never collide. The tier-mark plate, rarity
 * chop, and element edge-glyph stay CSS-driven in ItemDetailInspector.scss.
 */

export interface WaxSealProps {
  /** the chop glyphs (CJK), e.g. 寶錄 / 敕 / ？. Always decorative — the meaning is in adjacent text. */
  chars: string;
  size?: number;
  variant?: 'cinnabar' | 'jade';
}

/** A wax seal / chop — disc + tick ring + dashed band + glyph. */
export function WaxSeal({ chars, size = 64, variant = 'cinnabar' }: WaxSealProps) {
  const discId = `wax-${useId()}`;
  const c = size / 2;
  const r = c - 2;
  const isJade = variant === 'jade';
  const disc = isJade
    ? { from: 'var(--paper-jade-muted)', mid: 'var(--paper-jade)', to: 'var(--paper-jade-ink)', stroke: 'var(--paper-jade-ink)' }
    : { from: 'var(--paper-cinnabar-bright)', mid: 'var(--paper-stamp)', to: 'var(--paper-cinnabar-deep)', stroke: 'var(--paper-cinnabar-deep)' };
  const ink = 'var(--paper-parchment-soft)';
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 * Math.PI) / 180;
    const r1 = r - 1.5;
    const r2 = r - 4.5;
    return (
      <line
        key={i}
        x1={(c + Math.cos(a) * r1).toFixed(1)}
        y1={(c + Math.sin(a) * r1).toFixed(1)}
        x2={(c + Math.cos(a) * r2).toFixed(1)}
        y2={(c + Math.sin(a) * r2).toFixed(1)}
        stroke={ink}
        strokeOpacity={0.45}
        strokeWidth={0.8}
      />
    );
  });
  const fs = chars.length > 2 ? size * 0.26 : size * 0.4;
  return (
    <svg className="recordMark recordMark--wax" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <radialGradient id={discId} cx="40%" cy="34%" r="78%">
          <stop offset="0" stopColor={disc.from} />
          <stop offset="0.5" stopColor={disc.mid} />
          <stop offset="1" stopColor={disc.to} />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill={`url(#${discId})`} stroke={disc.stroke} strokeWidth={1.6} />
      <circle cx={c} cy={c} r={r - 3} fill="none" stroke={ink} strokeOpacity={0.3} strokeWidth={1} />
      <circle cx={c} cy={c} r={r - 7} fill="none" stroke={ink} strokeOpacity={0.4} strokeDasharray="1.5 4" />
      {ticks}
      <text x={c} y={c + fs * 0.34} textAnchor="middle" fontFamily="serif" fontWeight={700} fontSize={fs} fill={ink}>
        {chars}
      </text>
    </svg>
  );
}

/** A small lock seal for gated/sealed records (the slip treatment). */
export function LockSeal({ size = 40 }: { size?: number }) {
  const discId = `lock-${useId()}`;
  const c = size / 2;
  const ink = 'var(--paper-parchment-soft)';
  return (
    <svg className="recordMark recordMark--lock" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <radialGradient id={discId} cx="40%" cy="34%" r="78%">
          <stop offset="0" stopColor="var(--paper-cinnabar-bright)" />
          <stop offset="0.5" stopColor="var(--paper-stamp)" />
          <stop offset="1" stopColor="var(--paper-cinnabar-deep)" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={c - 2} fill={`url(#${discId})`} stroke="var(--paper-cinnabar-deep)" strokeWidth={1.5} opacity={0.92} />
      <circle cx={c} cy={c} r={c - 6} fill="none" stroke={ink} strokeOpacity={0.35} strokeDasharray="1.5 3" />
      <rect x={c - 7} y={c - 2} width={14} height={12} rx={2} fill={ink} opacity={0.92} />
      <path d={`M${c - 4.5},${c - 2} v-3 a4.5 4.5 0 0 1 9 0 v3`} fill="none" stroke={ink} strokeWidth={2} />
      <circle cx={c} cy={c + 3.5} r={1.6} fill="var(--paper-cinnabar-deep)" />
    </svg>
  );
}
