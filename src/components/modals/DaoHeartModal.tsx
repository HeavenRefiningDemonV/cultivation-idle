import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from 'react';
import { StudyModeWidget } from '../../ui/cultivation/StudyModeWidget.js';
import { HeartLawMindView } from '../../ui/cultivation/heartLaw/HeartLawMindView.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useCultivationStore } from '../../stores/cultivationStore.js';
import { useFxQuality } from '../../ui/fx/FxQualityProvider.js';
import './DaoHeartModal.scss';

interface DaoHeartModalProps {
  onClose: () => void;
  debugInitialTab?: 'heartLaw' | 'study';
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

export function DaoHeartModal({ onClose, debugInitialTab = 'heartLaw' }: DaoHeartModalProps) {
  const [tab, setTab] = useState<'heartLaw' | 'study'>(debugInitialTab);
  const { effectiveQuality } = useFxQuality();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
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
    setTab(debugInitialTab);
  }, [debugInitialTab]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const container = modalRef.current;
    if (!container) return;
    const focusables = Array.from(container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, nextTab: 'heartLaw' | 'study') => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    setTab(nextTab);
  };

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
        data-fx-quality={effectiveQuality}
        role="dialog"
        aria-modal="true"
        aria-label="Dao Heart"
        ref={modalRef}
        onClick={handleModalClick}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="daoHeartModalFx" aria-hidden="true">
          <div className="daoHeartFxWash" />
          <div className="daoHeartFxMandala" />
          <div className="daoHeartFxOrbit daoHeartFxOrbit--a">
            <span className="daoHeartMote daoHeartMote--1" />
            <span className="daoHeartMote daoHeartMote--2" />
            <span className="daoHeartMote daoHeartMote--3" />
          </div>
          <div className="daoHeartFxOrbit daoHeartFxOrbit--b">
            <span className="daoHeartMote daoHeartMote--4" />
            <span className="daoHeartMote daoHeartMote--5" />
          </div>
        </div>
        <div className="daoHeartModalScroll">
          <div className="daoHeartModalHeader">
            <div className="daoHeartModalHeaderText">
              <h2 className="daoHeartModalTitle">Dao Heart</h2>
              <div className="daoHeartModalTabs" role="tablist" aria-label="Dao Heart tabs">
                <button
                  type="button"
                  role="tab"
                  id="dao-heart-tab-heart-law"
                  aria-controls="dao-heart-panel-heart-law"
                  aria-selected={tab === 'heartLaw'}
                  className={`daoHeartModalTab uiNoShift ${tab === 'heartLaw' ? 'daoHeartModalTab--active' : ''}`}
                  onClick={() => setTab('heartLaw')}
                  onKeyDown={(event) => handleTabKeyDown(event, 'study')}
                >
                  Heart Law
                </button>
                <button
                  type="button"
                  role="tab"
                  id="dao-heart-tab-study"
                  aria-controls="dao-heart-panel-study"
                  aria-selected={tab === 'study'}
                  className={`daoHeartModalTab uiNoShift ${tab === 'study' ? 'daoHeartModalTab--active' : ''}`}
                  onClick={() => setTab('study')}
                  onKeyDown={(event) => handleTabKeyDown(event, 'heartLaw')}
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
              ref={closeButtonRef}
            >
              ×
            </button>
          </div>

          <div className="daoHeartModalBody">
            {tab === 'heartLaw' ? (
              <section
                className="daoHeartModalSection daoHeartModalSection--heartLaw"
                role="tabpanel"
                id="dao-heart-panel-heart-law"
                aria-labelledby="dao-heart-tab-heart-law"
              >
                <HeartLawMindView />
              </section>
            ) : null}

            {tab === 'study' ? (
              <section
                className="daoHeartModalSection daoHeartModalSection--study"
                role="tabpanel"
                id="dao-heart-panel-study"
                aria-labelledby="dao-heart-tab-study"
              >
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
