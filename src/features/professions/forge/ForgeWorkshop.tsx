import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';
import type { PlayerStats } from '../../../types/index.js';

import { ForgeMinigame } from './ForgeMinigame.js';
import { ErrorBoundary } from '../../../ui/feedback/ErrorBoundary.js';
import { UsedForLinks } from '../../../components/crafting/UsedForLinks.js';
import { computeForgeOutcome } from '../../../systems/crafting/forgeOutcome.js';
import { listForgeBlueprints, listForgeBlueprintsForCity, getForgeBlueprint, getItemDef } from '../../../stores/contentStore.js';
import { useCraftSessionStore } from '../../../stores/craftSessionStore.js';
import { useProfessionStore } from '../../../stores/professionStore.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { useActivityStore } from '../../../stores/activityStore.js';
import { useContentStore } from '../../../stores/contentStore.js';
import { useInventoryStore } from '../../../stores/inventoryStore.js';
import { isRuneBlueprint } from '../../../content/index.js';
import { buildItemDelta } from './forgeDelta.js';
import { resolveForgeStepScript } from './forgeScriptBuilder.js';
import { InkPanel, PaperCard } from '../../../ui/ink/index.js';
import type { IconId } from '../../../ui/icons/index.js';
import { GameIcon } from '../../../ui/icons/index.js';
import { RunCompassCompact } from '../../../ui/status/RunCompassCompact.js';
import { useRunCompassSurface } from '../../../ui/status/useRunCompassSurface.js';
import {
  buildForgeSurfaceModel,
  getAllowedForgeModes,
  getDefaultForgeMode,
  getForgeSurfaceTabForBlueprint,
  toForgeJobMode,
  type LiveForgeSurfaceTab,
} from '../../../systems/forge/index.js';
import { getLiveForgeFloorReadModel } from '../../../systems/forge/liveForgeFloorStore.js';
import { buildBestSourceIndex, getBestSourceIndexEntry } from '../../../systems/economy/bestSourceIndex.js';
import { openWorldModule } from '../../../systems/world/openWorldModule.js';
import { getWorldModuleLabel } from '../../../ui/text/playerFacingLabels.js';
import './ForgeWorkshop.scss';

type ForgeClaimResult = {
  jobId: string;
  blueprintId: string;
  mode: 'IDLE' | 'ASSISTED' | 'HANDS_ON';
  performance: {
    heatScore?: number;
    hammerScore?: number;
    specialScore?: number;
    qualityScore?: number;
  };
  resultSnapshot?: {
    outputItemId?: string;
    outputBundle?: { items?: Array<{ itemId: string; qty: number }> };
    beforeItem?: Record<string, unknown>;
    afterItem?: Record<string, unknown>;
  };
  serviceResult?: { type?: string };
};

const MODE_COPY = {
  idle: 'Fast, baseline quality.',
  assisted: "Mostly automatic, lands 'Good' performance.",
  handsOn: 'Play the session. Best quality / best proc chance.',
} as const;

const BENEFITS = [
  { mode: 'idle' as const, label: 'Idle', detail: 'Baseline' },
  { mode: 'assisted' as const, label: 'Assisted', detail: '+Small quality floor' },
  { mode: 'handsOn' as const, label: 'Hands-on', detail: '+Quality proc chance / +Mastery' },
];

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

const getProduceSummary = (blueprintId?: string | null): string => {
  if (!blueprintId) return '—';
  const blueprint = listForgeBlueprints().find((entry) => entry.id === blueprintId);
  if (!blueprint?.output) return blueprint?.service ? `${blueprint.service} service` : '—';
  const item = getItemDef(blueprint.output.itemId);
  return `${item?.name ?? blueprint.output.itemId} ×${blueprint.output.qty}`;
};

const resolveQualityLabel = (qualityScore?: number): string => {
  const score = typeof qualityScore === 'number' ? qualityScore : 0;
  if (score >= 90) return 'Perfect';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Solid';
  return 'Rough';
};

