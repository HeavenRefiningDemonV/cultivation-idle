import { useEffect, useMemo, useState } from 'react';
import './LifeStartWizardModal.scss';
import earthArt from '../../assets/menus/path_earth.png';
import heavenArt from '../../assets/menus/path_heaven.png';
import martialArt from '../../assets/menus/path_martial.png';
import { useContentStore } from '../../stores/contentStore';
import { useGameStore } from '../../stores/gameStore';
import { useHeartLawStore } from '../../stores/heartLawStore';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useUIStore } from '../../stores/uiStore';
import { SaveService } from '../../services/save/SaveService';
import { getAffinityStatus } from '../../systems/heartLaw/heartLawLogic';
import { getHeartLawUnlockInfo } from '../../systems/heartLaw/heartLawUnlockInfo';
import type { HeartLawDef, LifePath } from '../../types';

const LIFE_PATHS: { id: LifePath; name: string; desc: string; art: string }[] = [
  { id: 'heaven', name: 'Heaven', desc: 'Focus on techniques of the heavens and spiritual insight.', art: heavenArt },
  { id: 'earth', name: 'Earth', desc: 'Steady and defensive methods rooted in the earth.', art: earthArt },
  { id: 'martial', name: 'Martial', desc: 'Physical mastery and weapon-oriented techniques.', art: martialArt },
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

  const hasPath = Boolean(lifePath);
  const hasHeartLaw = Boolean(selectedHeartLawId);
  const showAutoPick = prestigeCount > 0 && Boolean(lifeStartWizardContext.lastHeartLawId);

  return (
    <div className="lifeStartWizardOverlay">
      <div className="lifeStartWizardModal">
        <div className="lifeStartWizardHeader">
          <h2>Begin Your New Life</h2>
          <p>Choose your path, scripture, and initial breath focus before cultivation begins.</p>
        </div>

        <div className="lifeStartWizardSteps">
          <div className={`wizardStep ${wizardStep === 1 ? 'active' : ''}`}>
            <div className="wizardStepNumber">1</div>
            <div className="wizardStepLabel">Life Path</div>
          </div>
          <div className={`wizardStep ${wizardStep === 2 ? 'active' : ''}`}>
            <div className="wizardStepNumber">2</div>
            <div className="wizardStepLabel">Heart Law</div>
          </div>
          <div className={`wizardStep ${wizardStep === 3 ? 'active' : ''}`}>
            <div className="wizardStepNumber">3</div>
            <div className="wizardStepLabel">Breath Focus</div>
          </div>
        </div>

        {wizardStep === 1 && (
          <div className="wizardSection wizardSection--lifePath">
            <div className="wizardSectionHeader wizardSectionHeader--lifePath">
              <h3>Choose Your Life Path</h3>
              <p>This determines which manuals you can buy and which techniques you can equip later.</p>
            </div>
            <div className="lifePathArtGrid" data-ui="life-path-art-grid">
              {LIFE_PATHS.map((path) => {
                const selected = lifePath === path.id;
                const disabled = !canChangeLifePath() && !selected;
                const ctaLabel = selected ? 'Selected' : disabled ? 'Locked this life' : 'Select';
                return (
                  <button
                    key={path.id}
                    type="button"
                    className={`lifePathArtPanel ${selected ? 'selected' : ''}`}
                    data-path={path.id}
                    onClick={() => setLifePath(path.id)}
                    disabled={disabled}
                    aria-pressed={selected}
                    aria-label={`${path.name} path. ${path.desc} ${ctaLabel}.`}
                  >
                    <div className="lifePathArtBg" aria-hidden="true" />
                    <img className="lifePathArtImage" src={path.art} alt="" aria-hidden="true" />
                    <div className="lifePathArtTopTitle">{path.name.toUpperCase()}</div>
                    <div className="lifePathArtFooter">
                      <div className="lifePathArtCta">{ctaLabel}</div>
                    </div>
                    <span className="lifePathArtDescription">{path.desc}</span>
                  </button>
                );
              })}
            </div>
            <div className="wizardFooter">
              <div />
              <button
                type="button"
                className="button-primary"
                onClick={() => setWizardStep(2)}
                disabled={!hasPath}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {wizardStep === 2 && (
          <div className="wizardSection">
            <div className="wizardSectionHeader">
              <h3>Choose Your Heart Law (Xinfa)</h3>
              <p>
                This is the scripture you cultivate by in this life. It defines your cultivation rhythm, your Dao resonance, and
                the verses you can comprehend.
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
                    className={`wizardCard ${selected ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`}
                    onClick={() => (unlocked ? selectHeartLaw(law.id) : undefined)}
                    disabled={!unlocked}
                  >
                    <div className="wizardCardTitle">{law.name}</div>
                    <div className="wizardCardTags">{(law.daoTags ?? []).slice(0, 3).join(' • ') || 'No tags'}</div>
                    <div className="wizardCardDesc">{tierLabel === 'starter' ? 'Starter' : tierLabel}</div>
                    <div className="wizardCardMeta">{unlocked ? 'Select' : lockedText}</div>
                  </button>
                );
              })}
              {heartLaws.length === 0 && <div className="wizardEmpty">Heart laws are loading...</div>}
            </div>
            <div className="wizardResonance">
              <div>
                Resonance: {resonance.status === 'none' ? 'None' : resonance.status === 'match' ? `Match (+${resonance.percent}%)` : `Mismatch (-${resonance.percent}%)`}
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
                    className={`wizardCard ${selected ? 'selected' : ''}`}
                    onClick={() => setBreathMode(mode.id)}
                  >
                    <div className="wizardCardTitle">{mode.label}</div>
                    <div className="wizardCardDesc">{mode.desc}</div>
                    <div className="wizardCardMeta">{selected ? 'Selected' : 'Select'}</div>
                  </button>
                );
              })}
            </div>
            <div className="wizardFooter">
              <button type="button" className="button-secondary" onClick={() => setWizardStep(2)}>
                Back
              </button>
              <button type="button" className="button-primary" onClick={handleFinish} disabled={!hasPath || !hasHeartLaw}>
                Finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
