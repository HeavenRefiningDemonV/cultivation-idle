import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { useDialogFocusTrap } from '../status/observatory/useDialogFocusTrap.js';
import './f2Modal.scss';

/**
 * F2.UI — the bespoke modal shell that matches the `modal-stage.html` artifact's `.scrim`. It owns
 * ONLY the structural concerns — a body portal, the state-keyed dim/void scrim, focus-trap + Esc
 * (reused from useDialogFocusTrap), body-scroll lock, and click-the-scrim-to-close. The visible box
 * (the `.record` / `.rite`) is the child — so the Inspector and Ritual frames render the artifact's
 * own chrome verbatim instead of a shared component's. Render-only: it forwards onClose, nothing else.
 */

export interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  /** inspector → parchment dim; ritual → the dark void glow. */
  mode: 'inspector' | 'ritual';
  /** the void/edge skin: default slate-teal · prestige warm-bronze · postfail cinnabar (tribulation). */
  skin?: 'default' | 'prestige' | 'postfail';
  /** freeze scene motion to a composed still (FxQuality below 'high'); reduced-motion freezes via CSS too. */
  still?: boolean;
  ariaLabel: string;
  children: ReactNode;
}

export function ModalShell({ open, onClose, mode, skin = 'default', still = false, ariaLabel, children }: ModalShellProps) {
  const dialogRef = useDialogFocusTrap<HTMLDivElement>(open, onClose);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const scrim = (
    <div
      className={classNames('f2Scrim', `f2Scrim--${mode}`, skin !== 'default' && `f2Scrim--${skin}`, { 'f2Scrim--still': still })}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="f2Scrim__center"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        ref={dialogRef}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(scrim, document.body);
}
