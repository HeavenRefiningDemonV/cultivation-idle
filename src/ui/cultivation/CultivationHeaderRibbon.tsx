import { Activity, Gauge, Mountain, Shield, Sparkles } from 'lucide-react';
import { formatNumber } from '../../utils/numbers';
import './CultivationHeaderRibbon.scss';

type CultivationHeaderRibbonProps = {
  realmLabel: string;
  substage: number;
  qi: string;
  qiPerSecond: string;
  rateTooltip: string;
  activityLabel: string;
  stability: number;
  stabilityCap: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function CultivationHeaderRibbon({
  realmLabel,
  substage,
  qi,
  qiPerSecond,
  rateTooltip,
  activityLabel,
  stability,
  stabilityCap,
  collapsed,
  onToggleCollapsed,
}: CultivationHeaderRibbonProps) {
  const stabilityPct = stabilityCap > 0 ? Math.min(100, (stability / stabilityCap) * 100) : 0;

  return (
    <div className={`cultivationHeaderRibbon ${collapsed ? 'cultivationHeaderRibbon--collapsed' : ''}`}>
      <div className="cultivationHeaderRibbonContent">
        <div className="cultivationHeaderRibbonGrid">
          <div className="cultivationHeaderRibbonItem">
            <div className="cultivationHeaderRibbonLabel">
              <Mountain size={14} aria-hidden="true" />
              Realm
            </div>
            <div className="cultivationHeaderRibbonValue">{realmLabel}</div>
            <div className="cultivationHeaderRibbonSub">Stage {substage}</div>
          </div>
          <div className="cultivationHeaderRibbonItem">
            <div className="cultivationHeaderRibbonLabel">
              <Sparkles size={14} aria-hidden="true" />
              Qi
            </div>
            <div className="cultivationHeaderRibbonValue">{formatNumber(qi)}</div>
          </div>
          <div className="cultivationHeaderRibbonItem" title={rateTooltip}>
            <div className="cultivationHeaderRibbonLabel">
              <Gauge size={14} aria-hidden="true" />
              Cultivation Rate
            </div>
            <div className="cultivationHeaderRibbonValue">{formatNumber(qiPerSecond)} /s</div>
            <div className="cultivationHeaderRibbonSub">Hover for breakdown</div>
          </div>
          {!collapsed ? (
            <>
              <div className="cultivationHeaderRibbonItem">
                <div className="cultivationHeaderRibbonLabel">
                  <Shield size={14} aria-hidden="true" />
                  Stability
                </div>
                <div className="cultivationHeaderRibbonValue">{Math.round(stabilityPct)}%</div>
                <div className="cultivationHeaderRibbonSub">
                  {stability}/{stabilityCap}
                </div>
              </div>
              <div className="cultivationHeaderRibbonItem">
                <div className="cultivationHeaderRibbonLabel">
                  <Activity size={14} aria-hidden="true" />
                  Foreground Activity
                </div>
                <div className="cultivationHeaderRibbonValue">{activityLabel}</div>
              </div>
            </>
          ) : null}
        </div>
        {collapsed ? (
          <div className="cultivationHeaderRibbonExtras">
            <div className="cultivationHeaderRibbonIndicator" title={`Stability ${Math.round(stabilityPct)}%`}>
              <Shield size={12} aria-hidden="true" />
              <span>{Math.round(stabilityPct)}%</span>
            </div>
            <div className="cultivationHeaderRibbonIndicator" title={`Activity: ${activityLabel}`}>
              <Activity size={12} aria-hidden="true" />
              <span>{activityLabel}</span>
            </div>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="cultivationHeaderRibbonToggle"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Expand header ribbon' : 'Collapse header ribbon'}
      >
        <span aria-hidden="true" className="cultivationHeaderRibbonToggleIcon">
          {collapsed ? '▾' : '▴'}
        </span>
      </button>
    </div>
  );
}
