import classNames from 'classnames';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlayerStats } from '../../../types';

import { ForgeMinigame } from './ForgeMinigame';
import { ForgeBlueprintDetailModal } from './ForgeBlueprintDetailModal';
import { ErrorBoundary } from '../../../ui/feedback/ErrorBoundary';
import { UsedForLinks } from '../../../components/crafting/UsedForLinks';
import { computeForgeOutcome } from '../../../systems/crafting/forgeOutcome';
import { listForgeBlueprints, getForgeBlueprint, getItemDef } from '../../../stores/contentStore';
import { useCraftSessionStore } from '../../../stores/craftSessionStore';
import { useProfessionStore } from '../../../stores/professionStore';
import { useUIStore } from '../../../stores/uiStore';
import { useActivityStore } from '../../../stores/activityStore';
import { isRuneBlueprint, isRefineBlueprint } from '../../../content';
import { buildItemDelta } from './forgeDelta';
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

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'refine', label: 'Refine' },
  { id: 'rune', label: 'Rune' },
  { id: 'formation', label: 'Formation' },
  { id: 'components', label: 'Components' },
];

const MODE_COPY = {
  idle: 'Fast, baseline quality.',
  assisted: "Mostly automatic, lands 'Good' performance.",
  handsOn: 'Play the session. Best quality / best proc chance.',
} as const;

 
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
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const setCraftMode = useCraftSessionStore((state) => state.setMode);
  const modeByStation = useCraftSessionStore((state) => state.modeByStation);
  const activeSession = useCraftSessionStore((state) => state.activeSession);
  const startForgeJob = useProfessionStore((state) => state.startForgeJob);
  const claimForgeJob = useProfessionStore((state) => state.claimForgeJob);
  const forgeQueue = useProfessionStore((state) => state.forgeQueue);
  const canStartForge = useProfessionStore((state) => state.canStartForge);
  const getForgeJobStatus = useProfessionStore((state) => state.getForgeJobStatus);
  const activeActivity = useActivityStore((state) => state.active);

  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [filterId, setFilterId] = useState('all');
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tierFilter, setTierFilter] = useState<'all' | number>('all');
  const [sortMode, setSortMode] = useState<'name' | 'tier' | 'time'>('name');
  const [now, setNow] = useState(() => Date.now());
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const [selectedServiceSlot, setSelectedServiceSlot] = useState<'weapon' | 'accessory'>('weapon');
  const [lastClaimResult, setLastClaimResult] = useState<ForgeClaimResult | null>(null);
  const detailsOpenerRef = useRef<HTMLButtonElement | null>(null);

  const currentMode = modeByStation.forge ?? 'idle';

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(handle);
  }, []);

  const activeForgeSession = activeSession?.station === 'forge' ? activeSession : null;
  const activeOtherStation = activeSession && activeSession.station !== 'forge';

  const blueprints = useMemo(() => listForgeBlueprints(), []);
  const availableTiers = useMemo(() => {
    const tiers = new Set<number>();
    blueprints.forEach((blueprint) => {
      if (typeof blueprint.cityIndex === 'number') {
        tiers.add(blueprint.cityIndex);
      }
    });
    return Array.from(tiers).sort((a, b) => a - b);
  }, [blueprints]);

  const filteredBlueprints = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    let list = blueprints.filter((blueprint) => {
      if (filterId === 'refine' && !isRefineBlueprint(blueprint)) return false;
      if (filterId === 'rune' && !isRuneBlueprint(blueprint)) return false;
      if (filterId === 'formation' && !blueprint.tags?.some((tag) => tag.includes('formation'))) return false;
      if (filterId === 'components' && (isRuneBlueprint(blueprint) || isRefineBlueprint(blueprint))) return false;
      if (!lowered) return true;
      const outputName = blueprint.output ? getItemDef(blueprint.output.itemId)?.name ?? blueprint.output.itemId : '';
      return blueprint.name?.toLowerCase().includes(lowered) || outputName.toLowerCase().includes(lowered);
    });
    if (tierFilter !== 'all') {
      list = list.filter((blueprint) => blueprint.cityIndex === tierFilter);
    }
    return [...list].sort((a, b) => {
      if (sortMode === 'time') {
        return a.timeSec - b.timeSec;
      }
      if (sortMode === 'tier') {
        const tierA = a.cityIndex ?? 0;
        const tierB = b.cityIndex ?? 0;
        if (tierA !== tierB) return tierA - tierB;
      }
      const nameA = a.name ?? a.id;
      const nameB = b.name ?? b.id;
      return nameA.localeCompare(nameB);
    });
  }, [blueprints, filterId, query, sortMode, tierFilter]);

  useEffect(() => {
    if (activeForgeSession?.sourceId) {
      setSelectedBlueprintId(activeForgeSession.sourceId);
      return;
    }
    if (!selectedBlueprintId && filteredBlueprints.length > 0) {
      setSelectedBlueprintId(filteredBlueprints[0].id);
    }
  }, [activeForgeSession?.sourceId, filteredBlueprints, selectedBlueprintId]);

  const selectedBlueprint = useMemo(
    () => blueprints.find((blueprint) => blueprint.id === selectedBlueprintId) ?? null,
    [blueprints, selectedBlueprintId],
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
  const canStart = Boolean(
    selectedBlueprint &&
      startEligibility.ok &&
      !(isHandsOnMode && selectedBlueprint.type === 'service'),
  );
  const isLocked = Boolean(selectedBlueprint?.cityId && cityId && selectedBlueprint.cityId !== cityId);
  const isBlocked = Boolean(activeOtherStation || (activeActivity && activeActivity.type !== 'forge'));
  const requirementCount = selectedBlueprint ? selectedBlueprint.costs.items.length : 0;
  const hasCurrencyCost = Boolean(
    selectedBlueprint && (selectedBlueprint.costs.gold > 0 || selectedBlueprint.costs.spiritStones > 0),
  );
  const processStepCount = selectedBlueprint?.stepScript?.length ?? 0;
  const handsOnAvailable = Boolean(selectedBlueprint?.handsOnBonus);
  const queueSummary = useMemo(() => {
    let ready = 0;
    forgeQueue.forEach((job) => {
      if (getForgeJobStatus(job, now).status === 'READY_TO_CLAIM') {
        ready += 1;
      }
    });
    return { total: forgeQueue.length, ready };
  }, [forgeQueue, getForgeJobStatus, now]);
  const ribbonStatus = sessionStatus ?? (activeForgeSession ? 'Hands-on session active.' : null);

  const handleStart = () => {
    if (!selectedBlueprint || !canStart || isLocked) return;
    setSessionStatus(null);
    const mode = currentMode === 'handsOn' ? 'HANDS_ON' : currentMode === 'assisted' ? 'ASSISTED' : 'IDLE';
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
    <div className="forgeWorkshop forgeWorkshop--v2">
      <header className="forgeWorkshopRibbon">
        <div className="forgeWorkshopRibbon__left">
          <div className="forgeWorkshopRibbon__title">Forge Workshop</div>
          <div className="forgeWorkshopRibbon__subtitle">Refine gear and craft runes that empower techniques.</div>
          <div className="forgeWorkshopRibbon__actions">
            <button type="button" className="worldScreenModuleButton" onClick={() => setActiveTab('techniques')}>
              Techniques
            </button>
            <button type="button" className="worldScreenModuleButton" onClick={() => setActiveTab('inventory')}>
              Equipment
            </button>
          </div>
          <UsedForLinks usageText="Techniques and equipment upgrades" className="forgeWorkshopRibbon__usedFor" />
        </div>
        <div className="forgeWorkshopRibbon__center">
          <div className={classNames('forgeWorkshopRibbon__status', { 'forgeWorkshopRibbon__status--idle': !ribbonStatus })}>
            {ribbonStatus ?? 'Select a blueprint to begin.'}
          </div>
          <div className="forgeWorkshopRibbon__microcopy">Select → Prepare → Forge → Claim</div>
          {isBlocked && <div className="forgeWorkshopRibbon__notice">Finish the active activity to start forging.</div>}
        </div>
        <div className="forgeWorkshopRibbon__right">
          <button
            type="button"
            className={classNames('forgeWorkshopRibbon__toggle', { 'is-active': queueOpen })}
            onClick={() => setQueueOpen((prev) => !prev)}
          >
            Queue ({queueSummary.total}) • Ready {queueSummary.ready}
            {queueSummary.ready > 0 && <span className="forgeWorkshopRibbon__dot" aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={classNames('forgeWorkshopRibbon__toggle', { 'is-active': filtersOpen })}
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            Filters {filtersOpen ? '▾' : '▸'}
          </button>
        </div>
      </header>

      <div className={classNames('forgeWorkshopStage', { 'forgeWorkshopStage--queueOpen': queueOpen })}>
        <aside className="forgeWorkshopDrawer">
          <div className="forgeWorkshopDrawer__header">
            <div>
              <div className="forgeWorkshopDrawer__title">Blueprint Library</div>
              <div className="forgeWorkshopDrawer__sub">{filteredBlueprints.length} designs</div>
            </div>
          </div>
          <div className="forgeWorkshopDrawer__scroll">
            <div className="forgeWorkshopDrawer__search">
              <input
                className="forgeWorkshop__search"
                placeholder="Search blueprints"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {filtersOpen && (
              <div className="forgeWorkshopDrawer__advanced">
                <div className="forgeWorkshopDrawer__section">
                  <div className="forgeWorkshopDrawer__label">Type</div>
                  <div className="forgeWorkshop__chips">
                    {FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={classNames('forgeWorkshop__chip', { 'forgeWorkshop__chip--active': filterId === filter.id })}
                        onClick={() => setFilterId(filter.id)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="forgeWorkshopDrawer__section">
                  <div className="forgeWorkshopDrawer__label">Tier</div>
                  <div className="forgeWorkshopDrawer__tiers">
                    <button
                      type="button"
                      className={classNames('forgeWorkshop__chip', { 'forgeWorkshop__chip--active': tierFilter === 'all' })}
                      onClick={() => setTierFilter('all')}
                    >
                      All
                    </button>
                    {availableTiers.map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        className={classNames('forgeWorkshop__chip', { 'forgeWorkshop__chip--active': tierFilter === tier })}
                        onClick={() => setTierFilter(tier)}
                      >
                        Tier {tier}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="forgeWorkshopDrawer__section">
                  <div className="forgeWorkshopDrawer__label">Sort</div>
                  <div className="forgeWorkshopDrawer__sort">
                    {(['name', 'tier', 'time'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={classNames('forgeWorkshop__chip', { 'forgeWorkshop__chip--active': sortMode === mode })}
                        onClick={() => setSortMode(mode)}
                      >
                        {mode === 'name' ? 'Name' : mode === 'tier' ? 'Tier' : 'Time'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="forgeWorkshopDrawer__list">
              {filteredBlueprints.length === 0 && (
                <div className="forgeWorkshop__listEmpty">No blueprints match this filter.</div>
              )}
              {filteredBlueprints.map((blueprint) => {
                const output = blueprint.output ? getItemDef(blueprint.output.itemId)?.name ?? blueprint.output.itemId : null;
                const locked = Boolean(blueprint.cityId && cityId && blueprint.cityId !== cityId);
                const rowCategory =
                  blueprint.service ?? blueprint.tags?.[0] ?? (blueprint.type === 'craft' ? 'Craft' : 'Service');
                return (
                  <button
                    key={blueprint.id}
                    type="button"
                    className={classNames('forgeWorkshop__row', {
                      'forgeWorkshop__row--active': blueprint.id === selectedBlueprintId,
                      'forgeWorkshop__row--locked': locked,
                    })}
                    onClick={() => setSelectedBlueprintId(blueprint.id)}
                  >
                    <div className="forgeWorkshop__rowIcon">{blueprint.name?.slice(0, 1) ?? '◆'}</div>
                    <div className="forgeWorkshop__rowBody">
                      <div className="forgeWorkshop__rowTitle">{blueprint.name ?? blueprint.id}</div>
                      <div className="forgeWorkshop__rowMeta">
                        {blueprint.cityIndex ? `Tier ${blueprint.cityIndex}` : 'Tier —'}
                        {output ? ` · ${output}` : blueprint.service ? ` · ${blueprint.service}` : ''}
                      </div>
                      {rowCategory && <span className="forgeWorkshop__rowChip">{rowCategory}</span>}
                      {locked && <div className="forgeWorkshop__rowLock">🔒 Unlock at {blueprint.cityId ?? 'another city'}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="forgeWorkshopWorkbench">
          <div className="forgeWorkshopWorkbench__panel">
            <div className="forgeWorkshopWorkbench__top">
              <div className="forgeWorkshop__workbenchFrame">
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
                    <div className="forgeWorkshop__idleHint">Choose a design, check materials, then start forging.</div>
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
                    {!selectedBlueprint && <div className="forgeWorkshop__idleHint">Blueprint list is on the left.</div>}
                    {isLocked && <div className="forgeWorkshop__idleHint">Unlock this blueprint in another city.</div>}
                    {isHandsOnMode && selectedBlueprint?.type === 'service' && (
                      <div className="forgeWorkshop__idleHint">Hands-on forging is only for crafted items.</div>
                    )}
                    {!canStart && startEligibility.reason && (
                      <div className="forgeWorkshop__idleHint">{startEligibility.reason}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="forgeWorkshopWorkbench__bottom">
              {!selectedBlueprint && (
                <div className="forgeWorkshopWorkbench__empty">
                  <div className="forgeWorkshopWorkbench__emptyTitle">Select a blueprint to begin.</div>
                  <div className="forgeWorkshopWorkbench__emptyBody">
                    Choose a design, confirm materials, and begin the forge ritual.
                  </div>
                  <button
                    type="button"
                    className="worldScreenModuleButton forgeDetailsButton"
                    disabled
                    title="Select a blueprint first"
                  >
                    Details
                  </button>
                </div>
              )}
              {selectedBlueprint && (
                <div className="forgeWorkshop__detail">
                  <div className="forgeWorkshop__detailHeader">
                    <div>
                      <div className="forgeWorkshop__detailTitle">{selectedBlueprint.name ?? selectedBlueprint.id}</div>
                      <div className="forgeWorkshop__detailMeta">{getProduceSummary(selectedBlueprint.id)}</div>
                    </div>
                    <div className="forgeWorkshop__detailActions">
                      <div className="forgeWorkshop__detailMeta">
                        {selectedBlueprint.cityIndex ? `Tier ${selectedBlueprint.cityIndex}` : 'Tier —'} ·{' '}
                        {Math.round(selectedBlueprint.timeSec)}s
                      </div>
                      <button
                        ref={detailsOpenerRef}
                        type="button"
                        className="worldScreenModuleButton forgeDetailsButton"
                        onClick={() => setDetailsOpen(true)}
                        disabled={!selectedBlueprint}
                        title={!selectedBlueprint ? 'Select a blueprint first' : 'Open blueprint details'}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                  <div className="forgeWorkshop__detailSummary">
                    <span>
                      {requirementCount > 0 ? `Requires ${requirementCount} materials` : 'No materials required'}
                    </span>
                    {hasCurrencyCost && <span>Currency costs apply</span>}
                    <span>{processStepCount > 0 ? `Process: ${processStepCount} steps` : 'Process: Auto'}</span>
                    <span>{handsOnAvailable ? 'Hands-on available' : 'Auto only'}</span>
                  </div>
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
                  <div className="craftingModeSelector">
                    <div className="craftingModeLabel">Mode</div>
                    <div className="craftingModeButtons craftModeTabs">
                      {(['idle', 'assisted', 'handsOn'] as const).map((mode) => (
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
                </div>
              )}
            </div>
          </div>
        </main>

        {queueOpen && (
          <aside className="forgeWorkshopQueueRail">
            <div className="forgeWorkshop__queue">
              <div className="forgeWorkshop__queueHeader">
                <div className="forgeWorkshop__queueTitle">Forge Queue</div>
                <div className="forgeWorkshop__queueSub">Jobs process in order.</div>
              </div>
              {forgeQueue.length === 0 ? (
                <div className="forgeWorkshop__queueEmpty">
                  <div>No jobs queued.</div>
                  <div>Start forging to queue work.</div>
                </div>
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
                      <div key={job.id} className="forgeWorkshop__queueCard">
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="forgeWorkshop__meter">
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
            </div>
          </aside>
        )}
      </div>

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
      <ForgeBlueprintDetailModal
        open={detailsOpen}
        blueprintId={selectedBlueprint?.id ?? null}
        onClose={() => setDetailsOpen(false)}
        openerRef={detailsOpenerRef}
      />
    </div>
  );
}
