import { useEffect, useMemo, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore, getItemDefinition } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import { formatNumber } from '../../utils/numbers';
import { REALMS } from '../../constants';
import { PathSelectionModal } from '../modals/PathSelectionModal';
import { PerkSelectionModal } from '../modals/PerkSelectionModal';
import { GATE_ITEMS } from '../../systems/loot';
import { getAvailablePerks, getPerkById } from '../../data/pathPerks';
import styles from './CultivateScreen.module.css';


/**
 * Meditating Character with Qi Aura
 */
function MeditatingCharacter() {
  return (
    <div className={styles.meditationAura}>
      {/* Qi aura rings */}
      <div className={styles.auraRings}>
        <div className={styles.ringLarge} />
        <div className={styles.ringMedium} />
        <div className={styles.ringSmall} />
      </div>

      <div className={styles.meditatingIcon}>
        🧘
      </div>

    </div>
  );
}

/**
 * Ornate Progress Bar with gradient fill
 */
function OrnateProgressBar({
  current,
  max,
  label,
}: {
  current: string;
  max: string;
  label: string;
}) {
  const percent = Math.min(100, parseFloat((Number(current) / Number(max) * 100).toFixed(2)));

  return (
    <div className={styles.progressGroup}>
      <div className={styles.progressMeta}>
        <span className={styles.progressLabel}>{label}</span>
        <span>
          {formatNumber(current)} / {formatNumber(max)}
        </span>
      </div>

      {/* Ornate container */}
      <div className={styles.progressBar}>
        {/* Background pattern */}
        <div className={styles.progressTrackPattern} />

        {/* Gradient fill */}
        <div
          className={styles.progressFill}
          style={{
            width: `${percent}%`,
          }}
        >
          {/* Shimmer effect */}
          <div className={styles.progressShimmer} />
        </div>

        {/* Percentage text */}
        <div className={styles.progressText}>
          <span>
            {percent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Cultivate Screen Component
 */
export function CultivateScreen() {
  const realm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const focusMode = useGameStore((state) => state.focusMode);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const pathPerks = useGameStore((state) => state.pathPerks);
  const breakthroughCost = useGameStore((state) => state.getBreakthroughRequirement());

  const breakthrough = useGameStore((state) => state.breakthrough);
  const setFocusMode = useGameStore((state) => state.setFocusMode);
  const inventoryItems = useInventoryStore((state) => state.items);
  const {
    showPathSelectionModal,
    showPerkSelectionModal,
    perkSelectionRealm,
    showPathSelection,
    hidePathSelection,
    showPerkSelection,
    hidePerkSelection,
  } = useUIStore();

  const currentRealm = REALMS[realm.index];
  const nextSubstage = realm.substage + 1;
  const isLastSubstage = nextSubstage > currentRealm.substages;

  const requiredGateItem = useMemo(() => {
    const willAdvanceRealm =
      realm.substage >= currentRealm.substages && realm.index < REALMS.length - 1;

    if (willAdvanceRealm) {
      return GATE_ITEMS[realm.index] || null;
    }

    return null;
  }, [currentRealm.substages, realm.index, realm.substage]);

  const requiredGateItemDefinition = useMemo(() => {
    if (!requiredGateItem) return null;
    return getItemDefinition(requiredGateItem) || null;
  }, [requiredGateItem]);

  const gateItemCount = useMemo(() => {
    if (!requiredGateItem) return 0;
    const matchingItem = inventoryItems.find(
      (item) => item.itemId === requiredGateItem
    );
    return matchingItem?.quantity ?? 0;
  }, [inventoryItems, requiredGateItem]);

  const hasRequiredToken = useMemo(() => {
    if (!requiredGateItem) return true;
    return gateItemCount > 0;
  }, [gateItemCount, requiredGateItem]);

  const hasEnoughQi = Number(qi) >= Number(breakthroughCost);
  const canBreakthrough = hasEnoughQi && hasRequiredToken;

  const hasPerkForRealm = useCallback(
    (realmIndex: number) =>
      pathPerks.some((perkId) => getPerkById(perkId)?.requiredRealm === realmIndex),
    [pathPerks]
  );

  // Show path selection when player reaches Foundation (realm 1) and hasn't chosen
  useEffect(() => {
    if (realm.index >= 1 && !selectedPath) {
      showPathSelection();
    }
  }, [realm.index, selectedPath, showPathSelection]);

  // Show perk selection when entering a new major realm without a perk for it
  useEffect(() => {
    if (!selectedPath || realm.index < 1) return;

    const hasRealmPerk = hasPerkForRealm(realm.index);
    const availablePerks = getAvailablePerks(selectedPath, realm.index);
    const perkModalAlreadyOpen =
      showPerkSelectionModal && perkSelectionRealm === realm.index;

    if (availablePerks.length > 0 && !hasRealmPerk && !perkModalAlreadyOpen) {
      showPerkSelection(realm.index);
    }
  }, [
    realm.index,
    selectedPath,
    hasPerkForRealm,
    showPerkSelection,
    showPerkSelectionModal,
    perkSelectionRealm,
  ]);

  // Handle breakthrough button click
  const handleBreakthrough = () => {
    if (!canBreakthrough) return;
    breakthrough();
  };

  return (
    <div className={styles.root}>

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Cultivation Chamber
          </h1>
          <p className={styles.subtitle}>
            Meditate and gather Qi to advance your cultivation
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className={styles.grid}>
          {/* LEFT: Meditation Display */}
          <div className={styles.leftColumn}>
            {/* Meditating Character */}
            <div className={styles.meditationCard}>
              <MeditatingCharacter />

              {/* Qi Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Current Qi</div>
                  <div className={styles.statValue}>{formatNumber(qi)}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Qi per Second</div>
                  <div className={styles.statValue}>
                    {formatNumber(qiPerSecond)}
                  </div>
                </div>
              </div>
            </div>

            {/* Breakthrough Progress */}
            <div className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <div className={styles.realmName}>
                  {currentRealm.name}
                </div>
                <div className={styles.realmDetails}>
                  {isLastSubstage
                    ? 'Maximum stage reached'
                    : `Stage ${realm.substage} → ${nextSubstage}`}
                </div>
              </div>

              <OrnateProgressBar current={qi} max={breakthroughCost} label="Breakthrough Progress" />

              {requiredGateItem && (
                <div className={styles.gateRequirement}>
                  {hasRequiredToken ? (
                    <span className={styles.gateRequirementStrong}>
                      ✅ {requiredGateItemDefinition?.name || 'Required Item'} ready ({gateItemCount}/1)
                    </span>
                  ) : (
                    <span className={styles.gateRequirementMissing}>
                      🔒 Requires {requiredGateItemDefinition?.name || requiredGateItem} ({gateItemCount}/1)
                    </span>
                  )}
                  <p className={styles.gateHint}>
                    Obtained from key bosses and trials. One will be consumed when breaking through to the
                    next realm.
                  </p>
                </div>
              )}

              {/* Breakthrough Button */}
              <button
                onClick={handleBreakthrough}
                disabled={!canBreakthrough}
                className={`${styles.breakthroughButton} ${canBreakthrough ? styles.breakthroughEnabled : styles.breakthroughDisabled}`}
              >
                {canBreakthrough
                  ? '✨ Break Through! ✨'
                  : !hasRequiredToken && requiredGateItem
                    ? `🔒 Requires ${requiredGateItemDefinition?.name || 'Gate Item'}`
                    : '🔒 Insufficient Qi'}
              </button>
            </div>
          </div>

          {/* RIGHT: Focus & Upgrades */}
          <div className={styles.rightColumn}>
            {/* Focus Mode Selector */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>
                Cultivation Focus
              </h3>

              <div className={styles.focusList}>
                {(['balanced', 'body', 'spirit'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFocusMode(mode)}
                    className={`${styles.focusButton} ${focusMode === mode ? styles.focusButtonActive : ''}`}
                  >
                    <div className={styles.focusButtonTitle}>{mode}</div>
                    <div className={styles.focusButtonDesc}>
                      {mode === 'balanced' && 'Equal focus on all aspects'}
                      {mode === 'body' && 'Enhance physical cultivation'}
                      {mode === 'spirit' && 'Focus on spiritual energy'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cultivation Info */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarTitle}>
                Cultivation Info
              </h3>

              <div className={styles.infoList}>
                <div>
                  <div className={styles.infoLabel}>Current Path</div>
                  <div className={`${styles.infoValue}`}>
                    {useGameStore.getState().selectedPath || 'None'}
                  </div>
                </div>
                <div>
                  <div className={styles.infoLabel}>Total Auras</div>
                  <div className={`${styles.infoValue} ${styles.infoHighlight}`}>
                    {formatNumber(useGameStore.getState().totalAuras)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Path Selection Modal */}
      {showPathSelectionModal && (
        <PathSelectionModal onClose={hidePathSelection} />
      )}

      {/* Perk Selection Modal */}
      {showPerkSelectionModal && perkSelectionRealm !== null && (
        <PerkSelectionModal
          onClose={hidePerkSelection}
          realmIndex={perkSelectionRealm}
        />
      )}
    </div>
  );
}
