import { useEffect, type MouseEvent } from 'react';
import { HeartLawPanel } from '../../ui/cultivation/heartLaw/HeartLawPanel';
import { StudyModeWidget } from '../../ui/cultivation/StudyModeWidget';
import './DaoHeartModal.scss';

interface DaoHeartModalProps {
  onClose: () => void;
}

export function DaoHeartModal({ onClose }: DaoHeartModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleOverlayClick = () => {
    onClose();
  };

  const handleModalClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="daoHeartModalOverlay" onClick={handleOverlayClick}>
      <div
        className="daoHeartModalModal"
        role="dialog"
        aria-modal="true"
        aria-label="Dao Heart"
        onClick={handleModalClick}
      >
        <div className="daoHeartModalHeader">
          <h2 className="daoHeartModalTitle">Dao Heart</h2>
          <button type="button" className="primaryButton primaryButton--secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="daoHeartModalBody">
          <section className="daoHeartModalSection">
            <h3 className="daoHeartModalSectionTitle">Heart Law</h3>
            <HeartLawPanel />
          </section>

          <section className="daoHeartModalSection">
            <h3 className="daoHeartModalSectionTitle">Study</h3>
            <StudyModeWidget />
          </section>
        </div>
      </div>
    </div>
  );
}
