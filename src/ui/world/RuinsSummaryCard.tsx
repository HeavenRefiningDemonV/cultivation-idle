import type { ReactNode } from 'react';

export function RuinsSummaryCard(props: {
  ruinName: string;
  roleTag: string;
  bestUsedWhen: string;
  roomCount: number;
  leadMaterialsLine: string;
  anchorLine: string;
  rarePityLine: string;
  goldSecondaryLine?: string;
  autoRepeatLine: string;
  runStateLine: string;
  trackedBountyLine?: ReactNode;
}) {
  const {
    ruinName,
    roleTag,
    bestUsedWhen,
    roomCount,
    leadMaterialsLine,
    anchorLine,
    rarePityLine,
    goldSecondaryLine,
    autoRepeatLine,
    runStateLine,
    trackedBountyLine,
  } = props;

  return (
    <section className="ruinsSummaryCard">
      <div className="ruinsSummaryCard__header">
        <strong>Ruins</strong>
        <span>{roleTag}</span>
      </div>
      <div className="ruinsSummaryCard__identity">Ruin: {ruinName}</div>
      <div className="ruinsSummaryCard__purpose">{bestUsedWhen}</div>
      <div className="ruinsSummaryCard__identity">Rooms: {roomCount}</div>
      <div className="ruinsSummaryCard__outputs">{leadMaterialsLine}</div>
      <div className="ruinsSummaryCard__deterministicBlock">
        <div>{anchorLine}</div>
        <div>{rarePityLine}</div>
      </div>
      {goldSecondaryLine ? <div className="ruinsSummaryCard__boundary">{goldSecondaryLine}</div> : null}
      <div className="ruinsSummaryCard__statusRow">{autoRepeatLine}</div>
      <div className="ruinsSummaryCard__statusRow">{runStateLine}</div>
      <div className={`ruinsSummaryCard__trackedBounty ${trackedBountyLine ? '' : 'ruinsSummaryCard__trackedBounty--empty'}`}>
        {trackedBountyLine ?? <span aria-hidden>—</span>}
      </div>
    </section>
  );
}
