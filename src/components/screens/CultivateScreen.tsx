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
import cultivatorImage from "../../assets/onscreen/cbg_full.png";
import dantianImage from "../../assets/onscreen/qisign.png";
import longBar from "../../assets/menus/bar_long.png";
import './CultivateScreen.scss';

/**
 * Ornate Progress Bar with gradient fill
 */
function OrnateProgressBar({
  current,
  max,
}: {
  current: string;
  max: string;
  label: string;
}) {
  const percent = Math.min(100, parseFloat((Number(current) / Number(max) * 100).toFixed(2)));

  return (

    <div className={'cultivateScreenProgressContainer'}>
      {/* Background pattern */}
      <div className={'cultivateScreenProgressPattern'} />

      {/* Gradient fill */}
      <div className={'cultivateScreenProgressFill'} style={{ width: `${percent}%` }}>
        <div className={'cultivateScreenProgressShimmer'} />
      </div>

      {/* Percentage text */}
      <div className={'cultivateScreenProgressText'}>{percent.toFixed(1)}%</div>
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
    <div className={'cultivateScreenRoot'}>
      {/* <div className={'cultivateScreenHeader'}>
        <h1 className={'cultivateScreenTitle'}>Cultivation Chamber</h1>
        <p className={'cultivateScreenSubtitle'}>Meditate and gather Qi to advance your cultivation</p>
      </div> */}

      <div className="cultivator-container">
        <img className='cultivator' src={cultivatorImage} />
        <img className='dantian' src={dantianImage} />
      </div>



      <div className={'cultivateScreenGrid'}>
        {/* LEFT: Meditation Display */}
        <div className={'cultivateScreenLeftColumn'}>

          <div className={`${'cultivateScreenPanel'} ${'cultivateScreenPanelDark'}`}>

            {/* Qi Stats */}
            <div className={'cultivateScreenStatsGrid'}>
              <div className={'cultivateScreenStatCard'}>
                <div className={'cultivateScreenStatLabel'}>Current Qi</div>
                <div className={'cultivateScreenStatValue'}>{formatNumber(qi)}</div>
              </div>
              <div className={'cultivateScreenStatCard'}>
                <div className={'cultivateScreenStatLabel'}>Qi per Second</div>
                <div className={'cultivateScreenStatValue'}>{formatNumber(qiPerSecond)}</div>
              </div>
            </div>
          </div>

          {/* Breakthrough Progress */}
          <div className={`${'cultivateScreenPanel'} ${'cultivateScreenPanelDark'}`}>
            <div className={'cultivateScreenProgressHeader'}>
              <div className={'cultivateScreenProgressTitle'}>{currentRealm.name}</div>
              <div className={'cultivateScreenProgressSubtitle'}>
                {isLastSubstage ? 'Maximum stage reached' : `Stage ${realm.substage} → ${nextSubstage}`}
              </div>
            </div>


            <div className={'cultivateScreenProgressBlock'}>
              <span className={'cultivateScreenProgressLabel'}>Breakthrough Progress</span>
              <span className={'cultivateScreenProgressValue'}>
                {formatNumber(qi)} / {formatNumber(breakthroughCost)}
              </span>
            </div>

            <div className="progress-bar">
              <OrnateProgressBar current={qi} max={breakthroughCost} label="Breakthrough Progress" />
              <img className='bar-container' src={longBar} />
            </div>

            {requiredGateItem && (
              <div className={'cultivateScreenGateRequirement'}>
                {hasRequiredToken ? (
                  <span className={'cultivateScreenGateReady'}>
                    ✅ {requiredGateItemDefinition?.name || 'Required Item'} ready ({gateItemCount}/1)
                  </span>
                ) : (
                  <span className={'cultivateScreenGateMissing'}>
                    🔒 Requires {requiredGateItemDefinition?.name || requiredGateItem} ({gateItemCount}/1)
                  </span>
                )}
                <p className={'cultivateScreenGateNote'}>
                  Obtained from key bosses and trials. One will be consumed when breaking through to the
                  next realm.
                </p>
              </div>
            )}

            {/* Breakthrough Button */}
            <button
              onClick={handleBreakthrough}
              disabled={!canBreakthrough}
              className={'cultivateScreenBreakthroughButton'}
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
        <div className={'cultivateScreenRightColumn'}>
          {/* Focus Mode Selector */}
          <div className={`${'cultivateScreenPanel'} ${'cultivateScreenPanelDark'}`}>
            <h3 className={'cultivateScreenPanelHeader'}>Cultivation Focus</h3>

            <div className={'cultivateScreenFocusList'}>
              {(['balanced', 'body', 'spirit'] as const).map((mode) => {
                const isActive = focusMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setFocusMode(mode)}
                    className={`${'cultivateScreenFocusButton'} ${isActive ? 'cultivateScreenFocusButtonActive' : ''}`}
                  >
                    <div className={'cultivateScreenFocusTitle'}>{mode}</div>
                    <div className={'cultivateScreenFocusDescription'}>
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
          <div className={`${'cultivateScreenPanel'} ${'cultivateScreenPanelDark'}`}>
            <h3 className={'cultivateScreenPanelHeader'}>Cultivation Info</h3>

            <div className={'cultivateScreenInfoList'}>
              <div>
                <div className={'cultivateScreenInfoLabel'}>Current Path</div>
                <div className={'cultivateScreenInfoValue'}>{useGameStore.getState().selectedPath || 'None'}</div>
              </div>
              <div>
                <div className={'cultivateScreenInfoLabel'}>Total Auras</div>
                <div className={`${'cultivateScreenInfoValue'} ${'cultivateScreenInfoHighlight'}`}>
                  {formatNumber(useGameStore.getState().totalAuras)}
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
