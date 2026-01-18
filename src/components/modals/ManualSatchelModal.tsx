import { useEffect, useMemo, useRef, useState } from 'react';
import './ManualSatchelModal.scss';
import { useManualSatchelStore } from '../../stores/manualSatchelStore';
import { useUIStore } from '../../stores/uiStore';
import { useContentStore } from '../../stores/contentStore';
import { useTechCollectionStore } from '../../stores/techCollectionStore';
import { formatDurationHMS } from '../../utils/timeFormat';

type FocusStage = 'idle' | 'arming' | 'focusing' | 'result';

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
    }
  }, [showModal]);

  const manualList = useMemo(() => {
    return [...manuals].sort((a, b) => b.acquiredAt - a.acquiredAt);
  }, [manuals]);

  const handleDismantle = (id: string) => {
    const manual = manuals.find((entry) => entry.id === id);
    if (!manual) return;
    // eslint-disable-next-line no-alert
    const confirm = window.confirm(`Dismantle manual for ${techniquesById[manual.techId]?.name ?? manual.techId}?`);
    if (!confirm) return;
    const result = dismantleManual(id);
    if (result.ok && result.fragmentsGained != null) {
      addNotification('success', `Dismantled manual → +${result.fragmentsGained} fragments for ${manual.techId}`);
    } else if (!result.ok) {
      addNotification('error', `Dismantle failed: ${result.reason ?? 'Unknown error'}`);
    }
  };

  const handleStudy = (id: string) => {
    const manual = manuals.find((entry) => entry.id === id);
    if (!manual) return;
    if (activeStudy) {
      addNotification('warning', 'Already studying a manual.');
      return;
    }
    const result = startStudy(id);
    if (!result.ok) {
      addNotification('error', result.reason ?? 'Unable to start study.');
    }
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
      <div className={'manualSatchelCard'}>
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
          <div className={'manualSatchelFocusCard'}>
            <div className={'manualSatchelFocusTitle'}>Focused Study</div>
            <div className={'manualSatchelFocusText'}>Channeling... {focusCountdown}s</div>
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

  const renderManualRow = (manualId: string) => {
    const manual = manuals.find((entry) => entry.id === manualId);
    if (!manual) return null;
    const tech = techniquesById[manual.techId];
    const known = hasTech(manual.techId);
    const studyDisabled = Boolean(activeStudy) || known;
    return (
      <div key={manual.id} className={'manualSatchelRow'}>
        <div className={'manualSatchelRowMain'}>
          <div className={'manualSatchelRowName'}>{tech?.name ?? manual.techId}</div>
          <div className={'manualSatchelRowMeta'}>
            <span className={`manualBadge rarity-${manual.rarity}`}>{manual.rarity}</span>
            <span className={'manualBadge'}>{manual.grade}</span>
            <span className={'manualBadge'}>{tech?.type ?? 'unknown'}</span>
            {known && <span className={'manualBadge manualBadgeKnown'}>Known</span>}
          </div>
        </div>
        <div className={'manualSatchelRowActions'}>
          <button className={'manualSatchelButton'} disabled={studyDisabled} onClick={() => handleStudy(manual.id)}>
            Study Manual
          </button>
          <button className={'manualSatchelButton manualSatchelButtonSecondary'} onClick={() => handleDismantle(manual.id)}>
            Dismantle
          </button>
        </div>
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
            <div className={'manualSatchelTitle'}>Manual Satchel</div>
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
              ✕
            </button>
          </div>
        </div>

        {showHelp ? (
          <div className={'manualSatchelHelpCard'}>
            <div className={'manualSatchelHelpRow'}>🛍️ Buy manuals at the Manual Pavilion.</div>
            <div className={'manualSatchelHelpRow'}>📖 Study one manual at a time.</div>
            <div className={'manualSatchelHelpRow'}>✨ Finish study to unlock a technique.</div>
            <div className={'manualSatchelHelpRow'}>⚔️ Equip techniques in the Techniques tab.</div>
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
              {manualList.length === 0 && <div className={'manualSatchelEmpty'}>No manuals yet.</div>}
              {manualList.length > 0 && (
                <div className={'manualSatchelList'}>{manualList.map((manual) => renderManualRow(manual.id))}</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
