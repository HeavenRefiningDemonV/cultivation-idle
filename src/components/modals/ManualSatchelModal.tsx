import { useEffect, useMemo, useRef, useState } from 'react';
import './ManualSatchelModal.scss';
import { useManualSatchelStore } from '../../stores/manualSatchelStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import { formatDurationHMS } from '../../utils/timeFormat.js';
import { GameIcon } from '../../ui/icons/index.js';

type FocusStage = 'idle' | 'arming' | 'focusing' | 'result';
type ManualSortMode = 'newest' | 'rarity' | 'grade' | 'name';

const RARITY_SORT_ORDER: Record<string, number> = {
  legendary: 5,
  epic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

const GRADE_SORT_ORDER: Record<string, number> = {
  mystic: 4,
  heaven: 3,
  earth: 2,
  mortal: 1,
};

export function ManualSatchelModal() {
  const showModal = useUIStore((state) => state.showManualSatchelModal);
  const closeModal = useUIStore((state) => state.closeManualSatchel);
  const addNotification = useUIStore((state) => state.addNotification);
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const manuals = useManualSatchelStore((state) => state.manuals);
  const activeStudy = useManualSatchelStore((state) => state.activeStudy);
  const startStudy = useManualSatchelStore((state) => state.startStudy);
  const dismantleManual = useManualSatchelStore((state) => state.dismantleManual);
  const applyFocusReward = useManualSatchelStore((state) => state.applyFocusReward);
  const hasTech = useTechCollectionStore((state) => state.hasTech);
  const contentMaps = useContentStore((state) => state.maps);
  const techniquesById = contentMaps.techniquesById;

  const [now, setNow] = useState(() => Date.now());
  const [focusStage, setFocusStage] = useState<FocusStage>('idle');
  const [focusCountdown, setFocusCountdown] = useState(10);
  const [focusResult, setFocusResult] = useState<string | null>(null);
  const [focusRunning, setFocusRunning] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [confirmDismantleId, setConfirmDismantleId] = useState<string | null>(null);
  const [expandedManualId, setExpandedManualId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<ManualSortMode>('newest');
  const [hideKnown, setHideKnown] = useState(true);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showModal) return undefined;
    const handle = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return undefined;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [closeModal, showModal]);

  useEffect(() => {
    if (!showModal) return;
    closeButtonRef.current?.focus();
  }, [showModal]);

  useEffect(() => {
    if (!focusRunning) return undefined;
    if (focusCountdown <= 0) return undefined;
    const handle = window.setInterval(() => {
      setFocusCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(handle);
  }, [focusRunning, focusCountdown]);

  useEffect(() => {
    if (!focusRunning) return;
    if (focusCountdown > 0) return;
    setFocusRunning(false);
    const result = applyFocusReward();
    if (result.ok) {
      if (result.reward === 'time') {
        setFocusResult('Insight: -10% study time');
      } else if (result.reward === 'mastery') {
        setFocusResult('Insight: +10% mastery headstart');
      } else if (result.reward === 'traitQuality') {
        setFocusResult('Insight: +5% trait quality chance');
      }
    } else {
      setFocusResult(result.reason ?? 'Focus failed.');
    }
    setFocusStage('result');
  }, [focusCountdown, focusRunning, applyFocusReward]);

  useEffect(() => {
    if (!showModal) {
      setFocusStage('idle');
      setFocusCountdown(10);
      setFocusRunning(false);
      setFocusResult(null);
      setShowHelp(false);
      setConfirmDismantleId(null);
      setExpandedManualId(null);
    }
  }, [showModal]);

  useEffect(() => {
    if (confirmDismantleId && !manuals.some((manual) => manual.id === confirmDismantleId)) {
      setConfirmDismantleId(null);
    }
    if (expandedManualId && !manuals.some((manual) => manual.id === expandedManualId)) {
      setExpandedManualId(null);
    }
  }, [confirmDismantleId, expandedManualId, manuals]);

  const manualRows = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const rows = manuals.map((manual) => {
      const tech = techniquesById[manual.techId];
      const name = tech?.name ?? manual.techId;
      const type = (tech as { type?: string })?.type ?? 'unknown';
      const known = hasTech(manual.techId);
      const searchText = `${name} ${manual.techId} ${type}`.toLowerCase();
      return {
        manual,
        tech,
        name,
        type,
        known,
        searchText,
      };
    });

    const filtered = rows.filter((row) => {
      if (hideKnown && row.known) return false;
      if (!trimmedQuery) return true;
      return row.searchText.includes(trimmedQuery);
    });

    const compareByName = (a: (typeof filtered)[number], b: (typeof filtered)[number]) =>
      a.name.localeCompare(b.name);

    const sorted = [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'rarity': {
          const rarityDelta =
            (RARITY_SORT_ORDER[b.manual.rarity] ?? 0) - (RARITY_SORT_ORDER[a.manual.rarity] ?? 0);
          if (rarityDelta !== 0) return rarityDelta;
          return b.manual.acquiredAt - a.manual.acquiredAt || compareByName(a, b);
        }
        case 'grade': {
          const gradeDelta =
            (GRADE_SORT_ORDER[b.manual.grade] ?? 0) - (GRADE_SORT_ORDER[a.manual.grade] ?? 0);
          if (gradeDelta !== 0) return gradeDelta;
          return b.manual.acquiredAt - a.manual.acquiredAt || compareByName(a, b);
        }
        case 'name':
          return compareByName(a, b);
        case 'newest':
        default:
          return b.manual.acquiredAt - a.manual.acquiredAt || compareByName(a, b);
      }
    });

    return sorted;
  }, [hasTech, hideKnown, manuals, searchQuery, sortMode, techniquesById]);

  const handleDismantle = (id: string) => {
    const manual = manuals.find((entry) => entry.id === id);
    if (!manual) return;
    const result = dismantleManual(id);
    setConfirmDismantleId(null);
    if (result.ok && result.fragmentsGained != null) {
      addNotification('success', `Dismantled manual → +${result.fragmentsGained} fragments for ${manual.techId}`);
    } else if (!result.ok) {
      addNotification('error', `Dismantle failed: ${result.reason ?? 'Unknown error'}`);
    }
  };

  const handleStudy = (manualId: string, techName: string) => {
    if (activeStudy) {
      addNotification('warning', 'Already studying a manual.');
      return;
    }
    const result = startStudy(manualId);
    if (!result.ok) {
      addNotification('error', result.reason ?? 'Unable to start study.');
      return;
    }
    addNotification('success', `Began studying ${techName}.`);
  };

  const startFocus = () => {
    setFocusResult(null);
    setFocusCountdown(10);
    setFocusRunning(true);
    setFocusStage('focusing');
  };

  const cancelFocus = () => {
    setFocusRunning(false);
    setFocusCountdown(10);
    setFocusStage('idle');
    setFocusResult(null);
  };

  if (!showModal) return null;

  const renderActiveStudy = () => {
    if (!activeStudy) return null;
    const tech = techniquesById[activeStudy.manual.techId];
    const total = Math.max(1, activeStudy.endsAt - activeStudy.startedAt);
    const elapsed = Math.min(total, Math.max(0, now - activeStudy.startedAt));
    const remaining = Math.max(0, activeStudy.endsAt - now);
    const progress = Math.min(1, elapsed / total);
    const canFocus = !activeStudy.focusUsed && now < activeStudy.endsAt;

    return (
      <div className={'manualSatchelCard manualSatchelCardActive'}>
        <div className={'manualSatchelCardHeader'}>
          <div>
            <div className={'manualSatchelTitleLine'}>Active Study</div>
            <div className={'manualSatchelTechName'}>{tech?.name ?? activeStudy.manual.techId}</div>
            <div className={'manualSatchelMeta'}>
              <span className={`manualBadge rarity-${activeStudy.manual.rarity}`}>{activeStudy.manual.rarity}</span>
              <span className={'manualBadge'}>{activeStudy.manual.grade}</span>
            </div>
          </div>
          <div className={'manualSatchelTimer'}>Time remaining: {formatDurationHMS(remaining)}</div>
        </div>
        <div className={'manualSatchelProgress'}>
          <div className={'manualSatchelProgressBar'}>
            <div className={'manualSatchelProgressFill'} style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <div className={'manualSatchelProgressText'}>
            {Math.round(progress * 100)}% complete
          </div>
        </div>
        {focusResult && <div className={'manualSatchelFocusResult'}>{focusResult}</div>}
        {canFocus && focusStage === 'idle' && (
          <button className={'manualSatchelButton'} onClick={() => setFocusStage('arming')}>
            Focus (optional)
          </button>
        )}
        {focusStage === 'arming' && (
          <div className={'manualSatchelFocusCard'}>
            <div className={'manualSatchelFocusTitle'}>Focused Study</div>
            <div className={'manualSatchelFocusText'}>
              Hold your attention for 10 seconds to gain a one-time bonus.
            </div>
            <div className={'manualSatchelFocusActions'}>
              <button className={'manualSatchelButton manualSatchelButtonSecondary'} onClick={cancelFocus}>
                Cancel
              </button>
              <button className={'manualSatchelButton'} onClick={startFocus}>
                Begin Focus
              </button>
            </div>
          </div>
        )}
        {focusStage === 'focusing' && (
          <div className={'manualSatchelFocusCard manualSatchelFocusCardActive'}>
            <div className={'manualSatchelFocusTitle'}>Focused Study</div>
            <div className={'manualSatchelFocusText'}>
              Channeling... <span className={'manualSatchelFocusCountdown'}>{focusCountdown}s</span>
            </div>
            <div className={'manualSatchelProgressBar'}>
              <div
                className={'manualSatchelProgressFill'}
                style={{ width: `${Math.round(((10 - focusCountdown) / 10) * 100)}%` }}
              />
            </div>
            <div className={'manualSatchelFocusActions'}>
              <button className={'manualSatchelButton manualSatchelButtonSecondary'} onClick={cancelFocus} disabled={focusRunning}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {focusStage === 'result' && focusResult && (
          <div className={'manualSatchelFocusCard'}>
            <div className={'manualSatchelFocusTitle'}>Focused Study</div>
            <div className={'manualSatchelFocusText'}>{focusResult}</div>
            <div className={'manualSatchelFocusActions'}>
              <button className={'manualSatchelButton'} onClick={() => setFocusStage('idle')}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderManualRow = (row: (typeof manualRows)[number]) => {
    const { manual, tech, known, name, type } = row;
    const studyDisabled = Boolean(activeStudy) || known;
    const expanded = expandedManualId === manual.id;
    const confirmDismantle = confirmDismantleId === manual.id;
    const description = (tech as { description?: string; note?: string })?.description ?? (tech as { note?: string })?.note;
    const studyLabel = activeStudy ? 'Already Studying' : known ? 'Known' : 'Study Manual';
    const disabledReason = activeStudy
      ? 'You can only study one manual at a time.'
      : known
        ? 'Technique already known; dismantle for fragments.'
        : null;
    return (
      <div key={manual.id} className={'manualSatchelRow'}>
        <button
          className={'manualSatchelRowHeader'}
          type="button"
          onClick={() => setExpandedManualId((prev) => (prev === manual.id ? null : manual.id))}
        >
          <span className={`manualSatchelRowSpine rarity-${manual.rarity}`} aria-hidden="true" />
          <div className={'manualSatchelRowMain'}>
            <div className={'manualSatchelRowName'}>{name}</div>
            <div className={'manualSatchelRowMeta'}>
              <span className={`manualBadge rarity-${manual.rarity}`}>{manual.rarity}</span>
              <span className={'manualBadge'}>{manual.grade}</span>
              <span className={'manualBadge'}>{type}</span>
              {known && <span className={'manualBadge manualBadgeKnown'}>Known</span>}
            </div>
          </div>
          <span className={'manualSatchelRowChevron'}>
            <GameIcon icon={expanded ? 'inkChevronUp' : 'inkChevronDown'} size={16} decorative />
          </span>
        </button>
        {expanded && (
          <div className={'manualSatchelRowDetails'}>
            {description ? <div className={'manualSatchelRowDescription'}>{description}</div> : null}
            <div className={'manualSatchelRowActions'}>
              <button
                className={'manualSatchelButton'}
                disabled={studyDisabled}
                onClick={() => handleStudy(manual.id, name)}
                type="button"
              >
                {studyLabel}
              </button>
              {!confirmDismantle ? (
                <button
                  className={'manualSatchelButton manualSatchelButtonSecondary'}
                  onClick={() => setConfirmDismantleId(manual.id)}
                  type="button"
                >
                  Dismantle
                </button>
              ) : null}
            </div>
            {confirmDismantle ? (
              <div className={'manualSatchelRowConfirm'}>
                <div className={'manualSatchelRowWarning'}>Dismantle this manual into fragments?</div>
                <div className={'manualSatchelRowConfirmActions'}>
                  <button
                    className={'manualSatchelButton manualSatchelButtonSecondary'}
                    type="button"
                    onClick={() => setConfirmDismantleId(null)}
                  >
                    Cancel
                  </button>
                  <button className={'manualSatchelButton'} type="button" onClick={() => handleDismantle(manual.id)}>
                    Confirm Dismantle
                  </button>
                </div>
              </div>
            ) : null}
            {studyDisabled && disabledReason ? (
              <div className={'manualSatchelRowDisabledReason'}>{disabledReason}</div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={'manualSatchelOverlay'} onClick={closeModal}>
      <div
        className={'manualSatchelModal'}
        role="dialog"
        aria-modal="true"
        aria-label="Manual Satchel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={'manualSatchelHeader'}>
          <div className={'manualSatchelHeaderLeft'}>
            <div className={'manualSatchelTitle'}>
              <span className={'manualSatchelTitleIcon'} aria-hidden="true">
                <GameIcon icon="artifactBundle" size={18} decorative />
              </span>
              Manual Satchel
            </div>
            <div className={'manualSatchelSubtitle'}>Your study kit for unlocking techniques.</div>
            <button className={'manualSatchelHelpToggle'} onClick={() => setShowHelp((prev) => !prev)} type="button">
              {showHelp ? 'Hide help' : 'How it works'}
            </button>
          </div>
          <div className={'manualSatchelHeaderRight'}>
            <button
              className={'manualSatchelLibraryButton'}
              type="button"
              onClick={() => {
                closeModal();
                setActiveTab('techniques');
              }}
            >
              Technique Library
            </button>
            <button
              className={'manualSatchelClose'}
              onClick={closeModal}
              ref={closeButtonRef}
              aria-label="Close manual satchel"
              type="button"
            >
              <GameIcon icon="inkX" size={14} decorative />
            </button>
          </div>
        </div>

        {showHelp ? (
          <div className={'manualSatchelHelpCard'}>
            <div className={'manualSatchelHelpRow'}>
              <GameIcon icon="artifactBundle" size={14} decorative />
              <span>Buy manuals at the Manual Pavilion.</span>
            </div>
            <div className={'manualSatchelHelpRow'}>
              <GameIcon icon="bookHeaven" size={14} decorative />
              <span>Study one manual at a time.</span>
            </div>
            <div className={'manualSatchelHelpRow'}>
              <GameIcon icon="inkSparkles" size={14} decorative />
              <span>Finish study to unlock a technique.</span>
            </div>
            <div className={'manualSatchelHelpRow'}>
              <GameIcon icon="jadeSword" size={14} decorative />
              <span>Equip techniques in the Techniques tab.</span>
            </div>
          </div>
        ) : null}

        <div className={'manualSatchelBody'}>
          <section className={'manualSatchelColumn manualSatchelColumn--left'}>
            {activeStudy ? (
              renderActiveStudy()
            ) : (
              <div className={'manualSatchelCard manualSatchelCardEmpty'}>
                <div className={'manualSatchelTitleLine'}>Active Study</div>
                <div className={'manualSatchelEmpty'}>No manual currently studied.</div>
              </div>
            )}
          </section>

          <section className={'manualSatchelColumn manualSatchelColumn--right'}>
            <div className={'manualSatchelCard'}>
              <div className={'manualSatchelCardHeader'}>
                <div className={'manualSatchelTitleLine'}>Owned Manuals</div>
                <div className={'manualSatchelCount'}>
                  {manuals.length} in satchel{activeStudy ? ' • 1 studying' : ''}
                </div>
              </div>
              <div className={'manualSatchelTools'}>
                <input
                  className={'manualSatchelSearch'}
                  type="search"
                  placeholder="Search manuals..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <select
                  className={'manualSatchelSort'}
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as ManualSortMode)}
                >
                  <option value="newest">Newest</option>
                  <option value="rarity">Rarity</option>
                  <option value="grade">Grade</option>
                  <option value="name">Name</option>
                </select>
                <label className={'manualSatchelToggle'}>
                  <input
                    type="checkbox"
                    checked={hideKnown}
                    onChange={(event) => setHideKnown(event.target.checked)}
                  />
                  Hide Known
                </label>
              </div>
              {manuals.length === 0 && <div className={'manualSatchelEmpty'}>No manuals yet.</div>}
              {manuals.length > 0 && manualRows.length === 0 && (
                <div className={'manualSatchelEmpty'}>No manuals match your filters.</div>
              )}
              {manualRows.length > 0 && <div className={'manualSatchelList'}>{manualRows.map(renderManualRow)}</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
