import { useEffect, useMemo, useReducer, type CSSProperties } from 'react';
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
            {organs.map((organ) => {
              const geometry = STATUS_OBSERVATORY_MERIDIAN_ORGAN_GEOMETRY[organ.id];
              return (
                <path
                  key={organ.id}
                  className="statusMeridianVesselCompass__organThread"
                  data-organ-id={organ.id}
                  data-organ-state={organ.state}
                  data-selected={organ.id === selectedOrgan?.id ? 'true' : 'false'}
                  data-related={sharedSelection.isRelated('meridianVessel', organ.id) ? 'true' : 'false'}
                  d={`M${geometry.x} ${geometry.y} C${(geometry.x + geometry.lineTargetX) / 2} ${geometry.y} ${(geometry.x + geometry.lineTargetX) / 2} ${geometry.lineTargetY} ${geometry.lineTargetX} ${geometry.lineTargetY}`}
                  pathLength={1}
                >
                  <title>{organ.ariaLabel}</title>
                </path>
              );
            })}
            <circle className="statusMeridianVesselCompass__coreSeal" cx="50" cy="52" r="4.4" />
            <circle className="statusMeridianVesselCompass__coreSeal statusMeridianVesselCompass__coreSeal--outer" cx="50" cy="52" r="7.6" />
          </svg>

          <div className="statusMeridianVesselCompass__organLayer" aria-label="Selectable meridian organs">
            {organs.map((organ) => {
              const selected = organ.id === selectedOrgan?.id;
              return (
                <button
                  key={organ.id}
                  type="button"
                  className="statusMeridianVesselCompass__organSeal"
                  style={organStyle(organ)}
                  data-organ-id={organ.id}
                  data-organ-state={organ.state}
                  data-state={organ.state}
                  data-selected={selected ? 'true' : 'false'}
                  data-related={sharedSelection.isRelated('meridianVessel', organ.id) ? 'true' : 'false'}
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
                    {organ.ordinal}
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
