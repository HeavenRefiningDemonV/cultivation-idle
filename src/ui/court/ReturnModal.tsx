import './courtReturn.scss';
import { CourtChip } from './courtChips';
import { waxSealString } from './room/courtRoomSprites';
import { useDialogFocusTrap } from '../status/observatory/useDialogFocusTrap';
import type { CourtOfflineSummary } from '../../systems/meridians/index.js';

const NOOP = () => {};

/**
 * W7 — return-from-offline modal (artifact §1.5.10). Shown when an offline summary
 * exists; single-meridian (only the active meridian trains offline, §2.12/D13).
 * W10 — focus trap + restore via the shared useDialogFocusTrap: on open focus moves
 * into the dialog and Tab/Shift-Tab cycle within it; Escape resumes; on close focus
 * returns to the trigger.
 */
export function ReturnModal({ summary, onResume }: { summary: CourtOfflineSummary | null; onResume?: () => void }) {
  const dialogRef = useDialogFocusTrap<HTMLDivElement>(!!summary, onResume ?? NOOP);
  if (!summary) return null;
  return (
    <div className="court-return-wrap">
      <div className="court-return-scrim" onClick={onResume} aria-hidden="true" />
      <div className="court-return" role="dialog" aria-modal="true" aria-label="While you were away" ref={dialogRef}>
        <div className="court-return-seal" dangerouslySetInnerHTML={{ __html: waxSealString('歸', 40, -6, true) }} />
        <h3>WHILE YOU WERE AWAY</h3>
        <div className="court-return-lead">
          The hall tempered <b>{summary.meridian}</b> for {summary.minutes}.
        </div>
        <div className="court-rrow">
          <span>{summary.meridian}</span>
          <span className="court-rv">
            {summary.gained} <CourtChip tone="jade">{summary.ratings}</CourtChip>
          </span>
        </div>
        <div className="court-rrow">
          <span>Regimen mastery</span>
          <span className="court-rv">{summary.mastery}</span>
        </div>
        <div className="court-rrow court-rrow--jade">
          <span>Combat · passive</span>
          <span className="court-rv">{summary.passive}</span>
        </div>
        <div className="court-rrow court-rrow--gold">
          <span>Forge heat</span>
          <span className="court-rv">
            {summary.fatigue} → {summary.tier}
          </span>
        </div>
        {summary.downgrades > 0 ? (
          <div className="court-micro" style={{ marginTop: 6 }}>
            ⤓ Your Limit eased {summary.downgrades} times as the forge ran hot.
          </div>
        ) : null}
        <div className="court-return-resume">
          <button type="button" className="court-btn court-btn--jade" onClick={onResume}>
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
