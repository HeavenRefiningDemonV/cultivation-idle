import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useContentStore } from '../../stores/contentStore';
import { useHeartLawStore } from '../../stores/heartLawStore';
import type { LifePath } from '../../types';

const PATHS: { id: LifePath; label: string; desc: string }[] = [
  { id: 'heaven', label: 'Heaven', desc: 'Focus on techniques of the heavens and spiritual insight.' },
  { id: 'earth', label: 'Earth', desc: 'Steady and defensive methods rooted in the earth.' },
  { id: 'martial', label: 'Martial', desc: 'Physical mastery and weapon-oriented techniques.' },
];

const CHAPTER_LABELS = ['I', 'II', 'III', 'IV', 'V'];

const DEFAULT_CHAPTER_REQUIREMENTS: Record<number, number> = {
  1: 100,
  2: 250,
  3: 500,
  4: 1000,
};

function formatSignature(signature: unknown): string {
  if (!signature) return 'No signature details.';
  if (typeof signature === 'string') return signature;
  if (typeof signature === 'number' || typeof signature === 'boolean') return String(signature);
  if (typeof signature === 'object') {
    const entries = Object.entries(signature as Record<string, unknown>);
    if (entries.length === 0) return 'No signature details.';
    return entries
      .map(([key, value]) => {
        if (value == null) return `${key}: none`;
        if (typeof value === 'object') return `${key}: ${JSON.stringify(value)}`;
        return `${key}: ${value}`;
      })
      .join(' • ');
  }
  return String(signature);
}

function formatTierLabel(tier?: string): string {
  if (!tier) return 'Unknown Tier';
  if (tier === 'starter') return 'Starter';
  if (tier === 'tier1') return 'Tier 1';
  if (tier === 'tier2') return 'Tier 2';
  if (tier === 'tier3') return 'Tier 3';
  return tier;
}

