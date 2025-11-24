import { images } from '../../assets/images';
import { Bar } from './Bar';
import { formatNumber } from '../../utils/numbers';
import './BreakthroughBar.css';

interface BreakthroughBarProps {
  progress: number;
  qi: number | string;
  qiCap: number | string;
  canBreakthrough: boolean;
  onBreakthrough: () => void;
}

function formatQi(value: number | string) {
  return formatNumber(value);
}

export function BreakthroughBar({
  progress,
  qi,
  qiCap,
  canBreakthrough,
  onBreakthrough,
}: BreakthroughBarProps) {
  const raw = progress;
  const percent = raw <= 1 ? raw * 100 : raw;
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className="breakthrough-root">
      <div className="breakthrough-inner">
        <div className="breakthrough-left">
          <div className="breakthrough-label">Breakthrough Progress</div>
          <div
            className="breakthrough-bar-frame"
            style={{ backgroundImage: `url(${images.ui.barLong})` }}
          >
            <Bar value={clamped} max={100} showText label={`${clamped.toFixed(1)}%`} />
          </div>
          <div className="breakthrough-qi">Qi: {formatQi(qi)} / {formatQi(qiCap)}</div>
        </div>

        <div className="breakthrough-right">
          <img src={images.ui.qiSign} alt="" className="breakthrough-orb" />
          <button
            type="button"
            className="breakthrough-button"
            disabled={!canBreakthrough}
            onClick={onBreakthrough}
          >
            Breakthrough
          </button>
        </div>
      </div>
    </div>
  );
}

