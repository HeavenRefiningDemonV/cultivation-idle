import { useEffect, useMemo, useState } from 'react';
import { INITIAL_REALM } from '../../../constants/index.js';
import { COMPREHENSION_PER_MINUTE_BASE, getBreathModeMultipliers } from '../../../content/tuning/cultivationTuning.js';
import { getHeartLawProfile } from '../../../systems/doctrine/heartLawCatalog.js';
import { getHeartLawSelectionPresentation } from '../../../systems/doctrine/heartLawSelectionPresentation.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { buildRecentDaoImpressionSurfaces, useDaoImpressionStore } from '../../../systems/daoImpressions/index.js';
import { DaoImpressionSeal } from '../../daoImpressions/DaoImpressionSeal.js';
import { ChangeHeartLawModal } from './ChangeHeartLawModal.js';
import { RadialVerseRing } from './RadialVerseRing.js';
import './HeartLawMindView.scss';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

const EFFECT_LABELS: Record<string, string> = {
  cultivation_rate: 'Cultivation rhythm',
  combat_damage: 'Combat pressure',
  offline_efficiency: 'Offline gain',
  stability_cost: 'Stability control',
  profession_yield: 'Profession yield',
  profession_speed: 'Profession speed',
};

function summarizeNormalizedEffects(heartLawId: string | null, verse: number): string {
  const profile = getHeartLawProfile(heartLawId);
  if (!profile) return 'No scripture is active yet.';

  const effects = profile.chapterEffectsByChapter[verse] ?? [];
  const lines = effects
    .filter((effect) => typeof effect.value === 'number')
    .slice(0, 3)
    .map((effect) => {
      const label = EFFECT_LABELS[effect.normalizedKey] ?? effect.normalizedKey.replace(/_/g, ' ');
      const value = Math.round(Number(effect.value) * 100);
      return `${label} ${value >= 0 ? '+' : ''}${value}%`;
    });

  if (lines.length === 0) {
    return 'Verse doctrine remains stable and foundational.';
  }

  return lines.join(' • ');
}

