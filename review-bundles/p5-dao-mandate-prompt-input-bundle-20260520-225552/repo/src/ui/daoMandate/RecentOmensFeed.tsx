import classNames from 'classnames';

import type {
  DaoMandateEffectiveMotionMode,
  DaoRecentOmen,
} from '../../systems/ui/daoMandate/index.js';
import { DaoMandateStatusSeal } from './DaoMandateStatusSeal.js';
import { getDaoMandateMotionClassName } from './daoMandateUiFormatters.js';
import './RecentOmensFeed.scss';

export interface RecentOmensFeedProps {
  omens: DaoRecentOmen[];
  title?: string;
  variant?: 'compact' | 'default' | 'full';
  maxItems?: number;
  motionMode?: DaoMandateEffectiveMotionMode;
  className?: string;
}

export function RecentOmensFeed({
  omens,
  title = 'Recent Omens',
  variant = 'default',
  maxItems = variant === 'full' ? 5 : 3,
  motionMode = 'medium',
  className,
}: RecentOmensFeedProps) {
  const visibleOmens = omens.slice(0, maxItems);
  if (visibleOmens.length === 0) return null;

  return (
    <section
      className={classNames(
        'daoRecentOmensFeed',
        `daoRecentOmensFeed--${variant}`,
        getDaoMandateMotionClassName(motionMode),
        className,
      )}
      data-dao-motion={motionMode}
      aria-label={title}
    >
      <header className="daoRecentOmensFeed__header">
        <span className="daoRecentOmensFeed__eyebrow">Omen record</span>
        <h3>{title}</h3>
      </header>
      <ul className="daoRecentOmensFeed__list">
        {visibleOmens.map((omen) => (
          <li key={omen.id} className="daoRecentOmensFeed__item">
            <DaoMandateStatusSeal tone={omen.tone} label={omen.label} compact motionMode={motionMode} />
            <div className="daoRecentOmensFeed__body">
              <strong>{omen.label}</strong>
              <span>{variant === 'compact' ? omen.memoryLine : omen.detail}</span>
              {variant === 'full' && omen.rewardSummary ? <span>{omen.rewardSummary}</span> : null}
              {omen.readinessDeltaLabel ? <span className="daoRecentOmensFeed__delta">{omen.readinessDeltaLabel}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
