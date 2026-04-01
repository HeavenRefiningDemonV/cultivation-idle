import { useEffect, useMemo, useRef, useState } from 'react';
import { INITIAL_REALM } from '../../../constants/index.js';
import { COMPREHENSION_PER_MINUTE_BASE, getBreathModeMultipliers } from '../../../content/tuning/cultivationTuning.js';
import { getHeartLawUnlockInfo } from '../../../systems/heartLaw/heartLawUnlockInfo.js';
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
import { useUIStore } from '../../../stores/uiStore.js';
import type { HeartLawChapter, HeartLawDef } from '../../../content/index.js';
import { ChangeHeartLawModal } from './ChangeHeartLawModal.js';
import './HeartLawPanel.scss';

const roman = ['I', 'II', 'III', 'IV', 'V'];

function DaoTagSeals({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="daoTagSeals">
      {tags.map((tag) => (
        <span key={tag} className="daoSeal">
          {tag}
        </span>
      ))}
    </div>
  );
}

function ResonanceBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <div className={`resonanceBadge resonanceBadge--${tone}`}>
      Resonance: {label}
      <div className="resonanceBadgeHint">
        Resonance boosts signature effects when aligned. Mismatch is a minor penalty only.
      </div>
    </div>
  );
}

function VerseTimeline({
  currentVerse,
  chapters,
  celebrate,
}: {
  currentVerse: number;
  chapters: HeartLawChapter[];
  celebrate: boolean;
}) {
  const nodes = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, idx) => {
        const chapterNumber = idx + 1;
        const entry = chapters.find((c) => c.chapter === chapterNumber);
        return {
          chapter: chapterNumber,
          summary: entry ? 'Verse effects loaded' : 'No recorded effects.',
        };
      }),
    [chapters],
  );

  return (
    <div className={`verseTimeline ${celebrate ? 'verseTimeline--celebrate' : ''}`} role="list" aria-label="Verse progression timeline">
      {nodes.map((node, index) => {
        const unlocked = currentVerse > node.chapter;
        const current = currentVerse === node.chapter;
        return (
          <div key={node.chapter} className="verseNodeWrap" role="listitem" aria-current={current ? 'step' : undefined}>
            <div
              className={`verseNode ${unlocked ? 'verseNode--unlocked' : ''} ${current ? 'verseNode--current' : ''}`}
              aria-label={`Verse ${roman[index]}: ${node.summary}`}
            >
              <div className="verseNodeLabel">Verse {roman[index]}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComprehensionBar({
  comprehension,
  required,
  flash,
}: {
  comprehension: number;
  required: number;
  flash: boolean;
}) {
  const pct = required > 0 ? Math.min(100, (comprehension / required) * 100) : 100;
  return (
    <div className={`comprehensionBar ${flash ? 'comprehensionBar--flash' : ''}`}>
      <div className="comprehensionBarFill" style={{ width: `${pct}%` }} />
      <div className="comprehensionBarText">Comprehension (Insight): {pct.toFixed(1)}%</div>
    </div>
  );
}

function HeartLawScrollCard({
  heartLaw,
  etaText,
  comprehension,
  required,
  flash,
  chapters,
  currentChapter,
  familyLabel,
  signatureSummary,
  resonanceLabel,
  resonanceTone,
  currentVerseSummary,
  tags,
}: {
  heartLaw: HeartLawDef | null;
  etaText: string;
  comprehension: number;
  required: number;
  flash: boolean;
  chapters: HeartLawChapter[];
  currentChapter: number;
  familyLabel: string;
  signatureSummary: string;
  resonanceLabel: string;
  resonanceTone: string;
  currentVerseSummary: string;
  tags: string[];
}) {
  if (!heartLaw) {
    return (
      <div className="cultivationPanel heartLawCard">
        <div className="panelHeader">
          <div>
            <div className="panelTitle">No Heart Law selected</div>
            <div className="panelSub">Select a Heart Law to begin cultivating.</div>
          </div>
        </div>
      </div>
    );
  }

  const nextLabel = required > 0 ? `Next Verse at Comprehension ${required}` : 'All Verses comprehended';
  const etaDisplay = required > 0 ? etaText : '—';

  return (
    <div className="cultivationPanel heartLawCard">
      <div className="panelHeader">
        <div>
          <div className="panelTitle">{heartLaw.name}</div>
          <div className="panelSub">Heart Law • Dao Heart</div>
        </div>
        <span className="heartLawPattern">{familyLabel}</span>
      </div>
      <DaoTagSeals tags={tags} />
      <div className="heartLawSignature">{signatureSummary}</div>
      <ResonanceBadge label={resonanceLabel} tone={resonanceTone} />
      <div className="heartLawNext">
        <div className="heartLawNextLabel">{nextLabel}</div>
        <div className="heartLawNextEta">Estimated time: {etaDisplay}</div>
      </div>
      <ComprehensionBar comprehension={comprehension} required={required} flash={flash} />
      <VerseTimeline currentVerse={currentChapter} chapters={chapters} celebrate={flash} />
      <div className="heartLawVerseSummary">Current verse effect: {currentVerseSummary}</div>
    </div>
  );
}

export function HeartLawPanel() {
  const activeActivity = useActivityStore((state) => state.active);
  const isCultivating = activeActivity?.type === 'meditate';
  const breathMode = useCultivationStore((state) => state.breathMode);
  const chapter = useCultivationStore((state) => state.chapter);
  const comprehension = useCultivationStore((state) => state.comprehension);
  const selectedHeartLawId = useCultivationStore((state) => state.selectedHeartLawId);
  const getRequirement = useCultivationStore((state) => state.getComprehensionRequirementForNextChapter);
  const selectHeartLaw = useCultivationStore((state) => state.selectHeartLaw);
  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const realm = useGameStore((state) => state.realm);
  const addNotification = useUIStore((state) => state.addNotification);

  const [showModal, setShowModal] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const prevChapterRef = useRef(chapter);

  const heartLawDef = selectedHeartLawId ? heartLawsById[selectedHeartLawId] ?? null : null;
  const heartLawProfile = getHeartLawProfile(heartLawDef?.id ?? null);
  const heartLawPresentation = heartLawDef
    ? getHeartLawSelectionPresentation(heartLawDef, { spiritRoot, isUnlocked: true, isSelected: true })
    : null;
  const chapters = heartLawDef?.chapters ?? [];
  const required = getRequirement();
  const breath = getBreathModeMultipliers(breathMode);
  const comprehensionPerMinute = isCultivating ? COMPREHENSION_PER_MINUTE_BASE * breath.comprehensionMult : 0;
  const etaMinutes =
    comprehensionPerMinute > 0 && required > 0
      ? Math.max(0, (required - comprehension) / comprehensionPerMinute)
      : null;
  const etaText = etaMinutes === null ? '—' : `~${Math.max(1, Math.ceil(etaMinutes))}m`;

  const isNewLife = realm.index === INITIAL_REALM.index && realm.substage === INITIAL_REALM.substage;
  const canChangeHeartLaw = isNewLife;
  const changeTooltip = canChangeHeartLaw
    ? undefined
    : 'You may only change Heart Laws at the start of a new life (and later at major breakthroughs).';

  useEffect(() => {
    const previous = prevChapterRef.current;
    if (chapter > previous) {
      setCelebrate(true);
      addNotification('success', `You comprehended Verse ${roman[chapter - 1] ?? chapter}!`, 3500);
      const timer = window.setTimeout(() => setCelebrate(false), 1200);
      prevChapterRef.current = chapter;
      return () => window.clearTimeout(timer);
    }
    prevChapterRef.current = chapter;
    return undefined;
  }, [chapter, addNotification]);

  const handleChangeHeartLaw = (id: string) => {
    selectHeartLaw(id);
  };

  const currentHeartLawUnlockInfo = useMemo(
    () => getHeartLawUnlockInfo(heartLawDef?.tier),
    [heartLawDef?.tier],
  );

  return (
    <div className="heartLawPanel">
      <HeartLawScrollCard
        heartLaw={heartLawDef}
        etaText={etaText}
        comprehension={comprehension}
        required={required}
        flash={celebrate}
        chapters={chapters}
        currentChapter={chapter}
        familyLabel={heartLawPresentation?.familyLabel ?? 'Doctrine'}
        signatureSummary={heartLawPresentation?.signatureSummary ?? 'General insight bonus.'}
        resonanceLabel={heartLawPresentation?.resonanceLabel ?? 'Neutral'}
        resonanceTone={heartLawPresentation?.resonanceTone ?? 'neutral'}
        currentVerseSummary={summarizeHeartLawChapterEffects(heartLawProfile, chapter)}
        tags={heartLawPresentation?.tagLabels ? [...heartLawPresentation.tagLabels] : []}
      />

      <div className="heartLawActions">
        <div className="heartLawChangeCopy">
          <div className="panelSub">Resonance explains how well your Spirit Root aligns with this scripture.</div>
          {currentHeartLawUnlockInfo.kind === 'prestige' ? (
            <div className="panelSub">
              Unlock info: {currentHeartLawUnlockInfo.upgradeName} ({currentHeartLawUnlockInfo.apCost} AP)
            </div>
          ) : null}
        </div>
        <button
          type="button"
          className="primaryButton"
          disabled={!canChangeHeartLaw}
          onClick={() => setShowModal(true)}
          aria-describedby={!canChangeHeartLaw ? 'heart-law-change-restriction' : undefined}
        >
          Change Heart Law
        </button>
      </div>
      {!canChangeHeartLaw ? (
        <div id="heart-law-change-restriction" className="panelSub">
          {changeTooltip}
        </div>
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
