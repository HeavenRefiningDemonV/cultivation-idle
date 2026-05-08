import { useCallback, useMemo, useRef, useState } from 'react';
import { useContentStore, getItemDef } from '../../../stores/contentStore.js';
import { useGameStore } from '../../../stores/gameStore.js';
import { useHeartLawStore } from '../../../stores/heartLawStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { usePrestigeStore } from '../../../stores/prestigeStore.js';
import { useTrialStore } from '../../../stores/trialStore.js';
import { useCityStore } from '../../../stores/cityStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { RewardService } from '../../../services/rewards/index.js';
import { D } from '../../../utils/numbers.js';
import type { PrestigeUpgradeDef } from '../../../content/index.js';
import { getLiveRealmNameByIndex } from '../../../systems/progression/runtime/index.js';
import {
  countResolvedSemesterGateTrials,
  extractLiveTrialIds,
} from '../../../systems/prestige/prestigeApReadModel.js';
import { buildPrestigeLifeSummarySnapshot } from '../lifeSummarySurface.js';
import { getPrestigeAdvisorSurface } from '../prestigeAdvisorSurface.js';
import { ApBreakdownModal } from '../../../components/modals/ApBreakdownModal.js';
import { PrestigeRitualModal } from '../../../components/modals/PrestigeRitualModal.js';
import { PrestigeUpgradeModal } from '../../../components/modals/PrestigeUpgradeModal.js';
import { PrestigeDecreeLibraryDrawer } from './PrestigeDecreeLibraryDrawer.js';
import { PrestigeLedgerExactScreen } from './PrestigeLedgerExactScreen.js';
import {
  buildPrestigeLedgerExactSurfaceFromStores,
  createPrestigeLedgerExactMockupFixture,
} from './buildPrestigeLedgerExactSurface.js';
import { usePrestigeLedgerActionController } from './usePrestigeLedgerActionController.js';

const missingUpgradeMessage = 'This decree is no longer available.';

const resolvePurchaseError = (reason?: string) => {
  if (!reason) return 'Purchase failed.';
  if (reason.toLowerCase().includes('not enough')) return 'Not enough Ascension Points.';
  if (reason.toLowerCase().includes('already maxed')) return 'Max level reached.';
  if (reason.toLowerCase().includes('requires')) return `Locked: ${reason.replace('Requires', '').trim()}`;
  return reason;
};

