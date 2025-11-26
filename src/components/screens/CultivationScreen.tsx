import { useCallback, useEffect, useMemo } from 'react';
import { images } from '../../assets/images';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore, getItemDefinition } from '../../stores/inventoryStore';
import { useUIStore } from '../../stores/uiStore';
import { REALMS } from '../../constants';
import { GATE_ITEMS } from '../../systems/loot';
import { getAvailablePerks, getPerkById } from '../../data/pathPerks';
import { D, formatNumber, greaterThanOrEqualTo } from '../../utils/numbers';
import { PathSelectionModal } from '../modals/PathSelectionModal';
import { PerkSelectionModal } from '../modals/PerkSelectionModal';
import './CultivationScreen.css';

type FocusModeOption = 'balanced' | 'body' | 'spirit';

const FOCUS_DESCRIPTIONS: Record<FocusModeOption, string> = {
  balanced: 'Equal focus on all aspects',
  body: 'Enhance physical cultivation',
  spirit: 'Focus on spiritual energy',
};

export function CultivationScreen() {
  const realm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const focusMode = useGameStore((state) => state.focusMode);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const pathPerks = useGameStore((state) => state.pathPerks);
  const breakthroughRequirement = useGameStore((state) =>
    state.getBreakthroughRequirement()
  );
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
  const isAtFinalRealm = realm.index >= REALMS.length - 1 && isLastSubstage;

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

  const qiValue = D(qi);
  const requirementValue = D(breakthroughRequirement);
  const progressPercent = requirementValue.isZero()
    ? 0
    : Math.min(100, qiValue.dividedBy(requirementValue).times(100).toNumber());

  const canBreakthrough = greaterThanOrEqualTo(qi, breakthroughRequirement) && hasRequiredToken;

  const handleBreakthrough = () => {
    if (!canBreakthrough) return;
    breakthrough();
  };

  const renderFocusButton = (mode: FocusModeOption) => {
    const isActive = focusMode === mode;
    const label = mode.charAt(0).toUpperCase() + mode.slice(1);
    return (
      <button
        key={mode}
        type="button"
        className={isActive ? 'focus-button focus-button-active' : 'focus-button'}
        onClick={() => setFocusMode(mode)}
      >
        <div className="focus-label">{label}</div>
        <div className="focus-description">{FOCUS_DESCRIPTIONS[mode]}</div>
      </button>
    );
  };

  return (
    <div className="cultivation-root">
      <div className="cultivation-bg-layer">
        <img
          src={images.cultivation.background}
          alt="Cultivation background"
          className="cultivation-bg-image"
        />
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
                Substage {realm.substage}
                {isAtFinalRealm ? ' (Max)' : isLastSubstage ? ' • Breakthrough available' : ` → ${nextSubstage}`}
              </div>
            </div>
          </section>

          <section className="cultivation-focus-section">
            <div className="section-title">Cultivation Focus</div>
            <div className="focus-buttons">
              {(['balanced', 'body', 'spirit'] as FocusModeOption[]).map((mode) =>
                renderFocusButton(mode)
              )}
            </div>
          </section>

          <section className="cultivation-info-extras">
            <div className="extra-line">
              <span className="extra-label">Current Path:</span>
              <span className="extra-value">
                {selectedPath ? selectedPath : 'None selected'}
              </span>
            </div>
            <div className="extra-line">
              <span className="extra-label">Breakthrough Cost:</span>
              <span className="extra-value">{formatNumber(breakthroughRequirement)} Qi</span>
            </div>
            {requiredGateItemDefinition && (
              <div className="extra-line">
                <span className="extra-label">Gate Item:</span>
                <span className="extra-value">
                  {hasRequiredToken ? 'Ready • ' : 'Missing • '}
                  {requiredGateItemDefinition.name} ({gateItemCount}/1)
                </span>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="cultivation-breakthrough-row">
        <div className="cultivation-breakthrough-panel">
          <div className="breakthrough-text">
            <div className="section-title">Breakthrough Progress</div>
            <div className="stat-subvalue">
              {isLastSubstage && !isAtFinalRealm
                ? `Advance to ${REALMS[realm.index + 1].name}`
                : isAtFinalRealm
                  ? 'Highest known realm reached'
                  : `Advancing to Substage ${nextSubstage}`}
            </div>
          </div>

          <div className="cultivation-progress">
            <div className="cultivation-progress-track">
              <div
                className="cultivation-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="cultivation-progress-label">
              {progressPercent.toFixed(1)}% of {formatNumber(breakthroughRequirement)} Qi
            </div>
          </div>

          <button
            type="button"
            className={canBreakthrough ? 'breakthrough-btn' : 'breakthrough-btn breakthrough-btn-disabled'}
            onClick={handleBreakthrough}
            disabled={!canBreakthrough}
          >
            {canBreakthrough
              ? '✨ Break Through! ✨'
              : requiredGateItem && !hasRequiredToken
                ? 'Requires gate item'
                : 'Gather more Qi'}
          </button>
        </div>
      </div>

      {showPathSelectionModal && <PathSelectionModal onClose={hidePathSelection} />}

      {showPerkSelectionModal && perkSelectionRealm !== null && (
        <PerkSelectionModal onClose={hidePerkSelection} realmIndex={perkSelectionRealm} />
      )}
    </div>
  );
}