export function ForgeWorkshop({ cityId }: { cityId: string | null }) {
  const runCompass = useRunCompassSurface();
  const setUiActiveTab = useUIStore((state) => state.setActiveTab);
  const setCraftMode = useCraftSessionStore((state) => state.setMode);
  const modeByStation = useCraftSessionStore((state) => state.modeByStation);
  const activeSession = useCraftSessionStore((state) => state.activeSession);
  const startForgeJob = useProfessionStore((state) => state.startForgeJob);
  const claimForgeJob = useProfessionStore((state) => state.claimForgeJob);
  const forgeQueue = useProfessionStore((state) => state.forgeQueue);
  const canStartForge = useProfessionStore((state) => state.canStartForge);
  const getForgeJobStatus = useProfessionStore((state) => state.getForgeJobStatus);
  const activeActivity = useActivityStore((state) => state.active);
  const inventoryItems = useInventoryStore((state) => state.items);
  const rawContent = useContentStore((state) => state.raw);
  const cityName = useContentStore((state) => (cityId ? state.maps.citiesById[cityId]?.name ?? cityId : 'Forge'));

  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LiveForgeSurfaceTab>('refine');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const [selectedServiceSlot, setSelectedServiceSlot] = useState<'weapon' | 'accessory'>('weapon');
  const [lastClaimResult, setLastClaimResult] = useState<ForgeClaimResult | null>(null);

  const currentMode = modeByStation.forge ?? 'idle';

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(handle);
  }, []);

  const activeForgeSession = activeSession?.station === 'forge' ? activeSession : null;
  const activeOtherStation = activeSession && activeSession.station !== 'forge';

  const blueprints = useMemo(() => (cityId ? listForgeBlueprintsForCity({ cityId }) : listForgeBlueprints()), [cityId]);
  const floorModel = useMemo(() => getLiveForgeFloorReadModel({ cityId }), [cityId]);
  const bestSourceIndex = useMemo(() => (rawContent ? buildBestSourceIndex(rawContent) : null), [rawContent]);
  const surfaceModel = useMemo(
    () => buildForgeSurfaceModel({ blueprints, activeTab, query, floor: floorModel }),
    [activeTab, blueprints, floorModel, query],
  );
  const filteredBlueprints = surfaceModel.activeBlueprints;

  useEffect(() => {
    if (activeForgeSession?.sourceId) {
      setSelectedBlueprintId(activeForgeSession.sourceId);
      const activeBlueprint = blueprints.find((blueprint) => blueprint.id === activeForgeSession.sourceId);
      if (activeBlueprint) {
        setActiveTab(getForgeSurfaceTabForBlueprint(activeBlueprint));
      }
      return;
    }
    if (!selectedBlueprintId && filteredBlueprints.length > 0) {
      setSelectedBlueprintId(filteredBlueprints[0].id);
    }
  }, [activeForgeSession?.sourceId, blueprints, filteredBlueprints, selectedBlueprintId]);

  useEffect(() => {
    if (selectedBlueprintId && filteredBlueprints.some((blueprint) => blueprint.id === selectedBlueprintId)) return;
    setSelectedBlueprintId(filteredBlueprints[0]?.id ?? null);
  }, [filteredBlueprints, selectedBlueprintId]);

  const selectedBlueprint = useMemo(
    () => blueprints.find((blueprint) => blueprint.id === selectedBlueprintId) ?? null,
    [blueprints, selectedBlueprintId],
  );
  const allowedModes = useMemo(
    () => (selectedBlueprint ? getAllowedForgeModes(selectedBlueprint) : ['idle']),
    [selectedBlueprint],
  );

  useEffect(() => {
    if (!selectedBlueprint) return;
    if (allowedModes.includes(currentMode)) return;
    setCraftMode('forge', getDefaultForgeMode(selectedBlueprint));
  }, [allowedModes, currentMode, selectedBlueprint, setCraftMode]);

  const resolvedStepScript = useMemo(
    () => (selectedBlueprint ? resolveForgeStepScript(selectedBlueprint) : []),
    [selectedBlueprint],
  );

  const stepSummary = useMemo(() => {
    const steps = resolvedStepScript.map((step) => step.type);
    return buildStepSummary(steps);
  }, [resolvedStepScript]);

  const stepPreview = useMemo(
    () =>
      resolvedStepScript.map((step) => {
        const base = { id: step.id };
        switch (step.type) {
          case 'HEAT_TO':
          case 'HEAT_MATERIAL':
            return { ...base, iconId: 'inkBolt' as IconId, label: 'Heat' };
          case 'HAMMER_PATTERN':
            return { ...base, iconId: 'metalChunk' as IconId, label: 'Strike' };
          case 'ENGRAVE_RUNE':
            return { ...base, iconId: 'artifactShard' as IconId, label: 'Engrave' };
          case 'LAY_FORMATION':
            return { ...base, iconId: 'inkSwirl' as IconId, label: 'Formation' };
          case 'TEMPER':
          case 'QUENCH':
            return { ...base, iconId: 'inkSparkles' as IconId, label: 'Special' };
          case 'FINISH':
            return { ...base, iconId: 'taskComplete' as IconId, label: 'Finish' };
          default:
            return { ...base, iconId: 'inkSparkles' as IconId, label: 'Step' };
        }
      }),
    [resolvedStepScript],
  );

  const outcome = useMemo(() => {
    if (!activeForgeSession) return null;
    return computeForgeOutcome({
      script: activeForgeSession.script,
      performances: activeForgeSession.cursor.forgeStepResults ?? [],
      handsOnBonus: selectedBlueprint?.handsOnBonus ?? activeForgeSession.script.handsOnBonus,
      seed: activeForgeSession.seed,
    });
  }, [activeForgeSession, selectedBlueprint?.handsOnBonus]);

  const qualityBuckets = useMemo(() => {
    if (!activeForgeSession || !outcome) return null;
    const steps = activeForgeSession.script.steps;
    const hasSpecial = steps.some((step) => step.type === 'ENGRAVE_RUNE' || step.type === 'LAY_FORMATION');
    return {
      heat: outcome.heatScore,
      hammer: outcome.hammerScore,
      special: hasSpecial ? outcome.temperScore : undefined,
    };
  }, [activeForgeSession, outcome]);

  const resultBlueprint = useMemo(() => {
    if (!lastClaimResult) return null;
    return listForgeBlueprints().find((entry) => entry.id === lastClaimResult.blueprintId) ?? null;
  }, [lastClaimResult]);

  const resultDelta = useMemo(() => {
    if (!lastClaimResult?.resultSnapshot?.beforeItem || !lastClaimResult?.resultSnapshot?.afterItem) return null;
    return buildItemDelta(
      lastClaimResult.resultSnapshot.beforeItem as unknown as PlayerStats,
      lastClaimResult.resultSnapshot.afterItem as unknown as PlayerStats,
    );
  }, [lastClaimResult]);

  const showTechniquesCta = Boolean(resultBlueprint && isRuneBlueprint(resultBlueprint));

  const selectedTargetSlot = selectedBlueprint?.type === 'service' ? selectedServiceSlot : undefined;
  const startEligibility = selectedBlueprint ? canStartForge(selectedBlueprint.id, 1, selectedTargetSlot) : { ok: false };
  const isHandsOnMode = currentMode === 'handsOn';
  const isModeAllowed = selectedBlueprint ? allowedModes.includes(currentMode) : false;
  const canStart = Boolean(
    selectedBlueprint &&
      startEligibility.ok &&
      isModeAllowed &&
      !(activeTab === 'refine' && isHandsOnMode),
  );
  const isLocked = Boolean(selectedBlueprint?.cityId && cityId && selectedBlueprint.cityId !== cityId);
  const isBlocked = Boolean(activeOtherStation || (activeActivity && activeActivity.type !== 'forge'));

  const missingMaterialRows = useMemo(() => {
    if (!selectedBlueprint || !bestSourceIndex) return [];
    const rows = selectedBlueprint.costs.items
      .map((entry) => {
        const owned = inventoryItems[entry.itemId] ?? 0;
        const missing = Math.max(0, Math.ceil(entry.qty) - owned);
        if (missing <= 0) return null;
        const sourceEntry = getBestSourceIndexEntry(bestSourceIndex, entry.itemId);
        const best = sourceEntry?.primarySource ?? sourceEntry?.sourceOptions[0] ?? null;
        const canRoute = Boolean(
          cityId
          && best
          && ['outskirts', 'ruins', 'bounties', 'expeditions', 'apothecary'].includes(best.moduleKey),
        );
        return {
          itemId: entry.itemId,
          itemName: getItemDef(entry.itemId)?.name ?? entry.itemId,
          missing,
          sourceLabel: best ? getWorldModuleLabel(best.moduleKey) : 'No live source route',
          sourceReason: best?.shortReason ?? 'No live source route available.',
          routeCityId: (best?.cityId ?? cityId) ?? null,
          routeModuleKey: best?.moduleKey ?? null,
          canRoute,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => b.missing - a.missing)
      .slice(0, 3);
    return rows;
  }, [bestSourceIndex, cityId, inventoryItems, selectedBlueprint]);

  const requirementRows = useMemo(() => {
    if (!selectedBlueprint || !bestSourceIndex) return [];
    return selectedBlueprint.costs.items.map((entry) => {
      const owned = inventoryItems[entry.itemId] ?? 0;
      const needed = Math.ceil(entry.qty);
      const missing = Math.max(0, needed - owned);
      const sourceEntry = getBestSourceIndexEntry(bestSourceIndex, entry.itemId);
      const best = sourceEntry?.primarySource ?? sourceEntry?.sourceOptions[0] ?? null;
      const sourceLabel = best ? getWorldModuleLabel(best.moduleKey) : 'No live source route';
      const canRoute = Boolean(
        cityId
        && best
        && ['outskirts', 'ruins', 'bounties', 'expeditions', 'apothecary'].includes(best.moduleKey),
      );
      return {
        itemId: entry.itemId,
        itemName: getItemDef(entry.itemId)?.name ?? entry.itemId,
        owned,
        needed,
        missing,
        sourceLabel,
        sourceReason: best?.shortReason ?? 'No live source route available.',
        canRoute,
        routeCityId: (best?.cityId ?? cityId) ?? null,
        routeModuleKey: best?.moduleKey ?? null,
      };
    });
  }, [bestSourceIndex, cityId, inventoryItems, selectedBlueprint]);

  const floorDeltaRows = useMemo(() => {
    const next = floorModel.nextGateRecommendation;
    if (!next) return [];
    return [
      { key: 'weapon', label: 'Weapon refine', current: floorModel.weaponRefineFloor, target: next.weaponRefine },
      { key: 'accessory', label: 'Accessory refine', current: floorModel.accessoryRefineFloor, target: next.accessoryRefine },
      { key: 'temper', label: 'Temper successes', current: floorModel.temperSuccessTotal, target: next.temperSuccesses },
    ].map((entry) => ({ ...entry, deficit: Math.max(0, entry.target - entry.current) }));
  }, [floorModel.accessoryRefineFloor, floorModel.nextGateRecommendation, floorModel.temperSuccessTotal, floorModel.weaponRefineFloor]);

  const topForgeShortfall = floorDeltaRows.find((entry) => entry.deficit > 0) ?? null;

  const handleStart = () => {
    if (!selectedBlueprint || !canStart || isLocked) return;
    setSessionStatus(null);
    const mode = toForgeJobMode(currentMode);
    const result = startForgeJob({
      blueprintId: selectedBlueprint.id,
      mode,
      qty: 1,
      targetSlot: selectedTargetSlot,
    });
    if (!result.ok) {
      setSessionStatus(result.error ?? 'Unable to start');
      return;
    }
    setSessionStatus(mode === 'HANDS_ON' ? 'Hands-on session started.' : 'Queued forging.');
  };

  return (
    <div className="forgeWorkshop">
      <RunCompassCompact surface={runCompass.compact} tone="ink" className="forgeWorkshop__runCompassCompact" />
      <InkPanel variant="forge" className="forgeWorkshop__banner">
        <div>
          <div className="forgeWorkshop__bannerTitle">Forge Workshop</div>
          <div className="forgeWorkshop__bannerBody">{surfaceModel.headline}</div>
          <div className="forgeWorkshop__bannerHint">{cityName} · {surfaceModel.tabCopy}</div>
          {topForgeShortfall ? (
            <div className="forgeWorkshop__bannerWarning">
              Top shortfall: {topForgeShortfall.label} ({topForgeShortfall.current}/{topForgeShortfall.target})
            </div>
          ) : null}
        </div>
        <div className="forgeWorkshop__resourceRibbon" aria-label="Forge stock snapshot">
          {['mat_spirit_steel_ore', 'mat_quenching_oil', 'mat_artifact_shard'].map((itemId) => (
            <div key={itemId} className="forgeWorkshop__resourceChip">
              <span>{getItemDef(itemId)?.name ?? itemId}</span>
              <strong>{inventoryItems[itemId] ?? 0}</strong>
            </div>
          ))}
        </div>
        <div className="forgeWorkshop__bannerActions">
          <button
            type="button"
            className="worldScreenModuleButton forgeWorkshop__navButton"
            onClick={() => setUiActiveTab('techniques')}
          >
            Techniques
          </button>
          <button
            type="button"
            className="worldScreenModuleButton forgeWorkshop__navButton"
            onClick={() => setUiActiveTab('inventory')}
          >
            Equipment
          </button>
        </div>
        <UsedForLinks usageText="Techniques and equipment upgrades" className="forgeWorkshop__usedFor" />
      </InkPanel>

      <div className="forgeWorkshop__summaryGrid">
        <PaperCard variant="tray" className="forgeWorkshop__summaryCard">
          <div className="forgeWorkshop__summaryLabel">Current forge floor</div>
          <div className="forgeWorkshop__summaryRows">
            <div className="forgeWorkshop__summaryRow"><span>Weapon refine</span><strong>+{floorModel.weaponRefineFloor}</strong></div>
            <div className="forgeWorkshop__summaryRow"><span>Accessory refine</span><strong>+{floorModel.accessoryRefineFloor}</strong></div>
            <div className="forgeWorkshop__summaryRow"><span>Temper successes</span><strong>{floorModel.temperSuccessTotal}</strong></div>
            <div className="forgeWorkshop__summaryRow"><span>Rune floor</span><strong>{floorModel.runeSummaryLabel}</strong></div>
          </div>
        </PaperCard>
        <PaperCard variant="tray" className="forgeWorkshop__summaryCard">
          <div className="forgeWorkshop__summaryLabel">Next gate baseline</div>
          {floorModel.nextGateRecommendation ? (
            <div className="forgeWorkshop__summaryRows">
              <div className="forgeWorkshop__summaryRow"><span>Weapon refine</span><strong>+{floorModel.nextGateRecommendation.weaponRefine}</strong></div>
              <div className="forgeWorkshop__summaryRow"><span>Accessory refine</span><strong>+{floorModel.nextGateRecommendation.accessoryRefine}</strong></div>
              <div className="forgeWorkshop__summaryRow"><span>Temper successes</span><strong>{floorModel.nextGateRecommendation.temperSuccesses}</strong></div>
              <div className="forgeWorkshop__summaryRow"><span>Rune target</span><strong>{floorModel.nextGateRecommendation.runeCountLabel}</strong></div>
            </div>
          ) : (
            <div className="forgeWorkshop__summaryEmpty">No next-gate baseline is available for this city yet.</div>
          )}
        </PaperCard>
        <PaperCard variant="tray" className="forgeWorkshop__summaryCard forgeWorkshop__summaryCard--materials">
          <div className="forgeWorkshop__summaryLabel">Missing materials (top blockers)</div>
          {missingMaterialRows.length > 0 ? (
            <div className="forgeWorkshop__summaryRows">
              {missingMaterialRows.map((row) => (
                <div key={row.itemId} className="forgeWorkshop__materialRow">
                  <div className="forgeWorkshop__materialCopy">
                    <strong>{row.itemName}</strong>
                    <span>Missing {row.missing} • {row.sourceLabel}</span>
                    <span>{row.sourceReason}</span>
                  </div>
                  {row.canRoute && row.routeCityId && row.routeModuleKey ? (
                    <button
                      type="button"
                      className="worldScreenModuleButton forgeWorkshop__materialRouteButton"
                      onClick={() => openWorldModule({ cityId: row.routeCityId, moduleKey: row.routeModuleKey })}
                    >
                      Go to {row.sourceLabel}
                    </button>
                  ) : (
                    <span className="forgeWorkshop__materialRouteText">Route in this city is not direct.</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="forgeWorkshop__summaryEmpty">No material blockers for the current blueprint.</div>
          )}
        </PaperCard>
      </div>

      <div className="forgeWorkshop__body">
        <div className="forgeWorkshop__workbench">
          <InkPanel variant="forge" className="forgeWorkshop__workbenchFrame">
            {activeForgeSession?.mode === 'handsOn' && (
              <ErrorBoundary>
                <ForgeMinigame
                  session={activeForgeSession}
                  now={now}
                  blueprintName={selectedBlueprint?.name ?? selectedBlueprint?.id}
                  bonus={selectedBlueprint?.handsOnBonus}
                  onOutcome={() => setSessionStatus('Hands-on session complete.')}
                />
              </ErrorBoundary>
            )}
            {!activeForgeSession && (
              <div className="forgeWorkshop__idleBench">
                <div className="forgeWorkshop__idleTitle">Select a blueprint to begin.</div>
                <div className="forgeWorkshop__idleHint">Workbench ready. Choose a blueprint to forge.</div>
                {selectedBlueprint && (
                  <button
                    type="button"
                    className={classNames('worldScreenModuleButton', 'worldScreenModuleButton--active', {
                      forgeWorkshop__ctaDisabled: !canStart || isLocked || isBlocked,
                    })}
                    disabled={!canStart || isLocked || isBlocked}
                    onClick={handleStart}
                  >
                    Start {currentMode === 'idle' ? 'Idle' : currentMode === 'assisted' ? 'Assisted' : 'Hands-on'}
                  </button>
                )}
                {!selectedBlueprint && <div className="forgeWorkshop__idleHint">Choose a blueprint from the list.</div>}
                {isBlocked && <div className="forgeWorkshop__idleHint">Finish the active activity to start forging.</div>}
                {isLocked && <div className="forgeWorkshop__idleHint">Unlock this blueprint in another city.</div>}
                {!isModeAllowed && selectedBlueprint && (
                  <div className="forgeWorkshop__idleHint">
                    {selectedBlueprint.name ?? selectedBlueprint.id} does not support {currentMode === 'handsOn' ? 'hands-on' : currentMode} mode.
                  </div>
                )}
                {activeTab === 'refine' && isHandsOnMode && (
                  <div className="forgeWorkshop__idleHint">Refine stays queue-first this semester. Use idle or assisted mode.</div>
                )}
                {!canStart && startEligibility.reason && (
                  <div className="forgeWorkshop__idleHint">{startEligibility.reason}</div>
                )}
              </div>
            )}
          </InkPanel>
          {sessionStatus && <div className="forgeWorkshop__status">{sessionStatus}</div>}
        </div>

        <div className="forgeWorkshop__sidebar">
          <PaperCard variant="tray" className="forgeWorkshop__filters">
            <input
              className="forgeWorkshop__search"
              placeholder={`Search ${activeTab}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="forgeWorkshop__processRail" role="tablist" aria-label="Forge process">
              {surfaceModel.tabs.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={classNames('forgeWorkshop__processTab', { 'forgeWorkshop__processTab--active': activeTab === filter.id })}
                  onClick={() => setActiveTab(filter.id)}
                  role="tab"
                  aria-selected={activeTab === filter.id}
                >
                  <span>{filter.label}</span>
                  <strong>{filter.count}</strong>
                </button>
              ))}
            </div>
            <div className="forgeWorkshop__tabCopy">{surfaceModel.tabCopy}</div>
          </PaperCard>

          <PaperCard variant="tray" className="forgeWorkshop__list">
            {filteredBlueprints.length === 0 && (
              <div className="forgeWorkshop__listEmpty">No blueprints match this filter.</div>
            )}
            {filteredBlueprints.map((blueprint) => {
              const output = blueprint.output ? getItemDef(blueprint.output.itemId)?.name ?? blueprint.output.itemId : null;
              const locked = Boolean(blueprint.cityId && cityId && blueprint.cityId !== cityId);
              return (
                <button
                  key={blueprint.id}
                  type="button"
                  className={classNames('forgeWorkshop__rowButton', {
                    'forgeWorkshop__row--active': blueprint.id === selectedBlueprintId,
                    'forgeWorkshop__row--locked': locked,
                  })}
                  onClick={() => setSelectedBlueprintId(blueprint.id)}
                >
                  <PaperCard
                    className={classNames('forgeWorkshop__row', {
                      'forgeWorkshop__row--active': blueprint.id === selectedBlueprintId,
                      'forgeWorkshop__row--locked': locked,
                    })}
                    interactive
                    selected={blueprint.id === selectedBlueprintId}
                    disabled={locked}
                  >
                    <div className="forgeWorkshop__rowIcon">{blueprint.name?.slice(0, 1) ?? '◆'}</div>
                    <div className="forgeWorkshop__rowBody">
                      <div className="forgeWorkshop__rowTitle">{blueprint.name ?? blueprint.id}</div>
                      <div className="forgeWorkshop__rowMeta">
                        {blueprint.cityIndex ? `Tier ${blueprint.cityIndex}` : 'Tier —'}
                        {output ? ` · ${output}` : blueprint.service ? ` · ${blueprint.service}` : ''}
                      </div>
                      {locked && (
                        <div className="forgeWorkshop__rowLock">
                          <GameIcon icon="inkLock" size={12} decorative />
                          <span>Unlock at {blueprint.cityId ?? 'another city'}</span>
                        </div>
                      )}
                    </div>
                  </PaperCard>
                </button>
              );
            })}
          </PaperCard>

          {selectedBlueprint && (
            <InkPanel variant="forge" className="forgeWorkshop__detail">
              <div className="forgeWorkshop__detailHeader">
                <div>
                  <div className="forgeWorkshop__detailTitle">{selectedBlueprint.name ?? selectedBlueprint.id}</div>
                  <div className="forgeWorkshop__detailMeta">Produces: {getProduceSummary(selectedBlueprint.id)}</div>
                </div>
                <div className="forgeWorkshop__detailMeta">Base time: {Math.round(selectedBlueprint.timeSec)}s</div>
              </div>
              <div className="forgeWorkshop__detailGrid">
                <div>
                  <div className="forgeWorkshop__detailLabel">Requirements</div>
                  {requirementRows.length === 0 && <div className="forgeWorkshop__detailValue">No material requirements.</div>}
                  {requirementRows.map((entry) => (
                    <div
                      key={entry.itemId}
                      className={classNames('forgeWorkshop__requirementRow', { 'forgeWorkshop__requirementRow--missing': entry.missing > 0 })}
                    >
                      <div className="forgeWorkshop__requirementMain">
                        <strong>{entry.itemName}</strong>
                        <span>
                          Owned {entry.owned} / Needed {entry.needed}
                          {entry.missing > 0 ? ` • Missing ${entry.missing}` : ' • Ready'}
                        </span>
                        <span>{entry.sourceLabel} • {entry.sourceReason}</span>
                      </div>
                      {entry.canRoute && entry.routeCityId && entry.routeModuleKey ? (
                        <button
                          type="button"
                          className="worldScreenModuleButton forgeWorkshop__requirementRouteButton"
                          onClick={() => openWorldModule({ cityId: entry.routeCityId, moduleKey: entry.routeModuleKey })}
                        >
                          Source
                        </button>
                      ) : (
                        <span className="forgeWorkshop__materialRouteText">No direct route</span>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="forgeWorkshop__detailLabel">Output</div>
                  <div className="forgeWorkshop__detailValue">{getProduceSummary(selectedBlueprint.id)}</div>
                </div>
              </div>
              <div className="forgeWorkshop__detailSection">
                <div className="forgeWorkshop__detailLabel">Permanent-floor impact</div>
                <div className="forgeWorkshop__detailValue">
                  {activeTab === 'refine'
                    ? `Current weapon +${floorModel.weaponRefineFloor} / accessory +${floorModel.accessoryRefineFloor}.`
                    : activeTab === 'temper'
                      ? `Current temper total ${floorModel.temperSuccessTotal} (${floorModel.temperSuccessesBySlot.weapon} weapon, ${floorModel.temperSuccessesBySlot.accessory} accessory).`
                      : `Current rune floor: ${floorModel.runeSummaryLabel}.`}
                </div>
              </div>
              {floorDeltaRows.length > 0 ? (
                <div className="forgeWorkshop__detailSection">
                  <div className="forgeWorkshop__detailLabel">Current → next baseline</div>
                  <div className="forgeWorkshop__deltaSlab">
                    {floorDeltaRows.map((entry) => (
                      <div key={entry.key} className="forgeWorkshop__deltaRow">
                        <span>{entry.label}</span>
                        <span>{entry.current} → {entry.target}</span>
                        <strong>{entry.deficit > 0 ? `Need +${entry.deficit}` : 'Met'}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {selectedBlueprint.type === 'service' &&
                (selectedBlueprint.service === 'refine' || selectedBlueprint.service === 'temper') && (
                  <div className="forgeWorkshop__detailSection">
                    <div className="forgeWorkshop__detailLabel">Target slot</div>
                    <div className="forgeWorkshop__slotButtons">
                      <button
                        type="button"
                        className={classNames('forgeWorkshop__slotButton', {
                          'forgeWorkshop__slotButton--active': selectedServiceSlot === 'weapon',
                        })}
                        onClick={() => setSelectedServiceSlot('weapon')}
                      >
                        Weapon
                      </button>
                      <button
                        type="button"
                        className={classNames('forgeWorkshop__slotButton', {
                          'forgeWorkshop__slotButton--active': selectedServiceSlot === 'accessory',
                        })}
                        onClick={() => setSelectedServiceSlot('accessory')}
                      >
                        Accessory
                      </button>
                    </div>
                  </div>
                )}
              <div className="forgeWorkshop__stepPreview">
                {stepPreview.map((step, index) => (
                  <div key={step.id} className="forgeWorkshop__stepPreviewItem">
                    <span className="forgeWorkshop__stepIcon" aria-hidden="true">
                      <GameIcon icon={step.iconId} size={14} decorative />
                    </span>
                    <span className="forgeWorkshop__stepLabel">{step.label}</span>
                    {index < stepPreview.length - 1 && <span className="forgeWorkshop__stepArrow">→</span>}
                  </div>
                ))}
              </div>
              <div className="forgeWorkshop__stepSummary">
                {stepSummary.map((step, index) => (
                  <span key={`${step}-${index}`} className="forgeWorkshop__step">
                    {step}
                    {index < stepSummary.length - 1 && <span className="forgeWorkshop__stepArrow">→</span>}
                  </span>
                ))}
              </div>
              <div className="craftingModeSelector">
                <div className="craftingModeLabel">Mode</div>
                <div className="craftingModeButtons craftModeTabs">
                  {allowedModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={classNames('craftingModeButton craftModeTab', {
                        'craftingModeButton--active': currentMode === mode,
                        'craftModeTab--active': currentMode === mode,
                      })}
                      onClick={() => setCraftMode('forge', mode)}
                    >
                      {mode === 'idle' ? 'Idle' : mode === 'assisted' ? 'Assisted' : 'Hands-on'}
                    </button>
                  ))}
                </div>
                <div className="forgeWorkshop__modeCopy">{MODE_COPY[currentMode]}</div>
              </div>
              <div className="forgeWorkshop__benefits">
                {BENEFITS.map((benefit) => (
                  <div key={benefit.mode} className="forgeWorkshop__benefitRow">
                    <div className="forgeWorkshop__benefitLabel">{benefit.label}</div>
                    <div className="forgeWorkshop__benefitValue">{benefit.detail}</div>
                  </div>
                ))}
              </div>
            </InkPanel>
          )}
        </div>
      </div>

      <InkPanel variant="forge" className="forgeWorkshop__queue">
        <div className="forgeWorkshop__queueHeader">
          <div className="forgeWorkshop__queueTitle">Forge Queue</div>
          <div className="forgeWorkshop__queueSub">Jobs process in order.</div>
        </div>
        {forgeQueue.length === 0 ? (
          <div className="forgeWorkshop__queueEmpty">No forge jobs queued.</div>
        ) : (
          <div className="forgeWorkshop__queueList">
            {forgeQueue.map((job) => {
              const blueprint = getForgeBlueprint(job.blueprintId);
              const status = getForgeJobStatus(job, now);
              const done = status.done;
              const remainingMs = Math.max(0, job.endsAt - now);
              const queueMessage = queueStatus[job.id];
              const label = blueprint
                ? blueprint.type === 'service'
                  ? `${blueprint.service === 'temper' ? 'Temper' : 'Refine'} ${job.targetSlot ?? 'equipment'}`
                  : (() => {
                      const outputItemId = blueprint.output?.itemId;
                      const outputName = outputItemId ? getItemDef(outputItemId)?.name ?? outputItemId : blueprint.id;
                      return `Craft ${outputName} x${job.qty}`;
                    })()
                : job.blueprintId;
              const statusLabel =
                status.status === 'READY_TO_CLAIM'
                  ? 'Ready to claim'
                  : status.status === 'QUEUED'
                    ? 'Queued'
                    : job.mode === 'HANDS_ON'
                      ? 'Hands-on in progress'
                      : 'In progress';
              const modeLabel = job.mode === 'HANDS_ON' ? 'Hands-on' : job.mode === 'ASSISTED' ? 'Assisted' : 'Idle';

              return (
                <PaperCard key={job.id} className="forgeWorkshop__queueCard" variant="tray">
                  <div className="forgeWorkshop__queueRow">
                    <div>
                      <div className="forgeWorkshop__queueName">{label}</div>
                      <div className="forgeWorkshop__queueMeta">
                        {blueprint?.id ?? job.blueprintId} · {modeLabel}
                      </div>
                    </div>
                    <div className="forgeWorkshop__queueTiming">
                      <div>{statusLabel}</div>
                      <div>{done ? '00:00' : status.status === 'ACTIVE' ? `${Math.ceil(remainingMs / 1000)}s` : '--'}</div>
                    </div>
                  </div>
                  <div className="forgeWorkshop__queueActions">
                    <button
                      type="button"
                      className={classNames('worldScreenModuleButton', { 'worldScreenModuleButton--active': done })}
                      disabled={!done}
                      onClick={() => {
                        const result = claimForgeJob(job.id) as { ok: boolean; error?: string; result?: ForgeClaimResult };
                        if (!result.ok) {
                          setQueueStatus((prev) => ({
                            ...prev,
                            [job.id]: { type: 'error', message: result.error ?? 'Unable to claim' },
                          }));
                          return;
                        }
                        if (result.result) {
                          setLastClaimResult(result.result);
                        }
                        setQueueStatus((prev) => ({
                          ...prev,
                          [job.id]: { type: 'success', message: 'Claimed' },
                        }));
                      }}
                    >
                      Claim
                    </button>
                  </div>
                  {queueMessage && (
                    <div
                      className={`forgeWorkshop__queueStatus forgeWorkshop__queueStatus--${queueMessage.type}`}
                      role={queueMessage.type === 'error' ? 'alert' : 'status'}
                    >
                      {queueMessage.message}
                    </div>
                  )}
                </PaperCard>
              );
            })}
          </div>
        )}
      </InkPanel>

      <InkPanel variant="forge" className="forgeWorkshop__meter">
        <div className="forgeWorkshop__meterHeader">Quality &amp; Process</div>
        {qualityBuckets ? (
          <div className="forgeWorkshop__meterGrid">
            <div className="forgeWorkshop__meterRow">
              <div>Heat correctness</div>
              <div className="forgeWorkshop__meterBar">
                <span style={{ width: `${Math.round(qualityBuckets.heat * 100)}%` }} />
              </div>
              <div>{Math.round(qualityBuckets.heat * 100)}%</div>
            </div>
            <div className="forgeWorkshop__meterRow">
              <div>Hammer accuracy</div>
              <div className="forgeWorkshop__meterBar">
                <span style={{ width: `${Math.round(qualityBuckets.hammer * 100)}%` }} />
              </div>
              <div>{Math.round(qualityBuckets.hammer * 100)}%</div>
            </div>
            {qualityBuckets.special !== undefined && (
              <div className="forgeWorkshop__meterRow">
                <div>Special precision</div>
                <div className="forgeWorkshop__meterBar">
                  <span style={{ width: `${Math.round(qualityBuckets.special * 100)}%` }} />
                </div>
                <div>{Math.round(qualityBuckets.special * 100)}%</div>
              </div>
            )}
          </div>
        ) : (
          <div className="forgeWorkshop__meterEmpty">Play hands-on to improve these.</div>
        )}
      </InkPanel>

      {lastClaimResult && (
        <div className="modalOverlay forgeResultModal">
          <div className="modalCard">
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Forging Complete</div>
                <div className="modalSubtitle">{resultBlueprint?.name ?? lastClaimResult.blueprintId}</div>
              </div>
              <div className="forgeResultGrade">{resolveQualityLabel(lastClaimResult.performance?.qualityScore)}</div>
            </div>

            <div className="modalBody">
              <div className="forgeResultGrid">
                <div className="forgeResultSection">
                  <div className="sectionLabel">Output</div>
                  {lastClaimResult.resultSnapshot?.outputBundle?.items?.length ? (
                    lastClaimResult.resultSnapshot.outputBundle.items.map((entry) => {
                      const def = getItemDef(entry.itemId);
                      return (
                        <div key={entry.itemId} className="forgeResultRow">
                          <div>{def?.name ?? entry.itemId}</div>
                          <div className="resultQty">x{entry.qty}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="forgeResultRow">Service applied.</div>
                  )}
                </div>

                <div className="forgeResultSection">
                  <div className="sectionLabel">Quality</div>
                  <div className="forgeResultRow">Score: {Math.round(lastClaimResult.performance?.qualityScore ?? 0)}%</div>
                  <div className="forgeResultRow">
                    Heat: {Math.round((lastClaimResult.performance?.heatScore ?? 0) * 100)}%
                  </div>
                  <div className="forgeResultRow">
                    Hammer: {Math.round((lastClaimResult.performance?.hammerScore ?? 0) * 100)}%
                  </div>
                  {lastClaimResult.performance?.specialScore !== undefined && (
                    <div className="forgeResultRow">
                      Special: {Math.round(lastClaimResult.performance.specialScore * 100)}%
                    </div>
                  )}
                </div>
              </div>

              {resultDelta && (
                <div className="forgeResultSection">
                  <div className="sectionLabel">Before → After</div>
                  <div className="forgeResultDelta">
                    {resultDelta.lines.map((line) => (
                      <div key={line.label} className="forgeResultDeltaRow">
                        <div className="forgeResultDeltaLabel">{line.label}</div>
                        <div className="forgeResultDeltaValues">
                          <span>{line.before}</span>
                          <span className="forgeResultDeltaArrow">→</span>
                          <span>{line.after}</span>
                        </div>
                        <div className="forgeResultDeltaValue">{line.delta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modalActions">
              <button
                type="button"
                className="worldScreenModuleButton"
                onClick={() => {
                  setActiveTab('inventory');
                  setLastClaimResult(null);
                }}
              >
                Equip / View item
              </button>
              {showTechniquesCta && (
                <button
                  type="button"
                  className="worldScreenModuleButton"
                  onClick={() => {
                    setActiveTab('techniques');
                    setLastClaimResult(null);
                  }}
                >
                  Go to Techniques
                </button>
              )}
              <button
                type="button"
                className="worldScreenModuleButton worldScreenModuleButton--active"
                onClick={() => setLastClaimResult(null)}
              >
                Forge again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
