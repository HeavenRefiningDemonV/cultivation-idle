import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { deepEqualProps } from './fx/memoProps.js';
import type { StatusLedgerActionSurface, StatusLedgerTone } from '../../../systems/ui/status/statusLedgerTypes.js';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import type { ObservatoryCanopyMode } from '../../../systems/ui/status/statusObservatoryPresentation.js';
import { StatusBottleneckInspector } from './StatusBottleneckInspector.js';
import { StatusCausalThreadLayer } from './StatusCausalThreadLayer.js';
import { useObservatorySelection } from './useObservatorySelection.js';
import { useRitualMotion } from './fx/useRitualMotion.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';
import { InkTassel } from '../../ink/InkTassel.js';

export type StatusBottleneckCanopyPart = 'cluster' | 'charms' | 'safety';

export interface StatusBottleneckTalismanCanopyProps {
  surface: StatusObservatorySurfaceV1['bottleneckCanopy'];
  canopyMode?: ObservatoryCanopyMode;
  onAction?: (action: StatusLedgerActionSurface) => void;
  /** V7 three-panel split: which sub-panel this instance renders.
     'cluster' (default) = central edict + 4 slips + cords (obs-region-canopy);
     'charms' = best-improvement charm rail (obs-region-charms);
     'safety' = mercy / safety-net seal (obs-region-safety). */
  part?: StatusBottleneckCanopyPart;
}

function toneOf(action: StatusLedgerActionSurface | null | undefined, fallback: StatusLedgerTone): StatusLedgerTone {
  return action?.tone ?? fallback;
}

function charmDisabled(action: StatusLedgerActionSurface, onAction: StatusBottleneckTalismanCanopyProps['onAction']): boolean {
  return action.disabled || !onAction;
}

function slotStyle(slot: { x: number; y: number; rotationDeg: number }): CSSProperties {
  return {
    '--slip-x': `${slot.x}`,
    '--slip-y': `${slot.y}`,
    '--slip-rotation': `${slot.rotationDeg}deg`,
  } as CSSProperties;
}

function defaultSlipId(surface: StatusObservatorySurfaceV1['bottleneckCanopy']): string | null {
  return surface.inspector.selectedSlipId
    ?? surface.talismanSlips.find((slip) => slip.routeAction)?.id
    ?? surface.talismanSlips[0]?.id
    ?? null;
}

/* Decorative Kai-ti chop per visual state (chrome only - not surface data). */
const CANOPY_EDICT_CHOP: Record<string, { chars: string; variant: 'cinnabar' | 'jade' }> = {
  blocked: { chars: '瓶頸', variant: 'cinnabar' },
  healthy: { chars: '順遂', variant: 'jade' },
  postFailure: { chars: '敗', variant: 'cinnabar' },
  prestigePressure: { chars: '鼎', variant: 'cinnabar' },
  contentCap: { chars: '待續', variant: 'cinnabar' },
  unknown: { chars: '瓶頸', variant: 'cinnabar' },
};

function edictChop(visualState: string): { chars: string; variant: 'cinnabar' | 'jade' } {
  return CANOPY_EDICT_CHOP[visualState] ?? CANOPY_EDICT_CHOP.unknown;
}

/* Best-improvement charm medallion chrome (artifact charmRod): a fixed Kai-ti
   glyph + jade/gold tone keyed on the charm's POSITION (兵/療/術/心; first two
   jade, last two gold) — decorative-by-position, never surface truth. The
   charm.action / label remain the data the click and a11y read. Capped to the
   artifact's four medallions. */
const CANOPY_CHARM_GLYPHS = ['兵', '療', '術', '心'] as const;
const CANOPY_CHARM_CAP = 4;

function charmGlyph(index: number): string {
  return CANOPY_CHARM_GLYPHS[index] ?? CANOPY_CHARM_GLYPHS[CANOPY_CHARM_GLYPHS.length - 1];
}

/* Charms 0-1 read jade, 2-3 gold (artifact), unless the action tone already
   forces jade/success. Falls back to position when the surface tone is neutral. */
function charmMedallionTone(action: StatusLedgerActionSurface, index: number): 'jade' | 'gold' {
  if (action.tone === 'jade' || action.tone === 'success') return 'jade';
  return index < 2 ? 'jade' : 'gold';
}

