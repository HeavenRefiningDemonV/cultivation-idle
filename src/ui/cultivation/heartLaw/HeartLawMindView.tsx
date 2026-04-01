import { useEffect, useMemo, useState } from 'react';
import { INITIAL_REALM } from '../../../constants/index.js';
import { COMPREHENSION_PER_MINUTE_BASE, getBreathModeMultipliers } from '../../../content/tuning/cultivationTuning.js';
import { getAffinityStatus } from '../../../systems/heartLaw/heartLawLogic.js';
import {
  getHeartLawProfile,
  getHeartLawSelectionPresentation,
  summarizeHeartLawChapterEffects,
} from '../../../systems/doctrine/index.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { ChangeHeartLawModal } from './ChangeHeartLawModal.js';
import { RadialVerseRing } from './RadialVerseRing.js';
import './HeartLawMindView.scss';

const roman = ['I', 'II', 'III', 'IV', 'V'];

export function HeartLawMindView() {
  const activeActivity = useActivityStore((state) => state.active);
  const breathMode = useCultivationStore((state) => state.breathMode);
  const chapter = useCultivationStore((state) => state.chapter);
  const comprehension = useCultivationStore((state) => state.comprehension);
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const getRequirement = useCultivationStore((state) => state.getComprehensionRequirementForNextChapter);
  const selectHeartLaw = useCultivationStore((state) => state.selectHeartLaw);
  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const realm = useGameStore((state) => state.realm);

  const [selectedVerse, setSelectedVerse] = useState(chapter);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setSelectedVerse(chapter);
  }, [chapter, selectedHeartLawId]);

  const heartLawDef = selectedHeartLawId ? heartLawsById[selectedHeartLawId] ?? null : null;
  const heartLawProfile = getHeartLawProfile(heartLawDef?.id ?? null);
  const heartLawPresentation = heartLawDef
    ? getHeartLawSelectionPresentation(heartLawDef, {
      spiritRoot,
      isUnlocked: true,
      isSelected: true,
    })
    : null;
  const heartLawTags = heartLawPresentation?.tagLabels ?? []; 
  const chapters = heartLawDef?.chapters ?? [];
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

  const { status, percent } = useMemo(
    () => getAffinityStatus(heartLawDef, spiritRoot),
    [heartLawDef, spiritRoot],
  );

  const resonanceText = heartLawPresentation?.resonanceLabel
    ? `Resonance: ${heartLawPresentation.resonanceLabel}`
    : status === 'match'
      ? `Resonates: Strong (+${percent}% signature potency)`
      : status === 'mismatch'
        ? 'Resonates: Weak (minor penalty only)'
        : 'Resonance: None';

  const selectedEffectsSummary = summarizeHeartLawChapterEffects(heartLawProfile, selectedVerse);

  const tierLabel = heartLawPresentation?.tierLabel ?? 'Unranked';

  const isNewLife = realm.index === INITIAL_REALM.index && realm.substage === INITIAL_REALM.substage;
  const canChangeHeartLaw = isNewLife;
  const changeTooltip = canChangeHeartLaw
    ? undefined
    : 'You may only change Heart Laws at the start of a new life (and later at major breakthroughs).';

  const handleChangeHeartLaw = (id: string) => {
    selectHeartLaw(id);
  };

  return (
    <div className="heartLawMindView">
      <div className="heartLawMindHeader">
        <div>
          <div className="heartLawMindTitle">{heartLawDef?.name ?? 'No Heart Law Selected'}</div>
          <div className="heartLawMindSubtitle">
            {heartLawPresentation?.familyLabel ? `${heartLawPresentation.familyLabel} • ` : ''}
            {tierLabel}
          </div>
        </div>
        {heartLawTags.length > 0 ? (
          <div className="heartLawMindSeals">
            {heartLawTags.map((tag) => (
              <span key={tag} className="heartLawMindSeal">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="heartLawMindRadial">
        <RadialVerseRing
          currentVerse={chapter}
          selectedVerse={selectedVerse}
          progressToNextPct={progressPct}
          onSelectVerse={setSelectedVerse}
        />
        <div className="heartLawMindOrb" />
      </div>

      <div className="heartLawMindPanel">
        <div className="heartLawMindRow">
          <div className="heartLawMindResonance">{resonanceText}</div>
          <div className="heartLawMindProgress">
            Verse {roman[chapter - 1] ?? chapter} • {progressPct.toFixed(1)}% to next
          </div>
        </div>
        <div className="heartLawMindVerseSummary">
          <div className="heartLawMindVerseTitle">Verse {roman[selectedVerse - 1] ?? selectedVerse}</div>
          <div className="heartLawMindVerseText">{selectedEffectsSummary}</div>
        </div>
        <div className="heartLawMindFooter">
          <div>
            <div className="heartLawMindRequirement">Next verse requirement: {required} comprehension</div>
            <div className="heartLawMindEta">Estimated time: {etaText}</div>
          </div>
          <button
            type="button"
            className="button-standard heartLawMindChangeButton"
            onClick={() => setShowModal(true)}
            disabled={!canChangeHeartLaw}
            aria-describedby={!canChangeHeartLaw ? 'heart-law-mind-change-restriction' : undefined}
          >
            Change Heart Law
          </button>
        </div>
        {!canChangeHeartLaw ? (
          <div id="heart-law-mind-change-restriction" className="heartLawMindRestriction">
            {changeTooltip}
          </div>
        ) : null}
      </div>

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
