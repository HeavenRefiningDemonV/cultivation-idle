import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MutableRefObject,
} from 'react';
import { deepEqualProps } from './fx/memoProps.js';
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
  STATUS_OBSERVATORY_STAT_COMPACT_BRANCH_KEY,
  STATUS_OBSERVATORY_STAT_COMPACT_EDGES,
  STATUS_OBSERVATORY_STAT_COMPACT_NODE_ID,
  STATUS_OBSERVATORY_STAT_COMPACT_POSITIONS,
  STATUS_OBSERVATORY_STAT_COMPACT_VIEWBOX,
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
  /** 'compact' = airy in-panel bead field (default). 'expanded' = full-screen
   *  overlay body: reveals node names, the node-state legend, and the summary
   *  plaque (the artifact's "Path-Adaptive Stat Meridian Constellation" view). */
  variant?: 'compact' | 'expanded';
  /** When set, the in-panel "Open Constellation" hint becomes a button that
   *  opens the full-screen overlay. */
  onExpand?: () => void;
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

/* ===== Artifact COMPACT geometry helpers (700x210 space) ===== */

const COMPACT_W = STATUS_OBSERVATORY_STAT_COMPACT_VIEWBOX.width;
const COMPACT_H = STATUS_OBSERVATORY_STAT_COMPACT_VIEWBOX.height;

/** Artifact node ids that read as dashed dual-path sockets on the compact board. */
const COMPACT_SOCKET_IDS = new Set([27, 28, 18]);

type CompactState = 'lit' | 'spine' | 'weak' | 'socket' | 'grey';

interface CompactNode {
  surface: StatusObservatoryStatNodeSurface;
  artifactId: number;
  x: number;
  y: number;
  state: CompactState;
}

function compactArtifactId(node: StatusObservatoryStatNodeSurface): number | null {
  return (
    STATUS_OBSERVATORY_STAT_COMPACT_NODE_ID[
      node.id as keyof typeof STATUS_OBSERVATORY_STAT_COMPACT_NODE_ID
    ] ?? null
  );
}

/**
 * Derive a node's compact visual state. Surface state leads; the artifact's fixed
 * socket ids and the explicit weak link / spine rules fill any gap so the board
 * reads 1:1 with the reference.
 */
function compactStateFor(node: StatusObservatoryStatNodeSurface, artifactId: number): CompactState {
  if (node.weakLink) return 'weak';
  if (node.branchId === 'universal' || node.nodeState === 'foundation') return 'spine';
  if (node.nodeState === 'lit') return 'lit';
  if (COMPACT_SOCKET_IDS.has(artifactId)) return 'socket';
  if (node.nodeState === 'unlit_socket' || node.nodeState === 'future' || node.nodeState === 'inactive') {
    return 'socket';
  }
  return 'grey';
}

const COMPACT_NODE_FILL: Record<CompactState, string> = {
  lit: 'url(#goldRad)',
  spine: 'url(#jadeRad)',
  weak: 'url(#cinnDisc)',
  socket: 'none',
  grey: 'var(--observatory-paper-deep, var(--paper-parchment-strong))',
};

const COMPACT_NODE_STROKE: Record<CompactState, string> = {
  lit: '#6e4c16',
  spine: '#1c3128',
  weak: '#54190f',
  socket: 'rgba(120,90,46,.5)',
  grey: 'rgba(120,110,90,.6)',
};

