import { useEffect, useMemo, useReducer, useRef, type CSSProperties, type KeyboardEvent } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusMeridianOrganSurface,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import {
  STATUS_OBSERVATORY_MERIDIAN_BODY_LINEWORK,
  STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS,
  STATUS_OBSERVATORY_MERIDIAN_INSPECTION_COPY,
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

const MERIDIAN_CENTRAL_CHANNEL_D =
  STATUS_OBSERVATORY_MERIDIAN_BODY_LINEWORK.find((path) => path.id === 'central-channel')?.d ?? '';
const MERIDIAN_DANTIAN_PEARL_Y = [28, 40, 64, 76];

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

export function StatusMeridianVesselCompass({
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
      <div className="statusObservatoryInstrument__header statusMeridianVesselCompass__header">
        <span className="statusObservatoryInstrument__sigil" aria-hidden="true" />
        <div>
          <h2>{surface.title}</h2>
          <p>Full-state inner ledger of mind, body, root, path, preparation, and current work.</p>
        </div>
      </div>

      <div className="statusMeridianVesselCompass__body">
        <div className="statusMeridianVesselCompass__rail statusMeridianVesselCompass__rail--left">
          <div>
            <span>Overview</span>
            <p>{STATUS_OBSERVATORY_MERIDIAN_INSPECTION_COPY.overview}</p>
          </div>
          <div>
            <span>Current Focus</span>
            <strong>{selectedOrgan?.title ?? surface.focusLens.label}</strong>
            <small>{selectedOrgan?.valueLabel ?? surface.focusLens.value}</small>
          </div>
          <div>
            <span>Inspection Mode</span>
            <strong>{STATUS_OBSERVATORY_MERIDIAN_INSPECTION_COPY.inspectionMode}</strong>
            <small>{STATUS_OBSERVATORY_MERIDIAN_INSPECTION_COPY.inspectionDetail}</small>
          </div>
        </div>

        <div className="statusMeridianVesselCompass__figure" aria-label="Six-organ meridian vessel anatomy">
          <svg
            className="statusMeridianVesselCompass__bodyLinework"
            viewBox="0 0 100 100"
            role="img"
            data-animate={ritual.animate ? 'true' : 'false'}
            style={motion as CSSProperties}
            aria-label="Faint seated cultivator silhouette with meridian linework"
          >
            <defs>
              <radialGradient id="statusMeridianCoreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f8efd2" stopOpacity="0.88" />
                <stop offset="52%" stopColor="#d9b76d" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#5d4121" stopOpacity="0.04" />
              </radialGradient>
            </defs>
            <circle className="statusMeridianVesselCompass__bodyAura" cx="50" cy="50" r="31" />
            {STATUS_OBSERVATORY_MERIDIAN_BODY_LINEWORK.map((path) => (
              <path key={path.id} className="statusMeridianVesselCompass__bodyPath" d={path.d} pathLength={1} />
            ))}
            {MERIDIAN_CENTRAL_CHANNEL_D ? (
              <path
                className="statusMeridianVesselCompass__channelFlow"
                d={MERIDIAN_CENTRAL_CHANNEL_D}
                pathLength={1}
                aria-hidden="true"
              />
            ) : null}
            {MERIDIAN_DANTIAN_PEARL_Y.map((cy, index) => (
              <g
                key={cy}
                className="statusMeridianVesselCompass__dantian"
                data-dantian-index={index}
                aria-hidden="true"
              >
                <circle className="statusMeridianVesselCompass__dantianRing" cx="50" cy={cy} r="2.2" />
                <circle className="statusMeridianVesselCompass__dantianBead" cx="50" cy={cy} r="1.25" />
              </g>
            ))}
            {organs.map((organ) => {
              const geometry = STATUS_OBSERVATORY_MERIDIAN_ORGAN_GEOMETRY[organ.id];
              const threadPath = `M${geometry.x} ${geometry.y} C${(geometry.x + geometry.lineTargetX) / 2} ${geometry.y} ${(geometry.x + geometry.lineTargetX) / 2} ${geometry.lineTargetY} ${geometry.lineTargetX} ${geometry.lineTargetY}`;
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
                    aria-hidden="true"
                  />
                  <circle
                    className="statusMeridianVesselCompass__threadBead"
                    data-organ-state={organ.state}
                    cx={geometry.lineTargetX}
                    cy={geometry.lineTargetY}
                    r={1.1}
                    aria-hidden="true"
                  />
                </g>
              );
            })}
            <circle className="statusMeridianVesselCompass__coreSeal" cx="50" cy="52" r="4.4" />
            <circle className="statusMeridianVesselCompass__coreSeal statusMeridianVesselCompass__coreSeal--outer" cx="50" cy="52" r="7.6" />
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
                        {organ.ordinal}
                      </text>
                    </svg>
                  </span>
                  <strong>{organ.title}</strong>
                  <small>{organ.valueLabel}</small>
                  <em>{stateCopy(organ.state)}</em>
                </button>
              );
            })}
          </div>
        </div>

        <div className="statusMeridianVesselCompass__rail statusMeridianVesselCompass__rail--right">
          <div className="statusMeridianVesselCompass__legend" aria-label="Meridian vessel state legend">
            {surface.legend.map((entry) => (
              <span key={entry.state} data-organ-state={entry.state}>
                <i aria-hidden="true" />
                <strong>{entry.label}</strong>
                <small>{entry.detail}</small>
              </span>
            ))}
          </div>
          <div>
            <span>How this works</span>
            <p>{STATUS_OBSERVATORY_MERIDIAN_INSPECTION_COPY.howItWorks}</p>
          </div>
        </div>
      </div>

      {selectedOrgan ? <StatusMeridianFocusLens organ={selectedOrgan} lens={surface.focusLens} onAction={onAction} /> : null}

      <div
        className="statusMeridianVesselCompass__sharedCauseStamps"
        data-testid="status-meridian-shared-cause-stamps"
        aria-label="Shared causes across all organs"
      >
        <span>Shared Causes</span>
        <div>
          {surface.sharedCauseStamps.map((stamp) => (
            <button
              key={stamp.id}
              type="button"
              className="statusMeridianVesselCompass__causeStamp"
              data-cause-id={stamp.id}
              data-tone={stamp.tone}
              aria-label={stamp.ariaLabel}
              title={stamp.detail}
              onClick={() => {
                if (selectedOrgan) dispatch({ type: 'open-drawer' });
              }}
            >
              <strong>{stamp.label}</strong>
              <small>{stamp.value ?? stamp.detail}</small>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="statusMeridianVesselCompass__openDrawer"
        aria-expanded={state.drawerOpen}
        onClick={() => dispatch({ type: 'open-drawer' })}
      >
        {STATUS_OBSERVATORY_MERIDIAN_FOCUS_LABELS.drawerButtonLabel}
      </button>

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
