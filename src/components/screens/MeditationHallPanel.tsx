import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useContentStore } from '../../stores/contentStore';
import { useHeartLawStore } from '../../stores/heartLawStore';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useUIStore } from '../../stores/uiStore';
import { getAffinityStatus, getHeartLawBonuses } from '../../systems/heartLaw/heartLawLogic';
import { getHeartLawUnlockInfo } from '../../systems/heartLaw/heartLawUnlockInfo';

const CHAPTER_LABELS = ['I', 'II', 'III', 'IV', 'V'];

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
  const isLoaded = useContentStore((state) => state.isLoaded);
  const listHeartLaws = useContentStore((state) => state.listHeartLaws);
  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);
  const chapter = useHeartLawStore((state) => state.chapter);
  const comprehension = useHeartLawStore((state) => state.comprehension);
  const getNextRequirement = useHeartLawStore((state) => state.getComprehensionRequirementForNextChapter);
  const isUnlocked = useHeartLawStore((state) => state.isUnlocked);
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const heartLaws = useMemo(() => {
    if (!isLoaded) return [];
    return listHeartLaws();
  }, [isLoaded, listHeartLaws]);

  const selectedHeartLaw = useMemo(() => {
    if (!selectedHeartLawId) return null;
    return heartLaws.find((law) => law.id === selectedHeartLawId) ?? null;
  }, [heartLaws, selectedHeartLawId]);

  const heartLawBonuses = useMemo(() => {
    if (!selectedHeartLaw) return null;
    return getHeartLawBonuses({
      heartLawDef: selectedHeartLaw,
      chapter,
      spiritRoot,
    });
  }, [chapter, selectedHeartLaw, spiritRoot]);

  const affinityStatus = useMemo(() => {
    if (!selectedHeartLaw) return { status: 'none' as const, percent: 0 };
    return getAffinityStatus(selectedHeartLaw, spiritRoot);
  }, [selectedHeartLaw, spiritRoot]);

  const nextRequirement = getNextRequirement();
  const progressValue = Math.min(comprehension, nextRequirement || comprehension);
  const progressDisplay = comprehension % 1 === 0 ? comprehension.toFixed(0) : comprehension.toFixed(1);

  return (
    <div className={'worldScreenPlaceholder'}>
      <div className={'worldScreenPlaceholderHeader'}>
        <div className={'worldScreenPlaceholderTitle'}>Meditation Hall (Shortcut)</div>
        <div className={'worldScreenPlaceholderKey'}>meditationHall</div>
      </div>
      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine'}>
          Heart Laws are chosen at the start of each life. Use this shortcut to review your scripture and jump to the Cultivation tab.
        </div>
        <button className={'worldScreenModuleButton'} onClick={() => setActiveTab('cultivation')}>
          Open Cultivation
        </button>

        <div className={'worldScreenPlaceholderLine'}>
          {lifePath
            ? `Chosen Path: ${lifePath.charAt(0).toUpperCase() + lifePath.slice(1)}`
            : 'Path not chosen yet — select in the Life Start Wizard.'}
        </div>

        <div className={'worldScreenPlaceholderLine'}>
          <div className={'heartLawCurrent'}>
            <div className={'heartLawCurrentHeader'}>
              <div className={'heartLawCurrentName'}>
                {selectedHeartLaw?.name ?? 'No Heart Law selected'}
                {selectedHeartLaw && (
                  <span
                    className={'heartLawInfo'}
                    title={formatSignature(selectedHeartLaw.signature)}
                    aria-label="Heart law signature info"
                  >
                    ℹ️
                  </span>
                )}
              </div>
              {selectedHeartLaw && <div className={'heartLawCurrentMeta'}>Pattern: {selectedHeartLaw.archetype ?? 'Unknown'}</div>}
            </div>
            {selectedHeartLaw && (
              <>
                <div className={'heartLawCurrentMeta'}>Dao Tags: {(selectedHeartLaw.daoTags ?? []).join(', ') || 'None'}</div>
                {heartLawBonuses && (
                  <div className={'heartLawCurrentMeta'}>
                    Cultivation Rate: {((heartLawBonuses.cultivateRateMult - 1) * 100).toFixed(1)}% • Combat Damage:{' '}
                    {((heartLawBonuses.combatDamageMult - 1) * 100).toFixed(1)}%
                  </div>
                )}
                <div className={'heartLawCurrentMeta'}>
                  Affinity:{' '}
                  {affinityStatus.status === 'match' && `Match (+${affinityStatus.percent}%)`}
                  {affinityStatus.status === 'mismatch' && `Mismatch (-${affinityStatus.percent}%)`}
                  {affinityStatus.status === 'none' && 'None'}
                </div>
                <div className={'heartLawCurrentMeta'}>Chapter: {CHAPTER_LABELS[Math.max(0, chapter - 1)] ?? 'I'}</div>
                {chapter < 5 ? (
                  <div className={'heartLawProgress'}>
                    <progress value={progressValue} max={nextRequirement} />
                    <div className={'heartLawProgressText'}>
                      {progressDisplay} / {nextRequirement} to Chapter {CHAPTER_LABELS[chapter] ?? 'V'}
                    </div>
                  </div>
                ) : (
                  <div className={'heartLawProgressText'}>Max chapter reached.</div>
                )}
              </>
            )}
            {!selectedHeartLaw && <div className={'heartLawProgressText'}>Choose a Heart Law in the Life Start Wizard.</div>}
          </div>
        </div>

        {heartLaws.length > 0 && (
          <div className={'heartLawList'}>
            {heartLaws.map((law) => {
              const unlocked = isUnlocked(law.id);
              const isSelected = selectedHeartLawId === law.id;
              const unlockInfo = getHeartLawUnlockInfo(law.tier);
              const lockLine =
                unlockInfo.kind === 'prestige'
                  ? `Unlock: ${unlockInfo.upgradeName} (${unlockInfo.apCost} AP)`
                  : unlockInfo.kind === 'starter'
                    ? 'Starter choice'
                    : 'Locked — Unlock via Prestige';
              return (
                <div key={law.id} className={'heartLawCard'}>
                  <div className={'heartLawCardHeader'}>
                    <div className={'heartLawCardTitle'}>{law.name}</div>
                    <div className={'heartLawCardTier'}>{formatTierLabel(law.tier)}</div>
                  </div>
                  <div className={'heartLawCardMeta'}>Dao Tags: {(law.daoTags ?? []).slice(0, 3).join(', ') || 'None'}</div>
                  <div className={'heartLawCardMeta'}>
                    {unlocked ? (isSelected ? 'Selected this life' : 'Unlocked this life') : lockLine}
                  </div>
                  <div className={'heartLawCardMeta'}>
                    Adjust Heart Laws in the Life Start Wizard (Prestige) or Cultivation tab shortcut.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
