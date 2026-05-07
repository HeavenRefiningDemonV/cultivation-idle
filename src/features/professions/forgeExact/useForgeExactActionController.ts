import { useCallback } from 'react';
import { getForgeBlueprint } from '../../../stores/contentStore.js';
import { useProfessionStore } from '../../../stores/professionStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { openWorldModule } from '../../../systems/world/openWorldModule.js';
import {
  getAllowedForgeModes,
  isForgeModeAllowed,
  toForgeJobMode,
} from '../../../systems/forge/index.js';
import type {
  ForgeExactActionResult,
  ForgeExactButtonSurface,
  ForgeExactMode,
  ForgeExactSurfaceV1,
  ForgeExactTab,
} from './forgeExactTypes.js';

interface ControllerArgs {
  surface: ForgeExactSurfaceV1;
  onSelectTab: (tab: ForgeExactTab) => void;
  onSelectMode: (mode: ForgeExactMode) => void;
  onSelectSlot: (slot: 'weapon' | 'accessory') => void;
  onResult: (result: ForgeExactActionResult | null) => void;
}

function resultLines(result: unknown): string[] {
  if (!result || typeof result !== 'object') return ['Forge action completed.'];
  const record = result as {
    resultSnapshot?: {
      outputBundle?: { items?: Array<{ itemId: string; qty: number }> };
      beforeItem?: Record<string, unknown>;
      afterItem?: Record<string, unknown>;
    };
    performance?: { qualityScore?: number };
  };
  const lines: string[] = [];
  const items = record.resultSnapshot?.outputBundle?.items ?? [];
  if (items.length > 0) {
    lines.push(...items.map((entry) => `Output: ${entry.qty} item`));
  }
  if (record.resultSnapshot?.beforeItem && record.resultSnapshot?.afterItem) {
    lines.push('Service applied to equipped gear.');
  }
  if (typeof record.performance?.qualityScore === 'number') {
    lines.push(`Quality: ${Math.round(record.performance.qualityScore)}%`);
  }
  return lines.length > 0 ? lines : ['Forge result claimed.'];
}

export function useForgeExactActionController(args: ControllerArgs) {
  const addNotification = useUIStore((state) => state.addNotification);

  const handleStart = useCallback((action: ForgeExactButtonSurface) => {
    if (args.surface.meta.mode === 'fixture') {
      addNotification('info', 'Fixture Forge preview is safe and does not start live jobs.');
      args.onResult({
        ok: true,
        title: 'Fixture Preview',
        lines: ['Start Assisted Refine is preview-only in fixture mode.'],
      });
      return true;
    }

    const blueprintId = args.surface.meta.selectedBlueprintId;
    const blueprint = blueprintId ? getForgeBlueprint(blueprintId) : undefined;
    const requestedMode = action.mode ?? args.surface.meta.activeMode;
    const targetSlot = action.targetSlot ?? args.surface.meta.selectedTargetSlot;
    if (!blueprint) {
      addNotification('warning', 'No visible live Forge blueprint is selected.');
      return false;
    }
    if (!isForgeModeAllowed(blueprint, requestedMode)) {
      addNotification('warning', `${blueprint.name ?? 'Selected Forge action'} does not support ${requestedMode}.`);
      return false;
    }

    const result = useProfessionStore.getState().startForgeJob({
      blueprintId,
      mode: toForgeJobMode(requestedMode),
      qty: 1,
      targetSlot: blueprint.type === 'service' ? targetSlot : undefined,
    });

    if (!result.ok) {
      addNotification('warning', result.error);
      args.onResult({ ok: false, title: 'Forge Blocked', lines: [result.error] });
      return false;
    }

    addNotification('success', `${action.label} queued.`);
    args.onResult({
      ok: true,
      title: 'Forge Queued',
      lines: [`${action.label} is now in the Forge queue.`],
    });
    return true;
  }, [addNotification, args]);

  const handleClaim = useCallback(() => {
    if (args.surface.meta.mode === 'fixture') {
      addNotification('info', 'Fixture Forge has no live result to claim.');
      return false;
    }
    const jobId = args.surface.meta.readyJobId;
    if (!jobId) {
      addNotification('warning', 'No Forge job is ready to claim.');
      return false;
    }

    const result = useProfessionStore.getState().claimForgeJob(jobId);
    if (!result.ok) {
      addNotification('warning', result.error);
      args.onResult({ ok: false, title: 'Claim Blocked', lines: [result.error] });
      return false;
    }

    addNotification('success', 'Forge result claimed.');
    args.onResult({
      ok: true,
      title: 'Forging Complete',
      lines: resultLines(result.result),
    });
    return true;
  }, [addNotification, args]);

  const handleRoute = useCallback((action: ForgeExactButtonSurface) => {
    const cityId = action.route?.cityId ?? args.surface.meta.cityId;
    const moduleKey = action.route?.moduleKey;
    if (!cityId || !moduleKey) {
      addNotification('warning', action.reasonIfDisabled ?? 'No route is available for that source.');
      return false;
    }
    openWorldModule({ cityId, moduleKey });
    return true;
  }, [addNotification, args.surface.meta.cityId]);

  const handleAction = useCallback((action: ForgeExactButtonSurface) => {
    if (!action.enabled) {
      addNotification('info', action.reasonIfDisabled ?? 'That Forge action is unavailable.');
      return false;
    }

    switch (action.intent) {
      case 'start-forge':
        return handleStart(action);
      case 'claim-forge':
        return handleClaim();
      case 'route-source':
        return handleRoute(action);
      case 'select-tab':
        if (action.tab) {
          args.onSelectTab(action.tab);
          args.onResult(null);
          return true;
        }
        return false;
      case 'select-mode':
        if (action.mode) {
          const blueprint = args.surface.meta.selectedBlueprintId ? getForgeBlueprint(args.surface.meta.selectedBlueprintId) : undefined;
          if (blueprint && !getAllowedForgeModes(blueprint).includes(action.mode)) {
            addNotification('info', action.reasonIfDisabled ?? 'That mode is not available for this Forge action.');
            return false;
          }
          args.onSelectMode(action.mode);
          args.onResult(null);
          return true;
        }
        return false;
      case 'select-slot':
        if (action.targetSlot) {
          args.onSelectSlot(action.targetSlot);
          args.onResult(null);
          return true;
        }
        return false;
      case 'dismiss-result':
        args.onResult(null);
        return true;
      case 'disabled':
      default:
        addNotification('info', action.reasonIfDisabled ?? 'That Forge action is unavailable.');
        return false;
    }
  }, [
    addNotification,
    args,
    handleClaim,
    handleRoute,
    handleStart,
  ]);

  return {
    onAction: handleAction,
  };
}
