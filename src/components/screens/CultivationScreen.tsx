import React, { useCallback, useEffect, useMemo } from 'react';
import { images } from '../../assets/images';
import { REALMS } from '../../constants';
import { PathSelectionModal } from '../modals/PathSelectionModal';
import { PerkSelectionModal } from '../modals/PerkSelectionModal';
import { BreakthroughBar } from '../ui/BreakthroughBar';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import { formatNumber, D, greaterThanOrEqualTo } from '../../utils/numbers';
import { GATE_ITEMS } from '../../systems/loot';
import { getAvailablePerks, getPerkById } from '../../data/pathPerks';
import './CultivationScreen.css';

function formatQi(value: string | number) {
  return formatNumber(value);
}

function formatQiPerSecond(value: string | number) {
  return `${formatNumber(value)} /s`;
}

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
  const isLastSubstage = realm.substage + 1 > currentRealm.substages;

  const requiredGateItem = useMemo(() => {
    const willAdvanceRealm =
      realm.substage >= currentRealm.substages && realm.index < REALMS.length - 1;

    if (willAdvanceRealm) {
      return GATE_ITEMS[realm.index] || null;
    }

    return null;
  }, [currentRealm.substages, realm.index, realm.substage]);

  const gateItemCount = useMemo(() => {
    if (!requiredGateItem) return 0;
    const matchingItem = inventoryItems.find((item) => item.itemId === requiredGateItem);
    return matchingItem?.quantity ?? 0;
  }, [inventoryItems, requiredGateItem]);

  const hasRequiredToken = useMemo(() => {
    if (!requiredGateItem) return true;
    return gateItemCount > 0;
  }, [gateItemCount, requiredGateItem]);

  const hasEnoughQi = greaterThanOrEqualTo(qi, breakthroughCost);
  const canBreakthrough = hasEnoughQi && hasRequiredToken;

  const hasPerkForRealm = useCallback(
    (realmIndex: number) =>
      pathPerks.some((perkId) => getPerkById(perkId)?.requiredRealm === realmIndex),
    [pathPerks],
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
    const perkModalAlreadyOpen = showPerkSelectionModal && perkSelectionRealm === realm.index;

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

  const handleBreakthrough = () => {
    if (!canBreakthrough) return;
    breakthrough();
  };

  const realmLabel = currentRealm?.name || 'Unknown Realm';
  const substageLabel = `${isLastSubstage ? 'Peak' : 'Substage'} ${realm.substage}/${currentRealm.substages}`;
  const breakthroughProgress = D(breakthroughCost).equals(0)
    ? 0
    : Number(D(qi).dividedBy(D(breakthroughCost)));

  return (
    <div className="cultivation-root">
      <div className="cultivation-bg-layer">
        <img
          src={images.environment.mountainsStyle1Gray}
          alt=""
          className="cultivation-bg-mountains"
        />
        <img src={images.environment.treeMain} alt="" className="cultivation-bg-tree" />
      </div>

      <div className="cultivation-main-row">
        <div className="cultivation-center">
          <img src={images.ui.platformBare} alt="Platform" className="cultivation-platform" />
          <img
            src={images.sprites.cultivatorFront}
            alt="Cultivator"
            className="cultivation-figure"
          />
        </div>

        <div className="cultivation-info-panel">
          <div className="cultivation-info-header">
            <div className="cultivation-title">Cultivation Chamber</div>
            <div className="cultivation-subtitle">
              Meditate and gather Qi to advance your cultivation
            </div>
          </div>

          <div className="cultivation-info-stats">
            <div className="cultivation-stat-card">
              <div className="stat-label">Current Qi</div>
              <div className="stat-value">{formatQi(qi)}</div>
              <div className="stat-subvalue">{formatQiPerSecond(qiPerSecond)}</div>
            </div>
            <div className="cultivation-stat-card">
              <div className="stat-label">Qi per Second</div>
              <div className="stat-value">{formatQiPerSecond(qiPerSecond)}</div>
            </div>
            <div className="cultivation-stat-card">
              <div className="stat-label">Realm</div>
              <div className="stat-value">{realmLabel}</div>
              <div className="stat-subvalue">{substageLabel}</div>
            </div>
          </div>

          <div className="cultivation-focus-section">
            <div className="section-title">Cultivation Focus</div>
            <div className="focus-buttons">
              {renderFocusButton('balanced', 'Balanced', 'Equal focus on all aspects')}
              {renderFocusButton('body', 'Body', 'Enhance physical cultivation')}
              {renderFocusButton('spirit', 'Spirit', 'Focus on spiritual energy')}
            </div>
          </div>
        </div>
      </div>

      <BreakthroughBar
        progress={breakthroughProgress}
        qi={qi}
        qiCap={breakthroughCost}
        canBreakthrough={canBreakthrough}
        onBreakthrough={handleBreakthrough}
      />

      {showPathSelectionModal && <PathSelectionModal onClose={hidePathSelection} />}

      {showPerkSelectionModal && perkSelectionRealm !== null && (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      )}
    </div>
  );

  function renderFocusButton(
    id: 'balanced' | 'body' | 'spirit',
    label: string,
    description: string,
  ) {
    const isActive = focusMode === id;
    return (
      <button
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
