import { useCallback, useEffect, useMemo } from 'react';
import { images } from '../../assets/images';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore, getItemDefinition } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import { formatNumber } from '../../utils/numbers';
import { REALMS } from '../../constants';
import { PathSelectionModal } from '../modals/PathSelectionModal';
import { PerkSelectionModal } from '../modals/PerkSelectionModal';
import { GATE_ITEMS } from '../../systems/loot';
import { getAvailablePerks, getPerkById } from '../../data/pathPerks';
import { Bar } from '../ui/Bar';
import './CultivationScreen.css';

export function CultivationScreen() {
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
    const matchingItem = inventoryItems.find((item) => item.itemId === requiredGateItem);
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

  useEffect(() => {
    if (realm.index >= 1 && !selectedPath) {
      showPathSelection();
    }
  }, [realm.index, selectedPath, showPathSelection]);

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

  const handleBreakthrough = useCallback(() => {
    if (!canBreakthrough) return;
    breakthrough();
  }, [breakthrough, canBreakthrough]);

  const qiValue = Number(qi);
  const breakthroughValue = Number(breakthroughCost);

  return (
    <div className="cultivation-root">
      <div className="cultivation-bg-layer">
        <img src={images.cultivation.background} alt="" className="cultivation-bg-image" />
      </div>

      <div className="cultivation-main-grid">
        <div className="cultivation-center">
          <img
            src={images.cultivation.figure}
            alt="Cultivator"
            className="cultivation-figure"
          />
        </div>

        <div className="cultivation-info-panel">
          <header className="cultivation-info-header">
            <div className="cultivation-title">Cultivation Chamber</div>
            <div className="cultivation-subtitle">
              Meditate and gather Qi to advance your cultivation
            </div>
          </header>

          <section className="cultivation-info-stats">
            <div className="cultivation-stat-card">
              <div className="stat-label">Current Qi</div>
              <div className="stat-value">{formatNumber(qi)}</div>
              <div className="stat-subvalue">{formatNumber(qiPerSecond)} /s</div>
            </div>

            <div className="cultivation-stat-card">
              <div className="stat-label">Realm</div>
              <div className="stat-value">{currentRealm.name}</div>
              <div className="stat-subvalue">
                {isLastSubstage ? 'Maximum stage reached' : `Stage ${realm.substage + 1} → ${nextSubstage}`}
              </div>
            </div>
          </section>

          <section className="cultivation-focus-section">
            <div className="section-title">Cultivation Focus</div>
            <div className="focus-buttons">
              {renderFocusButton('balanced', 'Balanced', 'Equal focus on all aspects')}
              {renderFocusButton('body', 'Body', 'Enhance physical cultivation')}
              {renderFocusButton('spirit', 'Spirit', 'Focus on spiritual energy')}
            </div>
          </section>

          <section className="cultivation-info-stats">
            <div className="cultivation-stat-card">
              <div className="stat-label">Current Path</div>
              <div className="stat-value capitalize">{selectedPath || 'None'}</div>
              <div className="stat-subvalue">Total Auras: {formatNumber(useGameStore.getState().totalAuras)}</div>
            </div>
          </section>
        </div>
      </div>

      <div className="cultivation-breakthrough-row">
        <div className="cultivation-breakthrough-card">
          <div className="cultivation-breakthrough-header">
            <div>
              <div className="section-title">Breakthrough Progress</div>
              <div className="stat-subvalue">{currentRealm.name}</div>
            </div>
            <div className="cultivation-breakthrough-requirement">
              Requirement: {formatNumber(breakthroughCost)} Qi
            </div>
          </div>

          <Bar value={qiValue} max={breakthroughValue} showText label="" />

          {requiredGateItem && (
            <div className="cultivation-gate-note">
              {hasRequiredToken ? (
                <span className="text-emerald-300">✅ {requiredGateItemDefinition?.name || 'Required Item'} ready ({gateItemCount}/1)</span>
              ) : (
                <span className="text-rose-300">🔒 Requires {requiredGateItemDefinition?.name || requiredGateItem} ({gateItemCount}/1)</span>
              )}
            </div>
          )}

          <button
            type="button"
            className={`focus-button cultivation-breakthrough-button ${
              canBreakthrough ? 'focus-button-active' : ''
            }`}
            onClick={handleBreakthrough}
            disabled={!canBreakthrough}
          >
            {canBreakthrough
              ? '✨ Break Through! ✨'
              : !hasRequiredToken && requiredGateItem
                ? `Requires ${requiredGateItemDefinition?.name || 'Gate Item'}`
                : 'Insufficient Qi'}
          </button>
        </div>
      </div>

      {showPathSelectionModal && <PathSelectionModal onClose={hidePathSelection} />}

      {showPerkSelectionModal && perkSelectionRealm !== null && (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      )}
    </div>
  );

  function renderFocusButton(
    id: 'balanced' | 'body' | 'spirit',
    label: string,
    description: string
  ) {
    const isActive = focusMode === id;
    return (
      <button
        key={id}
        type="button"
        className={isActive ? 'focus-button focus-button-active' : 'focus-button'}
        onClick={() => setFocusMode(id)}
      >
        <div className="focus-label">{label}</div>
        <div className="focus-description">{description}</div>
      </button>
    );
  }
}
