import React from 'react';
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

export function BreakthroughBar({
  progress,
  qi,
  qiCap,
  canBreakthrough,
  onBreakthrough,
}: BreakthroughBarProps) {
  const percentRaw = progress <= 1 ? progress * 100 : progress;
  const percent = Math.max(0, Math.min(100, percentRaw));

  return (
    <div className="breakthrough-root">
      <div className="breakthrough-left">
        <div className="breakthrough-label">Breakthrough Progress</div>
        <div className="breakthrough-bar">
          <Bar value={percent} max={100} showText label={`${percent.toFixed(1)}%`} />
        </div>
        <div className="breakthrough-qi">Qi: {formatNumber(qi)} / {formatNumber(qiCap)}</div>
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
  );
}
