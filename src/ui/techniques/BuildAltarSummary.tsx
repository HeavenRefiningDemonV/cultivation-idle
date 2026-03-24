export interface BuildAltarFloorState {
  label: string;
  state: 'On Floor' | 'Below Floor' | 'Close';
}

export interface BuildAltarSummaryProps {
  pathLabel: string;
  archetypeLabel: string;
  archetypeSummary: string;
  pathAlignmentScore: number;
  mastery: BuildAltarFloorState;
  rank: BuildAltarFloorState;
  runes: BuildAltarFloorState;
  emptySlots: number;
  aiProfileLine: string;
  castingPolicyLine: string;
  postureJudgment: string;
  nextFix: string;
}

export function BuildAltarSummary(props: BuildAltarSummaryProps) {
  const {
    pathLabel,
    archetypeLabel,
    archetypeSummary,
    pathAlignmentScore,
    mastery,
    rank,
    runes,
    emptySlots,
    aiProfileLine,
    castingPolicyLine,
    postureJudgment,
    nextFix,
  } = props;

  return (
    <section className="techniquesBuildAltar">
      <div className="techniquesBuildAltar__grid">
        <div>
          <div className="techniquesBuildAltar__sectionTitle">Identity</div>
          <div>Path: {pathLabel}</div>
          <div>Archetype: {archetypeLabel}</div>
          <div>{archetypeSummary}</div>
          <div>Path Alignment: {pathAlignmentScore}%</div>
        </div>
        <div>
          <div className="techniquesBuildAltar__sectionTitle">Floor Status</div>
          <div>Mastery: {mastery.state}</div>
          <div>Rank: {rank.state}</div>
          <div>Runes: {runes.state}</div>
          {emptySlots > 0 ? <div>Empty unlocked slots: {emptySlots}</div> : null}
        </div>
        <div>
          <div className="techniquesBuildAltar__sectionTitle">Combat Posture</div>
          <div>{aiProfileLine}</div>
          <div>{castingPolicyLine}</div>
          <div>{postureJudgment}</div>
        </div>
      </div>
      <div className="techniquesBuildAltar__nextFix">Next Fix: {nextFix}</div>
    </section>
  );
}
