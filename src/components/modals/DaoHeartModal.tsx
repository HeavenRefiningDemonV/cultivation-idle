import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from 'react';
import { StudyModeWidget } from '../../ui/cultivation/StudyModeWidget';
import { HeartLawPanel } from '../../ui/cultivation/heartLaw/HeartLawPanel';
import { useContentStore } from '../../stores/contentStore';
import { useCultivationStore } from '../../stores/cultivationStore';
import './DaoHeartModal.scss';

interface DaoHeartModalProps {
  onClose: () => void;
}

type DaoElement = 'fire' | 'water' | 'wood' | 'metal' | 'earth' | 'neutral';

function pickDaoElement(tags: string[]): DaoElement {
  const normalized = new Set(tags.map((tag) => tag.toLowerCase()));
  if (normalized.has('fire') || normalized.has('flame')) return 'fire';
  if (normalized.has('water')) return 'water';
  if (normalized.has('wood')) return 'wood';
  if (normalized.has('metal')) return 'metal';
  if (normalized.has('earth')) return 'earth';
  return 'neutral';
}

const DAO_PALETTES: Record<DaoElement, { accent: string; accent2: string; washA: string; washB: string }> = {
  fire: {
    accent: '#f97316',
    accent2: '#ef4444',
    washA: 'rgba(249,115,22,0.18)',
    washB: 'rgba(239,68,68,0.12)',
  },
  water: {
    accent: '#0ea5e9',
    accent2: '#22d3ee',
    washA: 'rgba(14,165,233,0.16)',
    washB: 'rgba(34,211,238,0.10)',
  },
  wood: {
    accent: '#22c55e',
    accent2: '#84cc16',
    washA: 'rgba(34,197,94,0.14)',
    washB: 'rgba(132,204,22,0.10)',
  },
  metal: {
    accent: '#94a3b8',
    accent2: '#e5e7eb',
    washA: 'rgba(148,163,184,0.14)',
    washB: 'rgba(229,231,235,0.10)',
  },
  earth: {
    accent: '#f59e0b',
    accent2: '#a16207',
    washA: 'rgba(245,158,11,0.16)',
    washB: 'rgba(161,98,7,0.10)',
  },
  neutral: {
    accent: '#64748b',
    accent2: '#334155',
    washA: 'rgba(100,116,139,0.14)',
    washB: 'rgba(51,65,85,0.10)',
  },
};

export function DaoHeartModal({ onClose }: DaoHeartModalProps) {
  const [tab, setTab] = useState<'heartLaw' | 'study'>('heartLaw');
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);
  const daoTags = selectedHeartLawId ? heartLawsById[selectedHeartLawId]?.daoTags ?? [] : [];
  const element = useMemo(() => pickDaoElement(daoTags), [daoTags]);
  const palette = DAO_PALETTES[element];
  const themeStyle = useMemo(
    () =>
      ({
        ['--dao-accent' as string]: palette.accent,
        ['--dao-accent-2' as string]: palette.accent2,
        ['--dao-wash-a' as string]: palette.washA,
        ['--dao-wash-b' as string]: palette.washB,
        ['--dao-element' as string]: element,
      }) satisfies CSSProperties,
    [element, palette],
  );

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
        style={themeStyle}
        data-dao-element={element}
        role="dialog"
        aria-modal="true"
        aria-label="Dao Heart"
        onClick={handleModalClick}
      >
        <div className="daoHeartModalScroll">
          <div className="daoHeartModalHeader">
            <div className="daoHeartModalHeaderText">
              <h2 className="daoHeartModalTitle">Dao Heart</h2>
              <div className="daoHeartModalTabs" role="tablist" aria-label="Dao Heart tabs">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'heartLaw'}
                  className={`daoHeartModalTab ${tab === 'heartLaw' ? 'daoHeartModalTab--active' : ''}`}
                  onClick={() => setTab('heartLaw')}
                >
                  Heart Law
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'study'}
                  className={`daoHeartModalTab ${tab === 'study' ? 'daoHeartModalTab--active' : ''}`}
                  onClick={() => setTab('study')}
                >
                  Study
                </button>
              </div>
            </div>
            <button
              type="button"
              className="daoHeartModalClose"
              onClick={onClose}
              aria-label="Close Dao Heart"
            >
              ×
            </button>
          </div>

          <div className="daoHeartModalBody">
            {tab === 'heartLaw' ? (
              <section className="daoHeartModalSection" role="tabpanel">
                <HeartLawPanel />
              </section>
            ) : null}

            {tab === 'study' ? (
              <section className="daoHeartModalSection" role="tabpanel">
                <div className="daoHeartModalStudyWrap">
                  <StudyModeWidget />
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
