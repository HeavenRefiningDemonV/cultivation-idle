import { useEffect, useMemo, useState } from 'react';
import './LifeStartWizardModal.scss';
import heavenArt from '../../assets/menus/path_heaven 1.png';
import earthArt from '../../assets/menus/path_earth 1.png';
import martialArt from '../../assets/menus/path_martial 1.png';
import barLong from '../../assets/menus/bar_long.png';
import { SaveService } from '../../services/save/SaveService.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useHeartLawStore } from '../../stores/heartLawStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { useUIStore } from '../../stores/uiStore.js';
import { getBreathModeSemantics } from '../../systems/doctrine/breathSemantics.js';
import { getPathDoctrineProfile, getPathDoctrineSummary } from '../../systems/doctrine/pathDoctrineRegistry.js';
import { getPathDoctrinePresentation } from '../../systems/doctrine/pathDoctrinePresentation.js';
import { getAffinityStatus } from '../../systems/heartLaw/heartLawLogic.js';
import { getHeartLawUnlockInfo } from '../../systems/heartLaw/heartLawUnlockInfo.js';
import {
  LIFE_START_WIZARD_STEPS,
  resolveLifeStartWizardUiStep,
  type LifeStartWizardStep,
} from '../../systems/ui/lifeStart/lifeStartWizardContract.js';
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

interface LifeStartWizardModalProps {
  debugForceOpen?: boolean;
  debugForceStep?: LifeStartWizardStep;
}

