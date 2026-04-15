import type { ReactNode } from 'react';

export function RuinsSummaryCard(props: {
  ruinName: string;
  roleTag: string;
  bestUsedWhen: string;
  roomCountLine: string;
  leadMaterialsLine: string;
  anchorLine: string;
  rarePityLine: string;
  goldSecondaryLine?: string;
  autoRepeatLine: string;
  runStateLine: string;
  trackedBountyLine?: ReactNode;
  trackedBountyVisible: boolean;
}) {
  const {
    ruinName,
    roleTag,
    bestUsedWhen,
    roomCountLine,
    leadMaterialsLine,
    anchorLine,
    rarePityLine,
    goldSecondaryLine,
    autoRepeatLine,
    runStateLine,
    trackedBountyLine,
    trackedBountyVisible,
  } = props;

  return (
    <section className="ruinsSummaryCard">
      <div className="ruinsSummaryCard__header">
        <div>
          <div className="ruinsSummaryCard__label">Ruins</div>
          <strong className="ruinsSummaryCard__ruinName">{ruinName}</strong>
        </div>
        <span className="ruinsSummaryCard__roleTag">{roleTag}</span>
      </div>
      <div className="ruinsSummaryCard__purpose">{bestUsedWhen}</div>
      <div className="ruinsSummaryCard__structure">{roomCountLine}</div>
      <div className="ruinsSummaryCard__deterministicBlock" aria-label="Deterministic value preview">
        <div className="ruinsSummaryCard__deterministicTitle">Deterministic value preview</div>
        <div className="ruinsSummaryCard__deterministicLine">{anchorLine}</div>
        <div className="ruinsSummaryCard__deterministicLine ruinsSummaryCard__outputs">{leadMaterialsLine}</div>
        <div className="ruinsSummaryCard__deterministicLine">{rarePityLine}</div>
      </div>
      <div className="ruinsSummaryCard__supportRow">
        <div className="ruinsSummaryCard__statusRow">{autoRepeatLine}</div>
        <div className="ruinsSummaryCard__statusRow">{runStateLine}</div>
      </div>
      <div className={`ruinsSummaryCard__trackedBounty ${trackedBountyVisible ? '' : 'ruinsSummaryCard__trackedBounty--empty'}`}>
        {trackedBountyLine ?? <span aria-hidden>—</span>}
      </div>
      {goldSecondaryLine ? <div className="ruinsSummaryCard__boundary">{goldSecondaryLine}</div> : null}
    </section>
  );
}