export function HeartLawMindView() {
  const activeActivity = useActivityStore((state) => state.active);
  const breathMode = useCultivationStore((state) => state.breathMode);
  const chapter = useCultivationStore((state) => state.chapter);
  const comprehension = useCultivationStore((state) => state.comprehension);
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const getRequirement = useCultivationStore((state) => state.getComprehensionRequirementForNextChapter);
  const selectHeartLaw = useCultivationStore((state) => state.selectHeartLaw);
  const isUnlocked = useCultivationStore((state) => state.isUnlocked);
  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const realm = useGameStore((state) => state.realm);
  const recentDaoAwards = useDaoImpressionStore((state) => state.awards);

  const [selectedVerse, setSelectedVerse] = useState(chapter);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setSelectedVerse(chapter);
  }, [chapter, selectedHeartLawId]);

  const heartLawDef = selectedHeartLawId ? heartLawsById[selectedHeartLawId] ?? null : null;
  const required = getRequirement();
  const isCultivating = activeActivity?.type === 'meditate';
  const breath = getBreathModeMultipliers(breathMode);
  const comprehensionPerMinute = isCultivating ? COMPREHENSION_PER_MINUTE_BASE * breath.comprehensionMult : 0;
  const etaMinutes =
    comprehensionPerMinute > 0 && required > 0
      ? Math.max(0, (required - comprehension) / comprehensionPerMinute)
      : null;
  const etaText = etaMinutes === null ? '—' : `~${Math.max(1, Math.ceil(etaMinutes))}m`;
  const progressPct = required > 0 ? Math.min(100, (comprehension / required) * 100) : 0;

  const presentation = useMemo(
    () => (heartLawDef
      ? getHeartLawSelectionPresentation(heartLawDef, {
        spiritRoot,
        isUnlocked: isUnlocked(heartLawDef.id),
        isSelected: true,
      })
      : null),
    [heartLawDef, isUnlocked, spiritRoot],
  );

  const selectedVerseSummary = useMemo(
    () => summarizeNormalizedEffects(selectedHeartLawId, selectedVerse),
    [selectedHeartLawId, selectedVerse],
  );
  const recentDaoSurfaces = useMemo(
    () => buildRecentDaoImpressionSurfaces(recentDaoAwards, 3),
    [recentDaoAwards],
  );

  const isNewLife = realm.index === INITIAL_REALM.index && realm.substage === INITIAL_REALM.substage;
  const canChangeHeartLaw = isNewLife;
  const changeTooltip = canChangeHeartLaw
    ? undefined
    : 'You may only change Heart Laws at the start of a new life (and later at major breakthroughs).';

  const handleChangeHeartLaw = (id: string) => {
    selectHeartLaw(id);
  };

  return (
    <div className="heartLawMindView" data-ui="dao-heart-law-ritual-view">
      <header className="heartLawMindHeader" aria-label="Active heart law identity">
        <div className="heartLawMindIdentity">
          <p className="heartLawMindEyebrow">Current Scripture</p>
          <h3 className="heartLawMindTitle">{presentation?.label ?? 'No Heart Law Selected'}</h3>
          <p className="heartLawMindSubtitle">
            {presentation
              ? `${presentation.familyLabel} • ${presentation.tierLabel}${presentation.archetypeLabel ? ` • ${presentation.archetypeLabel}` : ''}`
              : 'Choose a Heart Law to activate doctrinal reading.'}
          </p>
          <p className="heartLawMindDoctrine">{presentation?.doctrineSubtitle ?? 'Doctrine scripture.'}</p>
        </div>
        <div className="heartLawMindResonance" role="status" aria-live="polite">
          <div className={`heartLawMindResonanceBadge heartLawMindResonanceBadge--${presentation?.resonanceTone ?? 'neutral'}`}>
            {presentation ? `Resonance: ${presentation.resonanceLabel}` : 'Resonance: Neutral'}
          </div>
          <p className="heartLawMindResonanceDetail">{presentation?.resonanceDetail ?? 'No resonance bonus needed.'}</p>
          <p className="heartLawMindStatus">{presentation?.availabilityLine ?? 'Starter scripture available immediately.'}</p>
        </div>
      </header>

      <section className="heartLawMindCenter" aria-label="Verse mandala and selected verse reading">
        <div className="heartLawMindRadial">
          <RadialVerseRing
            currentVerse={chapter}
            selectedVerse={selectedVerse}
            progressToNextPct={progressPct}
            onSelectVerse={setSelectedVerse}
          />
          <div className="heartLawMindOrb" aria-hidden="true" />
        </div>

        <aside className="heartLawMindVersePane" aria-live="polite">
          <p className="heartLawMindVerseEyebrow">Verse Reading</p>
          <h4 className="heartLawMindVerseTitle">Verse {ROMAN[selectedVerse - 1] ?? selectedVerse}</h4>
          <p className="heartLawMindVerseText">{selectedVerseSummary}</p>
          <p className="heartLawMindVerseHint">Current verse: {ROMAN[chapter - 1] ?? chapter}</p>
        </aside>
      </section>

      <section className="heartLawMindProgress" aria-label="Progression and change state">
        <div className="heartLawMindProgressBlock">
          <p className="heartLawMindProgressLabel">Comprehension</p>
          <div className="heartLawMindProgressBar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPct)}>
            <div className="heartLawMindProgressFill" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="heartLawMindProgressMeta">{progressPct.toFixed(1)}% to Verse {chapter < 5 ? ROMAN[chapter] ?? chapter + 1 : 'Peak'}</p>
        </div>

        <div className="heartLawMindProgressBlock">
          <p className="heartLawMindProgressLabel">Next threshold</p>
          <p className="heartLawMindProgressMeta">Requirement: {required > 0 ? `${required} comprehension` : 'All verses completed'}</p>
          <p className="heartLawMindProgressMeta">Estimated time: {required > 0 ? etaText : '—'}</p>
        </div>

        <div className="heartLawMindActionBlock">
          <button
            type="button"
            className="button-standard heartLawMindChangeButton"
            onClick={() => setShowModal(true)}
            disabled={!canChangeHeartLaw}
            aria-describedby={!canChangeHeartLaw ? 'dao-heart-law-change-restriction' : undefined}
          >
            Change Heart Law
          </button>
          <p id="dao-heart-law-change-restriction" className="heartLawMindRestriction" role="status" aria-live="polite">
            {canChangeHeartLaw ? 'Rewrite available in this life state.' : changeTooltip}
          </p>
        </div>
      </section>

      {recentDaoSurfaces.length > 0 ? (
        <section className="heartLawMindImpressions" aria-label="Recent Dao Impressions">
          {recentDaoSurfaces.map((surface) => (
            <DaoImpressionSeal key={surface.awardId} surface={surface} />
          ))}
        </section>
      ) : null}

      {showModal ? (
        <ChangeHeartLawModal
          currentHeartLawId={selectedHeartLawId}
          onClose={() => setShowModal(false)}
          canChange={canChangeHeartLaw}
          onChanged={handleChangeHeartLaw}
        />
      ) : null}
    </div>
  );
}
