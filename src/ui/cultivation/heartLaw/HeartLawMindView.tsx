import { useEffect, useMemo, useState } from 'react';
import { INITIAL_REALM } from '../../../constants.js';
import { COMPREHENSION_PER_MINUTE_BASE, getBreathModeMultipliers } from '../../../content/tuning/cultivationTuning.js';
import { getAffinityStatus } from '../../../systems/heartLaw/heartLawLogic.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useCultivationStore } from '../../../stores/cultivationStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import type { HeartLawChapter } from '../../../content/index.js';
import { ChangeHeartLawModal } from './ChangeHeartLawModal.js';
import { RadialVerseRing } from './RadialVerseRing.js';
import './HeartLawMindView.scss';

const roman = ['I', 'II', 'III', 'IV', 'V'];

const archetypeLabels: Record<string, string> = {
  steady: 'Steady',
  burst: 'Burst',
  risk: 'Risk',
  artisan: 'Artisan',
  mystic: 'Mystic',
};

const EFFECT_LABELS: Record<string, string> = {
  cultivateQiMult: 'Cultivation rate',
  combatDamageMult: 'Combat damage',
  offlineEfficiencyAdd: 'Offline efficiency',
  stabilityCostMult: 'Stability cost',
  professionYieldMult: 'Profession yield',
  professionSpeedMult: 'Profession speed',
};

function formatEffectValue(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const pct = Math.round(value * 100);
  if (Math.abs(value) < 5) {
    return `${value >= 0 ? '+' : ''}${pct}%`;
  }
  return `${value}`;
}

function summarizeEffects(effects: unknown): string {
  if (!effects || typeof effects !== 'object') return 'No recorded effects.';
  const parts: string[] = [];
  Object.entries(effects as Record<string, unknown>).forEach(([key, value]) => {
    const label = EFFECT_LABELS[key] ?? key;
    const formatted = formatEffectValue(value);
    if (formatted) {
      parts.push(`${label} ${formatted}`);
    }
  });
  return parts.length > 0 ? parts.join(' • ') : 'No recorded effects.';
}

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
  const heartLawTags = heartLawDef?.daoTags ?? [];
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

  const resonanceText =
    status === 'match'
      ? `Resonates: Strong (+${percent}% signature potency)`
      : status === 'mismatch'
        ? 'Resonates: Weak (minor penalty only)'
        : 'Resonance: None';

  const selectedChapter = chapters.find((entry) => entry.chapter === selectedVerse);
  const selectedEffectsSummary = summarizeEffects(selectedChapter?.effects);

  const tierLabel = heartLawDef?.tier ? heartLawDef.tier.replace('tier', 'Tier ') : 'Unranked';
  const archetypeLabel = heartLawDef?.archetype ? archetypeLabels[heartLawDef.archetype] ?? heartLawDef.archetype : '';

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
            {archetypeLabel ? `${archetypeLabel} • ` : ''}
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
            title={changeTooltip}
          >
            Change Heart Law
          </button>
        </div>
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
