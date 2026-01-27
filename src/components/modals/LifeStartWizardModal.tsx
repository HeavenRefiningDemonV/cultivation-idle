import { useEffect, useMemo, useState } from 'react';
import './LifeStartWizardModal.scss';
import heavenArt from '../../assets/menus/path_heaven 1.png';
import earthArt from '../../assets/menus/path_earth 1.png';
import martialArt from '../../assets/menus/path_martial 1.png';
import { SaveService } from '../../services/save/SaveService';
import { useContentStore } from '../../stores/contentStore';
import { useGameStore } from '../../stores/gameStore';
import { useHeartLawStore } from '../../stores/heartLawStore';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useUIStore } from '../../stores/uiStore';
import { getAffinityStatus } from '../../systems/heartLaw/heartLawLogic';
import { getHeartLawUnlockInfo } from '../../systems/heartLaw/heartLawUnlockInfo';
import { InkModalFrame, PaperCard, PaperChip } from '../../ui/ink';
import type { HeartLawDef, LifePath } from '../../types';

const LIFE_PATHS: { id: LifePath; title: string; art: string; alt: string }[] = [
  { id: 'heaven', title: 'HEAVEN', art: heavenArt, alt: 'Heaven path' },
  { id: 'earth', title: 'EARTH', art: earthArt, alt: 'Earth path' },
  { id: 'martial', title: 'MARTIAL', art: martialArt, alt: 'Martial path' },
];

const BREATH_MODES = [
  { id: 'balanced', label: 'Balanced', desc: 'Steady progress with reliable insight.' },
  { id: 'safe', label: 'Safe', desc: 'Slower, calmer cultivation; favors stability.' },
  { id: 'fast', label: 'Fast', desc: 'Aggressive cultivation; faster progress with more volatility.' },
] as const;

type WizardStep = 1 | 2 | 3 | 4;

