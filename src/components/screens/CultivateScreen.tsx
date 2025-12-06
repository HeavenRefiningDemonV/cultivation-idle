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
import './CultivateScreen.scss';


/**
 * Meditating Character with Qi Aura
 */
function MeditatingCharacter() {
  return (
    <div className={'cultivate-screen__meditation'}>
      {/* Qi aura rings */}
      <div className={'cultivate-screen__aura'}>
        <div className={'cultivate-screen__aura-ring--large'} />
        <div className={'cultivate-screen__aura-ring--medium'} />
        <div className={'cultivate-screen__aura-ring--small'} />
      </div>

      <div className={'cultivate-screen__meditator'}>
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
    <div className={'cultivate-screen__progress-section'}>
      <div className={'cultivate-screen__progress-block'}>
        <span className={'cultivate-screen__progress-label'}>{label}</span>
        <span className={'cultivate-screen__progress-value'}>
          {formatNumber(current)} / {formatNumber(max)}
        </span>
      </div>

      {/* Ornate container */}
      <div className={'cultivate-screen__progress-container'}>
        {/* Background pattern */}
        <div className={'cultivate-screen__progress-pattern'} />

        {/* Gradient fill */}
        <div className={'cultivate-screen__progress-fill'} style={{ width: `${percent}%` }}>
          <div className={'cultivate-screen__progress-shimmer'} />
        </div>

        {/* Percentage text */}
        <div className={'cultivate-screen__progress-text'}>{percent.toFixed(1)}%</div>
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
    <div className={'cultivate-screen'}>
      <div className={'cultivate-screen__content'}>
        <div className={'cultivate-screen__header'}>
          <h1 className={'cultivate-screen__title'}>Cultivation Chamber</h1>
          <p className={'cultivate-screen__subtitle'}>Meditate and gather Qi to advance your cultivation</p>
        </div>

        {/* Main Grid Layout */}
        <div className={'cultivate-screen__grid'}>
          {/* LEFT: Meditation Display */}
          <div className={'cultivate-screen__left'}>
            {/* Meditating Character */}
            <div className={`${'cultivate-screen__panel'} ${'cultivate-screen__panelDark'}`}>
              <MeditatingCharacter />

              {/* Qi Stats */}
              <div className={'cultivate-screen__stats'}>
                <div className={'cultivate-screen__stat-card'}>
                  <div className={'cultivate-screen__stat-label'}>Current Qi</div>
                  <div className={'cultivate-screen__stat-value'}>{formatNumber(qi)}</div>
                </div>
                <div className={'cultivate-screen__stat-card'}>
                  <div className={'cultivate-screen__stat-label'}>Qi per Second</div>
                  <div className={'cultivate-screen__stat-value'}>{formatNumber(qiPerSecond)}</div>
                </div>
              </div>
            </div>

            {/* Breakthrough Progress */}
            <div className={`${'cultivate-screen__panel'} ${'cultivate-screen__panelDark'}`}>
              <div className={'cultivate-screen__progress-header'}>
                <div className={'cultivate-screen__progress-title'}>{currentRealm.name}</div>
                <div className={'cultivate-screen__progress-subtitle'}>
                  {isLastSubstage ? 'Maximum stage reached' : `Stage ${realm.substage} → ${nextSubstage}`}
                </div>
              </div>

              <OrnateProgressBar current={qi} max={breakthroughCost} label="Breakthrough Progress" />

              {requiredGateItem && (
                <div className={'cultivate-screen__gate-requirement'}>
                  {hasRequiredToken ? (
                    <span className={'cultivate-screen__gate-ready'}>
                      ✅ {requiredGateItemDefinition?.name || 'Required Item'} ready ({gateItemCount}/1)
                    </span>
                  ) : (
                    <span className={'cultivate-screen__gate-missing'}>
                      🔒 Requires {requiredGateItemDefinition?.name || requiredGateItem} ({gateItemCount}/1)
                    </span>
                  )}
                  <p className={'cultivate-screen__gate-note'}>
                    Obtained from key bosses and trials. One will be consumed when breaking through to the
                    next realm.
                  </p>
                </div>
              )}

              {/* Breakthrough Button */}
              <button
                onClick={handleBreakthrough}
                disabled={!canBreakthrough}
                className={'cultivate-screen__breakthrough-button'}
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
          <div className={'cultivate-screen__right'}>
            {/* Focus Mode Selector */}
            <div className={`${'cultivate-screen__panel'} ${'cultivate-screen__panelDark'}`}>
              <h3 className={'cultivate-screen__panelHeader'}>Cultivation Focus</h3>

              <div className={'cultivate-screen__focus-list'}>
                {(['balanced', 'body', 'spirit'] as const).map((mode) => {
                  const isActive = focusMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setFocusMode(mode)}
                      className={`${'cultivate-screen__focus-button'} ${isActive ? 'cultivate-screen__focus-buttonActive' : ''}`}
                    >
                      <div className={'cultivate-screen__focus-title'}>{mode}</div>
                      <div className={'cultivate-screen__focus-description'}>
                        {mode === 'balanced' && 'Equal focus on all aspects'}
                        {mode === 'body' && 'Enhance physical cultivation'}
                        {mode === 'spirit' && 'Focus on spiritual energy'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cultivation Info */}
            <div className={`${'cultivate-screen__panel'} ${'cultivate-screen__panelDark'}`}>
              <h3 className={'cultivate-screen__panelHeader'}>Cultivation Info</h3>

              <div className={'cultivate-screen__info-list'}>
                <div>
                  <div className={'cultivate-screen__info-label'}>Current Path</div>
                  <div className={'cultivate-screen__info-value'}>{useGameStore.getState().selectedPath || 'None'}</div>
                </div>
                <div>
                  <div className={'cultivate-screen__info-label'}>Total Auras</div>
                  <div className={`${'cultivate-screen__info-value'} ${'cultivate-screen__info-highlight'}`}>
                    {formatNumber(useGameStore.getState().totalAuras)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Path Selection Modal */}
      {showPathSelectionModal && <PathSelectionModal onClose={hidePathSelection} />}

      {/* Perk Selection Modal */}
      {showPerkSelectionModal && perkSelectionRealm !== null && (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      )}
    </div>
  );
}