/* Artifact center card eyebrow is a fixed section label per canopy mode
   ("CURRENT BOTTLENECK" for the blocked board). Section chrome, not surface
   data — the dynamic sourceLabel renders as a separate attribution line below. */
const CANOPY_EDICT_EYEBROW: Record<ObservatoryCanopyMode, string> = {
  bottleneck: 'Current Bottleneck',
  maintenance: 'Current State',
  failureDiagnosis: 'After Setback',
  reincarnationEdict: 'Reincarnation Edict',
  capNotice: 'Content Frontier',
};

function edictEyebrow(mode: ObservatoryCanopyMode): string {
  return CANOPY_EDICT_EYEBROW[mode] ?? CANOPY_EDICT_EYEBROW.bottleneck;
}

/* Artifact canopyBlocked is a FIXED 5-slot composition: a big centre edict plus
   four corner slips at fixed slots, each on a clean cord dropping straight from
   the rail anchor directly above it. The surface's per-slip geometry scatters
   real-data slips into a crossing tangle, so blocked mode ignores it and pins the
   top four slips to these slots instead (board % of the artifact's 608x560 box,
   centre-anchored to match the --slip-x/--slip-y translate(-50%) model):
   LT, LB, RT, RB. The remaining slips stay reachable via the inspector + ledger. */
const CANOPY_FIXED_SLOTS = [
  { x: 13.7, y: 16.3, rotationDeg: -3, rail: 21.4 },
  { x: 14.6, y: 39.5, rotationDeg: 2, rail: 21.4 },
  { x: 86.4, y: 16.3, rotationDeg: 3, rail: 78.6 },
  { x: 85.5, y: 39.5, rotationDeg: -2, rail: 78.6 },
] as const;
const CANOPY_SLIP_CAP = CANOPY_FIXED_SLOTS.length;

/* Slip half-height as a board % (artifact side slip h90 / 560 => ~8%): the cord
   targets the slip TOP, i.e. the slot centre-y minus this. */
const CANOPY_SLIP_HALF_H = 8;
/* Rail arc height at the side anchors (130/478px => 21.3px on 560 => 3.8%) and at
   the apex above the centre edict (10px => 1.79%). */
const CANOPY_RAIL_SIDE_Y = 3.8;
const CANOPY_RAIL_APEX_Y = 1.79;
/* Cord sag (artifact 26/560 => 4.64%). */
const CANOPY_CORD_SAG = 4.64;
/* Centre edict top as a board % (edict centre top:24% minus its ~13% half-height). */
const CANOPY_EDICT_TOP_Y = 11;

/* Default canopyMode when the shell doesn't thread it (standalone / tests).
   Mirrors resolveObservatoryPresentation()'s visualState -> canopyMode map
   (single source of truth: statusObservatoryPresentation.ts). */
function canopyModeForVisualState(visualState: string): ObservatoryCanopyMode {
  switch (visualState) {
    case 'healthy':
      return 'maintenance';
    case 'postFailure':
      return 'failureDiagnosis';
    case 'prestigePressure':
      return 'reincarnationEdict';
    case 'contentCap':
      return 'capNotice';
    case 'blocked':
      return 'bottleneck';
    default:
      return 'maintenance';
  }
}

export const StatusBottleneckTalismanCanopy = memo(StatusBottleneckTalismanCanopyBase, deepEqualProps);

