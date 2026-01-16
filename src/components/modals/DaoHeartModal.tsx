import { useEffect, useState, type MouseEvent } from 'react';
import { StudyModeWidget } from '../../ui/cultivation/StudyModeWidget';
import { HeartLawMindView } from '../../ui/cultivation/heartLaw/HeartLawMindView';
import './DaoHeartModal.scss';

interface DaoHeartModalProps {
  onClose: () => void;
}

export function DaoHeartModal({ onClose }: DaoHeartModalProps) {
  const [activeTab, setActiveTab] = useState<'heart-law' | 'study'>('heart-law');

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
          <button
            type="button"
            className="daoHeartModalClose"
            onClick={onClose}
            aria-label="Close Dao Heart"
          >
            ×
          </button>
        </div>

        <div className="daoHeartModalTabs" role="tablist" aria-label="Dao Heart tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'heart-law'}
            className={`daoHeartModalTab ${activeTab === 'heart-law' ? 'daoHeartModalTab--active' : ''}`}
            onClick={() => setActiveTab('heart-law')}
          >
            Heart Law
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'study'}
            className={`daoHeartModalTab ${activeTab === 'study' ? 'daoHeartModalTab--active' : ''}`}
            onClick={() => setActiveTab('study')}
          >
            Study
          </button>
        </div>

        <div className="daoHeartModalBody">
          {activeTab === 'heart-law' ? (
            <section className="daoHeartModalSection" role="tabpanel">
              <HeartLawMindView />
            </section>
          ) : null}

          {activeTab === 'study' ? (
            <section className="daoHeartModalSection" role="tabpanel">
              <div className="daoHeartModalStudyWrap">
                <StudyModeWidget />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
