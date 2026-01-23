import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import classNames from 'classnames';

import { Modal } from '../../../ui/primitives/Modal';
import { getForgeBlueprint, getItemDef } from '../../../stores/contentStore';
import { useCraftSessionStore } from '../../../stores/craftSessionStore';
import { isRuneBlueprint, isRefineBlueprint } from '../../../content';
import { resolveForgeStepScript } from './forgeScriptBuilder';
import { getForgeStepIconInfo } from './forgeStepIconMap';

export interface ForgeBlueprintDetailModalProps {
  open: boolean;
  blueprintId: string | null;
  onClose: () => void;
  openerRef?: React.RefObject<HTMLElement>;
}

type StepPreview = { id: string; icon: string; label: string; ariaLabel: string };

const buildStepPreview = (steps: ReturnType<typeof resolveForgeStepScript>): StepPreview[] =>
  steps.map((step) => {
    const info = getForgeStepIconInfo(step.type);
    return { id: step.id, icon: info.icon, label: info.label, ariaLabel: info.ariaLabel };
  });

const MODE_COPY = {
  idle: 'Fast, baseline quality.',
  assisted: "Mostly automatic, lands 'Good' performance.",
  handsOn: 'Play the session. Best quality / best proc chance.',
} as const;

export function ForgeBlueprintDetailModal({
  open,
  blueprintId,
  onClose,
  openerRef,
}: ForgeBlueprintDetailModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);
  const scrollAnimationRef = useRef<number | null>(null);
  const scrollStateRef = useRef({ canScrollUp: false, canScrollDown: false });

  const overviewRef = useRef<HTMLElement | null>(null);
  const requirementsRef = useRef<HTMLElement | null>(null);
  const processRef = useRef<HTMLElement | null>(null);
  const handsOnRef = useRef<HTMLElement | null>(null);
  const modeRef = useRef<HTMLElement | null>(null);
  const advancedRef = useRef<HTMLElement | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const blueprint = useMemo(() => (blueprintId ? getForgeBlueprint(blueprintId) ?? null : null), [blueprintId]);
  const currentMode = useCraftSessionStore((state) => state.modeByStation.forge ?? 'idle');
  const setMode = useCraftSessionStore((state) => state.setMode);
  const resolvedSteps = useMemo(() => (blueprint ? resolveForgeStepScript(blueprint) : []), [blueprint]);
  const stepPreview = useMemo(() => buildStepPreview(resolvedSteps), [resolvedSteps]);
  const stepSummary = useMemo(
    () => stepPreview.map((step) => step.label),
    [stepPreview],
  );

  const categoryLabel = useMemo(() => {
    if (!blueprint) return '—';
    if (isRefineBlueprint(blueprint)) return 'Refine';
    if (isRuneBlueprint(blueprint)) return 'Rune';
    if (blueprint.service) return blueprint.service;
    return blueprint.type === 'craft' ? 'Craft' : 'Service';
  }, [blueprint]);

  const sectionDefinitions = useMemo(
    () => [
      { id: 'overview', label: 'Overview', ref: overviewRef },
      { id: 'requirements', label: 'Requirements', ref: requirementsRef },
      { id: 'process', label: 'Process', ref: processRef },
      { id: 'hands-on', label: 'Hands-on vs Auto', ref: handsOnRef },
      { id: 'mode', label: 'Mode', ref: modeRef },
      { id: 'advanced', label: 'Advanced', ref: advancedRef },
    ],
    [],
  );

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const nextCanScrollUp = container.scrollTop > 1;
    const nextCanScrollDown = container.scrollTop + container.clientHeight < container.scrollHeight - 1;

    if (
      nextCanScrollUp !== scrollStateRef.current.canScrollUp ||
      nextCanScrollDown !== scrollStateRef.current.canScrollDown
    ) {
      scrollStateRef.current = { canScrollUp: nextCanScrollUp, canScrollDown: nextCanScrollDown };
      setCanScrollUp(nextCanScrollUp);
      setCanScrollDown(nextCanScrollDown);
    }
  }, []);

  const handleSectionJump = useCallback(
    (targetId: string) => {
      const target = sectionDefinitions.find((section) => section.id === targetId)?.ref.current;
      if (!target) return;
      target.scrollIntoView({ block: 'start' });
    },
    [sectionDefinitions],
  );

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        openerRef?.current?.focus?.();
      }
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const target = closeButtonRef.current;
    if (target) {
      target.focus();
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    const focusable = container.querySelector<HTMLElement>('[tabindex], button, a, input, select, textarea');
    focusable?.focus();
  }, [open, openerRef]);

  useEffect(() => {
    if (!open) return undefined;
    setActiveSectionId(sectionDefinitions[0]?.id ?? null);
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      if (scrollAnimationRef.current) return;
      scrollAnimationRef.current = window.requestAnimationFrame(() => {
        scrollAnimationRef.current = null;
        updateScrollState();
      });
    };

    updateScrollState();
    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (scrollAnimationRef.current) {
        window.cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };
  }, [open, sectionDefinitions, updateScrollState]);

  useEffect(() => {
    if (!open) return undefined;
    const container = scrollContainerRef.current;
    if (!container) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSectionId(visible[0].target.getAttribute('data-section-id'));
        }
      },
      {
        root: container,
        rootMargin: '0px 0px -65% 0px',
        threshold: [0.1, 0.5, 0.9],
      },
    );

    sectionDefinitions.forEach((section) => {
      if (section.ref.current) {
        observer.observe(section.ref.current);
      }
    });

    return () => observer.disconnect();
  }, [open, sectionDefinitions]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const container = containerRef.current;
    if (!container) return;
    const focusables = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const costs = blueprint?.costs;
  const requirementItems = useMemo(() => costs?.items ?? [], [costs]);
  const currencyRequirements = useMemo(
    () =>
      [
        costs?.gold ? { label: 'Gold', value: costs.gold } : null,
        costs?.spiritStones ? { label: 'Spirit Stones', value: costs.spiritStones } : null,
      ].filter((entry): entry is { label: string; value: number } => Boolean(entry)),
    [costs],
  );
  const hasHandsOnBonus = Boolean(blueprint?.handsOnBonus && Object.keys(blueprint.handsOnBonus).length > 0);
  const handsOnSummary = useMemo(() => blueprint?.handsOnBonus ?? {}, [blueprint]);
  const requiresTarget =
    blueprint?.type === 'service' && (blueprint.service === 'refine' || blueprint.service === 'temper');
  const advancedRows = useMemo(
    () =>
      resolvedSteps.map((step) => ({
        id: step.id,
        label: step.type,
        value:
          [
            'targetHeat' in step && step.targetHeat ? `Heat ${step.targetHeat}°` : null,
            'targetMin' in step && 'targetMax' in step && step.targetMin && step.targetMax
              ? `Heat ${step.targetMin}-${step.targetMax}`
              : null,
            'hits' in step && step.hits ? `Hits ${step.hits}` : null,
            'tolerance' in step && step.tolerance ? `Tolerance ${step.tolerance}` : null,
            'timingWindow' in step && step.timingWindow ? 'Timed window' : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'No advanced parameters',
      })),
    [resolvedSteps],
  );

  const showTableOfContents = Boolean(blueprint && sectionDefinitions.length >= 4);

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      overlayClassName="forgeBlueprintModalOverlay"
      panelClassName="forgeBlueprintModal"
      ariaLabelledby={titleId}
    >
      <div className="forgeBlueprintModal__inner" ref={containerRef} onKeyDown={handleKeyDown}>
        <header className="forgeBlueprintModal__header">
          <div>
            <div id={titleId} className="forgeBlueprintModal__title">
              {blueprint?.name ?? blueprint?.id ?? 'Blueprint Details'}
            </div>
            <div className="forgeBlueprintModal__meta">
              <span>{categoryLabel}</span>
              <span>•</span>
              <span>{blueprint?.cityIndex ? `Tier ${blueprint.cityIndex}` : 'Tier —'}</span>
              <span>•</span>
              <span>{blueprint ? `${Math.round(blueprint.timeSec)}s` : '—'}</span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="forgeBlueprintModal__close"
            onClick={onClose}
            aria-label="Close blueprint details"
          >
            ✕
          </button>
        </header>

        <div
          ref={scrollContainerRef}
          className={classNames('forgeBlueprintModal__body', { 'forgeBlueprintModal__body--toc': showTableOfContents })}
        >
          <div
            className={classNames('forgeBlueprintModal__scrollShadow', 'forgeBlueprintModal__scrollShadow--top', {
              'is-visible': canScrollUp,
            })}
            aria-hidden="true"
          />
          <div
            className={classNames('forgeBlueprintModal__scrollShadow', 'forgeBlueprintModal__scrollShadow--bottom', {
              'is-visible': canScrollDown,
            })}
            aria-hidden="true"
          />
          {!blueprint && (
            <div className="forgeBlueprintModal__empty">Blueprint not found.</div>
          )}
          {blueprint && (
            <>
              {showTableOfContents && (
                <nav className="forgeBlueprintModal__toc" aria-label="Contents">
                  <div className="forgeBlueprintModal__tocTitle">Contents</div>
                  {sectionDefinitions.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      className={classNames('forgeBlueprintModal__tocButton', {
                        'is-active': activeSectionId === section.id,
                      })}
                      onClick={() => handleSectionJump(section.id)}
                    >
                      {section.label}
                    </button>
                  ))}
                </nav>
              )}
              <div className="forgeBlueprintModal__content">
                <section
                  ref={overviewRef}
                  data-section-id="overview"
                  className="forgeBlueprintModal__section"
                >
                  <h3>Overview</h3>
                  {blueprint.name && <p className="forgeBlueprintModal__summary">{blueprint.name}</p>}
                  <div className="forgeBlueprintModal__chips">
                    <span>{categoryLabel}</span>
                    <span>{blueprint.cityIndex ? `Tier ${blueprint.cityIndex}` : 'Tier —'}</span>
                    {blueprint.tags?.slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="forgeBlueprintModal__overviewGrid">
                    <div>
                      <div className="forgeBlueprintModal__label">Output</div>
                      <div className="forgeBlueprintModal__value">
                        {blueprint.output
                          ? `${getItemDef(blueprint.output.itemId)?.name ?? blueprint.output.itemId} ×${
                              blueprint.output.qty
                            }`
                          : blueprint.service
                            ? `${blueprint.service} service`
                            : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="forgeBlueprintModal__label">Time</div>
                      <div className="forgeBlueprintModal__value">
                        {Number.isFinite(blueprint.timeSec) ? `${Math.round(blueprint.timeSec)} seconds` : '—'}
                      </div>
                    </div>
                  </div>
                  {requiresTarget && (
                    <div className="forgeBlueprintModal__callout">
                      Requires a target item selected on the workbench.
                    </div>
                  )}
                </section>

                <section
                  ref={requirementsRef}
                  data-section-id="requirements"
                  className="forgeBlueprintModal__section"
                >
                  <h3>Requirements</h3>
                  {requirementItems.length === 0 && currencyRequirements.length === 0 && (
                    <div className="forgeBlueprintModal__value">No material costs.</div>
                  )}
                  {currencyRequirements.length > 0 && (
                    <div className="forgeBlueprintModal__requirements">
                      {currencyRequirements.map((entry) => (
                        <div key={entry.label} className="forgeBlueprintModal__requirementRow">
                          <span>{entry.label}</span>
                          <span className="forgeBlueprintModal__requirementQty">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {requirementItems.length > 0 && (
                    <div className="forgeBlueprintModal__requirements">
                      {requirementItems.map((entry) => (
                        <div key={entry.itemId} className="forgeBlueprintModal__requirementRow">
                          <span>{getItemDef(entry.itemId)?.name ?? entry.itemId}</span>
                          <span className="forgeBlueprintModal__requirementQty">×{entry.qty}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section
                  ref={processRef}
                  data-section-id="process"
                  className="forgeBlueprintModal__section"
                >
                  <h3>Process</h3>
                  {stepPreview.length > 0 ? (
                    <>
                      <div className="forgeBlueprintModal__stepPreview">
                        {stepPreview.map((step, index) => (
                          <div
                            key={step.id}
                            className="forgeBlueprintModal__step"
                            title={step.ariaLabel}
                            aria-label={step.ariaLabel}
                          >
                            <span aria-hidden="true">{step.icon}</span>
                            <span>{step.label}</span>
                            {index < stepPreview.length - 1 && <span className="forgeBlueprintModal__stepArrow">→</span>}
                          </div>
                        ))}
                      </div>
                      <div className="forgeBlueprintModal__stepSummary">
                        {stepSummary.map((step, index) => (
                          <span key={`${step}-${index}`}>
                            {step}
                            {index < stepSummary.length - 1 && <span className="forgeBlueprintModal__stepArrow">→</span>}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="forgeBlueprintModal__value">
                      This blueprint uses automated forging (no manual steps).
                    </div>
                  )}
                </section>

                <section
                  ref={handsOnRef}
                  data-section-id="hands-on"
                  className="forgeBlueprintModal__section"
                >
                  <h3>Hands-on vs Auto</h3>
                  {hasHandsOnBonus ? (
                    <div className="forgeBlueprintModal__value">
                      Hands-on bonus:{' '}
                      {[
                        handsOnSummary.qualityProcChancePct ? `+${handsOnSummary.qualityProcChancePct}% quality` : null,
                        handsOnSummary.timeReductionPct ? `-${handsOnSummary.timeReductionPct}% time` : null,
                        handsOnSummary.temperProcChancePct
                          ? `+${handsOnSummary.temperProcChancePct}% temper chance`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Improved outcomes'}
                    </div>
                  ) : (
                    <div className="forgeBlueprintModal__value">Hands-on forging not applicable.</div>
                  )}
                  <div className="forgeBlueprintModal__value">
                    Assisted mode automates steps; hands-on focuses on precision and timing.
                  </div>
                </section>

                <section
                  ref={modeRef}
                  data-section-id="mode"
                  className="forgeBlueprintModal__section"
                >
                  <h3>Mode</h3>
                  <div className="forgeBlueprintModal__modeControls">
                    {(['idle', 'assisted', 'handsOn'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={classNames('forgeBlueprintModal__modeButton', {
                          'forgeBlueprintModal__modeButton--active': currentMode === mode,
                        })}
                        onClick={() => setMode('forge', mode)}
                      >
                        {mode === 'idle' ? 'Idle' : mode === 'assisted' ? 'Assisted' : 'Hands-on'}
                      </button>
                    ))}
                  </div>
                  <div className="forgeBlueprintModal__value">{MODE_COPY[currentMode]}</div>
                </section>

                <section
                  ref={advancedRef}
                  data-section-id="advanced"
                  className="forgeBlueprintModal__section"
                >
                  <details className="forgeBlueprintModal__advanced">
                    <summary>Advanced</summary>
                    {advancedRows.length === 0 ? (
                      <div className="forgeBlueprintModal__value">No advanced parameters exposed.</div>
                    ) : (
                      <div className="forgeBlueprintModal__advancedGrid">
                        {advancedRows.map((step) => (
                          <div key={step.id} className="forgeBlueprintModal__advancedRow">
                            <div className="forgeBlueprintModal__label">{step.label}</div>
                            <div className="forgeBlueprintModal__value">{step.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </details>
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
