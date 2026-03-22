import { useEffect, useMemo, useRef, useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { getItemDef, useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useHeartLawStore } from '../../stores/heartLawStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { getLiveRealmNameByIndex } from '../../systems/progression/runtime/index.js';
import { useUIStore } from '../../stores/uiStore.js';
import { RewardService } from '../../services/rewards/index.js';
import type { PrestigeUpgradeDef } from '../../content/index.js';
import { PRESTIGE_CATEGORIES, buildPrestigeCategorySections } from '../../features/prestige/prestigeCategories.js';
import type { PrestigeCategoryKey } from '../../features/prestige/prestigeCategories.js';
import { getPrestigeCategoryIcon } from '../../features/prestige/prestigeEdictIconMap.js';
import { PrestigeUpgradePanelCard } from '../prestige/PrestigeUpgradePanelCard.js';
import { PrestigeUpgradeModal } from '../modals/PrestigeUpgradeModal.js';
import { ApBreakdownModal } from '../modals/ApBreakdownModal.js';
import { PrestigeRitualModal } from '../modals/PrestigeRitualModal.js';
import { D } from '../../utils/numbers.js';
import { InkPanel, PaperCard } from '../../ui/ink/index.js';
import { GameIcon } from '../../ui/icons/index.js';
import './PrestigeScreen.scss';

export function PrestigeScreen() {
  const totalAP = usePrestigeStore((state) => state.totalAP);
  const lifetimeAP = usePrestigeStore((state) => state.lifetimeAP);
  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);
  const prestigeRuns = usePrestigeStore((state) => state.prestigeRuns);
  const calculateAPGain = usePrestigeStore((state) => state.calculateAPGain);
  const canPrestige = usePrestigeStore((state) => state.canPrestige);
  const performPrestige = usePrestigeStore((state) => state.performPrestige);
  const purchaseUpgrade = usePrestigeStore((state) => state.purchaseUpgrade);
  const getCurrentLevel = usePrestigeStore((state) => state.getCurrentLevel);
  const getMaxLevel = usePrestigeStore((state) => state.getMaxLevel);
  const getNextLevelCost = usePrestigeStore((state) => state.getNextLevelCost);
  const checkPrereqs = usePrestigeStore((state) => state.checkPrereqs);
  const getApBreakdown = usePrestigeStore((state) => state.getApBreakdown);
  const isContentLoaded = useContentStore((state) => state.isLoaded);
  const getVisiblePrestigeUpgrades = useContentStore((state) => state.getVisiblePrestigeUpgrades);

  const realm = useGameStore((state) => state.realm);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sellBeforePrestige, setSellBeforePrestige] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [flashUpgradeId, setFlashUpgradeId] = useState<string | null>(null);
  const [apPulse, setApPulse] = useState(false);
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);
  const [isApBreakdownOpen, setIsApBreakdownOpen] = useState(false);
  const [ritualError, setRitualError] = useState<string | null>(null);
  const [showBenefitDetails, setShowBenefitDetails] = useState(false);
  const decreesAreaRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const ritualTriggerRef = useRef<HTMLButtonElement | null>(null);
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const setLifeStartWizardContext = useUIStore((state) => state.setLifeStartWizardContext);

  const apGain = calculateAPGain();
  const apBreakdown = getApBreakdown();
  const canPrestigeNow = canPrestige();
  const requirePrestigeConfirm = useUIStore((state) => state.settings.requirePrestigeConfirm);
  const prestigeLockHint = canPrestigeNow
    ? 'You are ready to reincarnate.'
    : 'Reach Foundation Establishment to unlock Reincarnation.';
  const prestigeActionLabel = canPrestigeNow ? 'Begin Reincarnation Ritual' : 'Reincarnation Sealed';
  const keepBenefits = ['Keep all Ascension Points', 'Keep all AP upgrades', 'Receive a fresh spirit root'];
  const resetCosts = ['Reset cultivation progress', 'Reset inventory & gold'];
  const visibleKeepBenefits = showBenefitDetails ? keepBenefits : keepBenefits.slice(0, 2);
  const visibleResetCosts = showBenefitDetails ? resetCosts : resetCosts.slice(0, 1);

  const sellAllItems = () => {
    const inventory = useInventoryStore.getState();
    const items = inventory.items;
    let totalGold = D(0);

    Object.entries(items).forEach(([itemId, qty]) => {
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
  };

  const handlePrestige = (shouldSellAll = false) => {
    if (!canPrestigeNow) return;
    setSellBeforePrestige(shouldSellAll);

    if (requirePrestigeConfirm) {
      setRitualError(null);
      setShowConfirmation(true);
      return;
    }

    if (shouldSellAll) {
      sellAllItems();
    }
    const lastHeartLawId = useHeartLawStore.getState().selectedHeartLawId;
    setLifeStartWizardContext(lastHeartLawId ?? null);
    performPrestige();
  };

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
      if (sellBeforePrestige) {
        sellAllItems();
      }
      const lastHeartLawId = useHeartLawStore.getState().selectedHeartLawId;
      setLifeStartWizardContext(lastHeartLawId ?? null);
      performPrestige();
      setSellBeforePrestige(false);
      return true;
    } catch (error) {
      console.warn('[Prestige] Ritual failed', error);
      setRitualError('Ritual failed. Please try again.');
      return false;
    }
  };

  useEffect(() => {
    setHeaderTitles('Reincarnation', 'Restart your cultivation journey with powerful blessings');
  }, [setHeaderTitles]);

  const upgradeList = useMemo(() => {
    if (!isContentLoaded) return [];
    return getVisiblePrestigeUpgrades();
  }, [getVisiblePrestigeUpgrades, isContentLoaded]);

  const categorizedUpgrades = useMemo(() => {
    return buildPrestigeCategorySections(upgradeList);
  }, [upgradeList]);

  const categoryLabelMap = useMemo(() => {
    const map = new Map<PrestigeCategoryKey, string>();
    PRESTIGE_CATEGORIES.forEach((category) => {
      map.set(category.key, category.title);
    });
    return map;
  }, []);

  useEffect(() => {
    const scrollContainer = decreesAreaRef.current;
    if (!scrollContainer || categorizedUpgrades.length === 0) return;

    const hasActiveCategory = activeCategory
      ? categorizedUpgrades.some((section) => section.category.key === activeCategory)
      : false;

    if (!hasActiveCategory) {
      setActiveCategory(categorizedUpgrades[0]?.category.key ?? null);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top) return;
        const key = top.target.getAttribute('data-category-key');
        if (key) {
          setActiveCategory(key);
        }
      },
      {
        root: scrollContainer,
        rootMargin: '0px 0px -60% 0px',
        threshold: [0.2, 0.4, 0.6],
      },
    );

    categorizedUpgrades.forEach((section) => {
      const target = document.getElementById(`prestige-category-${section.category.key}`);
      if (target) observer.observe(target);
    });

    return () => observer.disconnect();
  }, [activeCategory, categorizedUpgrades]);

  const purchasedUpgradeCount = useMemo(() => {
    return upgradeList.reduce((count, upgrade) => {
      return count + (getCurrentLevel(upgrade.id) > 0 ? 1 : 0);
    }, 0);
  }, [getCurrentLevel, upgradeList]);

  const selectedUpgrade = useMemo(() => {
    if (!selectedUpgradeId) return null;
    return upgradeList.find((upgrade) => upgrade.id === selectedUpgradeId) ?? null;
  }, [selectedUpgradeId, upgradeList]);

  const missingUpgradeMessage = 'This decree is no longer available.';
  const isMissingUpgrade = Boolean(selectedUpgradeId && !selectedUpgrade);

  useEffect(() => {
    if (!isMissingUpgrade) return;
    setPurchaseError(missingUpgradeMessage);
    setPurchaseSuccessMessage(null);
  }, [isMissingUpgrade, missingUpgradeMessage]);

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
    upgradeList.forEach((upgrade) => {
      nameMap.set(upgrade.id, upgrade.name);
    });
    return selectedUpgrade.prereq.map((prereq) => ({
      id: prereq.upgradeId,
      name: nameMap.get(prereq.upgradeId) ?? prereq.upgradeId,
      requiredLevel: prereq.minLevel,
      currentLevel: getCurrentLevel(prereq.upgradeId),
    }));
  }, [getCurrentLevel, selectedUpgrade, upgradeList]);

  const resolvePurchaseError = (reason?: string) => {
    if (!reason) return 'Purchase failed.';
    if (reason.toLowerCase().includes('not enough')) return 'Not enough Ascension Points.';
    if (reason.toLowerCase().includes('already maxed')) return 'Max level reached.';
    if (reason.toLowerCase().includes('requires')) return `Locked: ${reason.replace('Requires', '').trim()}`;
    return reason;
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
      const upgradeName = selectedUpgrade?.name ?? 'Decree';
      setFlashUpgradeId(selectedUpgradeId);
      setApPulse(true);
      setPurchaseSuccessMessage(`Decree Inscribed — ${upgradeName} is now Lv ${newLevel}`);
      setPurchaseToast(`Purchased: ${upgradeName} Lv ${newLevel}`);
      window.setTimeout(() => setFlashUpgradeId(null), 450);
      window.setTimeout(() => setApPulse(false), 450);
      window.setTimeout(() => setPurchaseToast(null), 2000);
    }
    setIsPurchasing(false);
  };

  const handleModalClose = () => {
    setSelectedUpgradeId(null);
    setPurchaseError(null);
    setPurchaseSuccessMessage(null);
    requestAnimationFrame(() => {
      lastFocusedRef.current?.focus();
    });
  };

  const scrollToCategory = (key: string) => {
    const target = document.getElementById(`prestige-category-${key}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderUpgradePanel = (upgrade: PrestigeUpgradeDef) => {
    const currentLevel = getCurrentLevel(upgrade.id);
    const maxLevel = getMaxLevel(upgrade.id);
    const isMaxed = currentLevel >= maxLevel;
    const nextCost = getNextLevelCost(upgrade.id);
    const prereqCheck = checkPrereqs(upgrade.id);
    const isLocked = !prereqCheck.ok;
    const costLabel = nextCost === null ? 'Maxed' : `${nextCost} AP`;
    const categoryKey = getPrestigeCategoryKey(upgrade.id);
    const categoryMeta = getPrestigeCategoryIcon(categoryKey);
    const categoryLabel = categoryLabelMap.get(categoryKey) ?? 'Decree';

    return (
      <PrestigeUpgradePanelCard
        key={upgrade.id}
        upgrade={upgrade}
        level={currentLevel}
        maxLevel={maxLevel}
        costLabel={costLabel}
        locked={isLocked}
        isPurchasing={isPurchasing}
        isMaxed={isMaxed}
        isSelected={selectedUpgradeId === upgrade.id}
        isFlash={flashUpgradeId === upgrade.id}
        categoryLabel={categoryLabel}
        CategoryIcon={categoryMeta.Icon}
        onSelect={(event) => {
          lastFocusedRef.current = event.currentTarget;
          setPurchaseError(null);
          setPurchaseSuccessMessage(null);
          setSelectedUpgradeId(upgrade.id);
        }}
        lockedReason={prereqCheck.reason}
      />
    );
  };

  return (
    <div className={'prestigeScreenRoot'}>
      <div className={'prestigeScreenBackground'} />

      <div className={'prestigeScreen prestigeScreen--v2'}>
        <div className={'prestigeScreenInner prestigeScreenContent'}>
          <header className={'prestigeTopRibbon'}>
            <div className={'prestigeTopLeft'}>
              <div className={'prestigeScreenTitle'}>Prestige</div>
              <div className={'prestigeScreenDesc'}>
                Restart your cultivation journey with powerful blessings.
              </div>
            </div>
            <div className={'prestigeTopRight'}>
              <div className={'prestigeTopMetaLine'}>Purchased Upgrades: {purchasedUpgradeCount}</div>
            </div>
          </header>

          <main className={'prestigeStage'}>
            <section className={'prestigeRitualStage'}>
              <InkPanel variant="prestige" className="prestigeRitualDocument" watermark>
                <div className="prestigeRitualGrid">
                  <div className={'prestigeRitualLeft'}>
                    <PaperCard className={'prestigeAltarCard'} variant="tray">
                      <header className={'prestigeAltarHeader'}>
                        <div className={'prestigeAltarTitle'}>Reincarnate &amp; Grow Stronger</div>
                        <div className={'prestigeAltarSubtitle'}>
                          Reincarnation grants Ascension Points to unlock permanent blessings.
                        </div>
                      </header>

                      <div className={'prestigeAltarSealArea'} aria-hidden="true">
                        <div className={'prestigeAltarSeal'} />
                      </div>

                      <div className={'prestigeAltarMetaRow'}>
                        <div className={'prestigeAltarApBadge'}>
                          <div className={`prestigeAltarApValue${apPulse ? ' is-pulse' : ''}`}>{totalAP}</div>
                          <div className={'prestigeAltarApLabel'}>Ascension Points Available</div>
                          <div className={'prestigeAltarApMeta'}>
                            {lifetimeAP} Total Earned • {prestigeCount} Reincarnations
                          </div>
                        </div>
                        <div className={'prestigeAltarMetaActions'}>
                          <div className={'prestigeAltarMetaText'}>Purchased Upgrades: {purchasedUpgradeCount}</div>
                        </div>
                      </div>

                      <div className={'prestigeAltarActionRow'}>
                        <div className={'prestigeAltarButtons'}>
                          <button
                            type="button"
                            onClick={(event) => {
                              ritualTriggerRef.current = event.currentTarget;
                              handlePrestige(false);
                            }}
                            disabled={!canPrestigeNow}
                            className={`prestigeAltarPrimaryButton${canPrestigeNow ? ' is-ready' : ' is-locked'}`}
                          >
                            {prestigeActionLabel}
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              ritualTriggerRef.current = event.currentTarget;
                              handlePrestige(true);
                            }}
                            disabled={!canPrestigeNow}
                            className={`prestigeAltarSecondaryButton${canPrestigeNow ? ' is-ready' : ' is-locked'}`}
                          >
                            Sell All &amp; Reincarnate
                          </button>
                        </div>
                        <div className={'prestigeAltarLockHint'}>{prestigeLockHint}</div>
                      </div>

                      <div className={'prestigeAltarMicrocopy'}>
                        Keep blessings. Reset the mortal coil. Return stronger.
                      </div>
                    </PaperCard>
                  </div>

                  <aside className={'prestigeRitualRight'}>
                    <InkPanel variant="prestige" className="prestigeRitualSidebar">
                      <div className={'prestigeRitualSidebarHeader'}>
                        <div className={'prestigeRitualSidebarTitle'}>Ritual Details</div>
                        <button
                          type="button"
                          className={'prestigeAltarBreakdownButton'}
                          onClick={() => setIsApBreakdownOpen(true)}
                        >
                          AP breakdown
                        </button>
                      </div>
                      <div className={'prestigeScreenInfoGrid'}>
                        <PaperCard className={'prestigeScreenInfoCard'} variant="tray">
                          <h3 className={'prestigeScreenInfoTitle'}>Current Run</h3>
                          <div className={'prestigeScreenInfoRows'}>
                            <div className={'prestigeScreenInfoRow'}>
                              <span className={'prestigeScreenInfoLabel'}>Current Realm:</span>
                              <span className={'prestigeScreenInfoValue'}>
                                {getLiveRealmNameByIndex(realm?.index || 0)}
                              </span>
                            </div>
                            <div className={'prestigeScreenInfoRow'}>
                              <span className={'prestigeScreenInfoLabel'}>Potential AP Gain:</span>
                              <span className={'prestigeScreenInfoValueAccent'}>+{apGain} AP</span>
                            </div>
                          </div>
                        </PaperCard>

                        <PaperCard className={'prestigeScreenInfoCard'} variant="tray">
                          <h3 className={'prestigeScreenInfoTitle'}>Reincarnation Benefits</h3>
                          <div className={'prestigeScreenBenefitsGroups'}>
                            <div className={'prestigeScreenBenefitsGroup'}>
                              <div className={'prestigeScreenBenefitsLabel'}>Keeps</div>
                              <ul className={'prestigeScreenBenefitsList'}>
                                {visibleKeepBenefits.map((benefit) => (
                                  <li key={benefit}>
                                    <GameIcon icon="inkCheck" size={12} decorative />
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className={'prestigeScreenBenefitsGroup'}>
                              <div className={'prestigeScreenBenefitsLabel'}>Resets</div>
                              <ul className={'prestigeScreenBenefitsList is-warning'}>
                                {visibleResetCosts.map((cost) => (
                                  <li key={cost}>
                                    <GameIcon icon="inkX" size={12} decorative />
                                    <span>{cost}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={'prestigeScreenBenefitsToggle'}
                            onClick={() => setShowBenefitDetails((value) => !value)}
                          >
                            {showBenefitDetails ? 'Hide full benefits' : 'View full benefits'}
                          </button>
                        </PaperCard>
                      </div>
                    </InkPanel>
                  </aside>
                </div>
              </InkPanel>
            </section>

            <section className={'prestigeDecreesPanel worldScreenPanel'}>
              <InkPanel variant="prestige" className="prestigeDecreesDocument" watermark>
                <div className={'prestigeDecreesHeader'}>
                  <div className={'prestigeDecreesTitle'}>Heavenly Decrees</div>
                  <div className={'prestigeDecreesSub'}>
                    Spend Ascension Points to permanently improve future lives.
                  </div>
                </div>

                <PaperCard className="prestigeDecreesArea" variant="tray">
                  <div className="prestigeDecreesScroll" ref={decreesAreaRef}>
                    <nav className={'prestigeDecreesCategoryBar'} aria-label="Prestige categories">
                      {categorizedUpgrades.map((section) => {
                        const iconMeta = getPrestigeCategoryIcon(section.category.key);
                        const isActive = activeCategory === section.category.key;
                        return (
                          <button
                            key={section.category.key}
                            type="button"
                            className={isActive ? 'is-active' : undefined}
                            onClick={() => scrollToCategory(section.category.key)}
                          >
                            <iconMeta.Icon aria-hidden="true" />
                            <span>{section.category.title}</span>
                          </button>
                        );
                      })}
                    </nav>
                    <div className={'prestigeDecreesList'}>
                      {categorizedUpgrades.length === 0 && (
                        <div className={'prestigeDecreesEmpty'}>No decrees available at this stage.</div>
                      )}
                      {categorizedUpgrades.map((section) => (
                        <section
                          key={section.category.key}
                          id={`prestige-category-${section.category.key}`}
                          data-category-key={section.category.key}
                          className={'prestigeDecreeSection'}
                        >
                          <header className={'prestigeDecreeHeader'}>
                            <div className={'prestigeDecreeTitle'}>{section.category.title}</div>
                            <div className={'prestigeDecreeSubtitle'}>{section.category.subtitle}</div>
                          </header>
                          <div className={'prestigeDecreesGrid'}>
                            {section.upgrades.map((upgrade) => renderUpgradePanel(upgrade))}
                          </div>
                        </section>
                      ))}
                    </div>
                  </div>
                </PaperCard>
              </InkPanel>
            </section>
          </main>

          <ApBreakdownModal
            open={isApBreakdownOpen}
            breakdown={apBreakdown}
            isSealed={!canPrestigeNow}
            onClose={() => setIsApBreakdownOpen(false)}
          />

          <PrestigeRitualModal
            open={showConfirmation}
            apGain={apGain}
            breakdown={apBreakdown}
            canPrestigeNow={canPrestigeNow}
            lockReason={prestigeLockHint}
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

          {purchaseToast && (
            <div className="prestigePurchaseToast" aria-live="polite">
              {purchaseToast}
            </div>
          )}

          {/* Prestige History */}
          {prestigeRuns.length > 0 && (
            <details className={'prestigeScreenHistory'}>
              <summary className={'prestigeScreenHistorySummary'}>
                Reincarnation History ({prestigeRuns.length} runs)
              </summary>
              <div className={'prestigeScreenHistoryList'}>
                {prestigeRuns
                  .slice()
                  .reverse()
                  .map((run) => (
                    <div key={run.runNumber} className={'prestigeScreenHistoryRow'}>
                      <div>
                        <span className={'prestigeScreenInfoValue'}>Run #{run.runNumber}</span>
                        <span className={'prestigeScreenInfoLabelMuted'}>{getLiveRealmNameByIndex(run.realmReached)}</span>
                      </div>
                      <div className={'prestigeScreenHistoryGain'}>
                        <span className={'prestigeScreenInfoValueAccent'}>+{run.apGained} AP</span>
                        <span className={'prestigeScreenInfoLabelMuted'}>{Math.floor(run.timeSpent / 60)}m</span>
                      </div>
                    </div>
                  ))}
              </div>
            </details>
          )}

        </div>
      </div>
    </div>
  );
}
