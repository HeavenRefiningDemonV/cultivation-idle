import type { ReactNode } from 'react';
import type { StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';
import { useDialogFocusTrap } from './useDialogFocusTrap.js';
import './StatusObservatoryOverlayShell.scss';

/** The Next Goal / Main Bottleneck / Primary Action context block the artifact
 *  ovShell paints top-right of every overlay. (We use the sanctioned "Primary
 *  Action" label, never the decommissioned route-board wording.) */
export interface StatusOverlayGoalContext {
  nextGoalLabel: string | null;
  mainBottleneckLabel: string | null;
  mainBottleneckTone?: StatusLedgerTone | null;
  primaryActionLabel: string | null;
}

export interface StatusObservatoryOverlayShellProps {
  open: boolean;
  /** Big serif overlay title, e.g. "Spirit Root Astrolabe". */
  title: string;
  /** Small uppercase sub-line, e.g. "Root & Heart Law entity diagnostic". */
  subtitle: string;
  /** Vertical CJK tag stamped down the left rail (artifact .ovtag), e.g. "根骨". */
  tagChars: string;
  /** Wax chop chars in the header, e.g. "根骨". */
  sealChars?: string;
  sealVariant?: 'cinnabar' | 'jade';
  /** Faint calligraphy watermark bled into the panel (artifact .gcol), e.g. "根骨鑑觀". */
  watermark?: string;
  goal?: StatusOverlayGoalContext | null;
  onClose: () => void;
  dataTestId?: string;
  ariaLabel?: string;
  /** Extra class on the panel for per-overlay tuning. */
  className?: string;
  children: ReactNode;
}

/**
 * Shared full-screen detail-overlay chrome (artifact `ovShell`): a parchment sheet
 * over a dark scrim, with grain, four gold corner brackets, a vertical CJK tag rail,
 * a header (title + sub + Next Goal/Main Bottleneck/Primary Action context + wax chop
 * + close), a faint calligraphy watermark, and an ink-mountain band along the foot.
 *
 * Unlike the artifact's onclick-only div, this is a real modal dialog: focus-trapped,
 * Escape-to-close, aria-modal — the visual content stays 1:1 with the mockup.
 */
export function StatusObservatoryOverlayShell({
  open,
  title,
  subtitle,
  tagChars,
  sealChars,
  sealVariant = 'cinnabar',
  watermark,
  goal,
  onClose,
  dataTestId,
  ariaLabel,
  className,
  children,
}: StatusObservatoryOverlayShellProps) {
  const dialogRef = useDialogFocusTrap<HTMLDivElement>(open, onClose);
  if (!open) return null;

  return (
    <div className="statusObservatoryOverlay" data-overlay-open="true">
      <div className="statusObservatoryOverlay__scrim" aria-hidden="true" onClick={onClose} />
      <div
        ref={dialogRef}
        className={['statusObservatoryOverlay__panel', className].filter(Boolean).join(' ')}
        data-testid={dataTestId}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
      >
        {/* grain + corner brackets (artifact .grain + .gc) */}
        <span className="statusObservatoryOverlay__grain" aria-hidden="true" />
        <i className="statusObservatoryOverlay__gc statusObservatoryOverlay__gc--tl" aria-hidden="true" />
        <i className="statusObservatoryOverlay__gc statusObservatoryOverlay__gc--tr" aria-hidden="true" />
        <i className="statusObservatoryOverlay__gc statusObservatoryOverlay__gc--bl" aria-hidden="true" />
        <i className="statusObservatoryOverlay__gc statusObservatoryOverlay__gc--br" aria-hidden="true" />

        {/* vertical CJK tag rail (artifact .ovtag) */}
        <div className="statusObservatoryOverlay__tag" aria-hidden="true">
          <span>{[...tagChars].join('\n')}</span>
        </div>

        <header className="statusObservatoryOverlay__head">
          <div className="statusObservatoryOverlay__heading">
            <div className="statusObservatoryOverlay__title">{title}</div>
            <div className="statusObservatoryOverlay__sub">{subtitle}</div>
          </div>
          <div className="statusObservatoryOverlay__headRight">
            {goal ? (
              <div className="statusObservatoryOverlay__ctx" aria-hidden="true">
                <div>
                  <i>Next Goal</i>
                  <b>{goal.nextGoalLabel ?? '—'}</b>
                </div>
                <div>
                  <i>Main Bottleneck</i>
                  <b data-tone={goal.mainBottleneckTone ?? 'muted'}>{goal.mainBottleneckLabel ?? '—'}</b>
                </div>
                <div>
                  <i>Primary Action</i>
                  <b data-tone="jade">{goal.primaryActionLabel ?? '—'}</b>
                </div>
              </div>
            ) : null}
            {sealChars ? (
              <InkWaxSeal
                className="statusObservatoryOverlay__seal"
                chars={sealChars}
                size={52}
                rotation={-4}
                variant={sealVariant}
              />
            ) : null}
            <button
              type="button"
              className="statusObservatoryOverlay__close"
              aria-label={`Close ${title}`}
              onClick={onClose}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable={false}>
                <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>

        <div className="statusObservatoryOverlay__content">
          {watermark ? (
            <span className="statusObservatoryOverlay__watermark" aria-hidden="true">
              {watermark}
            </span>
          ) : null}
          {/* ink-mountain foot band (artifact inkMountains) */}
          <svg
            className="statusObservatoryOverlay__mtn"
            viewBox="0 0 1856 260"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 210 L240 120 L430 200 L640 96 L880 200 L1120 110 L1360 205 L1600 120 L1856 200 L1856 260 L0 260 Z" />
            <path
              className="statusObservatoryOverlay__mtnFar"
              d="M0 230 L320 170 L560 224 L840 150 L1100 226 L1400 168 L1700 226 L1856 196 L1856 260 L0 260 Z"
            />
          </svg>
          <div className="statusObservatoryOverlay__body">{children}</div>
        </div>
      </div>
    </div>
  );
}
