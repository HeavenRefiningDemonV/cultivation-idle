import { useEffect, useId, useMemo, useRef, type KeyboardEvent } from 'react';

import { Modal } from '../../../ui/primitives/Modal';
import { getForgeBlueprint, getItemDef } from '../../../stores/contentStore';
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

export function ForgeBlueprintDetailModal({
  open,
  blueprintId,
  onClose,
  openerRef,
}: ForgeBlueprintDetailModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);

  const blueprint = useMemo(() => (blueprintId ? getForgeBlueprint(blueprintId) ?? null : null), [blueprintId]);
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

  if (!open) return null;

  const costs = blueprint?.costs;
  const requirementItems = costs?.items ?? [];
  const currencies = [
    costs?.gold ? { label: 'Gold', value: costs.gold } : null,
    costs?.spiritStones ? { label: 'Spirit Stones', value: costs.spiritStones } : null,
  ].filter((entry): entry is { label: string; value: number } => Boolean(entry));
  const hasHandsOnBonus = Boolean(blueprint?.handsOnBonus && Object.keys(blueprint.handsOnBonus).length > 0);
  const handsOnSummary = blueprint?.handsOnBonus ?? {};
  const requiresTarget =
    blueprint?.type === 'service' && (blueprint.service === 'refine' || blueprint.service === 'temper');

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

        <div className="forgeBlueprintModal__body">
          {!blueprint && (
            <div className="forgeBlueprintModal__empty">Blueprint not found.</div>
          )}
          {blueprint && (
            <>
              <section className="forgeBlueprintModal__section">
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

              <section className="forgeBlueprintModal__section">
                <h3>Requirements</h3>
                {requirementItems.length === 0 && currencies.length === 0 && (
                  <div className="forgeBlueprintModal__value">No material costs.</div>
                )}
                {currencies.length > 0 && (
                  <div className="forgeBlueprintModal__requirements">
                    {currencies.map((entry) => (
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

              <section className="forgeBlueprintModal__section">
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

              <section className="forgeBlueprintModal__section">
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

              <details className="forgeBlueprintModal__advanced">
                <summary>Advanced</summary>
                {resolvedSteps.length === 0 ? (
                  <div className="forgeBlueprintModal__value">No advanced parameters exposed.</div>
                ) : (
                  <div className="forgeBlueprintModal__advancedGrid">
                    {resolvedSteps.map((step) => (
                      <div key={step.id} className="forgeBlueprintModal__advancedRow">
                        <div className="forgeBlueprintModal__label">{step.type}</div>
                        <div className="forgeBlueprintModal__value">
                          {[
                            'targetHeat' in step && step.targetHeat ? `Heat ${step.targetHeat}°` : null,
                            'targetMin' in step && 'targetMax' in step && step.targetMin && step.targetMax
                              ? `Heat ${step.targetMin}-${step.targetMax}`
                              : null,
                            'hits' in step && step.hits ? `Hits ${step.hits}` : null,
                            'tolerance' in step && step.tolerance ? `Tolerance ${step.tolerance}` : null,
                            'timingWindow' in step && step.timingWindow ? 'Timed window' : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'No advanced parameters'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </details>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
