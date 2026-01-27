import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { PrestigeUpgradeDef } from '../../content';
import { getPrestigeCategoryIcon } from '../../features/prestige/prestigeEdictIconMap';
import { getPrestigeCategoryKey } from '../../features/prestige/prestigeCategories';
import { GameIcon } from '../../ui/icons';

interface PrestigeUpgradeModalProps {
  open: boolean;
  upgradeId: string | null;
  upgradeDef: PrestigeUpgradeDef | null;
  currentLevel: number;
  nextCost: number | null;
  totalAP: number;
  locked: boolean;
  lockedReason?: string;
  prereqList: Array<{ id: string; name: string; requiredLevel: number; currentLevel: number }>;
  onClose: () => void;
  onPurchase: () => void;
  purchaseState: {
    errorMessage?: string | null;
    isPurchasing?: boolean;
    successMessage?: string | null;
  };
}

const formatLineValue = (value: unknown) => {
  if (value == null) return '—';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map((entry) => formatLineValue(entry)).join(', ');
  return JSON.stringify(value, null, 2);
};

const formatEffectLines = (effect: unknown): string[] => {
  if (!effect) return [];
  if (typeof effect !== 'object') return [formatLineValue(effect)];
  const entries = Object.entries(effect as Record<string, unknown>);
  if (entries.length === 0) return [];
  return entries.map(([key, value]) => `${key}: ${formatLineValue(value)}`);
};

const formatMultiplierLine = (value: number, stat?: string) => {
  const percentage = value * 100;
  const sign = percentage >= 0 ? '+' : '';
  const statLabel = stat ? ` ${stat}` : '';
  return `${sign}${percentage.toFixed(0)}%${statLabel}`;
};

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(','))).filter(
    (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'),
  );
};

