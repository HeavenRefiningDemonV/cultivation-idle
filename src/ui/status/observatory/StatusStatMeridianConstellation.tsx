import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type {
  StatusLedgerActionSurface,
  StatusNamedStatBridgeSocket,
} from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusObservatoryStatNodeSurface,
  StatusObservatorySurfaceV1,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import {
  STATUS_OBSERVATORY_STAT_BRANCH_PATHS,
  STATUS_OBSERVATORY_STAT_BRIDGE_GEOMETRY,
  STATUS_OBSERVATORY_STAT_CONTRIBUTION_LABELS,
  STATUS_OBSERVATORY_STAT_NODE_GEOMETRY,
  STATUS_OBSERVATORY_STAT_NODE_STATE_LABELS,
  STATUS_OBSERVATORY_STAT_PATH_LABELS,
  type StatusStatGeometryBranch,
  type StatusStatNodeGeometry,
} from '../../../systems/ui/status/statusObservatoryPresentation.js';
import { StatusStatBeadLens } from './StatusStatBeadLens.js';
import { useObservatorySelection } from './useObservatorySelection.js';
import { useRitualMotion } from './fx/useRitualMotion.js';

export interface StatusStatMeridianConstellationProps {
  surface: StatusObservatorySurfaceV1['statConstellation'];
  onAction?: (action: StatusLedgerActionSurface) => void;
}

const BRANCH_ORDER: Record<StatusStatGeometryBranch, number> = {
  universal: 0,
  heaven: 1,
  earth: 2,
  martial: 3,
};

const BRANCH_NAV_ORDER: StatusStatGeometryBranch[] = ['universal', 'heaven', 'earth', 'martial'];

const BRANCH_LABEL_POINTS: Record<StatusStatGeometryBranch, { x: number; y: number }> = {
  universal: { x: 54, y: 12 },
  heaven: { x: 12, y: 10 },
  earth: { x: 10, y: 59 },
  martial: { x: 68, y: 18 },
};

function fallbackGeometry(node: StatusObservatoryStatNodeSurface, index: number): StatusStatNodeGeometry {
  const branchOffset = BRANCH_ORDER[node.branchId] * 6;
  return {
    id: node.id,
    x: 12 + ((index * 7 + branchOffset) % 76),
    y: 12 + ((index * 11 + branchOffset) % 76),
    branch: node.branchId,
    labelAnchor: 'middle',
    labelDy: 6,
  };
}

function geometryFor(node: StatusObservatoryStatNodeSurface, index: number): StatusStatNodeGeometry {
  return STATUS_OBSERVATORY_STAT_NODE_GEOMETRY[node.id] ?? fallbackGeometry(node, index);
}

function nodeSort(left: StatusObservatoryStatNodeSurface, right: StatusObservatoryStatNodeSurface): number {
  const leftGeometry = STATUS_OBSERVATORY_STAT_NODE_GEOMETRY[left.id];
  const rightGeometry = STATUS_OBSERVATORY_STAT_NODE_GEOMETRY[right.id];
  const branchDelta = BRANCH_ORDER[left.branchId] - BRANCH_ORDER[right.branchId];
  if (branchDelta !== 0) return branchDelta;
  const yDelta = (leftGeometry?.y ?? 0) - (rightGeometry?.y ?? 0);
  if (yDelta !== 0) return yDelta;
  return left.displayName.localeCompare(right.displayName);
}

function defaultSelectedStatId(
  surface: StatusObservatorySurfaceV1['statConstellation'],
  nodesById: ReadonlyMap<string, StatusObservatoryStatNodeSurface>,
): string | null {
  if (surface.selectedLensDefaultStatId && nodesById.has(surface.selectedLensDefaultStatId)) {
    return surface.selectedLensDefaultStatId;
  }
  return surface.weakLinks.find((node) => nodesById.has(node.id))?.id
    ?? surface.nodes.find((node) => node.nodeState === 'lit')?.id
    ?? surface.nodes[0]?.id
    ?? null;
}

function nodeStyle(geometry: StatusStatNodeGeometry): CSSProperties {
  return {
    '--node-x': `${geometry.x}`,
    '--node-y': `${geometry.y}`,
  } as CSSProperties;
}

function weakThreadPath(node: StatusObservatoryStatNodeSurface, index: number): string {
  const geometry = geometryFor(node, index);
  const targetY = node.branchId === 'heaven' ? 32 : node.branchId === 'earth' ? 74 : 48;
  const targetX = node.branchId === 'martial' ? 98 : 92;
  const controlX = Math.max(geometry.x + 10, (geometry.x + targetX) / 2);
  return `M${geometry.x} ${geometry.y} C${controlX} ${geometry.y} ${controlX} ${targetY} ${targetX} ${targetY}`;
}