export function LifeStartWizardModal() {
  const lifePath = useGameStore((state) => state.lifePath);
  const setLifePath = useGameStore((state) => state.setLifePath);
  const canChangeLifePath = useGameStore((state) => state.canChangeLifePath);

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
  const setLifeStartWizardContext = useUIStore((state) => state.setLifeStartWizardContext);
  const clearLifeStartWizardContext = useUIStore((state) => state.clearLifeStartWizardContext);

  const contentLoaded = useContentStore((state) => state.isLoaded);
  const listHeartLaws = useContentStore((state) => state.listHeartLaws);

  const [wizardStep, setWizardStep] = useState<WizardStep>(() => {
    if (!lifePath) return 1;
    if (!selectedHeartLawId) return 2;
    return 3;
  });

  const [autoPickChecked, setAutoPickChecked] = useState(false);
  const [autoPickError, setAutoPickError] = useState<string | null>(null);

  useEffect(() => {
    if (!lifePath) {
      setWizardStep(1);
    } else if (!selectedHeartLawId) {
      setWizardStep(2);
    } else {
      setWizardStep(3);
    }
  }, [lifePath, selectedHeartLawId]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (wizardStep === 1) {
      document.body.classList.add('lifePathMode');
      return () => {
        document.body.classList.remove('lifePathMode');
      };
    }
    document.body.classList.remove('lifePathMode');
    return undefined;
  }, [wizardStep]);

  useEffect(() => {
    if (!autoPickChecked) {
      setAutoPickError(null);
      return;
    }
    const lastId = lifeStartWizardContext.lastHeartLawId;
    if (!lastId) return;
    if (isHeartLawUnlocked(lastId)) {
      selectHeartLaw(lastId);
      setAutoPickError(null);
    } else {
      setAutoPickError('Last run Heart Law is not unlocked this life.');
    }
  }, [autoPickChecked, isHeartLawUnlocked, lifeStartWizardContext.lastHeartLawId, selectHeartLaw]);

  useEffect(() => {
    if (selectedHeartLawId) {
      setLifeStartWizardContext(selectedHeartLawId);
    }
  }, [selectedHeartLawId, setLifeStartWizardContext]);

  const shouldShow = lifePath === null || selectedHeartLawId === null;
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
    () => heartLaws.find((law) => law.id === selectedHeartLawId) ?? null,
    [heartLaws, selectedHeartLawId],
  );

  const resonance = useMemo(() => getAffinityStatus(selectedHeartLaw, spiritRoot), [selectedHeartLaw, spiritRoot]);

  if (!shouldShow) return null;

  const handleFinish = () => {
    setActiveTab('cultivation');
    const pathLabel = lifePath ? lifePath.charAt(0).toUpperCase() + lifePath.slice(1) : 'Path';
    const heartLawLabel = selectedHeartLaw?.name ?? 'Heart Law';
    const breathLabel = breathMode.charAt(0).toUpperCase() + breathMode.slice(1);
    addNotification('success', `Life begins: ${pathLabel} • ${heartLawLabel} • ${breathLabel}`, 5000);
    clearLifeStartWizardContext();
    SaveService.save();
  };

  const handlePickPath = (pathId: LifePath) => {
    setLifePath(pathId);
    setWizardStep(2);
  };

  const hasPath = Boolean(lifePath);
  const hasHeartLaw = Boolean(selectedHeartLawId);
  const showAutoPick = prestigeCount > 0 && Boolean(lifeStartWizardContext.lastHeartLawId);
  const steps = [
    {
      id: 1,
      label: 'Life Path',
      isActive: wizardStep === 1,
      isComplete: hasPath,
      onClick: canChangeLifePath() ? () => setWizardStep(1) : undefined,
    },
    {
      id: 2,
      label: 'Heart Law',
      isActive: wizardStep === 2,
      isComplete: hasHeartLaw,
    },
    {
      id: 3,
      label: 'Breath Focus',
      isActive: wizardStep === 3,
      isComplete: hasPath && hasHeartLaw,
    },
  ];

  if (wizardStep === 1) {
    return (
      <InkModalFrame
        ariaLabel="Choose your life path"
        className="lifeStartWizardFrame lifeStartWizardFrame--path"
        panelClassName="lifeStartWizardModal--path"
        variant="heartlaw"
        watermark
        showCloseButton={false}
      >
        <div className="lifePathFullscreen" data-ui="life-path-fullscreen">
          <div className="lifePathTriptychFrame">
            <div className="lifePathTriptych" data-ui="life-path-triptych" role="group" aria-label="Choose your Life Path">
              {LIFE_PATHS.map((path) => {
                const selected = lifePath === path.id;
                const disabled = !canChangeLifePath() && !selected;
                return (
                  <div key={path.id} className={`lifePathPanel lifePathPanel--${path.id}`}>
                    <img className="lifePathPanel__art" src={path.art} alt={path.alt} draggable={false} />
                    <div className="lifePathPanel__title">{path.title}</div>
                    <button
                      type="button"
                      className="lifePathPanel__select"
                      onClick={() => handlePickPath(path.id)}
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
      </InkModalFrame>
    );
  }

  return (
    <InkModalFrame
      ariaLabel="Begin Your New Life"
      className="lifeStartWizardFrame"
      panelClassName="lifeStartWizardModal--ink"
      variant="heartlaw"
      watermark
      showCloseButton={false}
    >
      <div className="lifeStartWizardContent">
        <div className="lifeStartWizardHeader">
          <h2>Begin Your New Life</h2>
          <p>Choose your path, scripture, and initial breath focus before cultivation begins.</p>
        </div>

        <div className="lifeStartWizardSteps">
          {steps.map((step) => (
            <PaperChip
              key={step.id}
              text={step.label}
              icon={<span className="wizardStepNumber">{step.id}</span>}
              variant="tag"
              className={`wizardStepChip${step.isActive ? ' wizardStepChip--active' : ''}${step.isComplete ? ' wizardStepChip--complete' : ''}`}
              onClick={step.onClick}
            />
          ))}
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
                const selected = selectedHeartLawId === law.id;
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
                    onClick={() => (unlocked ? selectHeartLaw(law.id) : undefined)}
                    disabled={!unlocked}
                  >
                    <PaperCard
                      className={`wizardCard${selected ? ' wizardCard--selected' : ''}${!unlocked ? ' wizardCard--locked' : ''}`}
                      variant="heartlaw"
                      interactive={unlocked}
                      selected={selected}
                      disabled={!unlocked}
                    >
                      <div className="wizardCardTitle">{law.name}</div>
                      <div className="wizardCardTags">
                        {(law.daoTags ?? []).slice(0, 3).map((tag) => (
                          <PaperChip key={tag} text={tag} variant="tag" tone="ink" />
                        ))}
                        {(law.daoTags ?? []).length === 0 && <PaperChip text="No tags" variant="tag" tone="neutral" />}
                      </div>
                      <div className="wizardCardDesc">{tierLabel === 'starter' ? 'Starter' : tierLabel}</div>
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
              {canChangeLifePath() && (
                <button type="button" className="button-secondary" onClick={() => setWizardStep(1)}>
                  Back
                </button>
              )}
              <button
                type="button"
                className="button-primary"
                onClick={() => setWizardStep(3)}
                disabled={!hasHeartLaw}
              >
                Next
              </button>
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
                const selected = breathMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    className={`wizardCardButton${selected ? ' wizardCardButton--selected' : ''}`}
                    onClick={() => setBreathMode(mode.id)}
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
              <button type="button" className="button-secondary" onClick={() => setWizardStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={handleFinish}
                disabled={!hasPath || !hasHeartLaw}
              >
                Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </InkModalFrame>
  );
}
