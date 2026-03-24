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
      <div>Ruin: {ruinName}</div>
      <div>{bestUsedWhen}</div>
      <div>Rooms: {roomCount}</div>
      <div className="ruinsSummaryCard__outputs">{leadMaterialsLine}</div>
      <div>{anchorLine}</div>
      <div>{rarePityLine}</div>
      {goldSecondaryLine ? <div>{goldSecondaryLine}</div> : null}
      <div>{autoRepeatLine}</div>
      <div>{runStateLine}</div>
      {trackedBountyLine}
    </section>
  );
}
