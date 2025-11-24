import { useCallback, useEffect, useMemo } from 'react';
import { images } from '../../assets/images';
import { BreakthroughBar } from '../ui/BreakthroughBar';
import { PathSelectionModal } from '../modals/PathSelectionModal';
import { PerkSelectionModal } from '../modals/PerkSelectionModal';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore, getItemDefinition } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import { REALMS } from '../../constants';
import { GATE_ITEMS } from '../../systems/loot';
import { getAvailablePerks, getPerkById } from '../../data/pathPerks';
import { D, formatNumber, greaterThanOrEqualTo } from '../../utils/numbers';
import './CultivationScreen.css';

type FocusMode = 'balanced' | 'body' | 'spirit';

type GateRequirement = {
  id: string;
  name: string;
  quantity: number;
};

function formatQi(value: number | string) {
  return formatNumber(value);
}

function formatQiPerSecond(value: number | string) {
  return formatNumber(value);
}

export function CultivationScreen() {
  const realm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const focusMode = useGameStore((state) => state.focusMode);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const pathPerks = useGameStore((state) => state.pathPerks);
  const breakthroughRequirement = useGameStore((state) => state.getBreakthroughRequirement());

  const attemptBreakthrough = useGameStore((state) => state.breakthrough);
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

  const currentRealmDef = REALMS[realm.index] || REALMS[0];
  const realmName = currentRealmDef?.name ?? realm.name;
  const substageLabel = `Stage ${realm.substage}`;

  const requiredGateItem = useMemo(() => {
    const willAdvanceRealm =
      realm.substage >= currentRealmDef.substages && realm.index < REALMS.length - 1;

    if (willAdvanceRealm) {
      return GATE_ITEMS[realm.index] || null;
    }

    return null;
  }, [currentRealmDef.substages, realm.index, realm.substage]);

  const gateRequirement: GateRequirement | null = useMemo(() => {
    if (!requiredGateItem) return null;
    const matchingItem = inventoryItems.find((item) => item.itemId === requiredGateItem);
    const definition = getItemDefinition(requiredGateItem);

    return {
      id: requiredGateItem,
      name: definition?.name || requiredGateItem,
      quantity: matchingItem?.quantity ?? 0,
    };
  }, [inventoryItems, requiredGateItem]);

  const hasRequiredToken = useMemo(() => {
    if (!gateRequirement) return true;
    return gateRequirement.quantity > 0;
  }, [gateRequirement]);

  const hasEnoughQi = greaterThanOrEqualTo(qi, breakthroughRequirement);
  const canBreakthrough = hasEnoughQi && hasRequiredToken;

  const qiCap = breakthroughRequirement;
  const breakthroughProgress = useMemo(() => {
    const cap = D(qiCap);
    if (cap.lessThanOrEqualTo(0)) return 0;
    const percent = D(qi).dividedBy(cap).times(100).toNumber();
    return Math.max(0, Math.min(100, percent));
  }, [qi, qiCap]);

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

      <div className="cultivation-main-grid">
        <div className="cultivation-center">
          <div className="cultivation-center-inner">
            <img src={images.ui.platformBare} alt="" className="cultivation-platform" />
            <img
              src={images.sprites.cultivatorFront}
              alt="Cultivator"
              className="cultivation-figure"
            />
          </div>
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
              <div className="stat-value">{formatQi(qi)}</div>
              <div className="stat-subvalue">{formatQiPerSecond(qiPerSecond)} /s</div>
            </div>

            <div className="cultivation-stat-card">
              <div className="stat-label">Realm</div>
              <div className="stat-value">{realmName}</div>
              <div className="stat-subvalue">{substageLabel}</div>
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
        </div>
      </div>

      <div className="cultivation-breakthrough-row">
        <BreakthroughBar
          progress={breakthroughProgress}
          qi={qi}
          qiCap={qiCap}
          canBreakthrough={canBreakthrough}
          onBreakthrough={attemptBreakthrough}
        />
        {!hasRequiredToken && gateRequirement ? (
          <div className="gate-requirement">Requires {gateRequirement.name} ({gateRequirement.quantity}/1)</div>
        ) : null}
      </div>

      {showPathSelectionModal && <PathSelectionModal onClose={hidePathSelection} />}
      {showPerkSelectionModal && perkSelectionRealm !== null ? (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      ) : null}
    </div>
  );

  function renderFocusButton(id: FocusMode, label: string, description: string) {
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

