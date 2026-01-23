import { useEffect, useId, useMemo, useRef, type KeyboardEvent } from 'react';

import { Modal } from '../../../ui/primitives/Modal';
import { getForgeBlueprint, getItemDef } from '../../../stores/contentStore';
import { isRuneBlueprint, isRefineBlueprint } from '../../../content';
import { resolveForgeStepScript } from './forgeScriptBuilder';

export interface ForgeBlueprintDetailModalProps {
  open: boolean;
  blueprintId: string | null;
  onClose: () => void;
  openerRef?: React.RefObject<HTMLElement>;
}

type StepPreview = { id: string; icon: string; label: string };

const buildStepSummary = (stepTypes: string[]): string[] => {
  if (stepTypes.length === 0) return ['Heat', 'Strike', 'Heat', 'Strike', 'Heat', 'Special', 'Finish'];
  return stepTypes.map((type) => {
    switch (type) {
      case 'HEAT_TO':
      case 'HEAT_MATERIAL':
        return 'Heat';
      case 'HAMMER_PATTERN':
        return 'Strike';
      case 'ENGRAVE_RUNE':
      case 'LAY_FORMATION':
        return 'Special';
      case 'FINISH':
        return 'Finish';
      default:
        return 'Special';
    }
  });
};

const buildStepPreview = (steps: ReturnType<typeof resolveForgeStepScript>): StepPreview[] =>
  steps.map((step) => {
    switch (step.type) {
      case 'HEAT_TO':
      case 'HEAT_MATERIAL':
        return { id: step.id, icon: '🔥', label: 'Heat' };
      case 'HAMMER_PATTERN':
        return { id: step.id, icon: '🔨', label: 'Strike' };
      case 'ENGRAVE_RUNE':
        return { id: step.id, icon: '🔮', label: 'Engrave' };
      case 'LAY_FORMATION':
        return { id: step.id, icon: '🧿', label: 'Formation' };
      case 'TEMPER':
      case 'QUENCH':
        return { id: step.id, icon: '✨', label: 'Special' };
      case 'FINISH':
        return { id: step.id, icon: '✅', label: 'Finish' };
      default:
        return { id: step.id, icon: '•', label: step.type };
    }
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
  const stepSummary = useMemo(() => buildStepSummary(resolvedSteps.map((step) => step.type)), [resolvedSteps]);
  const stepPreview = useMemo(() => buildStepPreview(resolvedSteps), [resolvedSteps]);

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
                <p>{blueprint.output ? 'Crafted output' : 'Service blueprint'}</p>
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
                    <div className="forgeBlueprintModal__label">Mode notes</div>
                    <div className="forgeBlueprintModal__value">
                      Idle: baseline · Assisted: steady · Hands-on: best quality
                    </div>
                  </div>
                </div>
              </section>

              <section className="forgeBlueprintModal__section">
                <h3>Requirements</h3>
                {requirementItems.length === 0 && currencies.length === 0 && (
                  <div className="forgeBlueprintModal__value">No material costs.</div>
                )}
                {currencies.length > 0 && (
                  <ul className="forgeBlueprintModal__list">
                    {currencies.map((entry) => (
                      <li key={entry.label}>
                        {entry.label}: {entry.value}
                      </li>
                    ))}
                  </ul>
                )}
                {requirementItems.length > 0 && (
                  <ul className="forgeBlueprintModal__list">
                    {requirementItems.map((entry) => (
                      <li key={entry.itemId}>
                        {getItemDef(entry.itemId)?.name ?? entry.itemId} ×{entry.qty}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="forgeBlueprintModal__section">
                <h3>Process</h3>
                {stepPreview.length > 0 && (
                  <div className="forgeBlueprintModal__stepPreview">
                    {stepPreview.map((step, index) => (
                      <div key={step.id} className="forgeBlueprintModal__step">
                        <span aria-hidden="true">{step.icon}</span>
                        <span>{step.label}</span>
                        {index < stepPreview.length - 1 && <span className="forgeBlueprintModal__stepArrow">→</span>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="forgeBlueprintModal__stepSummary">
                  {stepSummary.map((step, index) => (
                    <span key={`${step}-${index}`}>
                      {step}
                      {index < stepSummary.length - 1 && <span className="forgeBlueprintModal__stepArrow">→</span>}
                    </span>
                  ))}
                </div>
              </section>

              <section className="forgeBlueprintModal__section">
                <h3>Notes</h3>
                <p>
                  Hands-on sessions improve quality and may boost special outcomes. Assisted mode automates steps with
                  steady performance.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
