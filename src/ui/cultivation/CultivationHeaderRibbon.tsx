import { useEffect, useState } from 'react';
import { Activity, Cloud, Gauge, Mountain, Shield, Sparkles, Sun } from 'lucide-react';
import lotusClosed from '../../assets/onscreen/qi_lotus_closed.png';
import lotusFull from '../../assets/onscreen/qi_lotus_full.png';
import lotusOpen from '../../assets/onscreen/qi_lotus_open.png';
import { formatNumber } from '../../utils/numbers';
import './CultivationHeaderRibbon.scss';

type QiLotusState = 'closed' | 'open' | 'full';

type CultivationHeaderRibbonProps = {
  realmLabel: string;
  substage: number;
  realmIndex?: number;
  qi: string;
  qiPerSecond: string;
  rateTooltip: string;
  activityLabel: string;
  activityType: string | null;
  stability: number;
  stabilityCap: number;
  breakthroughImminent?: boolean;
};

function getRealmIcon(realmLabel: string, realmIndex?: number) {
  if (realmIndex === 0 || /condensation/i.test(realmLabel)) {
    return <Cloud size={16} aria-hidden="true" />;
  }
  if (/golden core/i.test(realmLabel)) {
    return <Sun size={16} aria-hidden="true" />;
  }
  return <Mountain size={16} aria-hidden="true" />;
}

export function CultivationHeaderRibbon({
  realmLabel,
  substage,
  realmIndex,
  qi,
  qiPerSecond,
  rateTooltip,
  activityLabel,
  activityType,
  stability,
  stabilityCap,
  breakthroughImminent,
}: CultivationHeaderRibbonProps) {
  const storageKey = 'ui.cultivation.headerCollapsed';
  const ribbonId = 'cultivationHeaderPanel';
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(storageKey) === '1';
  });
  const stabilityPct = stabilityCap > 0 ? Math.min(100, (stability / stabilityCap) * 100) : 0;
  const stabilityTone = stabilityPct >= 70 ? 'ok' : stabilityPct >= 30 ? 'warn' : 'danger';
  const activityTone = activityType === 'meditate' ? 'active' : activityType ? 'busy' : 'idle';
  const activityTooltip =
    activityTone === 'active'
      ? 'Meditating. Insight and Study are active.'
      : activityTone === 'busy'
        ? 'Foreground activity running. Meditation unavailable.'
        : 'Qi flows passively. Meditate to gain Insight/Study.';
  const lotusState: QiLotusState = breakthroughImminent
    ? 'full'
    : activityType === 'meditate'
      ? 'open'
      : 'closed';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className={`cultivationHeaderRibbon ${collapsed ? 'is-collapsed' : 'is-expanded'}`}>
      <div className="cultivationHeaderRibbon__panel" id={ribbonId}>
        <div className="cultivationHeaderRibbon__inner">
          <div className={`cultivationHeaderRibbon__grid ${collapsed ? 'is-collapsed' : 'is-expanded'}`}>
            <div className="cultivationHeaderRibbonItem">
              <div className="cultivationHeaderRibbonLabel">
                <span className="cultivationHeaderRealmIcon" aria-hidden="true">
                  {getRealmIcon(realmLabel, realmIndex)}
                </span>
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
              <div className="cultivationHeaderRibbonValue cultivationHeaderRibbonValue--qi">
                <span className="cultivationHeaderQiLotus" data-state={lotusState} aria-hidden="true">
                  <img
                    className="cultivationHeaderQiLotusImg cultivationHeaderQiLotusImg--closed"
                    src={lotusClosed}
                    alt=""
                  />
                  <img
                    className="cultivationHeaderQiLotusImg cultivationHeaderQiLotusImg--open"
                    src={lotusOpen}
                    alt=""
                  />
                  <img
                    className="cultivationHeaderQiLotusImg cultivationHeaderQiLotusImg--full"
                    src={lotusFull}
                    alt=""
                  />
                </span>
                {formatNumber(qi)}
              </div>
            </div>
            <div className="cultivationHeaderRibbonItem" title={rateTooltip}>
              <div className="cultivationHeaderRibbonLabel">
                <Gauge size={14} aria-hidden="true" />
                Cultivation Rate
              </div>
              <div className="cultivationHeaderRibbonValue">{formatNumber(qiPerSecond)} /s</div>
              {!collapsed ? <div className="cultivationHeaderRibbonSub">Hover for breakdown</div> : null}
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
                  <div className="cultivationHeaderRibbonValue">
                    <span
                      className={`cultivationHeaderActivityBadge cultivationHeaderActivityBadge--${activityTone}`}
                      title={activityTooltip}
                    >
                      <span className="cultivationHeaderActivityBreath" aria-hidden="true" />
                      {activityLabel}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="cultivationHeaderRibbonCollapsedMeta">
                <div className="cultivationHeaderRibbonIndicator" title={`Stability ${Math.round(stabilityPct)}%`}>
                  <span
                    className={`cultivationHeaderStabilityDot cultivationHeaderStabilityDot--${stabilityTone}`}
                    aria-hidden="true"
                  />
                  <span>{Math.round(stabilityPct)}%</span>
                </div>
                <div
                  className={`cultivationHeaderActivityBadge cultivationHeaderActivityBadge--${activityTone}`}
                  title={activityTooltip}
                >
                  <span className="cultivationHeaderActivityBreath" aria-hidden="true" />
                  {activityLabel}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        className="cultivationHeaderRibbon__handle"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={collapsed ? 'Expand cultivation header' : 'Collapse cultivation header'}
        aria-expanded={!collapsed}
        aria-controls={ribbonId}
      >
        <span aria-hidden="true" className="cultivationHeaderRibbon__handleIcon">
          {collapsed ? '▾' : '▴'}
        </span>
      </button>
    </div>
  );
}
