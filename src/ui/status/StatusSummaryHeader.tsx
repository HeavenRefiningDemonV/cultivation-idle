import { AlertCircle, Compass, Mountain, Sparkles, Swords, Target, TreePine } from 'lucide-react';
import { TopRibbon, RibbonStat, ChromeChip } from '../chrome/index.js';
import { CombatStatTile } from './CombatStatTile.js';

type StatusSummaryHeaderProps = {
  realmName: string;
  stageText: string;
  pathLabel: string;
  archetypeLabel: string;
  archetypeSummary: string;
  spiritRootLine: string;
  heartLawLine: string;
  cityLabel: string;
  readinessLabel: string;
  diagnosisLabel?: string | null;
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
  spiritRootLine,
  heartLawLine,
  cityLabel,
  readinessLabel,
  diagnosisLabel,
  biggestShortfallLine,
  topFixLine,
  combatStrip,
}: StatusSummaryHeaderProps) {
  const readinessTone = readinessLabel.toLowerCase().includes('ready') ? 'success' : 'warning';

  return (
    <div className="statusSummaryPanel statusScreenCardBase">
      <TopRibbon
        surface="tray"
        className="statusSummaryRibbon"
        chips={(
          <>
            <ChromeChip variant="tag" tone={readinessTone} text={readinessLabel} />
            {diagnosisLabel ? <ChromeChip variant="tag" tone="warning" text={diagnosisLabel} /> : null}
          </>
        )}
        end={<span className="statusSummaryRibbon__end">Build archetype: {archetypeLabel}</span>}
      >
        <RibbonStat label="Realm" icon={<Mountain size={13} />} value={realmName} detail={stageText} truncate />
        <RibbonStat label="Path" icon={<Target size={13} />} value={pathLabel} detail={archetypeSummary} truncate />
        <RibbonStat label="Spirit Root" icon={<TreePine size={13} />} value={spiritRootLine} truncate />
        <RibbonStat label="Heart Law" icon={<Sparkles size={13} />} value={heartLawLine} truncate />
        <RibbonStat label="City" icon={<Compass size={13} />} value={cityLabel} truncate />
      </TopRibbon>

      <div className="statusSummaryTopGrid">
        <div className="statusIdentityBand" aria-label="Run identity">
          <div className="statusSummaryLabelRow">
            <TreePine className="statusSummaryIcon" aria-hidden />
            <span className="statusSummaryLabel">Spirit Root</span>
          </div>
          <p className="statusIdentityBand__line">{spiritRootLine}</p>
          <p className="statusIdentityBand__detail">{pathLabel} • {heartLawLine}</p>
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
