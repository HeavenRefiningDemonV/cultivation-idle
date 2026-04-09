import type { ReactNode } from 'react';
import type { SpiritRoot } from '../../types/index.js';

export type DoctrineSummaryRow = {
  label: string;
  value: string;
  detail?: string;
  intent?: 'identity' | 'tuning';
};

type CultivationDoctrineSummaryProps = {
  pathLabel: string;
  pathSummary: string;
  spiritRootLine: string;
  spiritRootDetail: string;
  heartLawLine: string;
  heartLawDetail: string;
  resonanceLine: string;
  resonanceDetail: string;
  breathLabel: string;
  breathSummary: string;
  focusLabel: string;
  focusSummary: string;
  doctrineSentence: string;
  spiritRoot: SpiritRoot | null;
  verseSlot?: ReactNode;
  mode?: 'summary' | 'detail';
  onOpenDetail?: () => void;
  onCloseDetail?: () => void;
  onPinDetail?: () => void;
  pinned?: boolean;
};

export function CultivationDoctrineSummary({
  pathLabel,
  pathSummary,
  spiritRootLine,
  spiritRootDetail,
  heartLawLine,
  heartLawDetail,
  resonanceLine,
  resonanceDetail,
  breathLabel,
  breathSummary,
  focusLabel,
  focusSummary,
  doctrineSentence,
  spiritRoot,
  verseSlot,
  mode = 'summary',
  onOpenDetail,
  onCloseDetail,
  onPinDetail,
  pinned = false,
}: CultivationDoctrineSummaryProps) {
  const isSummary = mode === 'summary';
  const rows: DoctrineSummaryRow[] = [
    { label: 'Path', value: pathLabel, detail: pathSummary, intent: 'identity' },
    { label: 'Spirit Root', value: spiritRootLine, detail: spiritRootDetail, intent: 'identity' },
    { label: 'Heart Law', value: heartLawLine, detail: heartLawDetail, intent: 'identity' },
    { label: 'Resonance', value: resonanceLine, detail: resonanceDetail, intent: 'identity' },
    { label: 'Breath Mode', value: breathLabel, detail: breathSummary, intent: 'tuning' },
    { label: 'Focus Mode', value: focusLabel, detail: focusSummary, intent: 'tuning' },
  ];
  const visibleRows = rows;

  return (
    <section className={`cultivationDoctrinePanel cultivationCommandCard${isSummary ? ' cultivationDoctrinePanel--compact cultivationDoctrinePanel--summary' : ' cultivationDoctrinePanel--detail'}`} aria-label="Doctrine state">
      <div className="cultivationCommandCard__header">
        <div>
          <div className="cultivationCommandCard__eyebrow">Doctrine</div>
          <h2 className="cultivationCommandCard__title">{isSummary ? 'Doctrine seal' : 'Doctrine detail'}</h2>
        </div>
        <span className="cultivationCommandCard__badge">{spiritRoot ? 'Aligned' : 'Dormant'}</span>
      </div>

      <div className="cultivationDoctrinePanel__rows">
        {visibleRows.map((row) => (
          <div key={row.label} className={`cultivationDoctrinePanel__row cultivationDoctrinePanel__row--${row.intent ?? 'tuning'}${row.label === 'Heart Law' ? ' cultivationDoctrinePanel__row--heartLaw' : ''}`}>
            <div className="cultivationDoctrinePanel__rowTop">
              <span className="cultivationDoctrinePanel__label">{row.label}</span>
              <span className="cultivationDoctrinePanel__value">{row.value}</span>
            </div>
            {row.detail ? <div className="cultivationDoctrinePanel__detail">{row.detail}</div> : null}
            {row.label === 'Heart Law' && verseSlot ? (
              <div className={`cultivationDoctrinePanel__verseSlot${isSummary ? ' cultivationDoctrinePanel__verseSlot--summary' : ''}`}>
                {!isSummary ? <div className="cultivationDoctrinePanel__verseEyebrow">Verse rail</div> : null}
                {verseSlot}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <p className="cultivationDoctrinePanel__sentence">{doctrineSentence}</p>
      <div className="cultivationDoctrinePanel__actions">
        {isSummary && onOpenDetail ? (
          <button type="button" className="button-standard cultivationCommandLinkButton cultivationCommandLinkButton--subtle" onClick={onOpenDetail}>
            Open doctrine
          </button>
        ) : null}
        {!isSummary && onPinDetail ? (
          <button type="button" className="button-standard cultivationCommandLinkButton cultivationCommandLinkButton--subtle" onClick={onPinDetail}>
            {pinned ? 'Pinned' : 'Pin doctrine'}
          </button>
        ) : null}
        {!isSummary && onCloseDetail ? (
          <button type="button" className="button-standard cultivationCommandLinkButton cultivationCommandLinkButton--subtle" onClick={onCloseDetail}>
            Close
          </button>
        ) : null}
      </div>
    </section>
  );
}
