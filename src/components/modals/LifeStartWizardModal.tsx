import { useEffect, useMemo, useState } from 'react';
import './LifeStartWizardModal.scss';
import heavenArt from '../../assets/menus/path_heaven 1.png';
import earthArt from '../../assets/menus/path_earth 1.png';
import martialArt from '../../assets/menus/path_martial 1.png';
import { SaveService } from '../../services/save/SaveService.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useHeartLawStore } from '../../stores/heartLawStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { getBreathModeSemantics } from '../../systems/doctrine/breathSemantics.js';
import { getPathDoctrineProfile, getPathDoctrineSummary } from '../../systems/doctrine/pathDoctrineRegistry.js';
import {
  getLifeStartWizardCommittedStep,
  isLifeStartWizardRequired,
  LIFE_START_WIZARD_STEPS,
  resolveLifeStartWizardUiStep,
  type LifeStartWizardStep,
} from '../../systems/ui/lifeStart/lifeStartWizardContract.js';
import { getAffinityStatus } from '../../systems/heartLaw/heartLawLogic.js';
import { getHeartLawUnlockInfo } from '../../systems/heartLaw/heartLawUnlockInfo.js';
import { InkModalFrame, PaperCard, PaperChip } from '../../ui/ink/index.js';
import type { BreathMode, CultivationPath, HeartLawDef } from '../../types/index.js';

const LIFE_PATHS: { id: CultivationPath; title: string; art: string; alt: string }[] = [
  { id: 'heaven', title: 'HEAVEN', art: heavenArt, alt: 'Heaven path' },
  { id: 'earth', title: 'EARTH', art: earthArt, alt: 'Earth path' },
  { id: 'martial', title: 'MARTIAL', art: martialArt, alt: 'Martial path' },
];

const BREATH_MODES = [
  { id: 'balanced', label: 'Balanced', desc: 'Steady progress with reliable insight.' },
  { id: 'safe', label: 'Safe', desc: 'Slower, calmer cultivation; favors stability.' },
  { id: 'fast', label: 'Fast', desc: 'Aggressive cultivation; faster progress with more volatility.' },
] as const;

