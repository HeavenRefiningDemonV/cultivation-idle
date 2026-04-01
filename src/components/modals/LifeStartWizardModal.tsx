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
import {
  getBreathModeSemantics,
  getPathDoctrinePresentation,
  getPathDoctrineProfile,
  getPathDoctrineSummary,
} from '../../systems/doctrine/index.js';
import { getHeartLawSelectionPresentation } from '../../systems/doctrine/heartLawSelectionPresentation.js';
import { getAffinityStatus } from '../../systems/heartLaw/heartLawLogic.js';
import { getHeartLawUnlockInfo } from '../../systems/heartLaw/heartLawUnlockInfo.js';
import {
  LIFE_START_WIZARD_STEPS,
  resolveLifeStartWizardUiStep,
  type LifeStartWizardStep,
} from '../../systems/ui/lifeStart/lifeStartWizardContract.js';
import { InkModalFrame, PaperCard, PaperChip } from '../../ui/ink/index.js';
import { useFxQuality } from '../../ui/fx/FxQualityProvider.js';
import { getSelectionCommitDelay } from '../../ui/motion/ritualMotion.js';
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


const HEART_LAW_EFFECT_LABELS: Record<string, string> = {
  cultivateQiMult: 'Cultivation rate',
  combatDamageMult: 'Combat damage',
  offlineEfficiencyAdd: 'Offline efficiency',
  stabilityCostMult: 'Stability cost',
  professionYieldMult: 'Profession yield',
  professionSpeedMult: 'Profession speed',
};

