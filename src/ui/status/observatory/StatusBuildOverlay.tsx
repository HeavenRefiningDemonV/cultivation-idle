import type { CSSProperties, ReactNode } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type {
  StatusObservatorySurfaceV1,
  StatusObservatoryVisualState,
} from '../../../systems/ui/status/statusObservatoryTypes.js';
import { StatusObservatoryOverlayShell, type StatusOverlayGoalContext } from './StatusObservatoryOverlayShell.js';
import { jarFillFromText } from './StatusReserveJars.js';
import './StatusBuildOverlay.scss';

type BuildSurface = StatusObservatorySurfaceV1['buildPreparation'];
type Mark = 'ok' | 'warn' | 'risk';

export interface StatusBuildOverlayProps {
  open: boolean;
  surface: BuildSurface;
  visualState?: StatusObservatoryVisualState;
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

// Mirrors StatusBuildPreparationScales (the surface doesn't expose per-floor
// status, so the marks/verdict key on the whole-screen visualState).
const READINESS_LABELS = ['Path Alignment', 'Empty Slots', 'Mastery Floor', 'Rank Floor', 'Rune Floor', 'Policy Fit'] as const;
const READINESS_MARKS: Record<StatusObservatoryVisualState, readonly Mark[]> = {
  blocked: ['ok', 'warn', 'warn', 'risk', 'risk', 'risk'],
  postFailure: ['warn', 'risk', 'risk', 'risk', 'risk', 'risk'],
  healthy: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
  prestigePressure: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
  contentCap: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
  unknown: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
};
const SCALE_VERDICT: Record<StatusObservatoryVisualState, string> = {
  blocked: 'Strained',
  postFailure: 'Failed',
  healthy: 'Strong',
  prestigePressure: 'Strong',
  contentCap: 'Strong',
  unknown: 'Strong',
};

// Static floor reference (artifact reqMap): [desc, module, current, required].
const REQ: Record<string, [string, string, string, string]> = {
  'Path Alignment': ['Loadout matches Martial path', 'Loadout Policy', 'Martial loadout', 'Match path'],
  'Empty Slots': ['0 empty of 6 slots', 'Equipment', '0 empty', '0 allowed'],
  'Mastery Floor': ['Avg mastery vs realm floor', 'Training Hall', '0.0 avg', '≥ 4.0'],
  'Rank Floor': ['Technique rank vs floor', 'Manual Pavilion', 'Rank 1', '≥ Rank 3'],
  'Rune Floor': ['Rune tier vs floor', 'Forge', 'Tier 0', '≥ Tier 1'],
  'Policy Fit': ['Active policy vs build', 'Loadout Policy', 'Generic policy', 'Martial policy'],
};

const JAR_COLOR = ['#c79a45', '#5a8bb0', '#a44731', '#8d642d', '#9c4a3e'];
const JAR_TARGET = ['10,000', '5,000', '80%', 'Good', '70%'];
const JAR_ROUTE = ['Bounties', 'Mining', 'Apothecary', 'Apothecary', 'Apothecary'];
const FORECAST: Array<[string, string, string, boolean]> = [
  ['Healing charges', '−12', '0 remaining', true],
  ['Medicine doses', '−8', '4 short', true],
  ['Spirit Stones', '−150', 'covered', false],
  ['Merit (entry writ)', '−25', 'covered', false],
];
const LOADOUT: Array<[string, string, 'ok' | 'warn' | 'empty']> = [
  ['兵', 'Weapon', 'ok'],
  ['甲', 'Armor', 'ok'],
  ['符', 'Rune', 'empty'],
  ['丹', 'Pill', 'empty'],
  ['策', 'Policy', 'warn'],
  ['飾', 'Charm', 'empty'],
];
const COMPONENTS: Array<[string, number, number, boolean]> = [
  ['Build floors', 18, 55, true],
  ['Reserves', 9, 25, true],
  ['Loadout', 12, 15, false],
  ['Stability', 0, 15, true],
];

function markColor(m: Mark): string {
  return m === 'ok' ? 'var(--observatory-jade)' : m === 'warn' ? 'var(--observatory-gold-deep, var(--observatory-gold))' : 'var(--observatory-cinnabar)';
}

function MarkDot({ m }: { m: Mark }) {
  return (
    <span className="statusBuildOverlay__mark" style={{ background: markColor(m) }} aria-hidden="true">
      {m === 'ok' ? (
        <svg viewBox="0 0 16 16" width="10" height="10"><path d="M3 8.5 L6.5 12 L13 4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : m === 'warn' ? (
        '!'
      ) : (
        <svg viewBox="0 0 16 16" width="10" height="10"><path d="M4 4 L12 12 M12 4 L4 12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>
      )}
    </span>
  );
}

function Card({ style, className = '', children }: { style: CSSProperties; className?: string; children: ReactNode }) {
  return (
    <div className={`statusBuildOverlay__card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

/**
 * Full-screen "Build & Preparation Inspector" overlay (artifact `ovBuild`): the
 * build-floor table vs requirements, the reserve-jar detail with restock routes
 * and a trial-consumption forecast, and the gate-readiness reading with loadout
 * coverage and readiness components.
 */
export function StatusBuildOverlay({ open, surface, visualState, goal, onClose, onAction }: StatusBuildOverlayProps) {
  const state: StatusObservatoryVisualState = visualState && visualState !== 'unknown' ? visualState : 'blocked';
  const marks = READINESS_MARKS[state] ?? READINESS_MARKS.blocked;
  const verdict = SCALE_VERDICT[state] ?? SCALE_VERDICT.blocked;
  const jars = surface.reserveJars;

  const primaryRoutes = surface.rows
    .map((r) => r.action)
    .filter((a): a is StatusLedgerActionSurface => Boolean(a))
    .slice(0, 3);

  return (
    <StatusObservatoryOverlayShell
      open={open}
      title="Build & Preparation Inspector"
      subtitle="Floors, reserves, and readiness thresholds"
      tagChars="備械"
      sealChars="備械"
      sealVariant="cinnabar"
      watermark="備械秤量"
      goal={goal}
      onClose={onClose}
      dataTestId="status-build-overlay"
      ariaLabel="Build and Preparation Inspector detail"
      className="statusBuildOverlayPanel"
    >
      <div className="statusBuildOverlay">
        {/* Left: build floors vs required */}
        <Card style={box({ left: 18, top: 14, w: 430 })}>
          <div className="statusBuildOverlay__sub statusBuildOverlay__sub--cinnabar">Build Floors — Current vs Required</div>
          {READINESS_LABELS.map((label, i) => {
            const m = marks[i];
            const req = REQ[label];
            return (
              <div key={label} className="statusBuildOverlay__floor">
                <div className="statusBuildOverlay__floorHead">
                  <span className="statusBuildOverlay__floorTitle">
                    <MarkDot m={m} />
                    <b>{label}</b>
                  </span>
                  <span style={{ color: markColor(m) }}>{m === 'ok' ? 'Met' : m === 'warn' ? 'Marginal' : 'Below floor'}</span>
                </div>
                <div className="statusBuildOverlay__floorReq">
                  <span>Current <b style={{ color: markColor(m) }}>{req[2]}</b> · Required <b>{req[3]}</b></span>
                  <em>{req[1]} ›</em>
                </div>
                <div className="statusBuildOverlay__floorDesc">{req[0]}</div>
              </div>
            );
          })}
          <div className="statusBuildOverlay__verdict">Build Readiness: {verdict}</div>
          <div className="statusBuildOverlay__doctrine"><b>Floor Doctrine.</b> Floors are minimums the gate checks. Any red floor blocks readiness regardless of totals.</div>
          <div className="statusBuildOverlay__sub" style={{ marginTop: '10px' }}>Recent Floor Checks</div>
          {([['Gate trial — Stage 9', 'Failed', true], ['Pre-check — manual', '3 floors red', true], ['Loadout review', 'Policy loose', false]] as Array<[string, string, boolean]>).map(([what, result, bad]) => (
            <div key={what} className="statusBuildOverlay__check">
              <span>{what}</span>
              <b style={{ color: bad ? 'var(--observatory-cinnabar)' : 'var(--observatory-gold-deep, var(--observatory-gold))' }}>{result}</b>
            </div>
          ))}
          <svg className="statusBuildOverlay__balance" viewBox="0 0 150 92" aria-hidden="true">
            <line x1="75" y1="8" x2="75" y2="30" stroke="#5d4a26" strokeWidth="3" />
            <path d="M30,30 L120,30" stroke="#5d4a26" strokeWidth="4" />
            <circle cx="75" cy="8" r="5" fill="url(#goldRad)" stroke="#4a330e" />
            <path d="M30,30 L18,58 L42,58 Z" fill="none" stroke="#5d4a26" strokeWidth="2.4" />
            <path d="M120,30 L108,72 L132,72 Z" fill="none" stroke="#5d4a26" strokeWidth="2.4" />
            <ellipse cx="30" cy="60" rx="14" ry="4" fill="rgba(78,107,94,.5)" />
            <ellipse cx="120" cy="74" rx="14" ry="4" fill="rgba(139,48,40,.55)" />
            <text x="30" y="50" textAnchor="middle" fontSize="8" fill="var(--observatory-muted)">have</text>
            <text x="120" y="64" textAnchor="middle" fontSize="8" fill="var(--observatory-muted)">need</text>
          </svg>
        </Card>

        {/* Center: reserve jar detail + forecast */}
        <Card style={box({ left: 462, top: 14, w: 560 })}>
          <div className="statusBuildOverlay__sub statusBuildOverlay__sub--jade">Reserve Jars — Detail</div>
          {jars.map((jar, i) => {
            const level = jarFillFromText(jar.value, jar.tone);
            const bad = jar.tone === 'danger' || jar.tone === 'warning' || /low|empty|poor/i.test(jar.value ?? '');
            const color = JAR_COLOR[i] ?? '#7f9a86';
            return (
              <div key={jar.id} className="statusBuildOverlay__jar">
                <div className="statusBuildOverlay__jarHead">
                  <span className="statusBuildOverlay__jarName">
                    <svg width="22" height="26" viewBox="0 0 22 26" aria-hidden="true">
                      <rect x="5" y="6" width="12" height="17" rx="3" fill={color} opacity="0.8" stroke="rgba(74,51,14,.55)" />
                      <rect x="7" y="2" width="8" height="5" rx="2" fill="#caa15a" stroke="rgba(74,51,14,.55)" />
                    </svg>
                    <b>{jar.label}</b>
                  </span>
                  <span className="statusBuildOverlay__jarMeter">
                    <span className="statusBuildOverlay__jarTrack"><span style={{ width: `${level}%`, background: color }} /></span>
                    <strong style={{ color: bad ? 'var(--observatory-cinnabar)' : 'var(--observatory-ink)' }}>{jar.value ?? jar.detail}</strong>
                  </span>
                </div>
                <div className="statusBuildOverlay__jarFoot">
                  <span>Target: {JAR_TARGET[i] ?? '—'}</span>
                  <em>Restock via {JAR_ROUTE[i] ?? jar.sourceLabel} ›</em>
                </div>
              </div>
            );
          })}
          <div className="statusBuildOverlay__pouch">
            <div className="statusBuildOverlay__doctrine"><b>Pouch Doctrine.</b> Reserves drain during trials; the gate assumes a full pouch and punishes shortfalls mid-attempt.</div>
            <span className="statusRootLawRouteButton statusRootLawRouteButton--daoHeart" aria-hidden="true">Restock All</span>
          </div>
          <div className="statusBuildOverlay__sub" style={{ marginTop: '12px' }}>Trial Consumption Forecast — per gate attempt</div>
          {FORECAST.map(([what, delta, after, bad]) => (
            <div key={what} className="statusBuildOverlay__forecast">
              <span>{what}</span>
              <span><b>{delta}</b> → <b style={{ color: bad ? 'var(--observatory-cinnabar)' : 'var(--observatory-jade)' }}>{after}</b></span>
            </div>
          ))}
          <svg className="statusBuildOverlay__shelf" viewBox="0 0 360 86" aria-hidden="true">
            <path d="M14,70 L346,70 L340,80 L20,80 Z" fill="rgba(120,86,38,.5)" />
            <line x1="14" y1="70" x2="346" y2="70" stroke="#5d4a26" strokeWidth="2.4" />
            {[0, 1, 2, 3, 4].map((k) => {
              const x = 52 + k * 64;
              const fillFrac = [0.3, 0.85, 0.18, 0.5, 0.16][k];
              const col = JAR_COLOR[k];
              return (
                <g key={k}>
                  <rect x={x - 13} y="28" width="26" height="40" rx="5" fill={col} opacity="0.55" stroke="rgba(74,51,14,.6)" />
                  <rect x={x - 8} y="20" width="16" height="9" rx="3" fill="#caa15a" stroke="rgba(74,51,14,.6)" />
                  <rect x={x - 13} y={28 + 40 * (1 - fillFrac)} width="26" height={40 * fillFrac} rx="4" fill={col} opacity="0.85" />
                </g>
              );
            })}
            <text x="180" y="14" textAnchor="middle" fontSize="8.5" letterSpacing="1.5" fill="var(--observatory-muted)">APOTHECARY SHELF</text>
          </svg>
        </Card>

        {/* Right: gate readiness reading */}
        <Card style={box({ left: 1036, top: 14, right: 18 })}>
          <div className="statusBuildOverlay__sub statusBuildOverlay__sub--gold">Gate Readiness Reading</div>
          <div className="statusBuildOverlay__readHead">
            <svg width="112" height="112" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(120,90,46,.2)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--observatory-cinnabar)" strokeWidth="10" strokeDasharray={Math.PI * 100} strokeDashoffset={Math.PI * 100 * 0.66} transform="rotate(-90 60 60)" strokeLinecap="round" />
              <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--observatory-cinnabar)">34%</text>
              <text x="60" y="74" textAnchor="middle" fontSize="9" fill="var(--observatory-muted)">ready</text>
            </svg>
            <p>Preparation is the primary blocker. Healing and weapon floor are unmet; clearing them lifts readiness above the gate threshold.</p>
          </div>
          <div className="statusBuildOverlay__sub" style={{ marginTop: '10px' }}>Loadout Coverage</div>
          <div className="statusBuildOverlay__loadout">
            {LOADOUT.map(([glyph, name, st2]) => {
              const ok = st2 === 'ok';
              const warn = st2 === 'warn';
              const col = ok ? 'var(--observatory-jade)' : warn ? 'var(--observatory-gold-deep, var(--observatory-gold))' : 'rgba(120,110,90,.6)';
              return (
                <div key={name} className="statusBuildOverlay__slot">
                  <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
                    <circle cx="19" cy="19" r="16" fill={ok ? 'url(#jadeRad)' : warn ? 'url(#goldRad)' : 'none'} stroke={col} strokeWidth="1.8" strokeDasharray={st2 === 'empty' ? '4 3' : undefined} />
                    <text x="19" y="25" textAnchor="middle" fontFamily="var(--kai)" fontSize="15" fill={ok ? '#e9efe2' : warn ? '#2a1d08' : 'rgba(120,110,90,.85)'}>{glyph}</text>
                  </svg>
                  <small>{name}</small>
                  <b style={{ color: col }}>{ok ? 'Set' : warn ? 'Loose' : 'Empty'}</b>
                </div>
              );
            })}
          </div>
          <div className="statusBuildOverlay__lastGate"><b>Last gate attempt:</b> Failed — preparation below floor.</div>
          <div className="statusBuildOverlay__sub" style={{ marginTop: '11px' }}>Readiness Components</div>
          {COMPONENTS.map(([label, val, max, bad]) => (
            <div key={label} className="statusBuildOverlay__comp">
              <div className="statusBuildOverlay__compHead">
                <span>{label}</span>
                <b style={{ color: bad ? 'var(--observatory-cinnabar)' : 'var(--observatory-gold-deep, var(--observatory-gold))' }}>{val} / {max}</b>
              </div>
              <span className="statusBuildOverlay__compTrack"><span style={{ width: `${(val / max) * 100}%`, background: bad ? 'var(--observatory-cinnabar)' : 'var(--observatory-gold-deep, var(--observatory-gold))' }} /></span>
            </div>
          ))}
          <div className="statusBuildOverlay__threshold">Gate threshold <b>75</b> · current total <b style={{ color: 'var(--observatory-cinnabar)' }}>39</b></div>
          <div className="statusBuildOverlay__sub" style={{ marginTop: '10px' }}>Primary Routes</div>
          <div className="statusBuildOverlay__routes">
            {primaryRoutes.length > 0
              ? primaryRoutes.map((action, i) => {
                  const disabled = action.disabled || !onAction;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      className={`statusRootLawRouteButton ${i === 0 ? 'statusRootLawRouteButton--daoHeart' : ''}`.trim()}
                      data-action-id={action.id}
                      disabled={disabled}
                      aria-disabled={disabled ? 'true' : undefined}
                      title={action.disabled ? action.disabledReason ?? action.detail : action.detail}
                      onClick={() => {
                        if (!disabled) onAction?.(action);
                      }}
                    >
                      {action.label}
                    </button>
                  );
                })
              : /* The fixture's build rows expose no route actions; show the
                   artifact's readiness routes as informational chips so the
                   column reads complete (the live build surface wires these). */
                (['Restock Healing', 'Forge Weapon', 'Open Apothecary'] as const).map((label, i) => (
                  <span
                    key={label}
                    className={`statusRootLawRouteButton ${i === 0 ? 'statusRootLawRouteButton--daoHeart' : ''}`.trim()}
                    aria-hidden="true"
                  >
                    {label}
                  </span>
                ))}
          </div>
        </Card>
      </div>
    </StatusObservatoryOverlayShell>
  );
}
