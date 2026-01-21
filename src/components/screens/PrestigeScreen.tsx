import { useEffect, useMemo, useRef, useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore';
import { getItemDef, useContentStore } from '../../stores/contentStore';
import { useGameStore } from '../../stores/gameStore';
import { useHeartLawStore } from '../../stores/heartLawStore';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useUIStore } from '../../stores/uiStore';
import { RewardService } from '../../services/rewards';
import type { PrestigeUpgradeDef } from '../../content';
import { PRESTIGE_CATEGORIES, getPrestigeCategoryKey } from '../../features/prestige/prestigeCategories';
import type { PrestigeCategoryKey } from '../../features/prestige/prestigeCategories';
import { getPrestigeCategoryIcon } from '../../features/prestige/prestigeEdictIconMap';
import { PrestigeUpgradePanelCard } from '../prestige/PrestigeUpgradePanelCard';
import { PrestigeUpgradeModal } from '../modals/PrestigeUpgradeModal';
import { D } from '../../utils/numbers';
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
  const isContentLoaded = useContentStore((state) => state.isLoaded);
  const getPrestigeUpgrades = useContentStore((state) => state.getPrestigeUpgrades);

  const realm = useGameStore((state) => state.realm);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sellBeforePrestige, setSellBeforePrestige] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedUpgradeId, setSelectedUpgradeId] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const decreesAreaRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const setLifeStartWizardContext = useUIStore((state) => state.setLifeStartWizardContext);

  const apGain = calculateAPGain();
  const canPrestigeNow = canPrestige();
  const requirePrestigeConfirm = useUIStore((state) => state.settings.requirePrestigeConfirm);

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

  const confirmPrestige = () => {
    if (sellBeforePrestige) {
      sellAllItems();
    }
    const lastHeartLawId = useHeartLawStore.getState().selectedHeartLawId;
    setLifeStartWizardContext(lastHeartLawId ?? null);
    performPrestige();
    setShowConfirmation(false);
    setSellBeforePrestige(false);
  };

  useEffect(() => {
    setHeaderTitles('Reincarnation', 'Restart your cultivation journey with powerful blessings');
  }, [setHeaderTitles]);

  const upgradeList = useMemo(() => {
    if (!isContentLoaded) return [];
    return getPrestigeUpgrades();
  }, [getPrestigeUpgrades, isContentLoaded]);

  const categorizedUpgrades = useMemo(() => {
    const buckets = new Map<ReturnType<typeof getPrestigeCategoryKey>, PrestigeUpgradeDef[]>();
    upgradeList.forEach((upgrade) => {
      const key = getPrestigeCategoryKey(upgrade.id);
      const list = buckets.get(key) ?? [];
      list.push(upgrade);
      buckets.set(key, list);
    });

    return PRESTIGE_CATEGORIES
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((category) => ({
        category,
        upgrades: buckets.get(category.key) ?? [],
      }))
      .filter((section) => section.upgrades.length > 0);
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

    if (!activeCategory) {
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

  const selectedUpgradeLevel = selectedUpgradeId ? getCurrentLevel(selectedUpgradeId) : 0;
  const selectedUpgradeCost = selectedUpgradeId ? getNextLevelCost(selectedUpgradeId) : null;
  const selectedUpgradePrereq = selectedUpgradeId ? checkPrereqs(selectedUpgradeId) : { ok: true };
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

  const handleUpgradePurchase = () => {
    if (!selectedUpgradeId) return;
    setIsPurchasing(true);
    const result = purchaseUpgrade(selectedUpgradeId);
    if (!result.ok) {
      setPurchaseError(result.reason ?? 'Purchase failed');
    } else {
      setPurchaseError(null);
    }
    setIsPurchasing(false);
  };

  const handleModalClose = () => {
    setSelectedUpgradeId(null);
    setPurchaseError(null);
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
        categoryLabel={categoryLabel}
        CategoryIcon={categoryMeta.Icon}
        onSelect={(event) => {
          lastFocusedRef.current = event.currentTarget;
          setPurchaseError(null);
          setSelectedUpgradeId(upgrade.id);
        }}
        lockedReason={prereqCheck.reason}
      />
    );
  };

  const realmNames = [
    'Qi Refining',
    'Foundation Establishment',
    'Core Formation',
    'Nascent Soul',
    'Soul Formation',
    'Void Tribulation',
    'Mahayana',
    'True Immortal',
  ];

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
            <div className={'prestigeTopCenter'}>
              <div className={'prestigeSystemPill prestigeScreenApCard'}>
                <div className={'prestigeScreenApValue'}>{totalAP}</div>
                <div className={'prestigeScreenApLabel'}>Ascension Points Available</div>
                <div className={'prestigeScreenApMeta'}>
                  {lifetimeAP} Total Earned • {prestigeCount} Reincarnations
                </div>
              </div>
            </div>
            <div className={'prestigeTopRight'}>
              <div className={'prestigeTopMetaLine'}>Unspent Ascension Points: {totalAP}</div>
              <div className={'prestigeTopMetaLine'}>Purchased Upgrades: {purchasedUpgradeCount}</div>
            </div>
          </header>

          <main className={'prestigeStage'}>
            <section className={'prestigeHeroGrid'}>
              <div className={'prestigeHeroPanel prestigeHeroPanel--ritual'}>
                {/* Prestige Action */}
                <div className={'prestigeScreenPrestigeSection'}>
                  <h2 className={'prestigeScreenPrestigeTitle'}>Reincarnate &amp; Grow Stronger</h2>
                  <p className={'prestigeScreenPrestigeText'}>
                    Each reincarnation grants Ascension Points to unlock permanent upgrades. You'll return to the mortal realm but
                    with newfound power and potential.
                  </p>
                  <div className={'prestigeScreenPrestigeActions'}>
                    <button
                      onClick={() => handlePrestige(false)}
                      disabled={!canPrestigeNow}
                      className={`${'button-standard'} ${'prestigeScreenPrestigeButton'} ${
                        canPrestigeNow ? 'prestigeScreenPrestigeReady' : 'prestigeScreenPrestigeLocked'
                      }`}
                    >
                      {canPrestigeNow ? 'Reincarnate Now' : 'Not Ready Yet'}
                    </button>
                    <button
                      onClick={() => handlePrestige(true)}
                      disabled={!canPrestigeNow}
                      className={`${'button-standard'} ${'prestigeScreenPrestigeButton'} ${
                        canPrestigeNow ? 'prestigeScreenPrestigeReady' : 'prestigeScreenPrestigeLocked'
                      }`}
                    >
                      {canPrestigeNow ? 'Sell All & Reincarnate' : 'Not Ready Yet'}
                    </button>
                  </div>
                  {!canPrestigeNow && (
                    <p className={'prestigeScreenPrestigeHint'}>Reach Foundation Establishment to unlock Reincarnation.</p>
                  )}
                </div>
              </div>

              <div className={'prestigeHeroPanel prestigeHeroPanel--root'}>
                {/* Current Run & Benefits */}
                <div className={'prestigeScreenInfoGrid'}>
                  <div className={'prestigeScreenInfoCard'}>
                    <h3 className={'prestigeScreenInfoTitle'}>Current Run</h3>
                    <div className={'prestigeScreenInfoRows'}>
                      <div className={'prestigeScreenInfoRow'}>
                        <span className={'prestigeScreenInfoLabel'}>Current Realm:</span>
                        <span className={'prestigeScreenInfoValue'}>{realmNames[realm?.index || 0] || 'Unknown'}</span>
                      </div>
                      <div className={'prestigeScreenInfoRow'}>
                        <span className={'prestigeScreenInfoLabel'}>Potential AP Gain:</span>
                        <span className={'prestigeScreenInfoValueAccent'}>+{apGain} AP</span>
                      </div>
                    </div>
                  </div>

                  <div className={'prestigeScreenInfoCard'}>
                    <h3 className={'prestigeScreenInfoTitle'}>Reincarnation Benefits</h3>
                    <ul className={'prestigeScreenBenefitsList'}>
                      <li>✓ Keep all Ascension Points</li>
                      <li>✓ Keep all AP upgrades</li>
                      <li>✓ Keep spirit root floor level</li>
                      <li>✓ Unlock new content faster</li>
                      <li>✗ Reset cultivation progress</li>
                      <li>✗ Reset inventory & gold</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className={'prestigeDecreesPanel worldScreenPanel'}>
              <div className={'prestigeDecreesHeader'}>
                <div className={'prestigeDecreesTitle'}>Heavenly Decrees</div>
                <div className={'prestigeDecreesSub'}>
                  Spend Ascension Points to permanently improve future lives.
                </div>
              </div>

              <div className={'prestigeDecreesArea'} ref={decreesAreaRef}>
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
            </section>
          </main>

          <PrestigeUpgradeModal
            open={Boolean(selectedUpgrade)}
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
            purchaseState={{ errorMessage: purchaseError, isPurchasing }}
          />

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
                        <span className={'prestigeScreenInfoLabelMuted'}>{realmNames[run.realmReached]}</span>
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

          {/* Confirmation Modal */}
          {showConfirmation && (
            <div className={'prestigeScreenModalOverlay'}>
              <div className={'prestigeScreenModalCard'}>
                <h2 className={'prestigeScreenModalTitle'}>Confirm Reincarnation</h2>
                <p className={'prestigeScreenModalText'}>
                  Are you sure you want to reincarnate? This will reset your cultivation progress, but you'll gain{' '}
                  <strong className={'prestigeScreenModalHighlight'}>{apGain} AP</strong> to purchase permanent upgrades.
                </p>
                {sellBeforePrestige && (
                  <p className={'prestigeScreenModalText'}>
                    All inventory items will be sold for gold before the reset.
                  </p>
                )}
                <div className={'prestigeScreenModalActions'}>
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setSellBeforePrestige(false);
                    }}
                    className={`${'button-standard'} ${'prestigeScreenModalButton'} ${'prestigeScreenModalCancel'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPrestige}
                    className={`${'button-standard'} ${'prestigeScreenModalButton'} ${'prestigeScreenModalConfirm'}`}
                  >
                    Reincarnate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
