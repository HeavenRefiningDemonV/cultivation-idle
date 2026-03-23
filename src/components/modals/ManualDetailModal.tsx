import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import type { TechniqueDef } from "../../content/index.js";
import type {
  ManualGrade,
  ManualRarity,
  PavilionStockSlot,
} from "../../features/manuals/pavilionStockTypes.js";
import type { ManualOfferAnalysis } from "../../systems/manuals/index.js";
import type { ManualPurchaseResult as StoreManualPurchaseResult } from "../../stores/manualPavilionStore.js";
import {
  getManualPathIcon,
  getManualRoleIcon,
  getManualTierIcon,
} from "../../features/manuals/manualIconMap.js";
import { formatPrice } from "../../stores/contentStore.js";
import { GameIcon } from "../../ui/icons/index.js";

export interface ManualDetailData {
  slot: PavilionStockSlot;
  technique?: TechniqueDef;
}

export interface ManualPurchaseState {
  errorMessage: string | null;
  purchaseDisabledReason?: string;
  studyDisabledReason?: string;
  purchaseResult?: ManualPurchaseResult;
}

export type ManualPurchaseResult = StoreManualPurchaseResult & {
  studied?: boolean;
};

interface ManualDetailModalProps {
  open: boolean;
  manual: ManualDetailData | null;
  onClose: () => void;
  onPurchase: (mode: "buy" | "buyAndStudy") => void;
  onUpgradeNow: (techId: string) => void;
  onOpenSatchel: () => void;
  purchaseState: ManualPurchaseState;
  offerAnalysis?: ManualOfferAnalysis | null;
  studyDurationLabel?: string;
  duplicateFragmentValue?: number;
}

const formatLineValue = (value: unknown) => {
  if (value == null) return "—";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return String(value);
  if (Array.isArray(value))
    return value.map((entry) => formatLineValue(entry)).join(", ");
  return JSON.stringify(value, null, 2);
};

const formatEffectLines = (effect: unknown): string[] => {
  if (!effect) return [];
  if (typeof effect !== "object") return [formatLineValue(effect)];
  const entries = Object.entries(effect as Record<string, unknown>);
  if (entries.length === 0) return [];
  return entries.map(([key, value]) => `${key}: ${formatLineValue(value)}`);
};

