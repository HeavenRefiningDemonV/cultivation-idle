import { memo, useEffect, useMemo, useReducer, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { deepEqualProps } from './fx/memoProps.js';
import cultivatorArt from '../../../assets/onscreen/cbg_full.png';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusMeridianOrganSurface,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import {
  STATUS_OBSERVATORY_MERIDIAN_BODY_LINEWORK,
  STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS,
  STATUS_OBSERVATORY_MERIDIAN_ORGAN_GEOMETRY,
  STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS,
} from '../../../systems/ui/status/statusObservatoryPresentation.js';
import { StatusMeridianFocusLens } from './StatusMeridianFocusLens.js';
import { StatusObservatoryDrawers } from './StatusObservatoryDrawers.js';
import { useObservatorySelection } from './useObservatorySelection.js';
import { useRitualMotion } from './fx/useRitualMotion.js';
import { useObservatoryMotion } from './useObservatoryMotion.js';

export interface StatusMeridianVesselCompassProps {
  surface: StatusObservatorySurfaceV1['meridianVessel'];
  visualState?: StatusObservatorySurfaceV1['meta']['visualState'];
  onAction?: (action: StatusLedgerActionSurface) => void;
}

export interface StatusMeridianSharedCauseStampsProps {
  stamps: StatusObservatorySurfaceV1['meridianVessel']['sharedCauseStamps'];
}

/**
 * V7 `causes` ribbon (816x56 @552,806): a horizontal row of static shared-cause
 * seals divided by hairline rules. Lives in its OWN shell region
 * (obs-region-causes), not inside the hero compass. Kept in this file so the
 * `statusMeridianVesselCompass__sharedCauseStamps` class string stays co-located
 * with the vessel renderer (S4 contract).
 */
export const StatusMeridianSharedCauseStamps = memo(StatusMeridianSharedCauseStampsBase, deepEqualProps);

function StatusMeridianSharedCauseStampsBase({ stamps }: StatusMeridianSharedCauseStampsProps) {
  return (
    <div
      className="statusMeridianVesselCompass__sharedCauseStamps"
      data-testid="status-meridian-shared-cause-stamps"
      aria-label="Shared causes across all organs"
    >
      <span>Shared Causes</span>
      <div>
        {stamps.map((stamp) => (
          <span
            key={stamp.id}
            className="statusMeridianVesselCompass__causeStamp"
            data-cause-id={stamp.id}
            data-tone={stamp.tone}
            aria-label={stamp.ariaLabel}
          >
            <svg className="statusMeridianVesselCompass__causeSeal" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="statusMeridianVesselCompass__causeSealOuter" cx="12" cy="12" r="10.5" />
              <circle className="statusMeridianVesselCompass__causeSealInner" cx="12" cy="12" r="6.5" />
            </svg>
            <strong>{stamp.label}</strong>
            <small>{stamp.value ?? stamp.detail}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

type StatusMeridianOrganId = StatusMeridianOrganSurface['id'];

type MeridianVesselAction =
  | { type: 'select-organ'; organId: StatusMeridianOrganId }
  | { type: 'open-drawer' }
  | { type: 'close-drawer' }
  | { type: 'reset-selected'; organId: StatusMeridianOrganId };

interface MeridianVesselState {
  selectedOrganId: StatusMeridianOrganId;
  drawerOpen: boolean;
}

function meridianVesselReducer(state: MeridianVesselState, action: MeridianVesselAction): MeridianVesselState {
  switch (action.type) {
    case 'select-organ':
      return { ...state, selectedOrganId: action.organId };
    case 'open-drawer':
      return { ...state, drawerOpen: true };
    case 'close-drawer':
      return { ...state, drawerOpen: false };
    case 'reset-selected':
      return { selectedOrganId: action.organId, drawerOpen: false };
    default:
      return state;
  }
}

// Artifact compass() figure is painted in an 838x560 px viewBox (cx=419, hy=96).
// These mirror the generator's mer[] meridian points and pos[]/anchor math so the
// React figure reproduces the exact element-by-element output.
const MERIDIAN_VIEW_W = 838;
const MERIDIAN_VIEW_H = 560;
const MERIDIAN_CX = 419;
const MERIDIAN_MER: ReadonlyArray<readonly [number, number]> = [
  [419, 62],
  [419, 104],
  [419, 150],
  [419, 200],
  [419, 256],
  [419, 322],
];
// thread tone (under-stroke) matches the artifact thcol().
function meridianThreadColor(state: StatusMeridianOrganSurface['state']): string {
  if (state === 'danger') return '#a94835';
  if (state === 'attention') return '#b2832d';
  return '#3f7d63';
}

// Artifact organ-seal Kai glyph per organ (compass o.glyph): body / heart /
// root / martial / prep / merit. The ordinal moves to the title ("1. …").
const ORGAN_GLYPH: Record<string, string> = {
  cultivation: '體',
  daoHeart: '心',
  spiritRoot: '根',
  training: '武',
  buildPrep: '備',
  activeWork: '功',
};

function organStateRank(state: StatusMeridianOrganSurface['state']): number {
  if (state === 'danger') return 0;
  if (state === 'attention') return 1;
  if (state === 'locked') return 2;
  if (state === 'unknown') return 3;
  return 4;
}

function defaultSelectedOrganId(
  surface: StatusObservatorySurfaceV1['meridianVessel'],
  organs: readonly StatusMeridianOrganSurface[],
): StatusMeridianOrganId {
  const byId = new Set(organs.map((organ) => organ.id));
  if (byId.has(surface.focusLens.selectedOrganId)) return surface.focusLens.selectedOrganId;
  return [...organs].sort((left, right) => {
    const rankDelta = organStateRank(left.state) - organStateRank(right.state);
    if (rankDelta !== 0) return rankDelta;
    return left.ordinal - right.ordinal;
  })[0]?.id ?? surface.focusLens.selectedOrganId;
}

function organStyle(organ: StatusMeridianOrganSurface): CSSProperties {
  const geometry = STATUS_OBSERVATORY_MERIDIAN_ORGAN_GEOMETRY[organ.id];
  return {
    '--organ-x': `${geometry.x}`,
    '--organ-y': `${geometry.y}`,
    '--organ-line-x': `${geometry.lineTargetX}`,
    '--organ-line-y': `${geometry.lineTargetY}`,
  } as CSSProperties;
}

function stateCopy(state: StatusMeridianOrganSurface['state']): string {
  return STATUS_OBSERVATORY_MERIDIAN_STATE_LABELS[state].label;
}

export const StatusMeridianVesselCompass = memo(StatusMeridianVesselCompassBase, deepEqualProps);

function StatusMeridianVesselCompassBase({
  surface,
  visualState = 'unknown',
  onAction,
}: StatusMeridianVesselCompassProps) {
  const organs = useMemo(() => [...surface.organs].sort((left, right) => left.ordinal - right.ordinal), [surface.organs]);
  const organsById = useMemo(() => new Map(organs.map((organ) => [organ.id, organ])), [organs]);
  const fallbackOrganId = useMemo(() => defaultSelectedOrganId(surface, organs), [surface, organs]);
  const [state, dispatch] = useReducer(meridianVesselReducer, {
    selectedOrganId: fallbackOrganId,
    drawerOpen: false,
  });
  const sharedSelection = useObservatorySelection();

  useEffect(() => {
    if (!organsById.has(state.selectedOrganId)) {
      dispatch({ type: 'reset-selected', organId: fallbackOrganId });
    }
  }, [fallbackOrganId, organsById, state.selectedOrganId]);

  const selectedOrgan = organsById.get(state.selectedOrganId) ?? organs[0] ?? null;

  const ritual = useRitualMotion();
  const motion = useObservatoryMotion({
    purityPct: 0,
    fitAngleDeg: 0,
    qiPerSecond: null,
    cultivationRate: null,
  });

  const organsByOrdinal = useMemo(
    () => new Map(organs.map((organ) => [organ.ordinal as number, organ])),
    [organs],
  );
  const organButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const focusOrgan = (organId: StatusMeridianOrganId) => {
    dispatch({ type: 'select-organ', organId });
    sharedSelection.select('organ', organId);
    organButtonRefs.current.get(organId)?.focus();
  };
  const handleOrganRovingKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const active = document.activeElement as HTMLElement | null;
    const currentId = active?.getAttribute?.('data-organ-id');
    if (!currentId) return;
    const organ = organsById.get(currentId);
    if (!organ) return;
    const row = Math.floor((organ.ordinal - 1) / 2);
    const col = (organ.ordinal - 1) % 2;
    const ordinalAt = (nextRow: number, nextCol: number): number =>
      Math.min(Math.max(nextRow, 0), 2) * 2 + nextCol + 1;
    let targetOrdinal: number | null = null;
    switch (event.key) {
      case 'ArrowUp':
        targetOrdinal = ordinalAt(row - 1, col);
        break;
      case 'ArrowDown':
        targetOrdinal = ordinalAt(row + 1, col);
        break;
      case 'ArrowLeft':
        targetOrdinal = ordinalAt(row, 0);
        break;
      case 'ArrowRight':
        targetOrdinal = ordinalAt(row, 1);
        break;
      case 'Home':
        targetOrdinal = 1;
        break;
      case 'End':
        targetOrdinal = 6;
        break;
      default:
        return;
    }
    const target = targetOrdinal === null ? undefined : organsByOrdinal.get(targetOrdinal);
    if (!target) return;
    event.preventDefault();
    focusOrgan(target.id);
  };

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryVessel statusMeridianVesselCompass"
      data-testid="status-current-state"
      data-surface-testid={surface.rootTestId}
      data-s4-instrument="meridian-vessel-compass"
      data-selected-organ-id={selectedOrgan?.id ?? 'none'}
      data-visual-state={visualState}
      aria-label="Meridian Vessel Compass"
    >
      {/* No title/header here: the jade region banner ("MERIDIAN VESSEL COMPASS")
          owns the title, exactly as the artifact `compass` generator renders no
          header. The figure + flanking cards span the full panel below the banner. */}
      <div className="statusMeridianVesselCompass__body">
        <div className="statusMeridianVesselCompass__figure" aria-label="Six-organ meridian vessel anatomy">
          <svg
            className="statusMeridianVesselCompass__bodyLinework"
            viewBox={`0 0 ${MERIDIAN_VIEW_W} ${MERIDIAN_VIEW_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            data-animate={ritual.animate ? 'true' : 'false'}
            style={motion as CSSProperties}
            aria-label="Seated cultivator with qi threads to the six organs"
          >
            <defs>
              <radialGradient id="statusMeridianQiAura" cx="50%" cy="42%" r="55%">
                <stop offset="0" stopColor="#e7c878" stopOpacity="0.42" />
                <stop offset="0.4" stopColor="#d8b45e" stopOpacity="0.2" />
                <stop offset="0.72" stopColor="#caa84e" stopOpacity="0.07" />
                <stop offset="1" stopColor="#caa84e" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="statusMeridianQiCore" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#fff4d6" stopOpacity="0.9" />
                <stop offset="1" stopColor="#e7c878" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* (A) qi aura ellipse */}
            <ellipse className="statusMeridianVesselCompass__bodyAura" cx={MERIDIAN_CX} cy="206" rx="186" ry="232" />
            {/* Cultivator portrait — the actual meditating-cultivator art (transparent
               PNG) replaces the drawn anatomy figure, centered in the vessel behind the
               per-organ qi threads. The threads still emanate from the centerline
               (MERIDIAN_MER, x=419), i.e. up the cultivator's spine. */}
            <image
              className="statusMeridianVesselCompass__cultivatorArt"
              href={cultivatorArt}
              x="209"
              y="40"
              width="421"
              height="330"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            />
            {/* (I) per-organ qi threads: spine meridian point -> card anchor */}
            {organs.map((organ, index) => {
              const geometry = STATUS_OBSERVATORY_MERIDIAN_ORGAN_GEOMETRY[organ.id];
              const src = MERIDIAN_MER[geometry.src];
              const ax = geometry.side === 'left' ? 200 : 638;
              const ay = geometry.cardTop + 30;
              const mx = (src[0] + ax) / 2;
              const my = (src[1] + ay) / 2 - 16;
              const threadPath = `M${src[0]},${src[1]} Q${mx},${my} ${ax},${ay}`;
              const threadSelected = organ.id === selectedOrgan?.id;
              return (
                <g key={organ.id}>
                  <path
                    className="statusMeridianVesselCompass__organThread"
                    data-organ-id={organ.id}
                    data-organ-state={organ.state}
                    data-selected={threadSelected ? 'true' : 'false'}
                    data-related={sharedSelection.isRelated('meridianVessel', organ.id) ? 'true' : 'false'}
                    d={threadPath}
                    style={{ stroke: meridianThreadColor(organ.state) }}
                    pathLength={1}
                  >
                    <title>{organ.ariaLabel}</title>
                  </path>
                  <path
                    className="statusMeridianVesselCompass__threadGlow"
                    data-organ-state={organ.state}
                    data-selected={threadSelected ? 'true' : 'false'}
                    d={threadPath}
                    pathLength={1}
                    style={{ animationDelay: `${(index * 0.4).toFixed(1)}s` }}
                    aria-hidden="true"
                  />
                  <circle
                    className="statusMeridianVesselCompass__threadBead"
                    data-organ-state={organ.state}
                    cx={ax}
                    cy={ay}
                    r={4.5}
                    style={{ fill: meridianThreadColor(organ.state), animationDelay: `${(index * 0.45).toFixed(1)}s` }}
                    aria-hidden="true"
                  />
                  <circle className="statusMeridianVesselCompass__threadBeadCore" cx={ax} cy={ay} r={2} aria-hidden="true" />
                </g>
              );
            })}
            {/* Meridian points + qi-core + focus ring removed: the cultivator portrait
               now reads as the body, and the per-organ threads above carry the state. */}
          </svg>

          <div
            className="statusMeridianVesselCompass__organLayer"
            aria-label="Selectable meridian organs"
            onKeyDown={handleOrganRovingKeyDown}
          >
            {organs.map((organ) => {
              const selected = organ.id === selectedOrgan?.id;
              return (
                <button
                  key={organ.id}
                  ref={(el) => {
                    if (el) organButtonRefs.current.set(organ.id, el);
                    else organButtonRefs.current.delete(organ.id);
                  }}
                  type="button"
                  className="statusMeridianVesselCompass__organSeal"
                  style={organStyle(organ)}
                  data-organ-id={organ.id}
                  data-organ-state={organ.state}
                  data-state={organ.state}
                  data-selected={selected ? 'true' : 'false'}
                  data-related={sharedSelection.isRelated('meridianVessel', organ.id) ? 'true' : 'false'}
                  tabIndex={selected ? 0 : -1}
                  aria-pressed={selected}
                  aria-label={organ.ariaLabel}
                  onClick={() => {
                    dispatch({ type: 'select-organ', organId: organ.id });
                    sharedSelection.select('organ', organ.id);
                  }}
                  onFocus={() => {
                    dispatch({ type: 'select-organ', organId: organ.id });
                    sharedSelection.select('organ', organ.id);
                  }}
                >
                  <span className="statusMeridianVesselCompass__organSealInner" data-icon={organ.icon} aria-hidden="true">
                    {/* W4-deferred: per-organ glyph atlas (lotus/book/swords/etc.) - own Design packet. */}
                    <svg className="statusMeridianVesselCompass__organMedallion" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="statusMeridianVesselCompass__organRimOuter" cx="12" cy="12" r="11" />
                      <circle
                        className="statusMeridianVesselCompass__organRing"
                        data-organ-state={organ.state}
                        cx="12"
                        cy="12"
                        r="8.6"
                      />
                      <circle className="statusMeridianVesselCompass__organDisc" cx="12" cy="12" r="6" />
                      <text
                        className="statusMeridianVesselCompass__organMark"
                        x="12"
                        y="12"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {ORGAN_GLYPH[organ.id] ?? organ.ordinal}
                      </text>
                    </svg>
                  </span>
                  <strong>{organ.ordinal}. {organ.title}</strong>
                  <small>{organ.valueLabel}</small>
                  <em>{stateCopy(organ.state)}</em>
                  {organ.route ? (
                    /* Artifact card carries a route pill bottom-right. Decorative
                       here (aria-hidden) — selecting the organ routes the real,
                       focusable action through the focus lens below. */
                    <span className="statusMeridianVesselCompass__organRoute" data-tone={organ.route.tone} aria-hidden="true">
                      {organ.route.label}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {selectedOrgan ? <StatusMeridianFocusLens organ={selectedOrgan} lens={surface.focusLens} onAction={onAction} /> : null}

      <div className="statusMeridianVesselCompass__footer">
        <button
          type="button"
          className="statusMeridianVesselCompass__openDrawer"
          aria-expanded={state.drawerOpen}
          onClick={() => dispatch({ type: 'open-drawer' })}
        >
          {STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS.drawerButtonLabel}
        </button>
      </div>

      {selectedOrgan ? (
        <StatusObservatoryDrawers
          open={state.drawerOpen}
          organ={selectedOrgan}
          sharedCauseStamps={surface.sharedCauseStamps}
          onClose={() => dispatch({ type: 'close-drawer' })}
          onAction={onAction}
        />
      ) : null}
    </section>
  );
}
