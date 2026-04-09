import { AlertCircle, Compass, Mountain, Swords, Target } from 'lucide-react';
import type { RunCompassActionLine } from '../../systems/ui/runCompass/index.js';
import { BadgeSlot } from '../shell/BadgeSlot.js';

type StatusSummaryHeaderProps = {
  realmName: string;
  stageText: string;
  pathLabel: string;
  spiritRootLine: string;
  archetypeLabel: string;
  archetypeSummary: string;
  biggestShortfallLine: string;
  topFixLine: string | null;
  topFixAction: RunCompassActionLine | null;
  onRunCompassAction: (action: RunCompassActionLine) => void;
  combatStrip: Array<{ label: string; value: string; tone: 'hp' | 'offense' | 'defense' | 'crit' }>;
};

export function StatusSummaryHeader({
  realmName,
  stageText,
  pathLabel,
  spiritRootLine,
  archetypeLabel,
  archetypeSummary,
  biggestShortfallLine,
  topFixLine,
  topFixAction,
  onRunCompassAction,
  combatStrip,
}: StatusSummaryHeaderProps) {
  return (
    <header className="statusSummaryRibbon statusScreenCardBase" aria-label="Status quick diagnosis ribbon">
      <div className="statusSummaryRibbonGrid">
        <div className="statusSummaryRibbonCell statusSummaryRibbonCell--identity">
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

        <div className="statusSummaryRibbonCell statusSummaryRibbonCell--path">
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
            <span className="statusSummarySub">Spirit Root: {spiritRootLine}</span>
          </div>
          <div className="statusSummarySubRow">
            <span className="statusSummarySub">{archetypeSummary}</span>
          </div>
        </div>

        <div className="statusSummaryRibbonCell statusSummaryRibbonCell--shortfall">
          <div className="statusSummaryLabelRow">
            <AlertCircle className="statusSummaryIcon" aria-hidden />
            <span className="statusSummaryLabel">Biggest Shortfall</span>
          </div>
          <p className="statusBiggestShortfallBody">{biggestShortfallLine}</p>
          <p className={`statusBiggestShortfallHint ${topFixLine ? '' : 'statusBiggestShortfallHint--empty'}`}>
            {topFixLine ? `Top Fix: ${topFixLine}` : 'Top Fix: —'}
          </p>
          <div className="statusBiggestShortfallActionLane">
            <BadgeSlot preset="rowEnd">
              {topFixAction ? (
                <button type="button" className="statusBiggestShortfallAction uiNoShift" onClick={() => onRunCompassAction(topFixAction)}>
                  Open best fix
                </button>
              ) : null}
            </BadgeSlot>
          </div>
        </div>
      </div>

      <div className="statusSummaryCombatStrip" aria-label="Combat strength strip">
        <div className="statusSummaryLabelRow">
          <Swords className="statusSummaryIcon" aria-hidden />
          <span className="statusSummaryLabel">Combat Strength</span>
        </div>
        <div className="statusSummaryCombatPills">
          {combatStrip.slice(0, 4).map((entry) => (
            <div key={entry.label} className={`statusSummaryCombatPill statusSummaryCombatPill--${entry.tone}`}>
              <Compass className="statusSummaryCombatPillIcon" aria-hidden />
              <span className="statusSummaryCombatPillLabel">{entry.label}</span>
              <span className="statusSummaryCombatPillValue">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