export function PrestigeLedgerScreenOwner() {
  const fixtureMode = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('prestigeLedgerMode') === 'fixture';
  const totalAP = usePrestigeStore((state) => state.totalAP);
  const lifetimeAP = usePrestigeStore((state) => state.lifetimeAP);
  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);
  const highestRealmReached = usePrestigeStore((state) => state.highestRealmReached);
  const spiritRoot = usePrestigeStore((state) => state.spiritRoot);
  const purchasesById = usePrestigeStore((state) => state.purchasesById);
  const lastLifeSummary = usePrestigeStore((state) => state.lastLifeSummary);
  const calculateAPGain = usePrestigeStore((state) => state.calculateAPGain);
  const canPrestige = usePrestigeStore((state) => state.canPrestige);
  const getApBreakdown = usePrestigeStore((state) => state.getApBreakdown);
  const performPrestige = usePrestigeStore((state) => state.performPrestige);
  const purchaseUpgrade = usePrestigeStore((state) => state.purchaseUpgrade);
  const getCurrentLevel = usePrestigeStore((state) => state.getCurrentLevel);
  const getMaxLevel = usePrestigeStore((state) => state.getMaxLevel);
  const getNextLevelCost = usePrestigeStore((state) => state.getNextLevelCost);
  const checkPrereqs = usePrestigeStore((state) => state.checkPrereqs);

  const realm = useGameStore((state) => state.realm);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);
  const requirePrestigeConfirm = useUIStore((state) => state.settings.requirePrestigeConfirm);
  const setLifeStartWizardContext = useUIStore((state) => state.setLifeStartWizardContext);
  const openLifeSummaryModal = useUIStore((state) => state.openLifeSummaryModal);
  const contentRaw = useContentStore((state) => state.raw);
  const heartLawsById = useContentStore((state) => state.maps.heartLawsById);
  const citiesById = useContentStore((state) => state.maps.citiesById);
  const getVisiblePrestigeUpgrades = useContentStore((state) => state.getVisiblePrestigeUpgrades);
  const progressByTrialId = useTrialStore((state) => state.progressByTrialId);
  const currentCityId = useCityStore((state) => state.currentCityId);
  const unlockedCityIds = useCityStore((state) => state.unlockedCityIds);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sellBeforePrestige, setSellBeforePrestige] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);
  const [isApBreakdownOpen, setIsApBreakdownOpen] = useState(false);
  const [ritualError, setRitualError] = useState<string | null>(null);
  const [apPulse, setApPulse] = useState(false);
  const ritualTriggerRef = useRef<HTMLButtonElement | null>(null);

  const apGain = calculateAPGain();
  const apBreakdown = getApBreakdown();
  const canPrestigeNow = canPrestige();
  const advisor = getPrestigeAdvisorSurface();
  const visibleUpgrades = useMemo(() => getVisiblePrestigeUpgrades(), [getVisiblePrestigeUpgrades, contentRaw]);

  const resolvedGateCount = useMemo(() => {
    const liveTrialIds = extractLiveTrialIds(contentRaw?.trials);
    return countResolvedSemesterGateTrials({ progressByTrialId, liveTrialIds });
  }, [contentRaw?.trials, progressByTrialId]);

  const cityNamesReached = useMemo(() => {
    const ids = unlockedCityIds.length > 0 ? unlockedCityIds : currentCityId ? [currentCityId] : [];
    return ids
      .map((cityId) => citiesById[cityId])
      .filter((city): city is NonNullable<typeof city> => Boolean(city))
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map((city) => city.name);
  }, [citiesById, currentCityId, unlockedCityIds]);

  const heartLawName = selectedHeartLawId ? heartLawsById[selectedHeartLawId]?.name ?? null : null;

  const surface = useMemo(() => {
    if (fixtureMode) return createPrestigeLedgerExactMockupFixture();

    return buildPrestigeLedgerExactSurfaceFromStores({
    mode: 'live',
    prestige: {
      totalAP,
      lifetimeAP,
      prestigeCount,
      apGain,
      canPrestige: canPrestigeNow,
      contentCapReached: advisor.stateLabel === 'Recommended',
      hasLastLifeSummary: Boolean(lastLifeSummary),
      highestRealmReached,
      spiritRoot,
      breakdown: apBreakdown,
      purchasesById,
    },
    game: {
      selectedPath,
      realm,
    },
    advisor: {
      stateLabel: advisor.stateLabel,
      stateDetail: advisor.stateDetail,
      resetPreview: advisor.resetPreview,
    },
    heartLawName,
    cityNamesReached,
    resolvedGateCount,
    visibleUpgrades,
    });
  }, [
    advisor.resetPreview,
    advisor.stateDetail,
    advisor.stateLabel,
    apBreakdown,
    apGain,
    canPrestigeNow,
    cityNamesReached,
    fixtureMode,
    heartLawName,
    highestRealmReached,
    lastLifeSummary,
    lifetimeAP,
    prestigeCount,
    purchasesById,
    realm,
    resolvedGateCount,
    selectedPath,
    spiritRoot,
    totalAP,
    visibleUpgrades,
  ]);

  const sellAllItems = useCallback(() => {
    const inventory = useInventoryStore.getState();
    let totalGold = D(0);

    Object.entries(inventory.items).forEach(([itemId, qty]) => {
      const def = getItemDef(itemId);
      const sellValue = def?.sellValue ?? 0;
      if (sellValue > 0 && qty > 0) {
        totalGold = totalGold.plus(D(sellValue).times(qty));
      }
      inventory.removeItem(itemId, qty);
    });

    if (totalGold.greaterThan(0)) {
      RewardService.grantRewards(
        { currencies: { gold: totalGold.toString() } },
        'Prestige: Sell all items',
      );
    }
  }, []);

  const performImmediatePrestige = useCallback((shouldSellAll: boolean) => {
    if (!canPrestigeNow) return;
    const preparedSummary = buildPrestigeLifeSummarySnapshot();
    if (shouldSellAll) sellAllItems();
    const lastHeartLawId = useHeartLawStore.getState().selectedHeartLawId;
    setLifeStartWizardContext(lastHeartLawId ?? null);
    performPrestige(preparedSummary);
  }, [canPrestigeNow, performPrestige, sellAllItems, setLifeStartWizardContext]);

  const actionController = usePrestigeLedgerActionController({
    canPrestigeNow,
    requirePrestigeConfirm,
    setShowConfirmation,
    setSellBeforePrestige,
    setRitualError,
    setLibraryOpen: setIsLibraryOpen,
    setApBreakdownOpen: setIsApBreakdownOpen,
    setSelectedUpgradeId,
    openLifeSummaryModal: () => openLifeSummaryModal('current'),
    performImmediatePrestige,
  });

  const closeRitualModal = () => {
    setShowConfirmation(false);
    setRitualError(null);
    setSellBeforePrestige(false);
    requestAnimationFrame(() => {
      ritualTriggerRef.current?.focus();
    });
  };

  const handleRitualConfirm = () => {
    setRitualError(null);
    try {
      performImmediatePrestige(sellBeforePrestige);
      setSellBeforePrestige(false);
      return true;
    } catch (error) {
      console.warn('[Prestige] Ritual failed', error);
      setRitualError('Ritual failed. Please try again.');
      return false;
    }
  };

  const selectedUpgrade = useMemo(() => {
    if (!selectedUpgradeId) return null;
    return visibleUpgrades.find((upgrade) => upgrade.id === selectedUpgradeId) ?? null;
  }, [selectedUpgradeId, visibleUpgrades]);

  const isMissingUpgrade = Boolean(selectedUpgradeId && !selectedUpgrade);
  const selectedUpgradeLevel = selectedUpgradeId && !isMissingUpgrade ? getCurrentLevel(selectedUpgradeId) : 0;
  const selectedUpgradeCost = selectedUpgradeId && !isMissingUpgrade ? getNextLevelCost(selectedUpgradeId) : null;
  const selectedUpgradePrereq =
    selectedUpgradeId && !isMissingUpgrade
      ? checkPrereqs(selectedUpgradeId)
      : { ok: false, reason: selectedUpgradeId ? missingUpgradeMessage : undefined };
  const selectedUpgradeLocked = selectedUpgradePrereq ? !selectedUpgradePrereq.ok : false;

  const selectedUpgradePrereqs = useMemo(() => {
    if (!selectedUpgrade?.prereq) return [];
    const nameMap = new Map<string, string>();
    visibleUpgrades.forEach((upgrade) => {
      nameMap.set(upgrade.id, upgrade.name);
    });
    return selectedUpgrade.prereq.map((prereq) => ({
      id: prereq.upgradeId,
      name: nameMap.get(prereq.upgradeId) ?? prereq.upgradeId,
      requiredLevel: prereq.minLevel,
      currentLevel: getCurrentLevel(prereq.upgradeId),
    }));
  }, [getCurrentLevel, selectedUpgrade, visibleUpgrades]);

  const handleModalClose = () => {
    setSelectedUpgradeId(null);
    setPurchaseError(null);
    setPurchaseSuccessMessage(null);
  };

  const handleUpgradePurchase = () => {
    if (!selectedUpgradeId) return;
    if (!selectedUpgrade) {
      setPurchaseError(missingUpgradeMessage);
      setPurchaseSuccessMessage(null);
      return;
    }

    setIsPurchasing(true);
    const result = purchaseUpgrade(selectedUpgradeId);
    if (!result.ok) {
      setPurchaseError(resolvePurchaseError(result.reason));
      setPurchaseSuccessMessage(null);
    } else {
      setPurchaseError(null);
      const newLevel = getCurrentLevel(selectedUpgradeId);
      const upgradeName = selectedUpgrade.name;
      setApPulse(true);
      setPurchaseSuccessMessage(`Decree Inscribed - ${upgradeName} is now Lv ${newLevel}`);
      setPurchaseToast(`Purchased: ${upgradeName} Lv ${newLevel}`);
      window.setTimeout(() => setApPulse(false), 450);
      window.setTimeout(() => setPurchaseToast(null), 2000);
    }
    setIsPurchasing(false);
  };

  const inspectUpgradeFromLibrary = (upgradeId: string) => {
    setIsLibraryOpen(false);
    setPurchaseError(null);
    setPurchaseSuccessMessage(null);
    setSelectedUpgradeId(upgradeId);
  };

  return (
    <div className={`prestigeLedgerOwner${apPulse ? ' prestigeLedgerOwner--apPulse' : ''}`}>
      <PrestigeLedgerExactScreen
        surface={surface}
        onReviewAndReincarnate={() => {
          actionController.reviewAndReincarnate(false);
        }}
        onOpenLibrary={actionController.openDecreeLibrary}
        onViewLifeSummary={actionController.viewLifeSummary}
        onOpenApBreakdown={actionController.openApBreakdown}
        onSelectRecommendedDecree={(upgradeId) => {
          setPurchaseError(null);
          setPurchaseSuccessMessage(null);
          actionController.inspectUpgrade(upgradeId);
        }}
      />

      <PrestigeDecreeLibraryDrawer
        open={isLibraryOpen}
        upgrades={visibleUpgrades}
        totalAP={totalAP}
        getCurrentLevel={getCurrentLevel}
        getMaxLevel={getMaxLevel}
        getNextLevelCost={getNextLevelCost}
        checkPrereqs={checkPrereqs}
        onSelectUpgrade={inspectUpgradeFromLibrary}
        onClose={actionController.closeDecreeLibrary}
      />

      <ApBreakdownModal
        open={isApBreakdownOpen}
        breakdown={apBreakdown}
        advisorLabel={advisor.stateLabel}
        advisorDetail={advisor.stateDetail}
        onClose={() => setIsApBreakdownOpen(false)}
      />

      <PrestigeRitualModal
        open={showConfirmation}
        apGain={apGain}
        breakdown={apBreakdown}
        advisorLabel={advisor.stateLabel}
        advisorDetail={advisor.stateDetail}
        resetPreview={advisor.resetPreview}
        canPrestigeNow={canPrestigeNow}
        currentRealm={getLiveRealmNameByIndex(realm?.index || 0)}
        sellBeforePrestige={sellBeforePrestige}
        errorMessage={ritualError}
        onClose={closeRitualModal}
        onConfirm={handleRitualConfirm}
      />

      <PrestigeUpgradeModal
        open={Boolean(selectedUpgradeId)}
        upgradeId={selectedUpgradeId}
        upgradeDef={selectedUpgrade}
        currentLevel={selectedUpgradeLevel}
        nextCost={selectedUpgradeCost}
        totalAP={totalAP}
        locked={selectedUpgradeLocked}
        lockedReason={selectedUpgradePrereq?.reason}
        prereqList={selectedUpgradePrereqs}
        onClose={handleModalClose}
        onPurchase={handleUpgradePurchase}
        purchaseState={{
          errorMessage: purchaseError,
          isPurchasing,
          successMessage: purchaseSuccessMessage,
        }}
      />

      {purchaseToast ? (
        <div className="prestigePurchaseToast" aria-live="polite">
          {purchaseToast}
        </div>
      ) : null}
    </div>
  );
}

export type { PrestigeUpgradeDef };
