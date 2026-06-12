import './InkGrain.scss';

export interface InkGrainProps {
  className?: string;
}

/**
 * Paper-grain overlay (artifact `.grain`): a multiply-blended fractal-noise
 * layer. The noise is an SVG rect filtered by the shared `#grainF` filter
 * declared once in <InkObservatoryDefs/>; render this inside an Observatory
 * subtree where that sprite is mounted. aria-hidden, non-interactive.
 */
export function InkGrain({ className }: InkGrainProps) {
  return (
    <div className={['inkGrain', className].filter(Boolean).join(' ')} aria-hidden="true">
      <svg width="100%" height="100%" preserveAspectRatio="none">
        <rect width="100%" height="100%" filter="url(#grainF)" />
      </svg>
    </div>
  );
}