function StatusBottleneckTalismanCanopyBase({
  surface,
  canopyMode,
  onAction,
  part = 'cluster',
}: StatusBottleneckTalismanCanopyProps) {
  const slipsById = useMemo(() => new Map(surface.talismanSlips.map((slip) => [slip.id, slip])), [surface.talismanSlips]);
  const fallbackSlipId = useMemo(() => defaultSlipId(surface), [surface]);
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(fallbackSlipId);
  const sharedSelection = useObservatorySelection();
  const ritual = useRitualMotion();
  // M.I.3 (G1) — the canopy's qi-flow / breath motion vars cascade from the stage (.obsStageViewport)
  // via CSS; no per-instrument motion is computed here, so live telemetry never re-renders these parts.

  useEffect(() => {
    setSelectedSlipId((current) => (current && slipsById.has(current) ? current : fallbackSlipId));
  }, [fallbackSlipId, slipsById]);

  const selectedSlip = selectedSlipId ? slipsById.get(selectedSlipId) ?? null : surface.talismanSlips[0] ?? null;
  const edictAction = surface.centralEdict.primaryAction;
  const edictDisabled = !edictAction || edictAction.disabled || !onAction;
  const chop = edictChop(surface.centralEdict.visualState);
  const resolvedCanopyMode = canopyMode ?? canopyModeForVisualState(surface.centralEdict.visualState);
  const slipButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const handleSlipRovingKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const active = document.activeElement as HTMLElement | null;
    const currentId = active?.getAttribute?.('data-slip-id');
    if (!currentId) return;
    // Blocked mode pins only the top four slips to fixed slots; roving stays
    // within that rendered set.
    const slips = surface.talismanSlips.slice(0, CANOPY_SLIP_CAP);
    const index = slips.findIndex((slip) => slip.id === currentId);
    if (index < 0) return;
    let target = index;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        target = Math.min(index + 1, slips.length - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        target = Math.max(index - 1, 0);
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = slips.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = slips[target];
    if (!next || next.id === currentId) return;
    setSelectedSlipId(next.id);
    sharedSelection.select('talisman', next.id);
    slipButtonRefs.current.get(next.id)?.focus();
  };

  // Cap / Prestige / Failure are self-contained boards (no separate charm-rail or
  // mercy parts); the cluster renders the whole composition, other parts nothing.
  const clusterOnlyMode =
    resolvedCanopyMode === 'capNotice' ||
    resolvedCanopyMode === 'reincarnationEdict' ||
    resolvedCanopyMode === 'failureDiagnosis' ||
    resolvedCanopyMode === 'maintenance';
  if (clusterOnlyMode && part !== 'cluster') return null;

  if (part === 'charms') {
    return (
      <div
        className="statusObservatoryInstrument statusBottleneckCanopyCharms"
        data-s6-instrument="bottleneck-charms"
        data-visual-state={surface.centralEdict.visualState}
        data-canopy-mode={resolvedCanopyMode}
        data-animate={ritual.animate ? 'true' : 'false'}
        aria-label="Best Improvement Charms"
      >
        <span className="statusBottleneckTalismanCanopy__charmsCaption" aria-hidden="true">Best Improvement Charms</span>
        <div className="statusBottleneckTalismanCanopy__routeCharms" aria-label="Best improvement route charms">
          <div className="statusBottleneckTalismanCanopy__charmRod" aria-hidden="true" />
          {/* Artifact charmRod hangs four gourd/coin medallions; cap to four so a
              5th real charm never crowds the rod. The dropped charms stay reachable
              via the inspector / ledger drawer. */}
          {surface.routeCharms.slice(0, CANOPY_CHARM_CAP).map((charm, index) => {
            const disabled = charmDisabled(charm.action, onAction);
            const medallionTone = charmMedallionTone(charm.action, index);
            return (
              <button
                key={charm.id}
                type="button"
                className="statusBottleneckTalismanCanopy__routeCharm"
                data-testid="status-bottleneck-route-charm"
                data-action-id={charm.action.id}
                data-destination-kind={charm.action.target.kind}
                data-disabled={disabled ? 'true' : 'false'}
                disabled={disabled}
                aria-disabled={disabled ? 'true' : undefined}
                title={charm.action.disabled ? charm.action.disabledReason ?? charm.detail : charm.detail}
                onClick={() => {
                  if (!disabled) onAction?.(charm.action);
                }}
              >
                {/* Vertical gourd/coin medallion (artifact charmRod ellipse): jade
                    for the first two, gold for the rest, with a fixed Kai-ti glyph
                    + tassel. Glyph is decorative-by-position; the label is truth. */}
                <svg className="statusBottleneckTalismanCanopy__charmMedallion" viewBox="0 0 72 94" aria-hidden="true">
                  <line className="statusBottleneckTalismanCanopy__charmCord" x1="36" y1="0" x2="36" y2="16" />
                  <ellipse className="statusBottleneckTalismanCanopy__charmRim" cx="36" cy="46" rx="32" ry="26" />
                  <ellipse
                    className="statusBottleneckTalismanCanopy__charmDisc"
                    data-charm-tone={medallionTone}
                    cx="36"
                    cy="46"
                    rx="28"
                    ry="22"
                  />
                  <ellipse className="statusBottleneckTalismanCanopy__charmShine" cx="36" cy="46" rx="24" ry="18" />
                  <text
                    className="statusBottleneckTalismanCanopy__charmGlyph"
                    x="36"
                    y="47"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {charmGlyph(index)}
                  </text>
                  <InkTassel x={36} y={70} color={medallionTone === 'jade' ? 'var(--observatory-jade)' : 'var(--observatory-cinnabar)'} length={13} />
                </svg>
                <strong>{charm.label}</strong>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (part === 'safety') {
    return (
      <div
        className="statusObservatoryInstrument statusBottleneckCanopySafety"
        data-s6-instrument="bottleneck-safety"
        data-visual-state={surface.centralEdict.visualState}
        data-canopy-mode={resolvedCanopyMode}
        data-animate={ritual.animate ? 'true' : 'false'}
        aria-label="Safety Net"
      >
        <div
          className="statusBottleneckTalismanCanopy__safetySeal"
          data-testid="status-bottleneck-safety-seal"
          data-tone={surface.safetySeal.tone}
          data-has-action={surface.safetySeal.action ? 'true' : 'false'}
          aria-label={`${surface.safetySeal.label}: ${surface.safetySeal.stateLabel}. ${surface.safetySeal.progressLabel}`}
        >
          {/* Artifact mercy seal: a thin cinnabar ring (no filled disc), a dashed
             inner ring, two gold pin-beads, a tassel and a lotus glyph, with the
             state + progress as text inside. Compact, not the old conic disc. */}
          <svg className="statusBottleneckTalismanCanopy__mercyRing" viewBox="0 0 148 132" aria-hidden="true">
            <circle className="statusBottleneckTalismanCanopy__mercyRingOuter" cx="74" cy="58" r="52" />
            <circle className="statusBottleneckTalismanCanopy__mercyRingInner" cx="74" cy="58" r="46" />
            <circle className="statusBottleneckTalismanCanopy__mercyBead" cx="74" cy="10" r="5" />
            <circle className="statusBottleneckTalismanCanopy__mercyBead" cx="120" cy="74" r="4" />
            <InkTassel x={30} y={100} color="var(--observatory-state)" length={16} />
            <g transform="translate(74,44)">
              <path
                className="statusBottleneckTalismanCanopy__lotus"
                d="M0,7 C-11,2 -11,-9 0,-13 C11,-9 11,2 0,7 Z M0,7 C-6,4 -6,-3 0,-6 C6,-3 6,4 0,7"
              />
            </g>
            <text className="statusBottleneckTalismanCanopy__mercyState" x="74" y="72" textAnchor="middle">{surface.safetySeal.stateLabel}</text>
          </svg>
          <span className="statusBottleneckTalismanCanopy__mercyCaption">{surface.safetySeal.label} · Mercy Seal</span>
          <small>{surface.safetySeal.progressLabel}</small>
          {surface.safetySeal.action && !surface.safetySeal.action.disabled ? (
            <button
              type="button"
              data-action-id={surface.safetySeal.action.id}
              disabled={!onAction}
              aria-disabled={!onAction ? 'true' : undefined}
              title={surface.safetySeal.action.detail}
              onClick={() => {
                if (surface.safetySeal.action) onAction?.(surface.safetySeal.action);
              }}
            >
              {surface.safetySeal.action.label}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (clusterOnlyMode) {
    return (
      <section
        className="statusObservatoryInstrument statusObservatoryCanopy statusBottleneckTalismanCanopy"
        data-testid="status-bottleneck-canopy"
        data-surface-testid={surface.rootTestId}
        data-s6-instrument="bottleneck-talisman-canopy"
        data-visual-state={surface.centralEdict.visualState}
        data-canopy-mode={resolvedCanopyMode}
        data-animate={ritual.animate ? 'true' : 'false'}
        aria-label="Bottleneck Talisman Canopy"
      >
        {resolvedCanopyMode === 'capNotice' ? (
          /* Artifact canopyCap: a single centred "Awaiting New Heavens" notice. */
          <div className="statusBottleneckTalismanCanopy__capBoard">
            <h2 className="statusBottleneckTalismanCanopy__capHeadline">{surface.centralEdict.label}</h2>
            <p className="statusBottleneckTalismanCanopy__capDetail">{surface.centralEdict.detail}</p>
            <InkWaxSeal
              className="statusBottleneckTalismanCanopy__capSeal"
              chars={chop.chars}
              size={64}
              rotation={-4}
              variant={chop.variant}
            />
          </div>
        ) : resolvedCanopyMode === 'reincarnationEdict' ? (
          /* Artifact canopyPrestige: reincarnation card + next-life promises +
             the 轉 Open Prestige route disc. */
          <div className="statusBottleneckTalismanCanopy__prestigeBoard">
            <article className="statusBottleneckTalismanCanopy__prestigeCard" data-tone="danger">
              <div className="statusBottleneckTalismanCanopy__prestigeHeadline">{surface.centralEdict.label}</div>
              <div className="statusBottleneckTalismanCanopy__prestigeSub">{surface.centralEdict.detail}</div>
              <InkWaxSeal
                className="statusBottleneckTalismanCanopy__prestigeSeal"
                chars={chop.chars}
                size={56}
                rotation={-5}
                variant={chop.variant}
              />
            </article>
            <div className="statusBottleneckTalismanCanopy__prestigePromises">
              {surface.talismanSlips.slice(0, 3).map((slip, index) => (
                <div
                  key={slip.id}
                  className="statusBottleneckTalismanCanopy__prestigePromise"
                  data-rot={index % 2 === 0 ? 'left' : 'right'}
                >
                  <span>Next Life Promise {['I', 'II', 'III'][index]}</span>
                  <strong>{slip.title}</strong>
                </div>
              ))}
            </div>
            {edictAction ? (
              <button
                type="button"
                className="statusBottleneckTalismanCanopy__prestigeOpen"
                data-action-id={edictAction.id}
                disabled={edictDisabled}
                aria-disabled={edictDisabled ? 'true' : undefined}
                title={edictAction.disabled ? edictAction.disabledReason ?? edictAction.detail : edictAction.detail}
                onClick={() => {
                  if (!edictDisabled && edictAction) onAction?.(edictAction);
                }}
              >
                <span className="statusBottleneckTalismanCanopy__prestigeOpenGlyph" aria-hidden="true">轉</span>
                <strong>{edictAction.label}</strong>
              </button>
            ) : null}
          </div>
        ) : resolvedCanopyMode === 'failureDiagnosis' ? (
          /* Artifact canopyFailure: torn red GATE TRIAL FAILED banner + 3 numbered
             fix cards (route charms) + the mercy-seal progress. */
          <div className="statusBottleneckTalismanCanopy__failureBoard">
            <div className="statusBottleneckTalismanCanopy__failureBanner">
              <InkWaxSeal
                className="statusBottleneckTalismanCanopy__failureSeal"
                chars={chop.chars}
                size={38}
                rotation={-6}
                variant="cinnabar"
              />
              <strong>Gate Trial Failed</strong>
              <em>Diagnosis</em>
              <span className="statusBottleneckTalismanCanopy__failureBlocker">
                Primary Blocker: <b>{surface.centralEdict.label}</b>
              </span>
            </div>
            <div className="statusBottleneckTalismanCanopy__failureFixes">
              {surface.routeCharms.slice(0, 3).map((charm, index) => {
                const disabled = charmDisabled(charm.action, onAction);
                return (
                  <button
                    key={charm.id}
                    type="button"
                    className="statusBottleneckTalismanCanopy__failureFix"
                    data-action-id={charm.action.id}
                    disabled={disabled}
                    aria-disabled={disabled ? 'true' : undefined}
                    title={charm.action.disabled ? charm.action.disabledReason ?? charm.detail : charm.detail}
                    onClick={() => {
                      if (!disabled) onAction?.(charm.action);
                    }}
                  >
                    <span className="statusBottleneckTalismanCanopy__failureFixNum" aria-hidden="true">{charm.order ?? index + 1}</span>
                    <strong>{charm.label}</strong>
                    <small>{charm.detail}</small>
                    <span className="statusBottleneckTalismanCanopy__failureFixRoute">{charm.action.label}</span>
                  </button>
                );
              })}
            </div>
            <div
              className="statusBottleneckTalismanCanopy__failureSafety"
              data-tone={surface.safetySeal.tone}
            >
              <span>{surface.safetySeal.label}</span>
              <strong>{surface.safetySeal.stateLabel}</strong>
              <small>{surface.safetySeal.progressLabel}</small>
            </div>
          </div>
        ) : (
          /* Artifact canopyHealthy: central "No major blocker" jade card + four
             jade check-slips + "Best Improvements" pills + a "Not needed" mercy. */
          <div className="statusBottleneckTalismanCanopy__healthyBoard">
            <article className="statusBottleneckTalismanCanopy__healthyCentral">
              <div className="statusBottleneckTalismanCanopy__healthyHeadline">{surface.centralEdict.label}</div>
              <p className="statusBottleneckTalismanCanopy__healthyDetail">{surface.centralEdict.detail}</p>
              <InkWaxSeal
                className="statusBottleneckTalismanCanopy__healthySeal"
                chars="順遂無礙"
                size={46}
                rotation={-4}
                variant="jade"
              />
            </article>
            <div className="statusBottleneckTalismanCanopy__healthyChecks">
              {surface.talismanSlips.slice(0, 4).map((slip) => (
                <div key={slip.id} className="statusBottleneckTalismanCanopy__healthyCheck">
                  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable={false}>
                    <path d="M3 8.5 L6.5 12 L13 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <strong>{slip.title}</strong>
                    <small>{slip.routeLabel ?? slip.detail}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="statusBottleneckTalismanCanopy__healthyImprovements">
              <span className="statusBottleneckTalismanCanopy__healthyImprovementsLabel">Best Improvements</span>
              <div className="statusBottleneckTalismanCanopy__healthyPills">
                {surface.routeCharms.slice(0, 3).map((charm) => {
                  const disabled = charmDisabled(charm.action, onAction);
                  return (
                    <button
                      key={charm.id}
                      type="button"
                      className="statusBottleneckTalismanCanopy__healthyPill"
                      data-action-id={charm.action.id}
                      disabled={disabled}
                      aria-disabled={disabled ? 'true' : undefined}
                      title={charm.action.disabled ? charm.action.disabledReason ?? charm.detail : charm.detail}
                      onClick={() => {
                        if (!disabled) onAction?.(charm.action);
                      }}
                    >
                      {charm.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="statusBottleneckTalismanCanopy__healthyMercy" data-tone={surface.safetySeal.tone}>
              <span>{surface.safetySeal.label}</span>
              <strong>{surface.safetySeal.stateLabel}</strong>
              <small>{surface.safetySeal.progressLabel}</small>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryCanopy statusBottleneckTalismanCanopy"
      data-testid="status-bottleneck-canopy"
      data-surface-testid={surface.rootTestId}
      data-s6-instrument="bottleneck-talisman-canopy"
      data-visual-state={surface.centralEdict.visualState}
      data-canopy-mode={resolvedCanopyMode}
      data-selected-slip-id={selectedSlip?.id ?? 'none'}
      data-animate={ritual.animate ? 'true' : 'false'}
      aria-label="Bottleneck Talisman Canopy"
    >
      <div className="statusBottleneckTalismanCanopy__board">
        <div className="statusBottleneckTalismanCanopy__backboard" aria-hidden="true" />

        <svg
          className="statusBottleneckTalismanCanopy__rail"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* canopyRail(): brass arc M34,34 Q304,10 574,34 on the 608x560 board
             -> board% M5.6 6.07 Q50 1.79 94.4 6.07; caps at 34/574px = 5.6/94.4%. */}
          <path className="statusBottleneckTalismanCanopy__railArc" d="M5.6 6.07 Q50 1.79 94.4 6.07" />
          <circle className="statusBottleneckTalismanCanopy__railCap" cx="5.6" cy="6.07" r="1.4" />
          <circle className="statusBottleneckTalismanCanopy__railCap" cx="94.4" cy="6.07" r="1.4" />
          {/* canopyRail() dangling nub ticks: i=1..6 x=34+i*(540/7), ry=34-24*sin(pi*i/7), line ry->ry+9 (px on 608x560 -> board%). */}
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const nx = ((34 + i * (540 / 7)) / 608) * 100;
            const ny = ((34 - 24 * Math.sin((Math.PI * i) / 7)) / 560) * 100;
            return (
              <line
                key={`nub-${i}`}
                className="statusBottleneckTalismanCanopy__railNub"
                x1={nx.toFixed(2)}
                y1={ny.toFixed(2)}
                x2={nx.toFixed(2)}
                y2={(ny + (9 / 560) * 100).toFixed(2)}
              />
            );
          })}
          {/* Centre cord: rail apex (50%, 1.79%) straight down to the edict top. */}
          {(() => {
            const ax = 50;
            const ay = CANOPY_RAIL_APEX_Y;
            const ty = CANOPY_EDICT_TOP_Y;
            const d = `M${ax} ${ay} C${ax} ${(ay + CANOPY_CORD_SAG).toFixed(2)} ${ax} ${(ty - CANOPY_CORD_SAG).toFixed(2)} ${ax} ${ty}`;
            return (
              <g>
                <path className="statusBottleneckTalismanCanopy__cord" data-tone="danger" d={d} />
                <path className="statusBottleneckTalismanCanopy__cordHighlight" d={d} />
                <circle className="statusBottleneckTalismanCanopy__cordAnchor" data-tone="danger" cx={ax} cy={ay} r="0.8" />
                <circle className="statusBottleneckTalismanCanopy__cordAnchor" data-tone="danger" cx={ax} cy={ty} r="0.9" />
              </g>
            );
          })()}
          {/* Side cords: each top-four slip drops on a clean cord from the fixed
             rail anchor (21.4% left / 78.6% right) directly above its fixed slot,
             so the cords never cross (cordTo(), sag 4.64%). */}
          {surface.talismanSlips.slice(0, CANOPY_SLIP_CAP).map((slip, index) => {
            const slot = CANOPY_FIXED_SLOTS[index];
            const tx = slot.x;
            const ty = slot.y - CANOPY_SLIP_HALF_H;
            const ax = slot.rail;
            const ay = CANOPY_RAIL_SIDE_Y;
            const d = `M${ax} ${ay} C${ax} ${(ay + CANOPY_CORD_SAG).toFixed(2)} ${tx} ${(ty - CANOPY_CORD_SAG).toFixed(2)} ${tx} ${ty}`;
            return (
              <g key={slip.id}>
                <path className="statusBottleneckTalismanCanopy__cord" data-tone={slip.tone} d={d} />
                <path className="statusBottleneckTalismanCanopy__cordHighlight" d={d} />
                <circle className="statusBottleneckTalismanCanopy__cordAnchor" data-tone={slip.tone} cx={ax} cy={ay} r="0.7" />
                <circle className="statusBottleneckTalismanCanopy__cordAnchor" data-tone={slip.tone} cx={tx} cy={ty} r="0.8" />
              </g>
            );
          })}
        </svg>

        <StatusCausalThreadLayer
          threads={surface.causalThreads}
          className="statusBottleneckTalismanCanopy__threads"
        />

        <div className="statusBottleneckTalismanCanopy__missionAnchor" data-testid="status-ledger-mission-requirements">
          <article
            className="statusBottleneckTalismanCanopy__edict"
            data-testid="status-bottleneck-edict"
            data-visual-state={surface.centralEdict.visualState}
            data-tone={toneOf(edictAction, toneOf(surface.safetySeal.action, surface.safetySeal.tone))}
            data-has-action={edictAction ? 'true' : 'false'}
          >
            <span className="statusBottleneckTalismanCanopy__pin" aria-hidden="true" />
            <span className="statusBottleneckTalismanCanopy__edictEyebrow">{edictEyebrow(resolvedCanopyMode)}</span>
            <h3>{surface.centralEdict.label}</h3>
            {/* Artifact centre card is compact: eyebrow -> title -> source ->
                "Primary Action / label". The detail prose is dropped here (it
                stays in the inspector + overlay). */}
            <small className="statusBottleneckTalismanCanopy__edictSource">{surface.centralEdict.sourceLabel}</small>
            {edictAction ? (
              <button
                type="button"
                className="statusBottleneckTalismanCanopy__edictRoute"
                data-action-id={edictAction.id}
                data-disabled={edictDisabled ? 'true' : 'false'}
                disabled={edictDisabled}
                aria-disabled={edictDisabled ? 'true' : undefined}
                aria-label={`Primary Action: ${edictAction.label}`}
                title={edictAction.disabled ? edictAction.disabledReason ?? edictAction.detail : edictAction.detail}
                onClick={() => {
                  if (!edictDisabled && edictAction) onAction?.(edictAction);
                }}
              >
                {/* Artifact: a flat "Primary Action / <label>" caption, not a filled
                    green capsule. The destinationLabel is dropped here — it usually
                    just echoes the label ("Refine Weapon / Refine Weapon"). */}
                <span className="statusBottleneckTalismanCanopy__edictRouteEyebrow">Primary Action</span>
                <strong>{edictAction.label}</strong>
              </button>
            ) : null}
            <InkWaxSeal
              className="statusBottleneckTalismanCanopy__edictChop"
              chars={chop.chars}
              size={44}
              rotation={7}
              variant={chop.variant}
            />
            <svg
              className="statusBottleneckTalismanCanopy__stand"
              viewBox="0 0 100 16"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M18 3 Q50 12 82 3 M30 3 Q50 14 70 3 M44 6 L44 14 M56 6 L56 14" />
              <circle cx="50" cy="14" r="2" />
            </svg>
          </article>
        </div>

        <div
          className="statusBottleneckTalismanCanopy__slips"
          aria-label="Pinned bottleneck talisman slips"
          onKeyDown={handleSlipRovingKeyDown}
        >
          {surface.talismanSlips.slice(0, CANOPY_SLIP_CAP).map((slip, index) => {
            const slot = CANOPY_FIXED_SLOTS[index];
            const selected = slip.id === selectedSlip?.id;
            const chipLabel = slip.priorityLabel ?? slip.stateLabel ?? slip.sourceLabel;
            const routeText = slip.routeLabel ? `Route: ${slip.routeLabel}` : slip.detail;
            return (
              <button
                key={slip.id}
                ref={(el) => {
                  if (el) slipButtonRefs.current.set(slip.id, el);
                  else slipButtonRefs.current.delete(slip.id);
                }}
                type="button"
                className="statusBottleneckTalismanCanopy__slip"
                style={slotStyle(slot)}
                data-testid="status-bottleneck-slip"
                data-slip-id={slip.id}
                data-source-family={slip.sourceFamily}
                data-tone={slip.tone}
                data-selected={selected ? 'true' : 'false'}
                data-related={sharedSelection.isRelated('bottleneckCanopy', slip.id) ? 'true' : 'false'}
                data-rotation={slot.rotationDeg}
                tabIndex={selected ? 0 : -1}
                aria-pressed={selected}
                aria-label={slip.ariaLabel}
                onClick={() => {
                  setSelectedSlipId(slip.id);
                  sharedSelection.select('talisman', slip.id);
                }}
                onFocus={() => {
                  setSelectedSlipId(slip.id);
                  sharedSelection.select('talisman', slip.id);
                }}
              >
                {/* Artifact side slip: a cinnabar "!" lead, then a column of bold
                    title + a solid priority chip + the "Route: X" line. */}
                <span className="statusBottleneckTalismanCanopy__slipLead" aria-hidden="true">!</span>
                <span className="statusBottleneckTalismanCanopy__slipBody">
                  <strong>{slip.title}</strong>
                  {chipLabel ? (
                    <span className="statusBottleneckTalismanCanopy__slipChip" data-tone={slip.tone}>{chipLabel}</span>
                  ) : null}
                  <small>{routeText}</small>
                </span>
              </button>
            );
          })}
        </div>

      </div>

      <div className="obsVisuallyHidden">
        <StatusBottleneckInspector inspector={surface.inspector} slip={selectedSlip} onAction={onAction} />
      </div>
    </section>
  );
}
