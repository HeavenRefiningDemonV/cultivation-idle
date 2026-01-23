import classNames from 'classnames';
import type { RefObject } from 'react';
import type { NormalizedForgeBlueprint } from '../../../content/forge';
import type { CraftSession } from '../../../systems/crafting/craftingTypes';

export interface ForgeActionDockProps {
  selectedBlueprint: NormalizedForgeBlueprint | null;
  canStart: boolean;
  isLocked: boolean;
  isBlocked: boolean;
  activeForgeSession: CraftSession | null;
  queueReady: number;
  requirementCount: number;
  hasCurrencyCost: boolean;
  onStart: () => void;
  onOpenDetails: () => void;
  onFocusLibrary: () => void;
  onOpenQueue: () => void;
  detailsRef: RefObject<HTMLButtonElement>;
}

export function ForgeActionDock({
  selectedBlueprint,
  canStart,
  isLocked,
  isBlocked,
  activeForgeSession,
  queueReady,
  requirementCount,
  hasCurrencyCost,
  onStart,
  onOpenDetails,
  onFocusLibrary,
  onOpenQueue,
  detailsRef,
}: ForgeActionDockProps) {
  const blueprintName = selectedBlueprint?.name ?? selectedBlueprint?.id ?? 'No blueprint selected';
  const tierLabel = selectedBlueprint?.cityIndex ? `Tier ${selectedBlueprint.cityIndex}` : 'Tier —';
  const typeLabel = selectedBlueprint
    ? selectedBlueprint.type === 'service'
      ? selectedBlueprint.service ?? 'Service'
      : 'Craft'
    : 'Blueprint';
  const timeLabel = selectedBlueprint ? `${Math.round(selectedBlueprint.timeSec)}s` : null;

  const hasSelected = Boolean(selectedBlueprint);
  const hasReadyQueue = queueReady > 0;
  const isForgeActive = Boolean(activeForgeSession);

  const primaryLabel = hasReadyQueue
    ? 'Claim'
    : isForgeActive
      ? 'Forge'
      : hasSelected
        ? canStart && !isLocked && !isBlocked
          ? 'Start'
          : 'Prepare'
        : 'Choose Blueprint';

  const primaryDisabled = isForgeActive || (hasSelected && (isLocked || isBlocked));
  const primaryAction = () => {
    if (hasReadyQueue) {
      onOpenQueue();
      return;
    }
    if (isForgeActive) return;
    if (!hasSelected) {
      onFocusLibrary();
      return;
    }
    if (canStart && !isLocked && !isBlocked) {
      onStart();
      return;
    }
    onOpenDetails();
  };

  return (
    <div className="forgeActionDock">
      <div className="forgeActionDock__left">
        <div className="forgeActionDock__title">{blueprintName}</div>
        <div className="forgeActionDock__meta">
          {tierLabel} · {typeLabel}
        </div>
      </div>
      <div className="forgeActionDock__pills">
        {timeLabel && <span className="forgeActionDock__pill">{timeLabel}</span>}
        {hasSelected && (requirementCount > 0 || hasCurrencyCost) && (
          <button type="button" className="forgeActionDock__pill forgeActionDock__pillButton" onClick={onOpenDetails}>
            Requirements
          </button>
        )}
        {isLocked && <span className="forgeActionDock__pill forgeActionDock__pill--warn">Locked</span>}
      </div>
      <div className="forgeActionDock__actions">
        <button
          type="button"
          className={classNames('worldScreenModuleButton', 'forgeActionDock__primary', {
            'worldScreenModuleButton--active': !primaryDisabled,
          })}
          onClick={primaryAction}
          disabled={primaryDisabled}
        >
          {primaryLabel}
        </button>
        <button
          ref={detailsRef}
          type="button"
          className="worldScreenModuleButton forgeDetailsButton"
          onClick={onOpenDetails}
          disabled={!hasSelected}
          title={!hasSelected ? 'Select a blueprint first' : 'Open blueprint details'}
        >
          Details
        </button>
        {hasSelected && (
          <button type="button" className="worldScreenModuleButton" onClick={onFocusLibrary}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
