import { useEffect, useState } from 'react';
import { Activity, Gauge, Mountain, Shield, Sparkles, Target, TreePine } from 'lucide-react';
import { formatNumber } from '../../utils/numbers.js';
import { TopRibbon, RibbonStat, ChromeChip } from '../chrome/index.js';
import './CultivationHeaderRibbon.scss';

type CultivationHeaderRibbonProps = {
  realmLabel: string;
  substage: number;
  qi: string;
  qiPerSecond: string;
  rateTooltip: string;
  activityLabel: string;
  activityType: string | null;
  stability: number;
  stabilityCap: number;
  breakthroughReady: boolean;
  pathLabel: string;
  spiritRootLine: string;
  heartLawLine: string;
  cityLabel: string;
};

export function CultivationHeaderRibbon({
  realmLabel,
  substage,
  qi,
  qiPerSecond,
  rateTooltip,
  activityLabel,
  activityType,
  stability,
  stabilityCap,
  breakthroughReady,
  pathLabel,
  spiritRootLine,
  heartLawLine,
  cityLabel,
}: CultivationHeaderRibbonProps) {
  const storageKey = 'ui.cultivation.headerCollapsed';
  const ribbonId = 'cultivationHeaderPanel';
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(storageKey) === '1';
  });

  const stabilityPct = stabilityCap > 0 ? Math.min(100, (stability / stabilityCap) * 100) : 0;
  const readinessLabel = breakthroughReady ? 'Ready' : 'Preparing';
  const readinessTone = breakthroughReady ? 'success' : 'warning';
  const activityTone = activityType === 'meditate' ? 'success' : activityType ? 'warning' : 'neutral';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className={`cultivationHeaderRibbon ${collapsed ? 'is-collapsed' : 'is-expanded'}`}>
      <div className="cultivationHeaderRibbon__panel" id={ribbonId}>
        <div className="cultivationHeaderRibbon__inner">
          <TopRibbon
            surface="tray"
            compact={collapsed}
            className="cultivationHeaderRibbon__topRibbon"
            chips={(
              <>
                <ChromeChip variant="tag" tone={readinessTone} text={readinessLabel} />
                <ChromeChip variant="tag" tone={activityTone} text={activityLabel} />
              </>
            )}
            end={<span className="cultivationHeaderRibbon__endLine">Stage {substage}</span>}
          >
            <RibbonStat label="Realm" icon={<Mountain size={13} />} value={realmLabel} detail={`Stage ${substage}`} truncate />
            <RibbonStat label="Path" icon={<Target size={13} />} value={pathLabel} truncate />
            <RibbonStat label="Spirit Root" icon={<TreePine size={13} />} value={spiritRootLine} truncate />
            <RibbonStat label="Heart Law" icon={<Sparkles size={13} />} value={heartLawLine} truncate />
            <RibbonStat label="City" icon={<Activity size={13} />} value={cityLabel} truncate />
            {!collapsed ? (
              <RibbonStat
                label="Qi"
                icon={<Sparkles size={13} />}
                value={formatNumber(qi)}
                detail={`${formatNumber(qiPerSecond)} /s`}
                title={rateTooltip}
                truncate
              />
            ) : null}
            {!collapsed ? (
              <RibbonStat
                label="Stability"
                icon={<Shield size={13} />}
                value={`${Math.round(stabilityPct)}%`}
                detail={`${stability}/${stabilityCap}`}
                tone={stabilityPct >= 70 ? 'success' : stabilityPct >= 30 ? 'default' : 'warning'}
              />
            ) : null}
            {!collapsed ? (
              <RibbonStat label="Rate" icon={<Gauge size={13} />} value={`${formatNumber(qiPerSecond)} /s`} title={rateTooltip} truncate />
            ) : null}
          </TopRibbon>
        </div>
      </div>
      <button
        type="button"
        className={`cultivationHeaderRibbon__handle uiNoShift ${collapsed ? 'is-collapsed' : 'is-expanded'}`}
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? 'Expand cultivation header' : 'Collapse cultivation header'}
        aria-expanded={!collapsed}
        aria-controls={ribbonId}
      >
        <span aria-hidden="true" className="cultivationHeaderRibbon__handleIcon">
          ▾
        </span>
      </button>
    </div>
  );
}
