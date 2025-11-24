import { images } from '../../assets/images';

export type BarProps = {
  value: number;
  max: number;
  label?: string;
  showText?: boolean;
};

export function Bar({ value, max, label, showText = false }: BarProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const background = images.ui.barLong ?? images.ui.barShort;

  return (
    <div className="w-full">
      {label ? <div className="text-xs text-ink-light mb-1 uppercase tracking-wide">{label}</div> : null}
      <div
        className="relative h-6 flex items-center px-2"
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-1 bg-black/40 rounded-md" aria-hidden />
        <div
          className="relative h-4 rounded-sm bg-gradient-to-r from-emerald-400 to-emerald-600"
          style={{ width: `${percentage}%` }}
        />
        {showText && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-ink-paper drop-shadow">
            {max > 0 ? `${value.toLocaleString()} / ${max.toLocaleString()}` : '0 / 0'}
          </div>
        )}
      </div>
    </div>
  );
}

export type HpBarProps = {
  current: number;
  max: number;
  label: string;
};

export function HpBar({ current, max, label }: HpBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-ink-light">
        <span className="font-semibold text-ink-paper">{label}</span>
        <span className="font-mono text-emerald-300">{`${current.toLocaleString()} / ${max.toLocaleString()}`}</span>
      </div>
      <Bar value={current} max={max} showText />
    </div>
  );
}
