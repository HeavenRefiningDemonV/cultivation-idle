import barShort from '../../assets/menus/bar_short.png';
import { formatNumber } from '../../utils/numbers';
import './InkHealthBar.scss';

interface InkHealthBarProps {
  name: string;
  current: number;
  max: number;
  label?: string;
  inactive?: boolean;
  fillPercent?: number;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function InkHealthBar({ name, current, max, label, inactive, fillPercent }: InkHealthBarProps) {
  const computedPercent = max > 0 ? (current / max) * 100 : 0;
  const resolvedPercent = clampPercent(fillPercent ?? computedPercent);
  const resolvedLabel = label ?? `${formatNumber(current)} / ${formatNumber(max)} (${resolvedPercent.toFixed(1)}%)`;

  return (
    <div className={`ink-health-bar${inactive ? ' ink-health-bar--inactive' : ''}`}>
      <div className="ink-health-bar__name">{name}</div>
      <div className="ink-health-bar__hp">{resolvedLabel}</div>
      <div className="ink-health-bar__meter">
        <img className="ink-health-bar__shape" src={barShort} alt="" aria-hidden="true" />
        <div className="ink-health-bar__track">
          <div className="ink-health-bar__fill" style={{ width: `${resolvedPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
