import { Cloud, Mountain, Sun, Target } from 'lucide-react';

type StatusSummaryHeaderProps = {
  realmName: string;
  realmIndex: number;
  stageText: string;
  qiText: string;
  qiPerSecondText: string;
  focusModeText: string;
  totalAurasText: string;
  hasQiFlow: boolean;
};

function getRealmIcon(realmIndex: number) {
  if (realmIndex <= 1) {
    return Cloud;
  }

  if (realmIndex >= 4) {
    return Sun;
  }

  return Mountain;
}

export function StatusSummaryHeader({
  realmName,
  realmIndex,
  stageText,
  qiText,
  qiPerSecondText,
  focusModeText,
  totalAurasText,
  hasQiFlow,
}: StatusSummaryHeaderProps) {
  const RealmIcon = getRealmIcon(realmIndex);

  return (
    <div className="statusSummaryPanel statusScreenCardBase">
      <div className="statusSummaryGrid">
        <div className="statusSummaryBlock statusSummaryBlock--realm">
          <div className="statusSummaryLabelRow">
            <RealmIcon className="statusSummaryIcon" aria-hidden />
            <span className="statusSummaryLabel">Realm</span>
          </div>
          <div className="statusSummaryValueRow">
            <span className="statusSummaryValue">{realmName}</span>
          </div>
          <div className="statusSummarySubRow">
            <span className="statusSummarySub">{stageText}</span>
          </div>
        </div>

        <div className="statusSummaryBlock statusSummaryBlock--qi">
          <div className="statusSummaryLabelRow">
            <span
              className={`statusSummaryQiOrb ${hasQiFlow ? 'is-flowing' : ''}`}
              aria-hidden
            />
            <span className="statusSummaryLabel">Qi</span>
          </div>
          <div className="statusSummaryValueRow">
            <span className="statusSummaryValue statusSummaryValue--qi">{qiText}</span>
          </div>
          <div className="statusSummarySubRow">
            <span className="statusSummarySub">{qiPerSecondText}</span>
          </div>
        </div>

        <div className="statusSummaryBlock statusSummaryBlock--mode">
          <div className="statusSummaryLabelRow">
            <Target className="statusSummaryIcon" aria-hidden />
            <span className="statusSummaryLabel">Focus</span>
          </div>
          <div className="statusSummaryValueRow">
            <span className="statusSummaryFocusChip">{focusModeText}</span>
          </div>
          <div className="statusSummarySubRow">
            <span className="statusSummarySub">Auras: {totalAurasText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
