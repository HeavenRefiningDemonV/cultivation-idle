import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';
import { StatusObservatoryOverlayShell, type StatusOverlayGoalContext } from './StatusObservatoryOverlayShell.js';
import { StatusBottleneckInspector } from './StatusBottleneckInspector.js';
import './StatusCanopyOverlay.scss';

type CanopySurface = StatusObservatorySurfaceV1['bottleneckCanopy'];

export interface StatusCanopyOverlayProps {
  open: boolean;
  surface: CanopySurface;
  goal?: StatusOverlayGoalContext | null;
  onClose: () => void;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

const CW = 1810;
const CH = 900;
const pc = (v: number, dim: number): string => `${((v / dim) * 100).toFixed(2)}%`;
function box(opts: { left?: number; top?: number; w?: number; right?: number; bottom?: number }): CSSProperties {
  const s: CSSProperties = { position: 'absolute' };
  if (opts.left != null) s.left = pc(opts.left, CW);
  if (opts.top != null) s.top = pc(opts.top, CH);
  if (opts.w != null) s.width = pc(opts.w, CW);
  if (opts.right != null) s.right = pc(opts.right, CW);
  if (opts.bottom != null) s.bottom = pc(opts.bottom, CH);
  return s;
}

// Artifact corner-slot layout for the four slips (TL, TR, BL, BR).
const SLOTS = [
  { left: 452, top: 118, rot: -2 },
  { left: 1188, top: 118, rot: 2 },
  { left: 452, top: 352, rot: 1 },
  { left: 1188, top: 352, rot: -1 },
];
const SLIP_CAP = SLOTS.length;
const CAUSE_GLYPHS = ['備', '根', '兵'];
const CHARM_GLYPHS = ['兵', '療', '術', '心'];

function Card({ style, className = '', children }: { style: CSSProperties; className?: string; children: ReactNode }) {
  return (
    <div className={`statusCanopyOverlay__card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

/**
 * Full-screen "Bottleneck Talisman Canopy" detail overlay (artifact `ovCanopy`):
 * the central edict + four corner cause-slips on a fan of cords, an expanded
 * inspector that tracks the selected slip, the causal-thread cards, the
 * best-improvement charm rail, the mercy seal, and the resolution reading.
 */
export function StatusCanopyOverlay({ open, surface, goal, onClose, onAction }: StatusCanopyOverlayProps) {
  const slips = surface.talismanSlips.slice(0, SLIP_CAP);
  const fallbackId = surface.inspector.selectedSlipId ?? slips[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(fallbackId);
  useEffect(() => {
    setSelectedId((cur) => (cur && slips.some((s) => s.id === cur) ? cur : fallbackId));
  }, [fallbackId, slips]);
  const selectedSlip = useMemo(() => slips.find((s) => s.id === selectedId) ?? slips[0] ?? null, [slips, selectedId]);

  const edict = surface.centralEdict;
  const opposed = edict.visualState === 'blocked' || edict.visualState === 'postFailure';
  const causeCards = slips.slice(0, 3);

  return (
    <StatusObservatoryOverlayShell
      open={open}
      title="Bottleneck Talisman Canopy"
      subtitle="The node of obstruction and the paths to resolution"
      tagChars="瓶頸"
      sealChars="瓶頸"
      sealVariant="cinnabar"
      watermark="厄結因緣"
      goal={goal}
      onClose={onClose}
      dataTestId="status-canopy-overlay"
      ariaLabel="Bottleneck Talisman Canopy detail"
      className="statusCanopyOverlayPanel"
    >
      <div className="statusCanopyOverlay">
        {/* Decorative fan skeleton + rail + charm rod (full-bleed, behind content) */}
        <svg className="statusCanopyOverlay__weave" viewBox="0 0 1856 912" preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: 9 }, (_, k) => {
            const a = ((-54 + (k * 108) / 8) * Math.PI) / 180;
            const x2 = 915 + Math.sin(a) * 780;
            const y2 = 1015 - Math.cos(a) * 780;
            return <line key={k} x1="915" y1="1015" x2={x2.toFixed(0)} y2={y2.toFixed(0)} stroke="rgba(120,86,38,.32)" strokeWidth="2.2" />;
          })}
          {[445, 585, 725].map((r) => {
            const xa = 915 + Math.sin((-54 * Math.PI) / 180) * r;
            const ya = 1015 - Math.cos((-54 * Math.PI) / 180) * r;
            const xb = 915 + Math.sin((54 * Math.PI) / 180) * r;
            const yb = 1015 - Math.cos((54 * Math.PI) / 180) * r;
            return <path key={r} d={`M${xa.toFixed(0)},${ya.toFixed(0)} A${r},${r} 0 0 1 ${xb.toFixed(0)},${yb.toFixed(0)}`} fill="none" stroke="rgba(120,86,38,.28)" strokeWidth="1.4" />;
          })}
          <path d="M120,64 Q915,26 1710,64" fill="none" stroke="url(#brassH)" strokeWidth="6" />
          <circle cx="120" cy="64" r="8" fill="url(#goldRad)" stroke="#4a330e" />
          <circle cx="1710" cy="64" r="8" fill="url(#goldRad)" stroke="#4a330e" />
          {/* charm spear-rod + banner */}
          <line x1="556" y1="568" x2="1274" y2="568" stroke="url(#brassH)" strokeWidth="5" />
          <rect x="788" y="552" width="254" height="30" rx="3" fill="rgba(31,42,38,.92)" stroke="url(#goldG)" strokeWidth="1.4" />
          <text x="915" y="572" textAnchor="middle" fontSize="12.5" fontWeight="800" letterSpacing="2" fill="#e8d9a8">BEST IMPROVEMENT ROUTES</text>
        </svg>

        {/* Left: causal-thread cause cards */}
        <div className="statusCanopyOverlay__threads" style={box({ left: 18, top: 96, w: 230 })}>
          <div className="statusCanopyOverlay__sub">Causal Threads (from Status)</div>
          {causeCards.map((slip, i) => (
            <Card key={slip.id} className="statusCanopyOverlay__causeCard" style={{}}>
              <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="15.5" fill="url(#cinnDisc)" stroke="#54190f" />
                <circle cx="18" cy="18" r="12" fill="none" stroke="rgba(244,220,203,.45)" strokeDasharray="2 3" />
                <text x="18" y="23" textAnchor="middle" fontFamily="var(--kai)" fontSize="15" fill="#f4dccb">{CAUSE_GLYPHS[i] ?? '結'}</text>
              </svg>
              <div>
                <b>{slip.title}</b>
                <div className="statusCanopyOverlay__causeSub">{slip.detail}</div>
                <span className="statusCanopyOverlay__causeChip">{slip.stateLabel ?? slip.priorityLabel ?? slip.sourceLabel}</span>
              </div>
            </Card>
          ))}
          <Card className="statusCanopyOverlay__causeNote" style={{}}>
            Threads run from each cause into the edict. Cut the cause and the knot loosens.
          </Card>
        </div>

        {/* Center: edict */}
        <Card className="statusCanopyOverlay__edict" style={box({ left: 760, top: 128, w: 330 })}>
          <span className="statusCanopyOverlay__edictPin" aria-hidden="true" />
          <div className="statusCanopyOverlay__sub">Current Bottleneck</div>
          <h2>{edict.label}</h2>
          <div className="statusCanopyOverlay__edictRule" aria-hidden="true" />
          <div className="statusCanopyOverlay__edictSource">{edict.sourceLabel}</div>
          {edict.primaryAction ? (
            <div className="statusCanopyOverlay__edictAction">
              Primary Action<br />
              <b>{edict.primaryAction.label}</b>
            </div>
          ) : null}
          <InkWaxSeal className="statusCanopyOverlay__edictSeal" chars="瓶頸" size={46} rotation={7} variant="cinnabar" />
        </Card>

        {/* Four corner cause-slips (select -> inspector) */}
        {slips.map((slip, i) => {
          const slot = SLOTS[i];
          const selected = slip.id === selectedSlip?.id;
          return (
            <button
              key={slip.id}
              type="button"
              className="statusCanopyOverlay__slip"
              data-tone={slip.tone}
              data-selected={selected ? 'true' : 'false'}
              style={{ ...box({ left: slot.left, top: slot.top, w: 196 }), transform: `rotate(${slot.rot}deg)` }}
              aria-pressed={selected}
              aria-label={slip.ariaLabel}
              onClick={() => setSelectedId(slip.id)}
            >
              <span className="statusCanopyOverlay__slipPin" aria-hidden="true" />
              <span className="statusCanopyOverlay__slipLead" aria-hidden="true">!</span>
              <span className="statusCanopyOverlay__slipBody">
                <b>{slip.title}</b>
                <span className="statusCanopyOverlay__slipChip">{slip.priorityLabel ?? slip.stateLabel ?? slip.sourceLabel}</span>
                <small>{slip.routeLabel ? `Route: ${slip.routeLabel}` : slip.detail}</small>
              </span>
            </button>
          );
        })}

        {/* Right: expanded inspector (reused) tracking the selected slip */}
        <div className="statusCanopyOverlay__inspector" style={box({ right: 18, top: 96, w: 300 })}>
          <StatusBottleneckInspector inspector={surface.inspector} slip={selectedSlip} onAction={onAction} />
        </div>

        {/* Right: resolution reading */}
        <Card className="statusCanopyOverlay__summary" style={box({ right: 18, top: 560, w: 300 })}>
          <div className="statusCanopyOverlay__sub statusCanopyOverlay__sub--gold">Resolution Reading</div>
          <p>
            {opposed
              ? 'Multiple sources feed this bottleneck. Clear preparation and the weapon floor first to unblock the realm edge; the opposed root is a longer-term reroll.'
              : 'No major source blocks the gate. Keep cultivating and maintain reserves.'}
          </p>
        </Card>

        {/* Best-improvement charm rail */}
        <div className="statusCanopyOverlay__charms" style={box({ left: 545, top: 600, w: 720 })}>
          {surface.routeCharms.slice(0, 4).map((charm, i) => {
            const jade = i < 2;
            const disabled = charm.action.disabled || !onAction;
            return (
              <button
                key={charm.id}
                type="button"
                className="statusCanopyOverlay__charm"
                data-action-id={charm.action.id}
                data-tone={jade ? 'jade' : 'gold'}
                disabled={disabled}
                aria-disabled={disabled ? 'true' : undefined}
                title={charm.action.disabled ? charm.action.disabledReason ?? charm.detail : charm.detail}
                onClick={() => {
                  if (!disabled) onAction?.(charm.action);
                }}
              >
                <svg width="80" height="116" viewBox="0 0 80 116" aria-hidden="true">
                  <ellipse cx="40" cy="42" rx="34" ry="40" fill={jade ? 'url(#jadeRad)' : 'url(#goldRad)'} stroke="#4a330e" strokeWidth="3" />
                  <ellipse cx="40" cy="42" rx="27" ry="33" fill="none" stroke={jade ? 'rgba(233,239,226,.45)' : 'rgba(42,29,8,.45)'} strokeWidth="1.2" strokeDasharray="3 3" />
                  <text x="40" y="52" textAnchor="middle" fontFamily="var(--kai)" fontSize="27" fill={jade ? '#e9efe2' : '#2a1d08'}>{CHARM_GLYPHS[i] ?? '符'}</text>
                  <g className="statusCanopyOverlay__charmTassel">
                    <path d="M40,84 q-4,14 -6,22 M40,84 q0,15 0,23 M40,84 q4,14 6,22" stroke="var(--observatory-cinnabar)" strokeWidth="1.4" fill="none" />
                    <circle cx="40" cy="108" r="2" fill="var(--observatory-cinnabar)" />
                  </g>
                </svg>
                <strong>{charm.label}</strong>
                <small>Route charm</small>
              </button>
            );
          })}
        </div>

        {/* Diagnosis watermark seal (bottom-left) */}
        <svg className="statusCanopyOverlay__diag" viewBox="0 0 92 92" style={box({ left: 26, bottom: 22 })} aria-hidden="true">
          <circle cx="46" cy="46" r="42" fill="none" stroke="#3a342c" strokeWidth="3" opacity="0.7" />
          <circle cx="46" cy="46" r="35" fill="none" stroke="#3a342c" strokeWidth="1.6" opacity="0.55" />
          <text x="46" y="40" textAnchor="middle" fontFamily="var(--kai)" fontSize="24" fill="#3a342c">診</text>
          <text x="46" y="66" textAnchor="middle" fontFamily="var(--kai)" fontSize="24" fill="#3a342c">斷</text>
        </svg>

        {/* Mercy seal (bottom-right) */}
        <div className="statusCanopyOverlay__mercy" style={box({ right: 30, bottom: 18, w: 280 })}>
          <svg width="200" height="150" viewBox="0 0 200 150" aria-hidden="true">
            <circle cx="100" cy="72" r="58" fill="rgba(248,243,224,.6)" stroke="var(--observatory-cinnabar)" strokeWidth="3" />
            <circle cx="100" cy="72" r="58" fill="none" stroke="rgba(240,217,160,.6)" strokeWidth="1" strokeDasharray="6 4" />
            <g transform="translate(100,46)" opacity="0.9">
              <path d="M0,10 C-10,4 -10,-8 0,-12 C10,-8 10,4 0,10 Z" fill="none" stroke="var(--observatory-cinnabar)" strokeWidth="1.6" />
              <path d="M-9,2 C-16,-2 -15,-10 -8,-12 M9,2 C16,-2 15,-10 8,-12" fill="none" stroke="var(--observatory-cinnabar)" strokeWidth="1.3" />
            </g>
            <text x="100" y="80" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="var(--observatory-cinnabar)">{surface.safetySeal.stateLabel}</text>
            <text x="100" y="96" textAnchor="middle" fontSize="8.5" fill="var(--observatory-muted)">{surface.safetySeal.progressLabel}</text>
          </svg>
          <div className="statusCanopyOverlay__sub">{surface.safetySeal.label} (Mercy Path)</div>
        </div>
      </div>
    </StatusObservatoryOverlayShell>
  );
}