export function MeditationHallPanel() {
  const lifePath = useGameStore((state) => state.lifePath);
  const setLifePath = useGameStore((state) => state.setLifePath);
  const canChangeLifePath = useGameStore((state) => state.canChangeLifePath);
  const isLoaded = useContentStore((state) => state.isLoaded);
  const listHeartLaws = useContentStore((state) => state.listHeartLaws);
  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);
  const chapter = useHeartLawStore((state) => state.chapter);
  const comprehension = useHeartLawStore((state) => state.comprehension);
  const selectHeartLaw = useHeartLawStore((state) => state.selectHeartLaw);
  const isUnlocked = useHeartLawStore((state) => state.isUnlocked);

  const title = useMemo(() => {
    if (lifePath) return `Chosen Path: ${lifePath.toUpperCase()}`;
    return 'Choose your Path';
  }, [lifePath]);

  const heartLaws = useMemo(() => {
    if (!isLoaded) return [];
    return listHeartLaws();
  }, [isLoaded, listHeartLaws]);

  const selectedHeartLaw = useMemo(() => {
    if (!selectedHeartLawId) return null;
    return heartLaws.find((law) => law.id === selectedHeartLawId) ?? null;
  }, [heartLaws, selectedHeartLawId]);

  const nextRequirement = chapter < 5 ? DEFAULT_CHAPTER_REQUIREMENTS[chapter] ?? 0 : 0;
  const progressValue = Math.min(comprehension, nextRequirement || comprehension);

  const handleSelectHeartLaw = (id: string) => {
    if (!isUnlocked(id)) return;
    if (!selectedHeartLawId) {
      selectHeartLaw(id);
      return;
    }
    if (selectedHeartLawId === id) return;
    const confirmed = window.confirm(
      'Changing Heart Law resets chapter + comprehension for this life. Continue?',
    );
    if (confirmed) {
      selectHeartLaw(id);
    }
  };

  return (
    <div className={'worldScreenPlaceholder'}>
      <div className={'worldScreenPlaceholderHeader'}>
        <div className={'worldScreenPlaceholderTitle'}>{title}</div>
        <div className={'worldScreenPlaceholderKey'}>meditationHall</div>
      </div>
      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine'}>
          Choose one path for this life. This determines which manuals you can buy and which techniques you can equip later.
        </div>
        {PATHS.map((path) => (
          <div key={path.id} className={'worldScreenPlaceholderLine'}>
            <div className={'worldScreenPlaceholderTitle'}>{path.label}</div>
            <div className={'worldScreenPlaceholderLine'}>{path.desc}</div>
            <button
              className={`worldScreenModuleButton ${lifePath === path.id ? 'worldScreenModuleButton--active' : ''}`}
              disabled={!canChangeLifePath() && lifePath !== path.id}
              onClick={() => setLifePath(path.id)}
            >
              {lifePath === path.id ? 'Selected' : 'Choose'}
            </button>
          </div>
        ))}
        {!canChangeLifePath() && lifePath && (
          <div className={'worldScreenInlineError'}>Path can only be changed at the start of a life.</div>
        )}
        <div className={'worldScreenPlaceholderLine'}>
          <div className={'worldScreenPlaceholderTitle'}>Heart Laws</div>
          {!selectedHeartLaw && (
            <div className={'worldScreenPlaceholderLine'}>
              No Heart Law selected (choose one for this life).
            </div>
          )}
          {selectedHeartLaw && (
            <div className={'heartLawCurrent'}>
              <div className={'heartLawCurrentHeader'}>
                <div className={'heartLawCurrentName'}>
                  {selectedHeartLaw.name}
                  <span
                    className={'heartLawInfo'}
                    title={formatSignature(selectedHeartLaw.signature)}
                    aria-label="Heart law signature info"
                  >
                    ℹ️
                  </span>
                </div>
                <div className={'heartLawCurrentMeta'}>
                  Pattern: {selectedHeartLaw.archetype ?? 'Unknown'}
                </div>
              </div>
              <div className={'heartLawCurrentMeta'}>
                Dao Tags: {(selectedHeartLaw.daoTags ?? []).join(', ') || 'None'}
              </div>
              <div className={'heartLawCurrentMeta'}>
                Chapter: {CHAPTER_LABELS[Math.max(0, chapter - 1)] ?? 'I'}
              </div>
              {chapter < 5 ? (
                <div className={'heartLawProgress'}>
                  <progress value={progressValue} max={nextRequirement} />
                  <div className={'heartLawProgressText'}>
                    {comprehension} / {nextRequirement} to Chapter {CHAPTER_LABELS[chapter] ?? 'V'}
                  </div>
                </div>
              ) : (
                <div className={'heartLawProgressText'}>Max chapter reached.</div>
              )}
            </div>
          )}
        </div>
        {heartLaws.length > 0 && (
          <div className={'heartLawList'}>
            {heartLaws.map((law) => {
              const unlocked = isUnlocked(law.id);
              const isSelected = selectedHeartLawId === law.id;
              return (
                <div key={law.id} className={'heartLawCard'}>
                  <div className={'heartLawCardHeader'}>
                    <div className={'heartLawCardTitle'}>{law.name}</div>
                    <div className={'heartLawCardTier'}>{formatTierLabel(law.tier)}</div>
                  </div>
                  <div className={'heartLawCardMeta'}>
                    Dao Tags: {(law.daoTags ?? []).slice(0, 3).join(', ') || 'None'}
                  </div>
                  {!unlocked && (
                    <div className={'heartLawCardMeta'}>Locked (unlock via Prestige)</div>
                  )}
                  <button
                    className={`worldScreenModuleButton ${isSelected ? 'worldScreenModuleButton--active' : ''}`}
                    disabled={!unlocked}
                    onClick={() => handleSelectHeartLaw(law.id)}
                  >
                    {isSelected ? 'Selected' : unlocked ? 'Select' : 'Locked'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
