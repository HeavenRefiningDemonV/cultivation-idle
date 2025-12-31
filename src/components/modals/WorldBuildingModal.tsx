import { useEffect, useCallback, type ReactNode } from 'react';
import './WorldBuildingModal.scss';

export interface WorldBuildingModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

export function WorldBuildingModal({ open, title, subtitle, onClose, children }: WorldBuildingModalProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="worldBuildingModalOverlay" onClick={onClose} role="presentation">
      <div className="worldBuildingModal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="worldBuildingModalHeader">
          <div>
            <div className="worldBuildingModalTitle">{title}</div>
            {subtitle && <div className="worldBuildingModalSubtitle">{subtitle}</div>}
          </div>
          <button type="button" className="worldBuildingModalClose" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="worldBuildingModalBody">{children}</div>
      </div>
    </div>
  );
}