function bridgeSocketFor(
  socketGeometry: (typeof STATUS_OBSERVATORY_STAT_BRIDGE_GEOMETRY)[keyof typeof STATUS_OBSERVATORY_STAT_BRIDGE_GEOMETRY],
  sockets: readonly StatusNamedStatBridgeSocket[],
): StatusNamedStatBridgeSocket | null {
  return sockets.find((socket) => socket.id === socketGeometry.id || socket.id === socketGeometry.sourceSocketId)
    ?? sockets[0]
    ?? null;
}

function ariaLabelForNode(node: StatusObservatoryStatNodeSurface): string {
  const state = node.weakLink ? 'Weak Link' : STATUS_OBSERVATORY_STAT_NODE_STATE_LABELS[node.nodeState].label;
  const contribution = STATUS_OBSERVATORY_STAT_CONTRIBUTION_LABELS[node.contributionState];
  const value = node.cap > 0 ? `${node.currentRating} of ${node.cap}` : `${node.currentRating}`;
  return `${node.displayName}. ${STATUS_OBSERVATORY_STAT_PATH_LABELS[node.path].shortLabel}. ${state}. ${contribution}. Value ${value}.`;
}

function currentPathLabel(path: StatusObservatorySurfaceV1['statConstellation']['currentPath']): string {
  if (!path) return 'None';
  return STATUS_OBSERVATORY_STAT_PATH_LABELS[path]?.shortLabel ?? path;
}

