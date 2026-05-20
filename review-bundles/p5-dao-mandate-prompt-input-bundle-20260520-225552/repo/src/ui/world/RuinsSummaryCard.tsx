import type { ReactNode } from 'react';
import type { RuinsSupportExitHint } from './buildRuinsSupportContextSurface.js';

function ExitHintSlot(props: {
  hint: RuinsSupportExitHint | null;
  tone: 'primary' | 'secondary';
  onSelect?: (destination: RuinsSupportExitHint['destination']) => void;
}) {
  const { hint, tone, onSelect } = props;
  const className = `ruinsSummaryCard__exitHint ruinsSummaryCard__exitHint--${tone}${hint ? '' : ' ruinsSummaryCard__exitHint--empty'}`;

  if (!hint) {
    return <div className={className}><span aria-hidden="true"> </span></div>;
  }

  return (
    <div className={className}>
      <div className="ruinsSummaryCard__exitHintTitle">{hint.label}</div>
      <div className="ruinsSummaryCard__exitHintReason">{hint.reason}</div>
      <div className="ruinsSummaryCard__exitHintActionSlot">
        {hint.routeable ? (
          <button type="button" className="ruinsSummaryCard__exitHintAction" onClick={() => onSelect?.(hint.destination)}>
            {hint.ctaLabel}
          </button>
        ) : <span aria-hidden="true"> </span>}
      </div>
    </div>
  );
}

export function RuinsSummaryCard(props: {
  ruinName: string;
  roleTag: string;
  bestUsedWhen: string;
  roomCountLine: string;
  leadMaterialsLine: string;
  anchorLine: string;
  anchorRewardPlateArtUrl?: string | null;
  anchorGlowOverlayUrl?: string | null;
  rarePityLine: string;
  goldSecondaryLine?: string;
  autoRepeatLine: string;
  runStateLine: string;
  trackedBountyLine?: ReactNode;
  trackedBountyVisible: boolean;
  primaryExitHint: RuinsSupportExitHint | null;
  secondaryExitHint: RuinsSupportExitHint | null;
  onExitHintSelect?: (destination: RuinsSupportExitHint['destination']) => void;
}) {
  const {
    ruinName,
    roleTag,
    bestUsedWhen,
    roomCountLine,
    leadMaterialsLine,
    anchorLine,
    anchorRewardPlateArtUrl,
    anchorGlowOverlayUrl,
    rarePityLine,
    goldSecondaryLine,
    autoRepeatLine,
    runStateLine,
    trackedBountyLine,
    trackedBountyVisible,
    primaryExitHint,
    secondaryExitHint,
    onExitHintSelect,
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
        <div
          className={`ruinsSummaryCard__anchorRewardPlate${anchorRewardPlateArtUrl ? ' ruinsSummaryCard__anchorRewardPlate--art' : ''}`}
          style={anchorRewardPlateArtUrl ? { backgroundImage: `url(${anchorRewardPlateArtUrl})` } : undefined}
          aria-hidden="true"
        />
        {anchorGlowOverlayUrl ? (
          <div
            className="ruinsSummaryCard__anchorGlowOverlay"
            style={{ backgroundImage: `url(${anchorGlowOverlayUrl})` }}
            aria-hidden="true"
          />
        ) : null}
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
      <div className="ruinsSummaryCard__adjacency" aria-label="Ruins adjacency hints">
        <ExitHintSlot hint={primaryExitHint} tone="primary" onSelect={onExitHintSelect} />
        <ExitHintSlot hint={secondaryExitHint} tone="secondary" onSelect={onExitHintSelect} />
      </div>
      {goldSecondaryLine ? <div className="ruinsSummaryCard__boundary">{goldSecondaryLine}</div> : null}
    </section>
  );
}
