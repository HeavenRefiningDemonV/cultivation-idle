import { useCallback, useEffect, type ReactNode } from 'react';
import './WorldBuildingModal.scss';

export interface WorldBuildingModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export function WorldBuildingModal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: WorldBuildingModalProps) {
  const close = onClose;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close?.();
      }
    },
    [close],
  );

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, open]);

  useEffect(() => {
    if (!open) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="worldBuildingOverlay" role="dialog" aria-modal="true" onMouseDown={close}>
      <div className="worldBuildingModal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="worldBuildingHeader">
          <div className="worldBuildingTitleGroup">
            <div className="worldBuildingTitle">{title}</div>
            {subtitle && <div className="worldBuildingSubtitle">{subtitle}</div>}
          </div>
          <button type="button" className="worldBuildingClose" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="worldBuildingBody">{children}</div>
      </div>
    </div>
  );
}