export function LifeStartWizardModal({ debugForceOpen = false, debugForceStep }: LifeStartWizardModalProps = {}) {
  const forcedOpen = import.meta.env.DEV && debugForceOpen;
  const forcedStep = import.meta.env.DEV ? debugForceStep : undefined;

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

  const [requestedStep, setRequestedStep] = useState<LifeStartWizardStep | null>(null);
  const [hoveredPath, setHoveredPath] = useState<CultivationPath | null>(null);
  const [committingPath, setCommittingPath] = useState<CultivationPath | null>(null);

  const [draftHeartLawId, setDraftHeartLawId] = useState<string | null>(null);
  const [draftBreathMode, setDraftBreathMode] = useState<BreathMode>(breathMode);
  const [autoPickChecked, setAutoPickChecked] = useState(false);
  const [autoPickError, setAutoPickError] = useState<string | null>(null);

  const shouldShow = forcedOpen || selectedPath === null || selectedHeartLawId === null;

  const wizardStep: LifeStartWizardStep = forcedStep
    ?? resolveLifeStartWizardUiStep({
      selectedPath,
      selectedHeartLawId,
      draftHeartLawId,
      requestedStep,
    });

  useEffect(() => {
    if (selectedPath === null) {
      setRequestedStep(null);
      setDraftHeartLawId(null);
      setDraftBreathMode(breathMode);
      setAutoPickChecked(false);
      setAutoPickError(null);
      return;
    }

    if (selectedHeartLawId !== null) {
      setDraftHeartLawId(selectedHeartLawId);
      setDraftBreathMode(breathMode);
    }
  }, [breathMode, selectedHeartLawId, selectedPath]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const pathModeActive = shouldShow && wizardStep === 1;
    document.body.classList.toggle('lifePathMode', pathModeActive);
    return () => {
      document.body.classList.remove('lifePathMode');
    };
  }, [shouldShow, wizardStep]);

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
    () => heartLaws.find((law) => law.id === draftHeartLawId) ?? null,
    [draftHeartLawId, heartLaws],
  );

  const resonance = useMemo(() => getAffinityStatus(selectedHeartLaw, spiritRoot), [selectedHeartLaw, spiritRoot]);

  const pathDoctrineProfile = useMemo(() => getPathDoctrineProfile(selectedPath), [selectedPath]);
  const pathSummary = useMemo(() => getPathDoctrineSummary(selectedPath), [selectedPath]);
  const breathSemantics = useMemo(() => getBreathModeSemantics(draftBreathMode), [draftBreathMode]);

  useEffect(() => {
    if (!autoPickChecked) {
      setAutoPickError(null);
      return;
    }

    const lastId = lifeStartWizardContext.lastHeartLawId;
    if (!lastId) {
      setAutoPickError('No previous Heart Law is recorded yet.');
      return;
    }

    if (!isHeartLawUnlocked(lastId)) {
      setAutoPickError('Last run Heart Law is not unlocked this life.');
      return;
    }

    setDraftHeartLawId(lastId);
    setRequestedStep(3);
    setAutoPickError(null);
  }, [autoPickChecked, isHeartLawUnlocked, lifeStartWizardContext.lastHeartLawId]);

  if (!shouldShow) return null;

  const handleFinish = () => {
    if (!selectedPath || !draftHeartLawId) {
      setRequestedStep(2);
      return;
    }

    selectHeartLaw(draftHeartLawId);
    setBreathMode(draftBreathMode);
    setActiveTab('cultivation');

    const pathLabel = selectedPath.charAt(0).toUpperCase() + selectedPath.slice(1);
    const heartLawLabel = selectedHeartLaw?.name ?? 'Heart Law';
    const breathLabel = draftBreathMode.charAt(0).toUpperCase() + draftBreathMode.slice(1);
    addNotification('success', `Life begins: ${pathLabel} • ${heartLawLabel} • ${breathLabel}`, 5000);

    clearLifeStartWizardContext();
    setRequestedStep(null);
    setDraftHeartLawId(null);
    setAutoPickChecked(false);
    setAutoPickError(null);
    SaveService.save();
  };

  const handlePickPath = (pathId: CultivationPath) => {
    if (selectedPath !== null || committingPath !== null) return;

    const commitPath = () => {
      selectPath(pathId);
      setRequestedStep(2);
      setCommittingPath(null);
    };

    const prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      commitPath();
      return;
    }

    setCommittingPath(pathId);
    window.setTimeout(commitPath, 130);
  };

  const handleSelectDraftLaw = (heartLawId: string) => {
    setDraftHeartLawId(heartLawId);
  };

  const handleContinueToBreath = () => {
    if (!draftHeartLawId) return;
    setRequestedStep(3);
  };

  const showAutoPick = prestigeCount > 0 && Boolean(lifeStartWizardContext.lastHeartLawId);
  const previewedPath: CultivationPath = hoveredPath ?? 'heaven';
  const previewPresentation = getPathDoctrinePresentation(previewedPath);

  if (wizardStep === 1) {
    return (
      <div className="lifeStartWizardOverlay lifeStartWizardOverlay--path">
        <div className="lifeStartWizardModal lifeStartWizardModal--path">
          <div className="lifePathFullscreen" data-ui="life-path-fullscreen">
            <div className="lifePathHero">
              <div className="lifePathHeroBackdrop" aria-hidden />
              <header className="lifePathHeroHeader">
                <p className="lifePathHeroEyebrow">New Life Ritual</p>
                <h2 className="lifePathHeroTitle">Choose Your Path</h2>
                <p className="lifePathHeroSubline">Select the doctrine that will shape this life.</p>
                <img className="lifePathHeroDivider" src={barLong} alt="" aria-hidden />
                <div className="lifePathHeroDividerBar" aria-hidden />
              </header>

              <aside id="lifePath-preview-plaque" className={`lifePathPreviewPlaque lifePathPreviewPlaque--${previewedPath}`} aria-live="polite">
                <div className="lifePathPreviewPlaque__label">{previewPresentation?.label ?? 'Path Preview'}</div>
                <p className="lifePathPreviewPlaque__subtitle">{previewPresentation?.doctrineSubtitle ?? 'Choose a doctrine to preview its cadence.'}</p>
                <p className="lifePathPreviewPlaque__summary">{previewPresentation?.summary ?? 'Choose a doctrine to preview its philosophy.'}</p>
                <div className="lifePathPreviewPlaque__highlights" aria-label="Path highlights">
                  {(previewPresentation?.statHighlights ?? []).map((highlight) => (
                    <span key={highlight} className="lifePathPreviewPlaque__chip">{highlight}</span>
                  ))}
                </div>
                <div className="lifePathPreviewPlaque__tags" aria-label="Doctrine tags">
                  {(previewPresentation?.tags ?? []).map((tag) => (
                    <span key={tag} className="lifePathPreviewPlaque__tag">{tag}</span>
                  ))}
                </div>
              </aside>

              <div className="lifePathTriptychFrame">
                <div className="lifePathTriptych" data-ui="life-path-triptych" data-preview={previewedPath} role="group" aria-label="Choose your Life Path">
                {LIFE_PATHS.map((path) => {
                  const selected = selectedPath === path.id;
                  const disabled = selectedPath !== null && !selected;
                  const isPreviewed = hoveredPath === path.id;
                  const isDimmed = hoveredPath !== null && hoveredPath !== path.id;
                  const isCommitting = committingPath === path.id;
                  const presentation = getPathDoctrinePresentation(path.id);
                  const roleCue = presentation?.practicalRoleLine ?? 'Choose this path to shape your life.';
                  const roleId = `lifePath-role-${path.id}`;
                  const plaqueId = 'lifePath-preview-plaque';
                  return (
                    <div
                      key={path.id}
                      className={`lifePathPanel lifePathPanel--${path.id}${isPreviewed ? ' lifePathPanel--previewed' : ''}${isDimmed ? ' lifePathPanel--receded' : ''}${isCommitting ? ' lifePathPanel--commit' : ''}`}
                    >
                      <div className="lifePathPanel__frame" aria-hidden />
                      <div className="lifePathPanel__veil" aria-hidden />
                      <span className="lifePathPanel__stamp" aria-hidden="true" />
                      <img className="lifePathPanel__art" src={path.art} alt={path.alt} draggable={false} />
                      <div className="lifePathPanel__title">{path.title}</div>
                      <div className="lifePathPanel__footer">
                        <p id={roleId} className="lifePathPanel__role">{roleCue}</p>
                        <div className="lifePathPanel__actionPlate">
                          <button
                            type="button"
                            className="lifePathPanel__select"
                            onClick={() => handlePickPath(path.id)}
                            onMouseEnter={() => setHoveredPath(path.id)}
                            onMouseLeave={() => setHoveredPath(null)}
                            onFocus={() => setHoveredPath(path.id)}
                            onBlur={() => setHoveredPath(null)}
                            disabled={disabled || committingPath !== null}
                            aria-label={`Select ${path.title.toLowerCase()} path`}
                            aria-pressed={selected}
                            aria-describedby={`${roleId} ${plaqueId}`}
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
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

        <div className="lifeStartWizardSteps" role="list" aria-label="Life start steps">
          {LIFE_START_WIZARD_STEPS.map((step) => (
            <PaperChip
              key={step}
              text={step === 1 ? '1 · Life Path' : step === 2 ? '2 · Heart Law' : '3 · Breath Focus'}
              className={`wizardStepChip${wizardStep === step ? ' wizardStepChip--active' : ''}`}
            />
          ))}
        </div>

        <div className="wizardPathSummary" aria-live="polite">
          <div className="wizardPathSummary__title">Locked Path: {pathDoctrineProfile?.label ?? 'Unknown'}</div>
          <p className="wizardPathSummary__desc">{pathSummary}</p>
          <div className="wizardPathSummary__chips">
            {pathDoctrineProfile?.coreIdentity ? <span className="wizardPathSummary__chip">{pathDoctrineProfile.coreIdentity}</span> : null}
            <span className="wizardPathSummary__chip">Breath: {breathSemantics.label}</span>
          </div>
        </div>

        {wizardStep === 2 ? (
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
                const selected = draftHeartLawId === law.id;
                const unlockInfo = getHeartLawUnlockInfo(law.tier);
                const tierLabel = law.tier === 'starter' ? 'Starter' : law.tier ? law.tier.replace('tier', 'Tier ') : 'Tier ?';
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
                    onClick={() => (unlocked ? handleSelectDraftLaw(law.id) : undefined)}
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
              {heartLaws.length === 0 ? <div className="wizardEmpty">Heart laws are loading...</div> : null}
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
              {showAutoPick ? (
                <label className="wizardCheckbox">
                  <input
                    type="checkbox"
                    checked={autoPickChecked}
                    onChange={(event) => setAutoPickChecked(event.target.checked)}
                    disabled={lifeStartWizardContext.lastHeartLawId === null}
                  />
                  Auto-pick last run’s Heart Law
                  {autoPickError ? <span className="wizardError">{autoPickError}</span> : null}
                </label>
              ) : null}
            </div>

            <div className="wizardFooter wizardFooter--stable">
              <div className="wizardFooterLane wizardFooterLane--left" aria-hidden="true" />
              <div className="wizardFooterLane wizardFooterLane--right">
                <button
                  type="button"
                  className="button-primary uiNoShift"
                  onClick={handleContinueToBreath}
                  disabled={!draftHeartLawId}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {wizardStep === 3 ? (
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
            <div className="wizardFooter wizardFooter--stable">
              <div className="wizardFooterLane wizardFooterLane--left">
                <button type="button" className="button-secondary uiNoShift" onClick={() => setRequestedStep(2)}>
                  Back
                </button>
              </div>
              <div className="wizardFooterLane wizardFooterLane--right">
                <button
                  type="button"
                  className="button-primary uiNoShift"
                  onClick={handleFinish}
                  disabled={!selectedPath || !draftHeartLawId}
                >
                  Finish
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </InkModalFrame>
  );
}