function compactNodeRadius(state: CompactState): number {
  return state === 'lit' || state === 'spine' || state === 'weak' ? 8 : 6;
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

const STRIP_BRANCH_ORDER: StatusStatGeometryBranch[] = ['heaven', 'martial', 'earth'];

function branchChipState(
  branchId: StatusStatGeometryBranch,
  currentPath: StatusObservatorySurfaceV1['statConstellation']['currentPath'],
): { tone: 'gold' | 'bronze' | 'ash'; word: string } {
  if (currentPath && branchId === currentPath) return { tone: 'gold', word: 'Active' };
  if (currentPath) return { tone: 'ash', word: 'Locked' };
  return { tone: 'bronze', word: 'Dormant' };
}

function weakLinkChipLabel(surface: StatusObservatorySurfaceV1['statConstellation']): string {
  const weak = surface.weakLinks[0];
  if (!weak) return 'Weak Link - None';
  const value = weak.cap > 0 ? `${weak.currentRating} / ${weak.cap}` : `${weak.currentRating}`;
  return `Weak Link - ${weak.displayName} ${value}`;
}

/* ----- Decorative ink art (behind the nodes). Aria-hidden, motion-free. ----- */

function CompactBrushSwoosh() {
  return (
    <g transform="translate(556,122) rotate(-14) scale(.46)" opacity=".42" filter="url(#brushRough)" aria-hidden="true">
      <path
        d="M-190,60 C-150,-70 60,-150 180,-60 C250,-4 230,90 90,140 C30,160 -40,150 -90,120"
        fill="none"
        stroke="url(#goldBrushG)"
        strokeWidth="30"
        strokeLinecap="round"
      />
      <path
        d="M-160,90 C-90,-20 90,-90 200,0"
        fill="none"
        stroke="url(#goldBrushG)"
        strokeWidth="13"
        strokeLinecap="round"
        opacity=".8"
      />
      <path
        d="M-40,150 C60,170 170,130 215,55"
        fill="none"
        stroke="#7a5a22"
        strokeWidth="5"
        strokeLinecap="round"
        opacity=".4"
      />
    </g>
  );
}

function CompactInkCloud() {
  return (
    <g transform="translate(116,58) scale(.42)" opacity=".1" filter="url(#soft)" aria-hidden="true">
      <ellipse rx="95" ry="22" fill="#5c544a" />
      <ellipse cx="-55" cy="13" rx="55" ry="15" fill="#5c544a" />
      <ellipse cx="58" cy="10" rx="62" ry="16" fill="#5c544a" />
      <ellipse cx="6" cy="-14" rx="48" ry="13" fill="#5c544a" />
    </g>
  );
}

function CompactInkRidge() {
  return (
    <g transform="translate(146,196) scale(.5)" opacity=".12" aria-hidden="true">
      <path d="M-120,0 L-70,-46 L-30,-12 L10,-58 L52,-10 L95,-40 L130,0 Z" fill="#4d463d" />
      <path d="M-90,0 L-40,-30 L0,-6 L48,-34 L92,0 Z" fill="#3a342c" opacity=".8" />
    </g>
  );
}

interface CompactConstellationProps {
  surface: StatusObservatorySurfaceV1['statConstellation'];
  animate: boolean;
  lensNodeId: string | null;
  isRelated: (id: string) => boolean;
  buttonRefs: MutableRefObject<Map<string, HTMLButtonElement>>;
  onSelect: (node: StatusObservatoryStatNodeSurface) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * The artifact-fidelity compact board: a faint Heaven heptagon, jade Spine
 * column, gold Martial constellation with one cinnabar weak node over a brush
 * swoosh, and a flat Earth web — all at the artifact's fixed 700x210 positions.
 * Renders only the 28 stat nodes (no bridge sockets, no branch text labels, no
 * default selection box). The transparent hit-layer keeps roving keyboard a11y.
 */
function CompactConstellation({
  surface,
  animate,
  lensNodeId,
  isRelated,
  buttonRefs,
  onSelect,
  onKeyDown,
}: CompactConstellationProps) {
  const nodes = useMemo<CompactNode[]>(() => {
    const out: CompactNode[] = [];
    for (const node of surface.nodes) {
      const artifactId = compactArtifactId(node);
      if (artifactId == null) continue;
      const pos = STATUS_OBSERVATORY_STAT_COMPACT_POSITIONS[artifactId];
      if (!pos) continue;
      out.push({ surface: node, artifactId, x: pos[0], y: pos[1], state: compactStateFor(node, artifactId) });
    }
    return out;
  }, [surface.nodes]);

  const currentBranchKey = surface.currentPath
    ? STATUS_OBSERVATORY_STAT_COMPACT_BRANCH_KEY[surface.currentPath as StatusStatGeometryBranch]
    : null;

  return (
    <>
      <svg
        className="statusStatConstellation__svg statusStatConstellation__svg--compact"
        viewBox={`0 0 ${COMPACT_W} ${COMPACT_H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        data-animate={animate ? 'true' : 'false'}
        aria-label="Fixed Heaven, Universal spine, Earth, and Martial stat branch geometry"
      >
        {/* Decorative ink art, drawn first (behind nodes) */}
        <CompactInkCloud />
        <CompactInkRidge />
        <CompactBrushSwoosh />

        {/* Branch edges */}
        {(Object.keys(STATUS_OBSERVATORY_STAT_COMPACT_EDGES) as Array<keyof typeof STATUS_OBSERVATORY_STAT_COMPACT_EDGES>).map(
          (branchKey) => {
            const lit = currentBranchKey === branchKey;
            const isSpine = branchKey === 'U';
            const stroke = isSpine
              ? 'rgba(45,120,68,.5)'
              : lit
                ? 'rgba(162,113,42,.6)'
                : 'rgba(120,110,90,.25)';
            const width = isSpine || lit ? 1.8 : 1;
            return (
              <g key={branchKey} className="statusStatConstellation__compactEdges" data-branch-key={branchKey}>
                {STATUS_OBSERVATORY_STAT_COMPACT_EDGES[branchKey].map(([from, to], index) => {
                  const a = STATUS_OBSERVATORY_STAT_COMPACT_POSITIONS[from];
                  const b = STATUS_OBSERVATORY_STAT_COMPACT_POSITIONS[to];
                  if (!a || !b) return null;
                  return (
                    <line
                      key={`${branchKey}-${index}`}
                      x1={a[0]}
                      y1={a[1]}
                      x2={b[0]}
                      y2={b[1]}
                      stroke={stroke}
                      strokeWidth={width}
                    />
                  );
                })}
              </g>
            );
          },
        )}

        {/* Spine glow + qi flow (center column) */}
        <line
          className="statusStatConstellation__compactSpineGlow"
          x1={352}
          y1={14}
          x2={352}
          y2={190}
          stroke="rgba(45,120,68,.2)"
          strokeWidth={6}
        />
        <path
          className="statusStatConstellation__compactQiFlow"
          d="M352,190 L352,14"
          stroke="#cfe6cf"
          strokeWidth={1.2}
          opacity={0.7}
          fill="none"
          aria-hidden="true"
        />

        {/* The 28 nodes */}
        {nodes.map(({ surface: node, artifactId, x, y, state }) => {
          const r = compactNodeRadius(state);
          const dashed = state === 'socket';
          const isGlowing = (state === 'lit' || state === 'spine') && !node.weakLink;
          return (
            <g
              key={node.id}
              className="statusStatConstellation__nodeGlyph"
              data-stat-id={node.id}
              data-branch-id={node.branchId}
              data-node-state={node.nodeState}
              data-compact-state={state}
              data-contribution-state={node.contributionState}
              data-weak-link={node.weakLink ? 'true' : 'false'}
              data-selected={node.id === lensNodeId ? 'true' : 'false'}
              data-related={isRelated(node.id) ? 'true' : 'false'}
              transform={`translate(${x} ${y})`}
            >
              {isGlowing ? (
                <circle
                  className="statusStatConstellation__compactHalo twk"
                  r={r + 3}
                  fill={state === 'spine' ? 'rgba(45,120,68,.3)' : 'rgba(201,168,90,.38)'}
                />
              ) : null}
              {node.weakLink ? (
                <circle
                  className="statusStatConstellation__compactWeakRing weakP"
                  r={r + 3}
                  fill="none"
                  stroke="#8b3028"
                  strokeWidth={1.4}
                />
              ) : null}
              <circle
                className="statusStatConstellation__compactNode"
                r={r}
                fill={COMPACT_NODE_FILL[state]}
                stroke={COMPACT_NODE_STROKE[state]}
                strokeWidth={dashed ? 1 : 1.4}
                strokeDasharray={dashed ? '2 2' : undefined}
                opacity={state === 'grey' ? 0.65 : 1}
                data-artifact-id={artifactId}
              />
            </g>
          );
        })}
      </svg>

      <div
        className="statusStatConstellation__hitLayer statusStatConstellation__hitLayer--compact"
        aria-label="Selectable stat beads"
        onKeyDown={onKeyDown}
      >
        {nodes.map(({ surface: node, x, y }) => {
          const selected = node.id === lensNodeId;
          return (
            <button
              key={node.id}
              ref={(el) => {
                if (el) buttonRefs.current.set(node.id, el);
                else buttonRefs.current.delete(node.id);
              }}
              type="button"
              className="statusStatConstellation__node statusStatConstellation__node--compact"
              style={{ left: `${(x / COMPACT_W) * 100}%`, top: `${(y / COMPACT_H) * 100}%` } as CSSProperties}
              data-stat-id={node.id}
              data-branch-id={node.branchId}
              data-node-state={node.nodeState}
              data-contribution-state={node.contributionState}
              data-weak-link={node.weakLink ? 'true' : 'false'}
              data-selected={selected ? 'true' : 'false'}
              data-related={isRelated(node.id) ? 'true' : 'false'}
              tabIndex={selected ? 0 : -1}
              aria-pressed={selected}
              aria-label={ariaLabelForNode(node)}
              onClick={() => onSelect(node)}
              onFocus={() => onSelect(node)}
            >
              <span className="statusStatConstellation__hitTarget" aria-hidden="true" />
              <span className="statusStatConstellation__nodeName">{node.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export const StatusStatMeridianConstellation = memo(StatusStatMeridianConstellationBase, deepEqualProps);

function StatusStatMeridianConstellationBase({
  surface,
  onAction,
  variant = 'compact',
  onExpand,
}: StatusStatMeridianConstellationProps) {
  const expanded = variant === 'expanded';
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
  const spineNodes = useMemo(
    () => orderedNodes.filter((node) => node.branchId === 'universal').slice(0, 8),
    [orderedNodes],
  );
  const weakLinkNode = surface.weakLinks[0] ?? null;
  const selectWeakLink = () => {
    if (!weakLinkNode) return;
    setSelectedStatId(weakLinkNode.id);
    sharedSelection.select('stat', weakLinkNode.id);
  };
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
      data-variant={variant}
      aria-label="Path-Adaptive Stat Meridian Constellation"
    >
      <div className="statusStatConstellation__strip" hidden aria-hidden="true">
        <span className="statusStatConstellation__stripTitle" aria-hidden="true">Spine</span>
        <div className="statusStatConstellation__spine" aria-label="Universal spine stat beads">
          {spineNodes.map((node, index) => (
            <div className="statusStatConstellation__spineSlot" key={node.id}>
              <button
                type="button"
                className="statusStatConstellation__spineBead"
                data-stat-id={node.id}
                data-branch-id={node.branchId}
                data-node-state={node.nodeState}
                data-contribution-state={node.contributionState}
                data-weak-link={node.weakLink ? 'true' : 'false'}
                data-selected={node.id === lensNode?.id ? 'true' : 'false'}
                data-related={sharedSelection.isRelated('statConstellation', node.id) ? 'true' : 'false'}
                aria-pressed={node.id === lensNode?.id}
                aria-label={ariaLabelForNode(node)}
                onClick={() => {
                  setSelectedStatId(node.id);
                  sharedSelection.select('stat', node.id);
                }}
                onFocus={() => {
                  setSelectedStatId(node.id);
                  sharedSelection.select('stat', node.id);
                }}
              >
                <span className="statusStatConstellation__spineMedallion" aria-hidden="true" />
                <span className="statusStatConstellation__spineCoin" aria-hidden="true">{index + 1}</span>
                <span className="statusStatConstellation__spineName">{node.displayName}</span>
              </button>
              {index < spineNodes.length - 1 ? (
                <i className="statusStatConstellation__spineLink" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
        <div className="statusStatConstellation__chips" aria-label="Branch path states">
          {STRIP_BRANCH_ORDER.map((branchId) => {
            const chip = branchChipState(branchId, surface.currentPath);
            return (
              <span
                key={branchId}
                className="statusStatConstellation__chip"
                data-branch-id={branchId}
                data-chip-tone={chip.tone}
              >
                {STATUS_OBSERVATORY_STAT_PATH_LABELS[branchId].shortLabel} Path ({chip.word})
              </span>
            );
          })}
          <button
            type="button"
            className="statusStatConstellation__chip statusStatConstellation__chip--weak"
            data-chip-tone="cinnabar"
            disabled={!weakLinkNode}
            aria-disabled={weakLinkNode ? undefined : 'true'}
            onClick={selectWeakLink}
          >
            {weakLinkChipLabel(surface)}
          </button>
        </div>
      </div>

      <div className="statusStatConstellation__compact">
        <div className="statusStatConstellation__body">
        <div className="statusStatConstellation__atlas" aria-label="All named stat meridian map">
          {expanded ? (
          <>
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
          </>
          ) : (
            <CompactConstellation
              surface={surface}
              animate={motion.animate}
              lensNodeId={lensNode?.id ?? null}
              isRelated={(id) => sharedSelection.isRelated('statConstellation', id)}
              buttonRefs={buttonRefs}
              onSelect={(node) => {
                setSelectedStatId(node.id);
                sharedSelection.select('stat', node.id);
              }}
              onKeyDown={handleRovingKeyDown}
            />
          )}
        </div>

        {lensNode ? <div className="statusStatConstellation__lensSlot" hidden><StatusStatBeadLens node={lensNode} onAction={onAction} /></div> : null}
        </div>

        <span className="statusStatConstellation__corner statusStatConstellation__corner--heaven" aria-hidden="true">
          Heaven · {surface.currentPath === 'heaven' ? 'Active' : 'Locked'}
        </span>
        <span className="statusStatConstellation__corner statusStatConstellation__corner--earth" aria-hidden="true">
          Earth · {surface.currentPath === 'earth' ? 'Active' : 'Dormant'}
        </span>
        <span className="statusStatConstellation__corner statusStatConstellation__corner--path" aria-hidden="true">
          {currentPathLabel(surface.currentPath)} · Active
        </span>
        <span className="statusStatConstellation__corner statusStatConstellation__corner--spine" aria-hidden="true">Spine</span>
        {expanded ? null : onExpand ? (
          <button type="button" className="statusStatConstellation__expandHint" onClick={onExpand}>
            Open Constellation
          </button>
        ) : (
          <span className="statusStatConstellation__expandHint" aria-hidden="true">Open Constellation</span>
        )}

        <div className="statusStatConstellation__legend" aria-label="Node state legend" hidden={!expanded}>
          {surface.legend.map((entry) => (
            <span key={entry.id} data-node-state={entry.nodeState}>
              <i aria-hidden="true" />
              <strong>{entry.label}</strong>
              <small>{entry.detail}</small>
            </span>
          ))}
        </div>

        {/* Plaque summary hidden by default: the artifact constellation shows only
            the three zone labels, not a metrics block. Kept in the DOM (and in the
            bead lens / node aria-labels) so the data is never lost. */}
        <div className="statusStatConstellation__plaque" aria-label="Constellation summary" hidden={!expanded}>
          <span>Current Path: {currentPathLabel(surface.currentPath)}</span>
          <span>Overall Constellation Harmony: {surface.weakLinks.length > 0 ? 'Strained' : 'Stable'}</span>
          <span>Bridge Integration: {surface.bridgeSockets.length > 0 ? 'Dormant' : 'Empty'}</span>
          <span>
            Branch Count: {surface.branchCounts.universal}/{surface.branchCounts.heaven}/{surface.branchCounts.earth}/{surface.branchCounts.martial}
          </span>
        </div>
      </div>
    </section>
  );
}
