import { useEffect, useMemo, useRef, useState } from 'react';
import { useInventoryStore } from '../../stores/inventoryStore.js';
import { getItemDef, useContentStore } from '../../stores/contentStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useHeartLawStore } from '../../stores/heartLawStore.js';
import { usePrestigeStore } from '../../stores/prestigeStore.js';
import { getLiveRealmNameByIndex } from '../../systems/progression/runtime/index.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useCityStore } from '../../stores/cityStore.js';
import { RewardService } from '../../services/rewards/index.js';
import type { PrestigeUpgradeDef } from '../../content/index.js';
import { PRESTIGE_CATEGORIES, buildPrestigeCategorySections, getPrestigeCategoryKey } from '../../features/prestige/prestigeCategories.js';
import { getPrestigeAdvisorSurface } from '../../features/prestige/prestigeAdvisorSurface.js';
import { buildPrestigeLifeSummarySnapshot } from '../../features/prestige/lifeSummarySurface.js';
import type { PrestigeCategoryKey } from '../../features/prestige/prestigeCategories.js';
import { getPrestigeCategoryIcon } from '../../features/prestige/prestigeEdictIconMap.js';
import { PrestigeUpgradePanelCard } from '../prestige/PrestigeUpgradePanelCard.js';
import { PrestigeUpgradeModal } from '../modals/PrestigeUpgradeModal.js';
import { ApBreakdownModal } from '../modals/ApBreakdownModal.js';
import { PrestigeRitualModal } from '../modals/PrestigeRitualModal.js';
import { D } from '../../utils/numbers.js';
import { InkPanel, PaperCard } from '../../ui/ink/index.js';
import { ChromeChip, RibbonStat, TopRibbon } from '../../ui/chrome/index.js';
import { RunCompassCompact } from '../../ui/status/RunCompassCompact.js';
import { formatCityLabel, formatHeartLawLabel, formatPathLabel, formatSpiritRootCompactLabel } from '../../ui/text/playerFacingFormatters.js';
import { useRunCompassSurface } from '../../ui/status/useRunCompassSurface.js';
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
  const lastLifeSummary = usePrestigeStore((state) => state.lastLifeSummary);
  const isContentLoaded = useContentStore((state) => state.isLoaded);
  const getVisiblePrestigeUpgrades = useContentStore((state) => state.getVisiblePrestigeUpgrades);

  const realm = useGameStore((state) => state.realm);
  const selectedPath = useGameStore((state) => state.selectedPath);
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
  const decreesAreaRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const ritualTriggerRef = useRef<HTMLButtonElement | null>(null);
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);
  const setLifeStartWizardContext = useUIStore((state) => state.setLifeStartWizardContext);
  const openLifeSummaryModal = useUIStore((state) => state.openLifeSummaryModal);
  const runCompass = useRunCompassSurface();
  const currentCityId = useCityStore((state) => state.currentCityId);
  const selectedHeartLawId = useHeartLawStore((state) => state.selectedHeartLawId);

  const apGain = calculateAPGain();
  const apBreakdown = getApBreakdown();
  const canPrestigeNow = canPrestige();
  const requirePrestigeConfirm = useUIStore((state) => state.settings.requirePrestigeConfirm);
  const prestigeActionLabel = canPrestigeNow ? 'Begin Reincarnation Ritual' : 'Reincarnation Unavailable';
  const advisor = getPrestigeAdvisorSurface();

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
    const preparedSummary = buildPrestigeLifeSummarySnapshot();

    if (shouldSellAll) {
      sellAllItems();
    }
    const lastHeartLawId = useHeartLawStore.getState().selectedHeartLawId;
    setLifeStartWizardContext(lastHeartLawId ?? null);
    performPrestige(preparedSummary);
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
        const preparedSummary = buildPrestigeLifeSummarySnapshot();
        sellAllItems();
        const lastHeartLawId = useHeartLawStore.getState().selectedHeartLawId;
        setLifeStartWizardContext(lastHeartLawId ?? null);
        performPrestige(preparedSummary);
        setSellBeforePrestige(false);
        return true;
      }
      const preparedSummary = buildPrestigeLifeSummarySnapshot();
      const lastHeartLawId = useHeartLawStore.getState().selectedHeartLawId;
      setLifeStartWizardContext(lastHeartLawId ?? null);
      performPrestige(preparedSummary);
      setSellBeforePrestige(false);
      return true;
    } catch (error) {
      console.warn('[Prestige] Ritual failed', error);
      setRitualError('Ritual failed. Please try again.');
      return false;
    }
  };

  useEffect(() => {
    setHeaderTitles('Prestige', 'Review AP forecast, reset boundaries, and your next reincarnation decision');
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

  const totalAfterRitual = totalAP + advisor.apForecast.potentialGain;
  const pathLabel = formatPathLabel(selectedPath);
  const heartLawLabel = formatHeartLawLabel(selectedHeartLawId);
  const cityLabel = formatCityLabel(currentCityId);
  const spiritRootLabel = formatSpiritRootCompactLabel(spiritRoot ? {
    element: spiritRoot.element,
    grade: spiritRoot.grade,
    purity: spiritRoot.purity,
  } : null);

  return (
    <div className={'prestigeScreenRoot'}>
      <div className={'prestigeScreenBackground'} />

      <div className={'prestigeScreen prestigeScreen--v2'}>
        <div className={'prestigeScreenInner prestigeScreenContent'}>
          <header className={'prestigeTopRibbon'}>
            <div className={'prestigeTopLeft'}>
              <div className={'prestigeScreenTitle'}>Prestige</div>
              <div className={'prestigeScreenDesc'}>
                Review your next outer-loop decision before beginning Reincarnation.
              </div>
            </div>
            <div className={'prestigeTopRight'}>
              <div className={'prestigeTopMetaLine'}>Purchased Upgrades: {purchasedUpgradeCount}</div>
            </div>
          </header>

          <TopRibbon
            surface="tray"
            compact
            className="prestigeContextRibbon"
            chips={<ChromeChip variant="tag" tone={advisor.stateLabel === 'Recommended' ? 'success' : advisor.stateLabel === 'Viable' ? 'ink' : 'warning'} text={advisor.stateLabel} />}
            end={<span>Purchased: {purchasedUpgradeCount}</span>}
          >
            <RibbonStat label="Realm" value={getLiveRealmNameByIndex(realm.index)} truncate />
            <RibbonStat label="Path" value={pathLabel} truncate />
            <RibbonStat label="Spirit Root" value={spiritRootLabel} truncate />
            <RibbonStat label="Heart Law" value={heartLawLabel} truncate />
            <RibbonStat label="City" value={cityLabel} truncate />
          </TopRibbon>

          <main className={'prestigeStage'}>
            <RunCompassCompact surface={runCompass.compact} tone="paper" className="prestigeRunCompassCompact" />

            <PaperCard className="prestigeAdvisorHeader" variant="tray">
              <div>
                <div className="prestigeAdvisorHeader__title">Prestige Advisor</div>
                <div className="prestigeAdvisorHeader__detail">{advisor.stateDetail}</div>
              </div>
              <div className={`prestigeAdvisorHeader__badge prestigeAdvisorHeader__badge--${advisor.stateLabel.toLowerCase().replace(/\s+/g, '-')}`}>
                {advisor.stateLabel}
              </div>
            </PaperCard>

            <PaperCard className="prestigeForecastBlock" variant="tray">
              <div className="prestigeForecastBlock__header">
                <h3>AP Forecast</h3>
                <button type="button" className={'prestigeAltarBreakdownButton'} onClick={() => setIsApBreakdownOpen(true)}>
                  AP breakdown
                </button>
              </div>
              <div className="prestigeForecastBlock__grid">
                <div>
                  <div className="prestigeForecastBlock__label">AP available now</div>
                  <div className={`prestigeForecastBlock__value${apPulse ? ' is-pulse' : ''}`}>{totalAP}</div>
                </div>
                <div>
                  <div className="prestigeForecastBlock__label">Projected gain on Reincarnation</div>
                  <div className="prestigeForecastBlock__value">+{advisor.apForecast.potentialGain}</div>
                </div>
                <div>
                  <div className="prestigeForecastBlock__label">Total AP after ritual</div>
                  <div className="prestigeForecastBlock__value">{totalAfterRitual}</div>
                </div>
              </div>
              <div className="prestigeForecastBlock__rows">
                {advisor.apForecast.breakdown.rows.map((row) => (
                  <div key={row.key} className="prestigeForecastBlock__row">
                    <div>
                      <div>{row.label}</div>
                      {row.hint ? <small>{row.hint}</small> : null}
                    </div>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
              <div className="prestigeForecastBlock__meta">{lifetimeAP} lifetime AP earned • {prestigeCount} reincarnations</div>
            </PaperCard>

            <PaperCard className="prestigeResetContract" variant="tray">
              <div className="prestigeResetContract__column">
                <h4>Resets This Life</h4>
                <ul>
                  {advisor.resetPreview.resetsThisLife.map((line) => (<li key={line}>{line}</li>))}
                </ul>
              </div>
              <div className="prestigeResetContract__column">
                <h4>Carries Forward</h4>
                <ul>
                  {advisor.resetPreview.carriesForward.map((line) => (<li key={line}>{line}</li>))}
                </ul>
              </div>
              <div className="prestigeResetContract__column">
                <h4>Rebuilt Next Life</h4>
                <ul>
                  {advisor.resetPreview.rebuiltNextLife.length > 0
                    ? advisor.resetPreview.rebuiltNextLife.map((line) => (<li key={line}>{line}</li>))
                    : <li>No special rebuilds yet.</li>}
                </ul>
              </div>
            </PaperCard>

            <PaperCard className={'prestigeAltarCard'} variant="tray">
              <header className={'prestigeAltarHeader'}>
                <div className={'prestigeAltarTitle'}>Reincarnation Ritual</div>
                <div className={'prestigeAltarSubtitle'}>
                  Reincarnation resets this life and converts progress into permanent Ascension leverage.
                </div>
              </header>

              <div className={'prestigeAltarMetaRow'}>
                <div className={'prestigeAltarApBadge'}>
                  <div className={`prestigeAltarApValue${apPulse ? ' is-pulse' : ''}`}>{totalAP}</div>
                  <div className={'prestigeAltarApLabel'}>Ascension Points Available</div>
                  <div className={'prestigeAltarApMeta'}>
                    Current realm: {getLiveRealmNameByIndex(realm?.index || 0)} • Potential gain: +{apGain} AP
                  </div>
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
              <div className={'prestigeAltarLockHint'}>{advisor.stateLabel}: {advisor.stateDetail}</div>
            </div>
            <div className={'prestigeAltarActionRow'}>
              <div className={'prestigeAltarButtons'}>
                <button type="button" className="prestigeAltarSecondaryButton is-ready" onClick={() => openLifeSummaryModal('current')}>
                  View Current Life Summary
                </button>
                {lastLifeSummary ? (
                  <button type="button" className="prestigeAltarSecondaryButton is-ready" onClick={() => openLifeSummaryModal('last_completed')}>
                    View Last Life Summary
                  </button>
                ) : null}
              </div>
            </div>
            </PaperCard>

            {advisor.topRecommendedPurchase ? (
              <PaperCard className="prestigeRecommendationStrip" variant="tray">
                <div className="prestigeRecommendationStrip__head">Top recommended decree</div>
                <div className="prestigeRecommendationStrip__body">
                  <div>
                    <strong>{advisor.topRecommendedPurchase.name}</strong>
                    <div>{advisor.topRecommendedPurchase.categoryLabel}</div>
                  </div>
                  <div>
                    <div>Cost: {advisor.topRecommendedPurchase.nextCost} AP</div>
                    <div>{advisor.topRecommendedPurchase.affordabilityLabel}</div>
                  </div>
                  <div>{advisor.topRecommendedPurchase.reasonLine}</div>
                </div>
              </PaperCard>
            ) : null}

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

          {purchaseToast && (
            <div className="prestigePurchaseToast" aria-live="polite">
              {purchaseToast}
            </div>
          )}

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
