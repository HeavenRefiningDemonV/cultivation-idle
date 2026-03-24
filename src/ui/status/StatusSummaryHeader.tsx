import { AlertCircle, Compass, Mountain, Swords, Target } from 'lucide-react';
import { CombatStatTile } from './CombatStatTile.js';

type StatusSummaryHeaderProps = {
  realmName: string;
  stageText: string;
  pathLabel: string;
  archetypeLabel: string;
  archetypeSummary: string;
  biggestShortfallLine: string;
  topFixLine: string | null;
  combatStrip: Array<{ label: string; value: string; tone: 'hp' | 'offense' | 'defense' | 'crit' }>;
};

export function StatusSummaryHeader({
  realmName,
  stageText,
  pathLabel,
  archetypeLabel,
  archetypeSummary,
  biggestShortfallLine,
  topFixLine,
  combatStrip,
}: StatusSummaryHeaderProps) {
  return (
    <div className="statusSummaryPanel statusScreenCardBase">
      <div className="statusSummaryTopGrid">
        <div className="statusSummaryIdentity">
          <div className="statusSummaryLabelRow">
            <Mountain className="statusSummaryIcon" aria-hidden />
            <span className="statusSummaryLabel">Realm</span>
          </div>
          <div className="statusSummaryValueRow">
            <span className="statusSummaryValue">{realmName}</span>
          </div>
          <div className="statusSummarySubRow">
            <span className="statusSummarySub">{stageText}</span>
          </div>
        </div>

        <div className="statusSummaryIdentity">
          <div className="statusSummaryLabelRow">
            <Target className="statusSummaryIcon" aria-hidden />
            <span className="statusSummaryLabel">Path</span>
          </div>
          <div className="statusSummaryValueRow">
            <span className="statusSummaryValue">{pathLabel}</span>
          </div>
          <div className="statusSummarySubRow">
            <span className="statusSummarySub">Build archetype: {archetypeLabel}</span>
          </div>
          <div className="statusSummarySubRow">
            <span className="statusSummarySub">{archetypeSummary}</span>
          </div>
        </div>

        <div className="statusBiggestShortfall">
          <div className="statusSummaryLabelRow">
            <AlertCircle className="statusSummaryIcon" aria-hidden />
            <span className="statusSummaryLabel">Biggest Shortfall</span>
          </div>
          <p className="statusBiggestShortfallBody">{biggestShortfallLine}</p>
          {topFixLine ? <p className="statusBiggestShortfallHint">Top Fix: {topFixLine}</p> : null}
        </div>
      </div>

      <div className="statusCombatStrip" aria-label="Combat strength strip">
        <div className="statusSummaryLabelRow">
          <Swords className="statusSummaryIcon" aria-hidden />
          <span className="statusSummaryLabel">Combat Strength</span>
        </div>
        <div className="statusCombatStripGrid">
          {combatStrip.slice(0, 4).map((entry) => (
            <CombatStatTile
              key={entry.label}
              label={entry.label}
              value={entry.value}
              tone={entry.tone}
              icon={<Compass size={14} />}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