export function PrestigeUpgradeModal({
  open,
  upgradeId,
  upgradeDef,
  currentLevel,
  nextCost,
  totalAP,
  locked,
  lockedReason,
  prereqList,
  onClose,
  onPurchase,
  purchaseState,
}: PrestigeUpgradeModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });

  const isMaxed = upgradeDef ? currentLevel >= upgradeDef.maxLevel : false;
  const canAfford = nextCost !== null && totalAP >= nextCost;
  const categoryKey = upgradeDef ? getPrestigeCategoryKey(upgradeDef.id) : null;
  const categoryIcon = categoryKey ? getPrestigeCategoryIcon(categoryKey) : null;

  const sections = useMemo(() => {
    if (!upgradeDef) {
      return [
        {
          id: 'missing',
          title: 'Overview',
          content: <div className="prestigeUpgradeModalEmpty">Upgrade data unavailable.</div>,
        },
      ] as Array<{ id: string; title: string; content: ReactNode }>;
    }
    const description = upgradeDef.description ?? 'A decree etched into the cycle of reincarnation.';

    const currentEffectLines: string[] = [];
    const nextEffectLines: string[] = [];

    if (upgradeDef.type === 'multiplier' && typeof upgradeDef.effectPerLevel === 'number') {
      const perLevel = upgradeDef.effectPerLevel;
      if (currentLevel > 0) {
        currentEffectLines.push(formatMultiplierLine(perLevel * currentLevel, upgradeDef.stat));
      }
      if (!isMaxed) {
        nextEffectLines.push(formatMultiplierLine(perLevel * (currentLevel + 1), upgradeDef.stat));
      }
    } else if (upgradeDef.effectPerLevel) {
      const effectLines = formatEffectLines(upgradeDef.effectPerLevel);
      currentEffectLines.push(...effectLines);
      if (!isMaxed) {
        nextEffectLines.push(...effectLines);
      }
    } else if (upgradeDef.effect) {
      const effectLines = formatEffectLines(upgradeDef.effect);
      currentEffectLines.push(...effectLines);
      if (!isMaxed) {
        nextEffectLines.push(...effectLines);
      }
    }

    const currentContent = currentEffectLines.length ? (
      <ul className="prestigeUpgradeModalList">
        {currentEffectLines.map((line, index) => (
          <li key={`current-${index}`}>{line}</li>
        ))}
      </ul>
    ) : (
      <div className="prestigeUpgradeModalEmpty">No effect data available yet.</div>
    );

    const nextContent = isMaxed ? (
      <div className="prestigeUpgradeModalEmpty">This decree is fully inscribed.</div>
    ) : nextEffectLines.length ? (
      <ul className="prestigeUpgradeModalList">
        {nextEffectLines.map((line, index) => (
          <li key={`next-${index}`}>{line}</li>
        ))}
      </ul>
    ) : (
      <div className="prestigeUpgradeModalEmpty">No effect data available yet.</div>
    );

    return [
      {
        id: 'overview',
        title: 'Overview',
        content: (
          <div className="prestigeUpgradeModalOverview">
            <p>{description}</p>
          </div>
        ),
      },
      {
        id: 'effects',
        title: 'Effects',
        content: (
          <div className="prestigeUpgradeModalEffects">
            <div>
              <div className="prestigeUpgradeModalSubheading">Current Effect</div>
              {currentContent}
            </div>
            <div>
              <div className="prestigeUpgradeModalSubheading">Next Level</div>
              {nextContent}
            </div>
          </div>
        ),
      },
      {
        id: 'requirements',
        title: 'Requirements',
        content: (
          <div className="prestigeUpgradeModalRequirements">
            {locked && (
              <div className="prestigeUpgradeModalAlert">{lockedReason ?? 'Unlock requirements not met.'}</div>
            )}
            {prereqList.length > 0 ? (
              <ul className="prestigeUpgradeModalList">
                {prereqList.map((prereq) => {
                  const met = prereq.currentLevel >= prereq.requiredLevel;
                  return (
                    <li key={prereq.id} className={met ? 'is-met' : 'is-missing'}>
                      <span className="prestigeUpgradeModalListIcon" aria-hidden="true">
                        <GameIcon icon={met ? 'inkCheck' : 'inkX'} size={12} decorative />
                      </span>
                      <span>
                        {prereq.name} (Lv {prereq.currentLevel}/{prereq.requiredLevel})
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="prestigeUpgradeModalEmpty">No prerequisites.</div>
            )}
            {isMaxed && <div className="prestigeUpgradeModalEmpty">This decree is fully inscribed.</div>}
          </div>
        ),
      },
      {
        id: 'purchase',
        title: 'Purchase',
        content: (
          <div className="prestigeUpgradeModalActions">
            <div className="prestigeUpgradeModalActionRow">
              <button
                type="button"
                className="prestigeUpgradeModalButton"
                onClick={onPurchase}
                disabled={locked || isMaxed || !canAfford || purchaseState.isPurchasing}
              >
                Inscribe Decree
              </button>
              <span className="prestigeUpgradeModalCost">
                Cost: {nextCost === null ? '—' : `${nextCost} AP`}
              </span>
            </div>
            <div className="prestigeUpgradeModalMeta">AP available: {totalAP}</div>
            {purchaseState.successMessage && (
              <div className="prestigePurchaseResult">{purchaseState.successMessage}</div>
            )}
            {purchaseState.errorMessage && (
              <div className="prestigeUpgradeModalError">{purchaseState.errorMessage}</div>
            )}
          </div>
        ),
      },
    ];
  }, [
    currentLevel,
    isMaxed,
    locked,
    lockedReason,
    nextCost,
    onPurchase,
    prereqList,
    purchaseState.errorMessage,
    purchaseState.isPurchasing,
    purchaseState.successMessage,
    totalAP,
    upgradeDef,
  ]);

  useEffect(() => {
    if (!open) return undefined;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusables = getFocusableElements(dialog);
    const target = focusables[0] ?? dialog;
    requestAnimationFrame(() => {
      target?.focus();
    });
  }, [open, upgradeId]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!open || !scrollContainer) return;

    const updateScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      setScrollState({
        canScrollUp: scrollTop > 4,
        canScrollDown: scrollTop + clientHeight < scrollHeight - 4,
      });
    };

    updateScrollState();
    const observer = new ResizeObserver(() => updateScrollState());
    observer.observe(scrollContainer);

    return () => observer.disconnect();
  }, [open, sections.length]);

  if (!open) return null;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = getFocusableElements(dialogRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === dialogRef.current) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setScrollState({
      canScrollUp: scrollTop > 4,
      canScrollDown: scrollTop + clientHeight < scrollHeight - 4,
    });
  };

  return createPortal(
    <div className="prestigeUpgradeOverlay" role="presentation" onMouseDown={onClose}>
      <div
        className="prestigeUpgradeModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="prestigeUpgradeModalHeader">
          <div>
            <h2 className="prestigeUpgradeModalTitle" id={titleId}>
              {upgradeDef?.name ?? 'Unknown Decree'}
            </h2>
            {categoryIcon && (
              <div className="prestigeUpgradeModalSubtitle">
                <span className="prestigeUpgradeModalIcon" aria-hidden="true">
                  <categoryIcon.Icon />
                </span>
                {categoryIcon.label}
              </div>
            )}
          </div>
          <div className="prestigeUpgradeModalHeaderMeta">
            <div className="prestigeUpgradeModalHeaderIcons" aria-label="Decree metadata">
              {categoryIcon && (
                <span className="prestigeUpgradeModalIcon" title={categoryIcon.label}>
                  <categoryIcon.Icon aria-hidden="true" />
                </span>
              )}
            </div>
            <button
              type="button"
              className="prestigeUpgradeModalClose"
              onClick={onClose}
              aria-label="Close decree"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="prestigeUpgradeModalScroll" ref={scrollContainerRef} onScroll={handleScroll}>
          {scrollState.canScrollUp && <div className="prestigeUpgradeScrollShadow prestigeUpgradeScrollShadow--top" />}
          {scrollState.canScrollDown && (
            <div className="prestigeUpgradeScrollShadow prestigeUpgradeScrollShadow--bottom" />
          )}
          <div className="prestigeUpgradeModalLive" aria-live="polite">
            {purchaseState.successMessage}
          </div>
          {sections.map((section) => (
            <section key={section.id} className="prestigeUpgradeModalSection" data-section-id={section.id}>
              <h3 className="prestigeUpgradeModalSectionTitle">{section.title}</h3>
              {section.content}
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