export function LifeStartWizardModal() {
  const selectedPath = useGameStore((state) => state.selectedPath);
  const selectPath = useGameStore((state) => state.selectPath);

  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);
  const selectHeartLaw = useHeartLawStore((state) => state.selectHeartLaw);
  const isHeartLawUnlocked = useHeartLawStore((state) => state.isUnlocked);
  const breathMode = useHeartLawStore((state) => state.breathMode);
  const setBreathMode = useHeartLawStore((state) => state.setBreathMode);

  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);

  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const addNotification = useUIStore((state) => state.addNotification);
  const lifeStartWizardContext = useUIStore((state) => state.lifeStartWizardContext);
  const clearLifeStartWizardContext = useUIStore((state) => state.clearLifeStartWizardContext);

  const contentLoaded = useContentStore((state) => state.isLoaded);
  const listHeartLaws = useContentStore((state) => state.listHeartLaws);

  const [requestedStep, setRequestedStep] = useState<LifeStartWizardStep | null>(() =>
    getLifeStartWizardCommittedStep({ selectedPath, selectedHeartLawId }),
  );
  const [hoveredPath, setHoveredPath] = useState<CultivationPath | null>(null);
  const [draftHeartLawId, setDraftHeartLawId] = useState<string | null>(selectedHeartLawId);
  const [draftBreathMode, setDraftBreathMode] = useState<BreathMode>(breathMode);
  const [autoPickChecked, setAutoPickChecked] = useState(false);
  const [autoPickError, setAutoPickError] = useState<string | null>(null);

  const shouldShow = isLifeStartWizardRequired({ selectedPath, selectedHeartLawId });

  const wizardStep = resolveLifeStartWizardUiStep({
    selectedPath,
    selectedHeartLawId,
    draftHeartLawId,
    requestedStep,
  });

  useEffect(() => {
    if (!shouldShow) {
      setRequestedStep(null);
      setDraftHeartLawId(selectedHeartLawId);
      setDraftBreathMode(breathMode);
      setAutoPickChecked(false);
      setAutoPickError(null);
      return;
    }

    if (selectedPath === null) {
      setRequestedStep(1);
      setDraftHeartLawId(null);
      setDraftBreathMode(breathMode);
      setAutoPickChecked(false);
      setAutoPickError(null);
      return;
    }

    if (selectedHeartLawId !== null) {
      setDraftHeartLawId(selectedHeartLawId);
      setDraftBreathMode(breathMode);
      setRequestedStep((step) => step ?? 3);
      return;
    }

    setRequestedStep((step) => step ?? 2);
  }, [breathMode, selectedHeartLawId, selectedPath, shouldShow]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const stepOneLive = shouldShow && wizardStep === 1;
    document.body.classList.toggle('lifePathMode', stepOneLive);

    return () => {
      document.body.classList.remove('lifePathMode');
    };
  }, [shouldShow, wizardStep]);

  useEffect(() => {
    if (!autoPickChecked || !shouldShow || selectedPath === null || selectedHeartLawId !== null) {
      setAutoPickError(null);
      return;
    }

    const lastId = lifeStartWizardContext.lastHeartLawId;
    if (!lastId) return;

    if (isHeartLawUnlocked(lastId)) {
      setDraftHeartLawId(lastId);
      setRequestedStep(3);
      setAutoPickError(null);
      return;
    }

    setAutoPickError('Last run Heart Law is not unlocked this life.');
  }, [
    autoPickChecked,
    isHeartLawUnlocked,
    lifeStartWizardContext.lastHeartLawId,
    selectedHeartLawId,
    selectedPath,
    shouldShow,
  ]);

  const heartLaws: HeartLawDef[] = useMemo(() => {
    if (!contentLoaded) return [];
    try {
      return listHeartLaws();
    } catch (error) {
      console.warn('[LifeStartWizard] Unable to list heart laws', error);
      return [];
    }
  }, [contentLoaded, listHeartLaws]);

  const selectedHeartLaw = useMemo(
    () => heartLaws.find((law) => law.id === (draftHeartLawId ?? selectedHeartLawId)) ?? null,
    [draftHeartLawId, heartLaws, selectedHeartLawId],
  );

  const selectedPathProfile = useMemo(() => getPathDoctrineProfile(selectedPath), [selectedPath]);

  const selectedPathSummary = useMemo(() => getPathDoctrineSummary(selectedPath), [selectedPath]);

  const selectedBreathSemantics = useMemo(() => getBreathModeSemantics(draftBreathMode), [draftBreathMode]);

  const resonance = useMemo(() => getAffinityStatus(selectedHeartLaw, spiritRoot), [selectedHeartLaw, spiritRoot]);

  if (!shouldShow) return null;

  const handleFinish = () => {
    if (!selectedPath || !draftHeartLawId) return;

    selectHeartLaw(draftHeartLawId);
    setBreathMode(draftBreathMode);

    setActiveTab('cultivation');
    const pathLabel = selectedPath.charAt(0).toUpperCase() + selectedPath.slice(1);
    const heartLawLabel = selectedHeartLaw?.name ?? 'Heart Law';
    const breathLabel = selectedBreathSemantics.label;
    addNotification('success', `Life begins: ${pathLabel} • ${heartLawLabel} • ${breathLabel}`, 5000);
    clearLifeStartWizardContext();
    SaveService.save();
  };

  const handlePickPath = (pathId: CultivationPath) => {
    if (selectedPath !== null) return;
    selectPath(pathId);
    setRequestedStep(2);
  };

  const hasPath = Boolean(selectedPath);
  const hasHeartLawDraft = Boolean(draftHeartLawId || selectedHeartLawId);
  const showAutoPick = prestigeCount > 0 && Boolean(lifeStartWizardContext.lastHeartLawId);

  if (wizardStep === 1) {
    return (
      <div className="lifeStartWizardOverlay lifeStartWizardOverlay--path">
        <div className="lifeStartWizardModal lifeStartWizardModal--path">
          <div className="lifePathFullscreen" data-ui="life-path-fullscreen">
            <div className="lifePathTriptychFrame">
              <div className="lifePathTriptych" data-ui="life-path-triptych" role="group" aria-label="Choose your Life Path">
                {LIFE_PATHS.map((path) => {
                  const selected = selectedPath === path.id;
                  const disabled = selectedPath !== null && !selected;
                  const isHoverFx = hoveredPath === path.id;
                  return (
                    <div key={path.id} className={`lifePathPanel lifePathPanel--${path.id}${isHoverFx ? ' isHoverFx' : ''}`}>
                      <span className="lifePathPanel__stamp" aria-hidden="true" />
                      <img className="lifePathPanel__art" src={path.art} alt={path.alt} draggable={false} />
                      <div className="lifePathPanel__title">{path.title}</div>
                      <button
                        type="button"
                        className="lifePathPanel__select"
                        onClick={() => handlePickPath(path.id)}
                        onMouseEnter={() => setHoveredPath(path.id)}
                        onMouseLeave={() => setHoveredPath(null)}
                        onFocus={() => setHoveredPath(path.id)}
                        onBlur={() => setHoveredPath(null)}
                        disabled={disabled}
                        aria-label={`Select ${path.title.toLowerCase()} path`}
                        aria-pressed={selected}
                      >
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <InkModalFrame
      ariaLabel="Begin Your New Life"
      className="lifeStartWizardFrame"
      panelClassName="lifeStartWizardModal--ink"
      variant="heartlaw"
      watermark
    >
      <div className="lifeStartWizardContent">
        <div className="lifeStartWizardHeader">
          <h2>Begin Your New Life</h2>
          <p>Choose your path, scripture, and initial breath focus before cultivation begins.</p>
        </div>

        <div className="lifeStartWizardSteps" role="list" aria-label="Life-start ritual steps">
          {LIFE_START_WIZARD_STEPS.map((step) => (
            <PaperChip
              key={step}
              text={`${step} · ${step === 1 ? 'Life Path' : step === 2 ? 'Heart Law' : 'Breath Focus'}`}
              className={`wizardStepChip${wizardStep === step ? ' wizardStepChip--active' : ''}`}
            />
          ))}
        </div>

        <div className="wizardPathSummary" role="status" aria-live="polite">
          <div className="wizardPathSummary__label">Chosen Path</div>
          <div className="wizardPathSummary__name">{selectedPathProfile?.label ?? 'Unchosen'}</div>
          <div className="wizardPathSummary__summary">{selectedPathSummary}</div>
          <div className="wizardPathSummary__chips">
            {selectedPathProfile ? <PaperChip text={selectedPathProfile.coreIdentity.replace(/_/g, ' ')} className="wizardPathSummary__chip" /> : null}
            <PaperChip text={`Breath: ${selectedBreathSemantics.label}`} className="wizardPathSummary__chip" />
          </div>
        </div>

        {wizardStep === 2 && (
          <div className="wizardSection">
            <div className="wizardSectionHeader">
              <h3>Choose Your Heart Law (Xinfa)</h3>
              <p>
                This is the scripture you cultivate by in this life. It defines your cultivation rhythm, your Dao resonance,
                and the verses you can comprehend.
              </p>
            </div>
            <div className="wizardHelperRow">
              <span title="A verse is a section of your scripture you’ve truly understood. Comprehension comes from meditating and overcoming trials.">
                What is a Verse?
              </span>
              <span title="If your Spirit Root resonates with this Heart Law’s Dao tags, its signature effect is stronger. If not, the penalty is minor—your run is never ruined.">
                Resonance
              </span>
            </div>
            <div className="wizardCardGrid wizardCardGrid--heartLaws">
              {heartLaws.map((law) => {
                const unlocked = isHeartLawUnlocked(law.id);
                const selected = (draftHeartLawId ?? selectedHeartLawId) === law.id;
                const unlockInfo = getHeartLawUnlockInfo(law.tier);
                const tierLabel =
                  law.tier === 'starter' ? 'Starter' : law.tier ? law.tier.replace('tier', 'Tier ') : 'Tier ?';
                const lockedText =
                  unlockInfo.kind === 'prestige'
                    ? `Unlock: ${unlockInfo.upgradeName} (${unlockInfo.apCost} AP)`
                    : unlockInfo.kind === 'starter'
                      ? 'Starter'
                      : 'Locked — Unlock via Prestige';
                return (
                  <button
                    key={law.id}
                    type="button"
                    className={`wizardCardButton${selected ? ' wizardCardButton--selected' : ''}`}
                    onClick={() => {
                      if (!unlocked) return;
                      setDraftHeartLawId(law.id);
                      setRequestedStep(3);
                    }}
                    disabled={!unlocked}
                  >
                    <PaperCard
                      className={`wizardCard${selected ? ' wizardCard--selected' : ''}${!unlocked ? ' wizardCard--locked' : ''}`}
                      interactive={unlocked}
                      selected={selected}
                      disabled={!unlocked}
                    >
                      <div className="wizardCardTitle">{law.name}</div>
                      <div className="wizardCardTags">{(law.daoTags ?? []).slice(0, 3).join(' • ') || 'No tags'}</div>
                      <div className="wizardCardDesc">{tierLabel}</div>
                      <div className="wizardCardMeta">{unlocked ? 'Select' : lockedText}</div>
                    </PaperCard>
                  </button>
                );
              })}
              {heartLaws.length === 0 && <div className="wizardEmpty">Heart laws are loading...</div>}
            </div>
            <div className="wizardResonance">
              <div>
                Resonance:{' '}
                {resonance.status === 'none'
                  ? 'None'
                  : resonance.status === 'match'
                    ? `Match (+${resonance.percent}%)`
                    : `Mismatch (-${resonance.percent}%)`}
              </div>
              {showAutoPick && (
                <label className="wizardCheckbox">
                  <input
                    type="checkbox"
                    checked={autoPickChecked}
                    onChange={(e) => setAutoPickChecked(e.target.checked)}
                    disabled={lifeStartWizardContext.lastHeartLawId === null}
                  />
                  Auto-pick last run’s Heart Law
                  {autoPickError && <span className="wizardError">{autoPickError}</span>}
                </label>
              )}
            </div>
            <div className="wizardFooter">
              <div className="wizardFooterLane wizardFooterLane--left" aria-hidden="true" />
              <div className="wizardFooterLane wizardFooterLane--right">
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => setRequestedStep(3)}
                  disabled={!hasHeartLawDraft}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {wizardStep === 3 && (
          <div className="wizardSection">
            <div className="wizardSectionHeader">
              <h3>Choose Breath Focus</h3>
              <p>Select how you will pace your cultivation breaths. You can change this later.</p>
            </div>
            <div className="wizardCardGrid">
              {BREATH_MODES.map((mode) => {
                const selected = draftBreathMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className={`wizardCardButton${selected ? ' wizardCardButton--selected' : ''}`}
                    onClick={() => setDraftBreathMode(mode.id)}
                  >
                    <PaperCard className={`wizardCard${selected ? ' wizardCard--selected' : ''}`} selected={selected} interactive>
                      <div className="wizardCardTitle">{mode.label}</div>
                      <div className="wizardCardDesc">{mode.desc}</div>
                      <div className="wizardCardMeta">{selected ? 'Selected' : 'Select'}</div>
                    </PaperCard>
                  </button>
                );
              })}
            </div>
            <div className="wizardFooter">
              <div className="wizardFooterLane wizardFooterLane--left">
                <button type="button" className="button-secondary" onClick={() => setRequestedStep(2)}>
                  Back
                </button>
              </div>
              <div className="wizardFooterLane wizardFooterLane--right">
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleFinish}
                  disabled={!hasPath || !hasHeartLawDraft}
                >
                  Finish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </InkModalFrame>
  );
}