const formatEffectBlock = (title: string, effect: unknown) => {
  const lines = formatEffectLines(effect);
  if (lines.length === 0) {
    return (
      <div className="pavilionDetailSubsection">
        <div className="pavilionDetailSubsectionTitle">{title}</div>
        <div className="pavilionDetailEmpty">No effect data available yet.</div>
      </div>
    );
  }
  return (
    <div className="pavilionDetailSubsection">
      <div className="pavilionDetailSubsectionTitle">{title}</div>
      <div className="pavilionDetailEffectList">
        {lines.map((line, index) => (
          <div key={`${title}-${index}`} className="pavilionDetailEffectLine">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

const synthesizeCombatSummary = (technique?: TechniqueDef) => {
  if (!technique)
    return "No data available yet. Auto-used in combat when equipped.";
  const parts: string[] = [];
  const typeLabel = technique.type ? technique.type.toUpperCase() : "UNKNOWN";
  const role = technique.role ? `${technique.role} role` : "general role";
  parts.push(`An ${typeLabel} ${role} technique.`);
  parts.push("Auto-used in combat when equipped.");
  if (technique.tags && technique.tags.length > 0) {
    parts.push(`Tags: ${technique.tags.join(", ")}`);
  }
  if (technique.cooldownSec != null) {
    parts.push(`Cooldown: ${technique.cooldownSec}s.`);
  }
  if (technique.resourceModel && technique.resourceCost != null) {
    parts.push(
      `Resource: ${technique.resourceCost} ${technique.resourceModel}.`,
    );
  }
  return parts.join(" ");
};

const rarityLabel = (value: ManualRarity) =>
  value.charAt(0).toUpperCase() + value.slice(1);
const gradeLabel = (value: ManualGrade) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelectors.join(",")),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"),
  );
};

export function ManualDetailModal({
  open,
  manual,
  onClose,
  onPurchase,
  onUpgradeNow,
  onOpenSatchel,
  purchaseState,
  offerAnalysis = null,
  studyDurationLabel,
  duplicateFragmentValue,
}: ManualDetailModalProps) {
  const titleId = useId();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  const currentManualIdRef = useRef<string | null>(null);

  const manualId = manual?.slot.techniqueId ?? null;
  const technique = manual?.technique;
  const tierIcon = manual ? getManualTierIcon(manual.slot.grade) : null;
  const pathIcon = getManualPathIcon(technique?.path);
  const typeIcon = getManualRoleIcon(technique?.role);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const sections = useMemo(() => {
    if (!manual)
      return [] as Array<{ id: string; title: string; content: ReactNode }>;
    const costLabel = formatPrice(manual.slot.price) || "Free";
    const combatSummary = synthesizeCombatSummary(technique);
    const tags = technique?.tags?.length ? technique.tags.join(", ") : "None";
    const cooldown =
      technique?.cooldownSec != null ? `${technique.cooldownSec}s` : "—";
    const resourceLine =
      technique?.resourceModel && technique?.resourceCost != null
        ? `${technique.resourceCost} ${technique.resourceModel}`
        : "—";

    const baseSections = [
      {
        id: "overview",
        title: "Overview",
        content: (
          <div className="pavilionDetailSummary">
            <p className="pavilionDetailSummaryText">{combatSummary}</p>
            <dl className="pavilionDetailFacts">
              <div>
                <dt>Tier</dt>
                <dd>{gradeLabel(manual.slot.grade)}</dd>
              </div>
              <div>
                <dt>Rarity</dt>
                <dd>{rarityLabel(manual.slot.rarity)}</dd>
              </div>
              <div>
                <dt>Path</dt>
                <dd>{pathIcon.label}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{typeIcon.label}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{technique?.role ?? "General"}</dd>
              </div>
              <div>
                <dt>Tags</dt>
                <dd>{tags}</dd>
              </div>
            </dl>
            <div className="pavilionDetailSubsection">
              <div className="pavilionDetailSubsectionTitle">Build Fit</div>
              <div className="pavilionDetailEffectList">
                <div className="pavilionDetailEffectLine">
                  Study time: {studyDurationLabel ?? "—"}
                </div>
                {offerAnalysis?.pathAligned && (
                  <div className="pavilionDetailEffectLine">
                    Path-aligned for current life.
                  </div>
                )}
                {offerAnalysis?.supportOffer && (
                  <div className="pavilionDetailEffectLine">
                    Support offer: stabilizes or complements the current build.
                  </div>
                )}
                {offerAnalysis?.fillsCurrentGap && (
                  <div className="pavilionDetailEffectLine">
                    Build fix: fills a current gap or empty unlocked slot.
                  </div>
                )}
                {offerAnalysis?.improvesCurrentMilestone && (
                  <div className="pavilionDetailEffectLine">
                    Milestone value: improves current progression right now.
                  </div>
                )}
                {offerAnalysis?.isDuplicate && (
                  <div className="pavilionDetailEffectLine">
                    Duplicate conversion: +{duplicateFragmentValue ?? 0}{" "}
                    fragments.
                  </div>
                )}
                {offerAnalysis?.isDuplicate &&
                  offerAnalysis.fragmentProgressValue > 0 && (
                    <div className="pavilionDetailEffectLine">
                      Next rank progress after conversion:{" "}
                      {Math.round(offerAnalysis.fragmentProgressValue * 100)}%
                    </div>
                  )}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "combat-profile",
        title: "Combat Profile",
        content: (
          <div className="pavilionDetailPanel">
            <dl className="pavilionDetailFacts">
              <div>
                <dt>Cooldown</dt>
                <dd>{cooldown}</dd>
              </div>
              <div>
                <dt>Resource Cost</dt>
                <dd>{resourceLine}</dd>
              </div>
              <div>
                <dt>Technique Id</dt>
                <dd>{manual.slot.techniqueId}</dd>
              </div>
            </dl>
            {formatEffectBlock("Primary Effect", technique?.effect)}
            {formatEffectBlock(
              "Mastery 75 Bonus",
              technique?.secondaryAtMastery75,
            )}
          </div>
        ),
      },
      {
        id: "acquisition",
        title: "Acquisition",
        content: (
          <div className="pavilionDetailPanel">
            <div className="pavilionDetailLine">Price: {costLabel}</div>
            {manual.slot.notSold && (
              <div className={"pavilionDetailLine pavilionCardNotSold"}>
                Not sold here in this city tier.
              </div>
            )}
            {manual.slot.sold && (
              <div className={"pavilionDetailLine pavilionCardSold"}>
                Sold out.
              </div>
            )}
            <div className="pavilionDetailActions">
              <button
                className={"worldScreenModuleButton"}
                disabled={Boolean(purchaseState.purchaseDisabledReason)}
                title={purchaseState.purchaseDisabledReason}
                onClick={() => onPurchase("buy")}
                type="button"
              >
                Buy Manual
              </button>
              <button
                className={"worldScreenModuleButton"}
                disabled={Boolean(purchaseState.studyDisabledReason)}
                title={purchaseState.studyDisabledReason}
                onClick={() => onPurchase("buyAndStudy")}
                type="button"
              >
                Buy &amp; Study Now
              </button>
            </div>
            {purchaseState.errorMessage && (
              <div className={"pavilionPurchaseError"}>
                Purchase failed: {purchaseState.errorMessage}
              </div>
            )}
          </div>
        ),
      },
    ];

    if (purchaseState.purchaseResult) {
      baseSections.push({
        id: "result",
        title: "Result",
        content: (
          <div className="pavilionDetailPanel">
            {renderPurchaseResult(
              purchaseState.purchaseResult,
              onUpgradeNow,
              onOpenSatchel,
            )}
          </div>
        ),
      });
    }

    return baseSections;
  }, [
    manual,
    onPurchase,
    onUpgradeNow,
    onOpenSatchel,
    purchaseState,
    technique,
    typeIcon.label,
    pathIcon.label,
  ]);

  useEffect(() => {
    if (!open) return undefined;
    lastFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      lastFocusedRef.current?.focus();
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
  }, [open, manualId]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!open || !scrollContainer) return;

    const previousId = currentManualIdRef.current;
    if (previousId && previousId !== manualId) {
      scrollPositionsRef.current.set(previousId, scrollContainer.scrollTop);
    }
    currentManualIdRef.current = manualId;
    const savedScroll = manualId ? scrollPositionsRef.current.get(manualId) : 0;
    scrollContainer.scrollTop = savedScroll ?? 0;
  }, [manualId, open]);

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

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!open || !scrollContainer) return;

    const sectionElements = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>("[data-section-id]"),
    );
    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.getAttribute("data-section-id"));
          }
        });
      },
      {
        root: scrollContainer,
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.1,
      },
    );

    sectionElements.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [open, sections.length, manualId]);

  if (!open || !manual) return null;

  const showToc = sections.length > 1;

  const handleClose = () => {
    const scrollContainer = scrollContainerRef.current;
    if (manualId && scrollContainer) {
      scrollPositionsRef.current.set(manualId, scrollContainer.scrollTop);
    }
    onClose();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      handleClose();
      return;
    }

    if (event.key !== "Tab") return;
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

  const handleScrollToSection = (id: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const section = container.querySelector<HTMLElement>(
      `[data-section-id="${id}"]`,
    );
    if (!section) return;
    section.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  const handleBackToTop = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const hasBackToTop = scrollState.canScrollUp;

  return createPortal(
    <div
      className={"pavilionDetailOverlay"}
      role="presentation"
      onMouseDown={handleClose}
    >
      <div
        className={"pavilionDetailModal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="pavilionDetailHeader">
          <div className="pavilionDetailTitleBlock">
            <h2 className="pavilionDetailTitle" id={titleId}>
              {technique?.name ?? manual.slot.techniqueId}
            </h2>
            <div className="pavilionDetailSubtitle">
              {manual.slot.techniqueId}
            </div>
          </div>
          <div className="pavilionDetailMeta">
            <div
              className="pavilionDetailIconCluster"
              aria-label="Manual metadata"
            >
              {tierIcon && (
                <span
                  className="pavilionDetailIcon"
                  role="img"
                  aria-label={tierIcon.label}
                  title={tierIcon.label}
                >
                  {tierIcon.iconText ?? "◎"}
                </span>
              )}
              {pathIcon.iconId ? (
                <span
                  className="pavilionDetailIcon"
                  role="img"
                  aria-label={pathIcon.label}
                  title={pathIcon.label}
                >
                  <GameIcon icon={pathIcon.iconId} size={14} decorative />
                </span>
              ) : null}
              {typeIcon.iconId ? (
                <span
                  className="pavilionDetailIcon"
                  role="img"
                  aria-label={typeIcon.label}
                  title={typeIcon.label}
                >
                  <GameIcon icon={typeIcon.iconId} size={14} decorative />
                </span>
              ) : null}
            </div>
            <button
              className={"pavilionDetailClose"}
              type="button"
              onClick={handleClose}
              aria-label="Close manual detail"
            >
              <GameIcon icon="inkX" size={14} decorative />
            </button>
          </div>
        </div>
        <div className="pavilionDetailBody">
          <div className="pavilionDetailBodyLayout">
            {showToc && (
              <nav className="pavilionDetailToc" aria-label="Manual sections">
                <div className="pavilionDetailTocTitle">Contents</div>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className={`pavilionDetailTocItem ${activeSectionId === section.id ? "is-active" : ""}`}
                    onClick={() => handleScrollToSection(section.id)}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            )}
            <div
              className="pavilionDetailScroll"
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              <div
                className={`pavilionDetailScrollShadow pavilionDetailScrollShadow--top ${
                  scrollState.canScrollUp ? "is-visible" : ""
                }`}
                aria-hidden="true"
              />
              <div className="pavilionDetailContent">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    className="pavilionDetailSection"
                    data-section-id={section.id}
                    aria-labelledby={`${titleId}-${section.id}`}
                  >
                    <h3
                      className="pavilionDetailSectionTitle"
                      id={`${titleId}-${section.id}`}
                    >
                      {section.title}
                    </h3>
                    {section.content}
                  </section>
                ))}
              </div>
              <div
                className={`pavilionDetailScrollShadow pavilionDetailScrollShadow--bottom ${
                  scrollState.canScrollDown ? "is-visible" : ""
                }`}
                aria-hidden="true"
              />
            </div>
          </div>
          {hasBackToTop && (
            <button
              className="pavilionDetailBackToTop"
              type="button"
              onClick={handleBackToTop}
            >
              Back to top
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function renderPurchaseResult(
  result: ManualPurchaseResult,
  onUpgradeNow: (techId: string) => void,
  onOpenSatchel: () => void,
) {
  if (!result.ok) {
    return (
      <div className={"pavilionPurchaseResult pavilionPurchaseResult--error"}>
        Purchase failed: {result.reason}
      </div>
    );
  }

  const costText = formatPrice(result.cost) || "Free";

  if (result.outcome === "manualGranted") {
    return (
      <div className={"pavilionPurchaseResult"}>
        <div className={"pavilionResultTitle"}>Manual Purchased</div>
        <div>
          Added to Manual Satchel
          {typeof result.satchelCount === "number"
            ? ` (${result.satchelCount} owned in this grade/rarity).`
            : "."}
        </div>
        {result.studied && <div>Studying now.</div>}
        <div>
          {result.manualName} • {gradeLabel(result.grade ?? "mortal")} •{" "}
          {rarityLabel(result.rarity ?? "common")}
        </div>
        <div>Cost: {costText}</div>
        <button
          className={"worldScreenModuleButton"}
          onClick={onOpenSatchel}
          type="button"
        >
          Open Satchel
        </button>
      </div>
    );
  }

  const progressLine = result.nextRankCostFragments
    ? `Progress: ${result.fragmentsAfter}/${result.nextRankCostFragments} toward Rank ${result.nextRank}`
    : "Rank cap reached for current grade.";

  return (
    <div className={"pavilionPurchaseResult pavilionPurchaseResult--duplicate"}>
      <div className={"pavilionResultTitle"}>Duplicate Manual → Converted</div>
      <div>
        +{result.fragmentsGained} Technique Fragments (
        {rarityLabel(result.rarity ?? "common")})
      </div>
      <div>{progressLine}</div>
      {result.techId && (
        <button
          className={"worldScreenModuleButton"}
          onClick={() => onUpgradeNow(result.techId)}
          type="button"
        >
          Upgrade now
        </button>
      )}
    </div>
  );
}
