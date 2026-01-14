import classNames from 'classnames';
import { useEffect, useMemo, useState } from 'react';

import { ForgeMinigame } from './ForgeMinigame';
import { ErrorBoundary } from '../../../ui/feedback/ErrorBoundary';
import { UsedForLinks } from '../../../components/crafting/UsedForLinks';
import { computeForgeOutcome } from '../../../systems/crafting/forgeOutcome';
import { listForgeBlueprints, getItemDef } from '../../../stores/contentStore';
import { useCraftSessionStore } from '../../../stores/craftSessionStore';
import { useProfessionStore } from '../../../stores/professionStore';
import { useUIStore } from '../../../stores/uiStore';
import { useActivityStore } from '../../../stores/activityStore';
import { isRuneBlueprint, isRefineBlueprint } from '../../../content';
import './ForgeWorkshop.scss';

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

export function ForgeWorkshop({ cityId }: { cityId: string | null }) {
  const setActiveTab = useUIStore((state) => state.setActiveTab);
  const setCraftMode = useCraftSessionStore((state) => state.setMode);
  const modeByStation = useCraftSessionStore((state) => state.modeByStation);
  const startSession = useCraftSessionStore((state) => state.startSession);
  const activeSession = useCraftSessionStore((state) => state.activeSession);
  const startForge = useProfessionStore((state) => state.startForge);
  const activeActivity = useActivityStore((state) => state.active);

  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [filterId, setFilterId] = useState('all');
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);

  const currentMode = modeByStation.forge ?? 'idle';

  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(handle);
  }, []);

  const activeForgeSession = activeSession?.station === 'forge' ? activeSession : null;
  const activeOtherStation = activeSession && activeSession.station !== 'forge';

  const blueprints = useMemo(() => listForgeBlueprints(), []);
  const filteredBlueprints = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return blueprints.filter((blueprint) => {
      if (filterId === 'refine' && !isRefineBlueprint(blueprint)) return false;
      if (filterId === 'rune' && !isRuneBlueprint(blueprint)) return false;
      if (filterId === 'formation' && !blueprint.tags?.some((tag) => tag.includes('formation'))) return false;
      if (filterId === 'components' && (isRuneBlueprint(blueprint) || isRefineBlueprint(blueprint))) return false;
      if (!lowered) return true;
      const outputName = blueprint.output ? getItemDef(blueprint.output.itemId)?.name ?? blueprint.output.itemId : '';
      return blueprint.name?.toLowerCase().includes(lowered) || outputName.toLowerCase().includes(lowered);
    });
  }, [blueprints, filterId, query]);

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

  const stepSummary = useMemo(() => {
    const steps = selectedBlueprint?.stepScript?.map((step) => step.type) ?? [];
    return buildStepSummary(steps);
  }, [selectedBlueprint]);

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

  const canStart = Boolean(selectedBlueprint && selectedBlueprint.type === 'craft');
  const isLocked = Boolean(selectedBlueprint?.cityId && cityId && selectedBlueprint.cityId !== cityId);
  const isBlocked = Boolean(activeOtherStation || activeActivity);

  const handleStart = () => {
    if (!selectedBlueprint || !canStart || isLocked) return;
    setSessionStatus(null);
    if (currentMode === 'idle') {
      const result = startForge(selectedBlueprint.id, 1);
      if (!result.ok) {
        setSessionStatus(result.error ?? 'Unable to start');
        return;
      }
      setSessionStatus('Queued forging.');
      return;
    }
    const result = startSession({
      station: 'forge',
      mode: currentMode as 'assisted' | 'handsOn',
      sourceId: selectedBlueprint.id,
      qty: 1,
      now: Date.now(),
    });
    if (!result.ok) {
      setSessionStatus(`Cannot start: ${result.reason}`);
      return;
    }
    setSessionStatus('Session started.');
  };

  return (
    <div className="forgeWorkshop">
      <div className="forgeWorkshop__banner">
        <div>
          <div className="forgeWorkshop__bannerTitle">Forge Workshop</div>
          <div className="forgeWorkshop__bannerBody">Refine gear and craft runes that empower techniques.</div>
        </div>
        <div className="forgeWorkshop__bannerActions">
          <button type="button" className="worldScreenModuleButton" onClick={() => setActiveTab('techniques')}>
            Techniques
          </button>
          <button type="button" className="worldScreenModuleButton" onClick={() => setActiveTab('inventory')}>
            Equipment
          </button>
        </div>
        <UsedForLinks usageText="Techniques and equipment upgrades" className="forgeWorkshop__usedFor" />
      </div>

      <div className="forgeWorkshop__body">
        <div className="forgeWorkshop__workbench">
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
                {!canStart && selectedBlueprint?.type === 'service' && (
                  <div className="forgeWorkshop__idleHint">Service blueprints start from the queue panel.</div>
                )}
              </div>
            )}
          </div>
          {sessionStatus && <div className="forgeWorkshop__status">{sessionStatus}</div>}
        </div>

        <div className="forgeWorkshop__sidebar">
          <div className="forgeWorkshop__filters">
            <input
              className="forgeWorkshop__search"
              placeholder="Search blueprints"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
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

          <div className="forgeWorkshop__list">
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
                    {locked && <div className="forgeWorkshop__rowLock">🔒 Unlock at {blueprint.cityId ?? 'another city'}</div>}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedBlueprint && (
            <div className="forgeWorkshop__detail">
              <div className="forgeWorkshop__detailHeader">
                <div>
                  <div className="forgeWorkshop__detailTitle">{selectedBlueprint.name ?? selectedBlueprint.id}</div>
                  <div className="forgeWorkshop__detailMeta">Produces: {getProduceSummary(selectedBlueprint.id)}</div>
                </div>
                <div className="forgeWorkshop__detailMeta">Base time: {Math.round(selectedBlueprint.timeSec)}s</div>
              </div>
              <div className="forgeWorkshop__detailGrid">
                <div>
                  <div className="forgeWorkshop__detailLabel">Inputs</div>
                  {selectedBlueprint.costs.items.length === 0 && <div className="forgeWorkshop__detailValue">None</div>}
                  {selectedBlueprint.costs.items.map((entry) => (
                    <div key={entry.itemId} className="forgeWorkshop__detailValue">
                      {getItemDef(entry.itemId)?.name ?? entry.itemId} ×{entry.qty}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="forgeWorkshop__detailLabel">Output</div>
                  <div className="forgeWorkshop__detailValue">{getProduceSummary(selectedBlueprint.id)}</div>
                </div>
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
              <div className="forgeWorkshop__benefits">
                {BENEFITS.map((benefit) => (
                  <div key={benefit.mode} className="forgeWorkshop__benefitRow">
                    <div className="forgeWorkshop__benefitLabel">{benefit.label}</div>
                    <div className="forgeWorkshop__benefitValue">{benefit.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
    </div>
  );
}