export function StatusStatMeridianConstellation({ surface, onAction }: StatusStatMeridianConstellationProps) {
  const nodesById = useMemo(() => new Map(surface.nodes.map((node) => [node.id, node])), [surface.nodes]);
  const orderedNodes = useMemo(() => [...surface.nodes].sort(nodeSort), [surface.nodes]);
  const initialSelectedStatId = useMemo(
    () => defaultSelectedStatId(surface, nodesById),
    [nodesById, surface],
  );
  const [selectedStatId, setSelectedStatId] = useState<string | null>(initialSelectedStatId);
  const sharedSelection = useObservatorySelection();
  const motion = useRitualMotion();

  useEffect(() => {
    setSelectedStatId((current) => (current && nodesById.has(current) ? current : initialSelectedStatId));
  }, [initialSelectedStatId, nodesById]);

  const selectedNode = selectedStatId ? nodesById.get(selectedStatId) ?? null : null;
  const lensNode = selectedNode ?? orderedNodes[0] ?? null;
  const branchEntries = Object.entries(STATUS_OBSERVATORY_STAT_BRANCH_PATHS) as [StatusStatGeometryBranch, string][];
  const bridgeEntries = Object.values(STATUS_OBSERVATORY_STAT_BRIDGE_GEOMETRY);

  const branchGroups = useMemo(() => {
    const groups = new Map<StatusStatGeometryBranch, StatusObservatoryStatNodeSurface[]>();
    for (const branch of BRANCH_NAV_ORDER) groups.set(branch, []);
    for (const node of orderedNodes) groups.get(node.branchId)?.push(node);
    return groups;
  }, [orderedNodes]);
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const focusNode = (id: string) => {
    setSelectedStatId(id);
    sharedSelection.select('stat', id);
    buttonRefs.current.get(id)?.focus();
  };
  const handleRovingKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const active = document.activeElement as HTMLElement | null;
    const currentId = active?.getAttribute?.('data-stat-id');
    if (!currentId) return;
    const node = nodesById.get(currentId);
    if (!node) return;
    const group = branchGroups.get(node.branchId) ?? [];
    const idxInBranch = group.findIndex((entry) => entry.id === currentId);
    const branchIdx = BRANCH_NAV_ORDER.indexOf(node.branchId);
    const go = (id?: string) => {
      if (id) {
        event.preventDefault();
        focusNode(id);
      }
    };
    switch (event.key) {
      case 'ArrowRight':
        go(group[Math.min(idxInBranch + 1, group.length - 1)]?.id);
        break;
      case 'ArrowLeft':
        go(group[Math.max(idxInBranch - 1, 0)]?.id);
        break;
      case 'ArrowDown': {
        const next = branchGroups.get(BRANCH_NAV_ORDER[Math.min(branchIdx + 1, BRANCH_NAV_ORDER.length - 1)]) ?? [];
        go(next[Math.min(idxInBranch, next.length - 1)]?.id ?? next[0]?.id);
        break;
      }
      case 'ArrowUp': {
        const prev = branchGroups.get(BRANCH_NAV_ORDER[Math.max(branchIdx - 1, 0)]) ?? [];
        go(prev[Math.min(idxInBranch, prev.length - 1)]?.id ?? prev[0]?.id);
        break;
      }
      case 'Home':
        go(group[0]?.id);
        break;
      case 'End':
        go(group[group.length - 1]?.id);
        break;
      default:
        break;
    }
  };

  return (
    <section
      className="statusObservatoryInstrument statusObservatoryConstellation statusStatConstellation"
      data-testid="status-stat-constellation"
      data-surface-testid={surface.rootTestId}
      data-current-path={surface.currentPath ?? 'none'}
      data-s3-instrument="stat-meridian-constellation"
      aria-label="Path-Adaptive Stat Meridian Constellation"
    >
      <div className="statusObservatoryInstrument__header statusStatConstellation__header">
        <span className="statusObservatoryInstrument__sigil" aria-hidden="true" />
        <div>
          <h2>{surface.title}</h2>
          <p>
            {surface.subtitle} - current path {surface.currentPath ?? 'none'} - {surface.nodes.length} visible beads
          </p>
        </div>
      </div>

      <div className="statusStatConstellation__body">
        <div className="statusStatConstellation__atlas" aria-label="All named stat meridian map">
          <svg
            className="statusStatConstellation__svg"
            viewBox="0 0 100 100"
            role="img"
            data-animate={motion.animate ? 'true' : 'false'}
            aria-label="Fixed Universal, Heaven, Earth, and Martial stat branch geometry"
          >
            <defs>
              <radialGradient id="statusStatNodeGlow" cx="50%" cy="42%" r="62%">
                <stop offset="0%" stopColor="#fff8d6" stopOpacity="0.95" />
                <stop offset="58%" stopColor="#d6a33a" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4f3215" stopOpacity="0.18" />
              </radialGradient>
              <filter id="statusStatBrushSoft" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0.7" stdDeviation="0.9" floodColor="#3f2812" floodOpacity="0.35" />
              </filter>
            </defs>

            <path className="statusStatConstellation__wash statusStatConstellation__wash--heaven" d="M9 28 C16 9 36 4 50 18 C42 29 45 42 33 52 C18 58 8 47 9 28" />
            <path className="statusStatConstellation__wash statusStatConstellation__wash--earth" d="M6 86 C13 66 26 58 42 64 C51 73 42 91 25 94 C14 96 8 93 6 86" />
            <path className="statusStatConstellation__wash statusStatConstellation__wash--martial" d="M60 29 C75 15 96 35 91 54 C87 73 63 83 56 71 C76 67 88 47 78 33 C72 26 65 27 60 29" />

            {/* W3 atmosphere - painterly, decorative, aria-hidden */}
            <path
              className="statusStatConstellation__brush statusStatConstellation__brush--martial"
              d="M62 30 C72 16 92 22 90 40 C88 58 70 64 62 56 C76 52 84 40 78 32 C73 27 66 28 62 30"
              aria-hidden="true"
            />
            <path
              className="statusStatConstellation__spineGlow"
              d={STATUS_OBSERVATORY_STAT_BRANCH_PATHS.universal}
              aria-hidden="true"
            />
            <path
              className="statusStatConstellation__qiFlow"
              d={STATUS_OBSERVATORY_STAT_BRANCH_PATHS.universal}
              pathLength={1}
              aria-hidden="true"
            />

            {branchEntries.map(([branchId, path]) => (
              <path
                key={branchId}
                className={`statusStatConstellation__branchPath statusStatConstellation__branchPath--${branchId}`}
                data-branch-id={branchId}
                d={path}
                pathLength={1}
              />
            ))}

            {branchEntries.map(([branchId]) => {
              const label = STATUS_OBSERVATORY_STAT_PATH_LABELS[branchId];
              const point = BRANCH_LABEL_POINTS[branchId];
              const branch = surface.branchPaths.find((entry) => entry.id === branchId);
              return (
                <text
                  key={branchId}
                  className={`statusStatConstellation__label statusStatConstellation__label--${branchId}`}
                  data-branch-id={branchId}
                  data-branch-count={branch?.actualCount ?? 0}
                  x={point.x}
                  y={point.y}
                >
                  {label.label}
                </text>
              );
            })}

            {bridgeEntries.map((bridge) => {
              const sourceSocket = bridgeSocketFor(bridge, surface.bridgeSockets);
              return (
                <g
                  key={bridge.id}
                  className="statusStatConstellation__bridgeSocket"
                  data-bridge-socket-id={bridge.id}
                  data-source-socket-id={sourceSocket?.id ?? 'presentation'}
                  data-bridge-state={sourceSocket?.state ?? 'dormant'}
                  transform={`translate(${bridge.x} ${bridge.y})`}
                >
                  <title>{`${bridge.label}. ${sourceSocket?.detail ?? bridge.detail}`}</title>
                  <circle r="2.2" />
                  <circle r="3.5" />
                </g>
              );
            })}

            {surface.weakLinks.map((node) => {
              const index = orderedNodes.findIndex((entry) => entry.id === node.id);
              return (
                <path
                  key={node.id}
                  className="statusStatConstellation__weakThread"
                  data-stat-id={node.id}
                  data-thread-tone={node.tone}
                  data-related={sharedSelection.isRelated('statConstellation', node.id) ? 'true' : 'false'}
                  d={weakThreadPath(node, Math.max(index, 0))}
                  pathLength={1}
                >
                  <title>{node.weakReason ?? `${node.displayName} is linked to the current bottleneck.`}</title>
                </path>
              );
            })}

            {orderedNodes.map((node, index) => {
              const geometry = geometryFor(node, index);
              const isSocket =
                node.nodeState === 'unlit_socket' ||
                node.nodeState === 'future' ||
                node.nodeState === 'inactive';
              return (
                <g
                  key={node.id}
                  className="statusStatConstellation__nodeGlyph"
                  data-stat-id={node.id}
                  data-branch-id={node.branchId}
                  data-node-state={node.nodeState}
                  data-contribution-state={node.contributionState}
                  data-weak-link={node.weakLink ? 'true' : 'false'}
                  data-selected={node.id === lensNode?.id ? 'true' : 'false'}
                  data-related={sharedSelection.isRelated('statConstellation', node.id) ? 'true' : 'false'}
                  transform={`translate(${geometry.x} ${geometry.y})`}
                >
                  <title>{ariaLabelForNode(node)}</title>
                  <circle className="statusStatConstellation__nodeAura" r={node.weakLink ? 4.8 : 3.8} />
                  <circle className="statusStatConstellation__nodeBead" r={isSocket ? 2.15 : 2.75} />
                  {node.nodeState === 'foundation' && !node.weakLink ? (
                    <circle className="statusStatConstellation__nodeCore" r={1.15} />
                  ) : null}
                  {node.weakLink ? <circle className="statusStatConstellation__weakPulse" r={5.6} /> : null}
                  {node.weakLink ? <path className="statusStatConstellation__crack" d="M-1.4 -2.6 L0.2 -0.5 L-0.9 0.2 L1.3 2.5" /> : null}
                </g>
              );
            })}
          </svg>

          <div
            className="statusStatConstellation__hitLayer"
            aria-label="Selectable stat beads"
            onKeyDown={handleRovingKeyDown}
          >
            {orderedNodes.map((node, index) => {
              const geometry = geometryFor(node, index);
              const selected = node.id === lensNode?.id;
              return (
                <button
                  key={node.id}
                  ref={(el) => {
                    if (el) buttonRefs.current.set(node.id, el);
                    else buttonRefs.current.delete(node.id);
                  }}
                  type="button"
                  className="statusStatConstellation__node"
                  style={nodeStyle(geometry)}
                  data-stat-id={node.id}
                  data-branch-id={node.branchId}
                  data-node-state={node.nodeState}
                  data-contribution-state={node.contributionState}
                  data-weak-link={node.weakLink ? 'true' : 'false'}
                  data-selected={selected ? 'true' : 'false'}
                  data-related={sharedSelection.isRelated('statConstellation', node.id) ? 'true' : 'false'}
                  tabIndex={selected ? 0 : -1}
                  aria-pressed={selected}
                  aria-label={ariaLabelForNode(node)}
                  title={node.effectSummary}
                  onClick={() => {
                    setSelectedStatId(node.id);
                    sharedSelection.select('stat', node.id);
                  }}
                  onFocus={() => {
                    setSelectedStatId(node.id);
                    sharedSelection.select('stat', node.id);
                  }}
                >
                  <span className="statusStatConstellation__hitTarget" aria-hidden="true" />
                  <span className="statusStatConstellation__nodeName">{node.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {lensNode ? <StatusStatBeadLens node={lensNode} onAction={onAction} /> : null}
      </div>

      <div className="statusStatConstellation__legend" aria-label="Node state legend">
        {surface.legend.map((entry) => (
          <span key={entry.id} data-node-state={entry.nodeState}>
            <i aria-hidden="true" />
            <strong>{entry.label}</strong>
            <small>{entry.detail}</small>
          </span>
        ))}
      </div>

      <div className="statusStatConstellation__plaque" aria-label="Constellation summary">
        <span>Current Path: {currentPathLabel(surface.currentPath)}</span>
        <span>Overall Constellation Harmony: {surface.weakLinks.length > 0 ? 'Strained' : 'Stable'}</span>
        <span>Bridge Integration: {surface.bridgeSockets.length > 0 ? 'Dormant' : 'Empty'}</span>
        <span>
          Branch Count: {surface.branchCounts.universal}/{surface.branchCounts.heaven}/{surface.branchCounts.earth}/{surface.branchCounts.martial}
        </span>
      </div>
    </section>
  );
}