function summarizeHeartLawSignature(signature: HeartLawDef['signature']): string {
  if (!signature || typeof signature !== 'object') return 'General insight bonus.';

  const entries = Object.entries(signature)
    .slice(0, 2)
    .map(([key, value]) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return null;
      const label = HEART_LAW_EFFECT_LABELS[key] ?? key;
      const percent = Math.round(value * 100);
      return `${label} ${percent >= 0 ? '+' : ''}${percent}%`;
    })
    .filter((entry): entry is string => entry !== null);

  return entries.length > 0 ? entries.join(' • ') : 'General insight bonus.';
}

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
  const { effectiveQuality, prefersReducedMotion } = useFxQuality();

  const [requestedStep, setRequestedStep] = useState<LifeStartWizardStep | null>(null);
  const [hoveredPath, setHoveredPath] = useState<CultivationPath | null>(null);
  const [committingPath, setCommittingPath] = useState<CultivationPath | null>(null);

  const [draftHeartLawId, setDraftHeartLawId] = useState<string | null>(null);
  const [hoveredHeartLawId, setHoveredHeartLawId] = useState<string | null>(null);
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
      setHoveredHeartLawId(null);
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

    if (prefersReducedMotion) {
      commitPath();
      return;
    }

    setCommittingPath(pathId);
    window.setTimeout(commitPath, getSelectionCommitDelay(prefersReducedMotion));
  };

  const handleSelectDraftLaw = (heartLawId: string) => {
    setDraftHeartLawId(heartLawId);
  };

  const handleChoosePreviewedLaw = () => {
    if (!previewHeartLaw || !previewUnlocked) return;
    setDraftHeartLawId(previewHeartLaw.id);
  };

  const handleContinueToBreath = () => {
    if (!draftHeartLawId) return;
    setRequestedStep(3);
  };


  const rememberedHeartLawId = useMemo(() => {
    const lastId = lifeStartWizardContext.lastHeartLawId;
    if (!lastId) return null;
    const exists = heartLaws.some((law) => law.id === lastId);
    if (!exists || !isHeartLawUnlocked(lastId)) return null;
    return lastId;
  }, [heartLaws, isHeartLawUnlocked, lifeStartWizardContext.lastHeartLawId]);

  const firstUnlockedHeartLawId = useMemo(() => {
    const firstUnlocked = heartLaws.find((law) => isHeartLawUnlocked(law.id));
    return firstUnlocked?.id ?? heartLaws[0]?.id ?? null;
  }, [heartLaws, isHeartLawUnlocked]);

  const chosenHeartLawId = draftHeartLawId ?? selectedHeartLawId ?? rememberedHeartLawId ?? firstUnlockedHeartLawId;
  const previewHeartLawId = hoveredHeartLawId ?? chosenHeartLawId;

  const previewHeartLaw = useMemo(
    () => heartLaws.find((law) => law.id === previewHeartLawId) ?? null,
    [heartLaws, previewHeartLawId],
  );

  const previewUnlockInfo = useMemo(
    () => getHeartLawUnlockInfo(previewHeartLaw?.tier),
    [previewHeartLaw?.tier],
  );

  const previewUnlocked = previewHeartLaw ? isHeartLawUnlocked(previewHeartLaw.id) : false;
  const previewResonance = useMemo(() => getAffinityStatus(previewHeartLaw, spiritRoot), [previewHeartLaw, spiritRoot]);

  const previewPresentationCard = useMemo(() => {
    if (!previewHeartLaw) return null;
    return getHeartLawSelectionPresentation(previewHeartLaw, {
      spiritRoot,
      isUnlocked: previewUnlocked,
      isSelected: chosenHeartLawId === previewHeartLaw.id,
    });
  }, [chosenHeartLawId, previewHeartLaw, previewUnlocked, spiritRoot]);

  const showAutoPick = prestigeCount > 0 && Boolean(lifeStartWizardContext.lastHeartLawId);
  const previewedPath: CultivationPath = hoveredPath ?? 'heaven';
  const previewPresentation = getPathDoctrinePresentation(previewedPath);

  if (!shouldShow) return null;

  if (wizardStep === 1) {
    return (
      <div className="lifeStartWizardOverlay lifeStartWizardOverlay--path">
        <div className="lifeStartWizardModal lifeStartWizardModal--path">
          <div className="lifePathFullscreen" data-ui="life-path-fullscreen" data-fx-quality={effectiveQuality}>
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
          <div className="wizardSection lifeStartHeartLawShell" data-ui="life-start-heart-law-shell">
            <div className="lifeStartHeartLawShell__choices" role="group" aria-label="Heart Law choices">
              <div className="lifeStartHeartLawShell__choicesHeader">
                <h3>Choose Your Heart Law (Xinfa)</h3>
                <p>Select the scripture that governs your verses, resonance, and cultivation cadence.</p>
              </div>

              <div className="lifeStartHeartLawChoicesGrid">
                {heartLaws.map((law) => {
                  const unlocked = isHeartLawUnlocked(law.id);
                  const selected = chosenHeartLawId === law.id;
                  const previewed = previewHeartLawId === law.id;
                  const presentation = getHeartLawSelectionPresentation(law, {
                    spiritRoot,
                    isUnlocked: unlocked,
                    isSelected: selected,
                  });

                  return (
                    <button
                      key={law.id}
                      type="button"
                      className={`lifeStartHeartLawChoice${selected ? ' lifeStartHeartLawChoice--selected' : ''}${previewed ? ' lifeStartHeartLawChoice--previewed' : ''}${!unlocked ? ' lifeStartHeartLawChoice--locked' : ''}`}
                      onClick={() => (unlocked ? handleSelectDraftLaw(law.id) : undefined)}
                      onMouseEnter={() => setHoveredHeartLawId(law.id)}
                      onMouseLeave={() => setHoveredHeartLawId(null)}
                      onFocus={() => setHoveredHeartLawId(law.id)}
                      onBlur={() => setHoveredHeartLawId(null)}
                      aria-disabled={!unlocked}
                      aria-pressed={selected}
                      aria-describedby={`lifeStartHeartLawDetailTitle lifeStartHeartLawDetailResonance`}
                      aria-label={`${presentation.label}, ${presentation.familyLabel}, Resonance ${presentation.resonanceLabel}, ${presentation.statusLabel}`}
                    >
                      <div className={`lifeStartHeartLawChoice__stamp lifeStartHeartLawChoice__stamp--${presentation.statusTone}`} aria-hidden="true">{presentation.statusLabel}</div>
                      <div className="lifeStartHeartLawChoice__title">{presentation.label}</div>
                      <div className="lifeStartHeartLawChoice__family">{presentation.familyLabel}</div>
                      <div className={`lifeStartHeartLawChoice__resonance lifeStartHeartLawChoice__resonance--${presentation.resonanceTone}`}>{presentation.resonanceLabel}</div>
                      <div className="lifeStartHeartLawChoice__tags">
                        {presentation.tagLabels.map((tag) => (
                          <span key={tag} className="lifeStartHeartLawChoice__tag">{tag}</span>
                        ))}
                      </div>
                      <div className="lifeStartHeartLawChoice__footer">
                        <span className="lifeStartHeartLawChoice__tier">{presentation.tierLabel}</span>
                        <span className="lifeStartHeartLawChoice__statusLine">{presentation.statusLabel}</span>
                      </div>
                      <div className="lifeStartHeartLawChoice__unlock">{presentation.isLocked ? presentation.unlockLine : 'Ready now'}</div>
                    </button>
                  );
                })}
                {heartLaws.length === 0 ? <div className="wizardEmpty">Heart laws are loading...</div> : null}
              </div>
            </div>

            <aside className={`lifeStartHeartLawShell__detail lifeStartHeartLawShell__detail--${previewPresentationCard?.previewFamilyTone ?? 'unknown'}`} aria-live="polite">
              <div className="lifeStartHeartLawDetail">
                <p className="lifeStartHeartLawDetail__eyebrow">Scripture Detail</p>
                <h3 id="lifeStartHeartLawDetailTitle" className="lifeStartHeartLawDetail__title">{previewHeartLaw?.name ?? 'No Heart Law available'}</h3>
                <p className="lifeStartHeartLawDetail__subtitle">
                  {previewHeartLaw ? `${previewPresentationCard?.familyLabel ?? 'Doctrine'} • ${previewPresentationCard?.tierLabel ?? 'Tier ?'} • ${previewPresentationCard?.archetypeLabel ?? 'Doctrine'}` : 'Awaiting scripture data'}
                </p>

                <p className="lifeStartHeartLawDetail__doctrineSubtitle">{previewPresentationCard?.doctrineSubtitle ?? 'Doctrine scripture.'}</p>

                <div id="lifeStartHeartLawDetailResonance" className={`lifeStartHeartLawResonance lifeStartHeartLawResonance--${previewResonance.status}`}>
                  {previewPresentationCard ? `Resonance: ${previewPresentationCard.resonanceLabel} — ${previewPresentationCard.resonanceDetail}` : (
                    previewResonance.status === 'none'
                      ? 'Resonance: None'
                      : previewResonance.status === 'match'
                        ? `Resonance: Match (+${previewResonance.percent}% signature potency)`
                        : `Resonance: Mismatch (-${previewResonance.percent}% signature potency)`
                  )}
                </div>

                <div className="lifeStartHeartLawDetail__tags" aria-label="Dao tags">
                  {(previewPresentationCard?.tagLabels ?? []).map((tag) => (
                    <span key={tag} className="lifeStartHeartLawDetail__tag">{tag}</span>
                  ))}
                </div>

                <p className="lifeStartHeartLawDetail__fantasy">{previewPresentationCard?.fantasyDescription ?? 'A scripture carried through quiet inner discipline.'}</p>
                <p className="lifeStartHeartLawDetail__practical">{previewPresentationCard?.practicalDescription ?? 'Best for reliable doctrine development in early lives.'}</p>

                <div className="lifeStartHeartLawDetail__signature">
                  <p className="lifeStartHeartLawDetail__signatureTitle">Signature</p>
                  <p className="lifeStartHeartLawDetail__summary">{previewPresentationCard?.signatureSummary ?? summarizeHeartLawSignature(previewHeartLaw?.signature)}</p>
                  <ul className="lifeStartHeartLawDetail__benefits">
                    {(previewPresentationCard?.keyBenefits ?? []).slice(0, 3).map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </div>

                <p className="lifeStartHeartLawDetail__unlock">
                  {previewUnlocked
                    ? 'Unlocked: Ready to cultivate this scripture now.'
                    : previewUnlockInfo.kind === 'prestige'
                      ? `Locked until ${previewUnlockInfo.upgradeName} (${previewUnlockInfo.apCost} AP).`
                      : previewUnlockInfo.kind === 'starter'
                        ? 'Starter scripture available immediately.'
                        : 'Locked — Unlock via Prestige progression.'}
                </p>

                <div className="lifeStartHeartLawDetail__ctaLane">
                  <button
                    type="button"
                    className="button-secondary uiNoShift"
                    onClick={handleChoosePreviewedLaw}
                    disabled={Boolean(previewPresentationCard?.ctaDisabledReason)}
                  >
                    {previewPresentationCard?.ctaLabel ?? 'Choose This Heart Law'}
                  </button>
                  {previewPresentationCard?.ctaDisabledReason ? (
                    <p className="lifeStartHeartLawDetail__ctaReason">{previewPresentationCard.ctaDisabledReason}</p>
                  ) : null}
                </div>

                <div className="lifeStartHeartLawSupport">
                  <p className="lifeStartHeartLawSupport__hint">
                    This is doctrine preview only; verse progress begins after life-start is confirmed.
                  </p>

                  {showAutoPick ? (
                    <label className="lifeStartHeartLawMemory">
                      <input
                        type="checkbox"
                        checked={autoPickChecked}
                        onChange={(event) => setAutoPickChecked(event.target.checked)}
                        disabled={lifeStartWizardContext.lastHeartLawId === null}
                      />
                      <span>Use last run's Heart Law memory</span>
                    </label>
                  ) : null}
                  {autoPickError ? <div className="lifeStartHeartLawMemory__error">{autoPickError}</div> : null}
                </div>
              </div>

              <div className="lifeStartHeartLawPreview" aria-hidden="true">
                <div className="lifeStartHeartLawPreview__seal" />
                <div className="lifeStartHeartLawPreview__label">Sacred Scripture Altar</div>
                <div className="lifeStartHeartLawPreview__name">{previewHeartLaw?.name ?? 'Scripture Awaiting'}</div>
                <div className="lifeStartHeartLawPreview__line">{previewPresentationCard?.doctrineSubtitle ?? 'Parchment stillness'}</div>
              </div>
            </aside>

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
