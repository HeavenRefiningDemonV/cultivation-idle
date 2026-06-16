import type { CSSProperties, ReactNode } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';
import { StatusObservatoryOverlayShell, type StatusOverlayGoalContext } from './StatusObservatoryOverlayShell.js';
import { StatusSpiritRootAstrolabe } from './StatusSpiritRootAstrolabe.js';
import { StatusHeartLawSeal } from './StatusHeartLawSeal.js';
import { parseLeadingInt } from './observatoryAstrolabeGeometry.js';
import './StatusRootLawOverlay.scss';

type RootLawSurface = StatusObservatorySurfaceV1['rootLawInstrument'];

export interface StatusRootLawOverlayProps {
  open: boolean;
  surface: RootLawSurface;
  goal?: StatusOverlayGoalContext | null;
  onClose: () => void;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

/* The 14 major roots (artifact ELEMENTS): id (matches activeRootId) + name +
   Kai-ti glyph + element colour. Static reference data, same as the artifact. */
const ELEMENTS: ReadonlyArray<[string, string, string, string]> = [
  ['wood', 'Wood', '木', '#2d7844'],
  ['fire', 'Fire', '火', '#a44731'],
  ['earth', 'Earth', '土', '#8d642d'],
  ['metal', 'Metal', '金', '#69717c'],
  ['water', 'Water', '水', '#2a668d'],
  ['wind', 'Wind', '風', '#6f8a5e'],
  ['lightning', 'Lightning', '雷', '#b2832d'],
  ['ice', 'Ice', '冰', '#6f93a8'],
  ['light', 'Light', '光', '#c8a04b'],
  ['shadow', 'Shadow', '影', '#4a4039'],
  ['soul', 'Soul', '魂', '#9c5a4e'],
  ['void', 'Void', '虛', '#3a332d'],
  ['time', 'Time', '時', '#8d642d'],
  ['astral', 'Astral', '星', '#b59a55'],
];

// Artifact ovcontent is ~1810x900 inner; positions are ported as % of that box so
// the absolute composition scales with the overlay panel.
const CW = 1810;
const CH = 900;
const px = (v: number, dim: number): string => `${((v / dim) * 100).toFixed(2)}%`;
function box(left: number, top: number, opts: { w?: number; h?: number; right?: number; bottom?: number } = {}): CSSProperties {
  const s: CSSProperties = { position: 'absolute', left: px(left, CW), top: px(top, CH) };
  if (opts.w != null) s.width = px(opts.w, CW);
  if (opts.h != null) s.height = px(opts.h, CH);
  if (opts.right != null) s.right = px(opts.right, CW);
  if (opts.bottom != null) s.bottom = px(opts.bottom, CH);
  return s;
}

function observeAction(astrolabe: RootLawSurface['astrolabe']): StatusLedgerActionSurface | null {
  return (
    astrolabe.routeActions.find((a) => a.target.kind === 'status_observation') ??
    astrolabe.routeActions.find((a) => a.label === 'Observe Spirit Root') ??
    astrolabe.routeActions[0] ??
    null
  );
}

interface DiagRow {
  label: string;
  value: string;
  bad?: boolean;
}

function Card({ style, className = '', children }: { style: CSSProperties; className?: string; children: ReactNode }) {
  return (
    <div className={`statusRootLawOverlay__card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

function DiagList({ rows }: { rows: DiagRow[] }) {
  return (
    <div className="statusRootLawOverlay__diag">
      {rows.map((r) => (
        <div key={r.label} className="statusRootLawOverlay__diagRow">
          <span>{r.label}</span>
          <b data-bad={r.bad ? 'true' : 'false'}>{r.value}</b>
        </div>
      ))}
    </div>
  );
}

/**
 * Full-screen "Spirit Root Astrolabe" detail overlay (artifact `ovAstrolabe`).
 * A dense diagnostic of the root + heart-law pairing: profile, the 14-root legend,
 * the live dial, the root/law chain-bridge, the heart-law seal scroll, an
 * observation drawer, run-validity / expression-cap / proc readouts, grade notes,
 * and the bottom synergy / impact / improve / variants band — inside the shared
 * overlay-shell chrome. Reuses the in-panel dial + heart-seal medallion verbatim.
 */
export function StatusRootLawOverlay({ open, surface, goal, onClose, onAction }: StatusRootLawOverlayProps) {
  const a = surface.astrolabe;
  const h = surface.heartLawSeal;
  const opposed = surface.bridge.fitTier === 'opposed';
  const strained = surface.bridge.fitTier === 'strained';
  const fitBad = opposed || strained;
  const purity = parseLeadingInt(a.purityLabel) ?? 0;
  const activeName = a.spiritRoot.elementLabel;
  const mult = a.totalMultiplierLabel ?? (opposed ? '−2.32×' : '+1.4×');
  const fitCol = fitBad ? 'var(--observatory-cinnabar)' : 'var(--observatory-jade)';

  const observe = observeAction(a);
  const observeDisabled = !observe || observe.disabled || !onAction;
  const dao = h.routeAction;
  const daoDisabled = !dao || dao.disabled || !onAction;
  const fire = (action: StatusLedgerActionSurface | null, disabled: boolean) => {
    if (action && !disabled) onAction?.(action);
  };

  const procName = a.proc ? a.proc.name : 'None';
  const observationRows: DiagRow[] = [
    { label: 'Purity', value: a.purityLabel ?? '—' },
    { label: 'Expression', value: a.expressionCapLabel ?? '—', bad: opposed },
    { label: 'Total Multiplier', value: mult, bad: opposed },
    { label: 'Current Proc', value: procName },
    { label: 'Status', value: a.proc?.statusLabel ?? 'Inactive' },
    { label: 'Run Validity', value: a.runValidityLabel ?? '—', bad: fitBad },
    { label: 'Cooldown', value: a.proc?.cooldownLabel ?? '—' },
  ];
  const fitRows: DiagRow[] = [
    { label: 'Root / Law Fit', value: a.fitLabel, bad: fitBad },
    { label: 'Fit Multiplier', value: mult, bad: opposed },
  ];
  const impactRows: DiagRow[] = [
    { label: 'Cultivation Efficiency', value: opposed ? 'Low ↓' : 'Strong', bad: opposed },
    { label: 'Breakthrough Stability', value: opposed ? 'Low ↓' : 'Stable', bad: opposed },
    { label: 'Qi Recovery', value: opposed ? 'Reduced' : 'Normal', bad: opposed },
    { label: 'Skill Expression', value: opposed ? 'Suppressed' : 'Full', bad: opposed },
    { label: 'Breakthrough Risk', value: opposed ? 'Increased ↑' : 'Low', bad: opposed },
  ];
  const improveRows: Array<[string, string]> = [
    ['Refine Heart Law comprehension', 'Dao Heart Sanctuary'],
    ['Raise Purity through cultivation', 'Cultivation'],
    ['Align Root / Law synergy', 'Renewal reroll'],
    ['Stabilize Dao Heart turbulence', 'Verses & seals'],
    ['Increase Expression Cap', 'Training Hall'],
  ];
  const variantRows: Array<[string, string, boolean]> = [
    ['Hollow Void Canon', 'Best fit', true],
    ['Abyssal Stillness Sutra', 'Strong', true],
    [h.heartLawLabel, opposed ? 'Opposed' : 'Current', !opposed],
    ['Iron Marrow Litany', 'Neutral', false],
  ];

  const TABS = ['Profile', 'Fit', 'Effects', 'Variants', 'Routes', 'History'];
  const TAB_GLYPH = ['profile', 'fit', 'effects', 'variants', 'routes', 'history'];

  const TAGS = surface.bridge.fitTier;

  const capPct = (() => {
    const m = /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/.exec(a.expressionCapLabel ?? '');
    if (!m) return 43;
    return Math.min(100, Math.max(0, (Number(m[1]) / Math.max(1, Number(m[2]))) * 100));
  })();

  return (
    <StatusObservatoryOverlayShell
      open={open}
      title="Spirit Root Astrolabe"
      subtitle="Root & Heart Law entity diagnostic"
      tagChars="根骨"
      sealChars="根骨"
      sealVariant={opposed ? 'cinnabar' : 'jade'}
      watermark="根骨鑑觀"
      goal={goal}
      onClose={onClose}
      dataTestId="status-root-law-overlay"
      ariaLabel="Spirit Root Astrolabe detail"
      className="statusRootLawOverlayPanel"
    >
      <div className="statusRootLawOverlay" data-fit-tier={TAGS}>
        {/* Profile (top-left) */}
        <Card style={box(18, 6, { w: 300 })} className="statusRootLawOverlay__profile">
          <div className="statusRootLawOverlay__profileHead">
            <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
              <circle cx="17" cy="17" r="15" fill={opposed ? 'url(#cinnDisc)' : 'url(#jadeRad)'} stroke="#4a330e" />
              <text x="17" y="22" textAnchor="middle" fontFamily="var(--kai)" fontSize="15" fill="#f3ead7">根</text>
            </svg>
            <div>
              <div className="statusRootLawOverlay__profileName">{activeName} Root</div>
              <div className="statusRootLawOverlay__profileSub">Grade {a.gradeLabel} · Purity {a.purityLabel}</div>
            </div>
          </div>
          <div className="statusRootLawOverlay__profileBody">
            Root / Law Fit <b style={{ color: fitCol }}>{a.fitLabel}</b><br />
            Total Multiplier <b style={{ color: fitCol }}>{mult}</b><br />
            Run Validity <b style={{ color: fitBad ? 'var(--observatory-cinnabar)' : 'var(--observatory-jade)' }}>{a.runValidityLabel}</b>
          </div>
        </Card>

        {/* 14-root legend (left) */}
        <div className="statusRootLawOverlay__legend" style={box(18, 150, { w: 118 })}>
          <div className="statusRootLawOverlay__sub">14 Major Roots</div>
          {ELEMENTS.map(([id, name, glyph, color]) => {
            const active = id === a.activeRootId;
            return (
              <div key={id} className="statusRootLawOverlay__legendRow" data-active={active ? 'true' : 'false'}>
                <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
                  <circle cx="7.5" cy="7.5" r="6" fill={active ? color : 'var(--observatory-paper)'} stroke={color} strokeWidth="1.2" />
                  <text x="7.5" y="11" textAnchor="middle" fontFamily="var(--kai)" fontSize="8" fill={active ? '#fff' : color}>{glyph}</text>
                </svg>
                <span>{name}</span>
              </div>
            );
          })}
        </div>

        {/* Dial (center) — reuse the live in-panel astrolabe dial */}
        <div className="statusRootLawOverlay__dial" style={box(142, 116, { w: 430, h: 440 })}>
          <StatusSpiritRootAstrolabe surface={a} />
        </div>

        {/* Root / Law chain bridge (center-right) */}
        <div className="statusRootLawOverlay__bridge" style={box(520, 250, { w: 216 })}>
          <svg width="100%" viewBox="0 0 216 88" aria-hidden="true">
            {[[8, 46], [36, 38], [64, 46], [90, 36], [128, 40], [156, 48], [184, 40], [208, 46]].map(([cx, cy], i) => (
              <g key={i}>
                <ellipse cx={cx} cy={cy} rx="13" ry="8" fill="none" stroke="#5d4a26" strokeWidth="4" />
                <ellipse cx={cx} cy={cy} rx="13" ry="8" fill="none" stroke="rgba(240,217,160,.45)" strokeWidth="1.2" />
              </g>
            ))}
            {opposed ? (
              <>
                <path d="M96,16 L108,40 L98,46 L118,70 M106,26 L90,54" stroke="#8b3028" strokeWidth="2.6" fill="none" filter="url(#glowR)" />
                <path d="M68,30 Q108,4 152,26" fill="none" stroke="#c4604a" strokeWidth="2" />
                <path d="M62,58 Q108,84 156,60" fill="none" stroke="#c4604a" strokeWidth="2" />
                <circle cx="108" cy="42" r="11" fill="rgba(169,72,53,.32)" />
              </>
            ) : (
              <>
                <ellipse cx="108" cy="42" rx="13" ry="8" fill="none" stroke="#5d4a26" strokeWidth="4" />
                <circle cx="108" cy="42" r="14" fill="rgba(15,111,90,.18)" />
              </>
            )}
          </svg>
          <div className="statusRootLawOverlay__bridgeLabel" style={{ color: fitCol }}>Root / Law Fit: {a.fitLabel}</div>
          <div className="statusRootLawOverlay__bridgeSeal">
            <InkWaxSeal chars={opposed ? '對沖' : '相合'} size={34} rotation={-6} variant={opposed ? 'cinnabar' : 'jade'} />
          </div>
        </div>

        {/* Heart-Law seal scroll (right) — reuse the medallion + add the Dao route */}
        <Card style={box(680, 104, { w: 280 })} className="statusRootLawOverlay__seal">
          <StatusHeartLawSeal surface={h} distress={opposed} />
          <div className="statusRootLawOverlay__daoState">
            Dao Heart State
            <span data-bad={opposed ? 'true' : 'false'}>{h.daoHeartStateLabel ?? (opposed ? 'Needs Work' : 'Steady')}</span>
          </div>
          {dao ? (
            <button
              type="button"
              className="statusRootLawRouteButton statusRootLawRouteButton--daoHeart"
              data-route-kind={dao.target.kind}
              disabled={daoDisabled}
              aria-disabled={daoDisabled ? 'true' : undefined}
              title={dao.disabled ? dao.disabledReason ?? dao.detail : dao.detail}
              onClick={() => fire(dao, daoDisabled)}
            >
              {dao.label}
            </button>
          ) : null}
        </Card>

        {/* Mid column A: run validity + expression cap + proc */}
        <div className="statusRootLawOverlay__mid" style={box(990, 104, { w: 250 })}>
          <Card style={{}} className="statusRootLawOverlay__validity">
            <div className="statusRootLawOverlay__sub">Run Validity</div>
            <div className="statusRootLawOverlay__validityBody">
              <strong style={{ color: fitBad ? 'var(--observatory-cinnabar)' : 'var(--observatory-jade)' }}>{a.runValidityLabel}</strong>
              <InkWaxSeal chars="勉強" size={44} rotation={6} variant={fitBad ? 'cinnabar' : 'jade'} />
            </div>
          </Card>
          <Card style={{}}>
            <div className="statusRootLawOverlay__sub">Expression Cap</div>
            <div className="statusRootLawOverlay__capValue" style={{ color: opposed ? 'var(--observatory-cinnabar)' : 'var(--observatory-jade)' }}>{a.expressionCapLabel}</div>
            <span className="statusRootLawOverlay__capTrack">
              <span className="statusRootLawOverlay__capFill" data-bad={opposed ? 'true' : 'false'} style={{ width: `${capPct}%` }} />
            </span>
            <small>{opposed ? 'Cap suppressed by opposed fit' : 'Cap healthy'}</small>
          </Card>
          <Card style={{}}>
            <div className="statusRootLawOverlay__sub">Proc</div>
            <strong className="statusRootLawOverlay__procName">{procName}</strong>
            <small>{a.proc ? `${a.proc.statusLabel}${a.proc.cooldownLabel ? ` · ${a.proc.cooldownLabel}` : ''}` : 'Inactive'}</small>
          </Card>
        </div>

        {/* Mid column B: law-fit note + grade & multiplier + root notes */}
        <div className="statusRootLawOverlay__mid" style={box(1262, 104, { w: 248 })}>
          <Card style={{}} className="statusRootLawOverlay__note">
            <InkWaxSeal chars="械鑑" size={32} rotation={8} variant="cinnabar" />
            <p style={{ color: fitBad ? 'var(--observatory-cinnabar)' : 'var(--observatory-jade)' }}>
              {opposed
                ? 'Current law fit reduces cultivation efficiency and breakthrough stability.'
                : 'Current law fit reinforces cultivation efficiency and stability.'}
            </p>
          </Card>
          <Card style={{}}>
            <div className="statusRootLawOverlay__sub">Root Grade &amp; Multiplier</div>
            <DiagList
              rows={[
                { label: 'Grade', value: a.gradeLabel },
                { label: 'Purity', value: a.purityLabel ?? '—' },
                { label: 'Fit Multiplier', value: mult, bad: opposed },
                { label: 'Effective Output', value: opposed ? '≈ 0.43× base' : '≈ 1.4× base', bad: opposed },
              ]}
            />
          </Card>
          <Card style={{}}>
            <div className="statusRootLawOverlay__sub">Root Notes</div>
            <p className="statusRootLawOverlay__notesBody">
              {activeName} roots excel with aligned laws; an opposed Heart Law inverts their flow and bleeds qi at every conversion.
            </p>
          </Card>
        </div>

        {/* Observation drawer (right edge): vertical tab rail + diagnostic rows */}
        <Card style={box(1462, 96, { w: 330 })} className="statusRootLawOverlay__drawer">
          <div className="statusRootLawOverlay__drawerTabs" aria-hidden="true">
            {TABS.map((t, i) => (
              <span key={TAB_GLYPH[i]} data-active={i === 0 ? 'true' : 'false'}>{t}</span>
            ))}
          </div>
          <div className="statusRootLawOverlay__drawerBody">
            <div className="statusRootLawOverlay__sub statusRootLawOverlay__sub--cinnabar">Spirit Root Observation</div>
            <DiagList rows={observationRows} />
            <div className="statusRootLawOverlay__sub statusRootLawOverlay__sub--cinnabar statusRootLawOverlay__divider">— Fit Analysis —</div>
            <DiagList rows={fitRows} />
            <div className="statusRootLawOverlay__sub statusRootLawOverlay__sub--gold statusRootLawOverlay__divider">— Practice Guide —</div>
            <p className="statusRootLawOverlay__guide">
              <b>Recommended:</b>{' '}
              {opposed ? 'Adjust law alignment or stabilize the Dao Heart.' : 'Continue the current pairing; raise purity.'}
            </p>
            {observe ? (
              <button
                type="button"
                className="statusRootLawRouteButton statusRootLawRouteButton--observe statusRootLawOverlay__observe"
                data-route-kind={observe.target.kind}
                disabled={observeDisabled}
                aria-disabled={observeDisabled ? 'true' : undefined}
                title={observe.disabled ? observe.disabledReason ?? observe.detail : observe.detail}
                onClick={() => fire(observe, observeDisabled)}
              >
                {observe.label}
              </button>
            ) : null}
          </div>
        </Card>

        <div className="statusRootLawOverlay__bandLabel" style={box(18, 578)}>— Diagnostic Detail —</div>

        {/* Bottom band: synergy · impact · improve · variants */}
        <Card style={box(18, 600, { w: 300, bottom: 16 })}>
          <div className="statusRootLawOverlay__sub">Root / Law Synergy Map</div>
          <svg className="statusRootLawOverlay__synergy" viewBox="0 0 272 76" aria-hidden="true">
            <circle cx="34" cy="44" r="18" fill="url(#jadeRad)" stroke="#1c3128" />
            <text x="34" y="49" textAnchor="middle" fontFamily="var(--kai)" fontSize="15" fill="#e9efe2">根</text>
            <path
              d={opposed ? 'M54,44 L92,28 L112,54 L142,24 L168,52 L228,40' : 'M54,44 L228,42'}
              stroke={opposed ? '#8b3028' : '#0f6f5a'}
              strokeWidth="3"
              fill="none"
              filter={opposed ? 'url(#glowR)' : undefined}
            />
            <circle cx="248" cy="42" r="18" fill={opposed ? 'url(#cinnDisc)' : 'url(#goldRad)'} stroke="#4a330e" />
            <text x="248" y="47" textAnchor="middle" fontFamily="var(--kai)" fontSize="15" fill="#f3ead7">法</text>
          </svg>
          <div className="statusRootLawOverlay__synergyVerdict" style={{ color: fitCol }}>
            {opposed ? 'Bridge fractured — Opposed' : 'Bridge intact — Compatible'}
          </div>
          <p className="statusRootLawOverlay__notesBody">
            {opposed
              ? `${activeName} root resists ${h.heartLawLabel}. Reroll the root or change Heart Law.`
              : 'Root and Heart Law reinforce one another.'}
          </p>
        </Card>

        <Card style={box(340, 600, { w: 300, bottom: 16 })}>
          <div className="statusRootLawOverlay__sub statusRootLawOverlay__sub--cinnabar">Current Impact</div>
          <DiagList rows={impactRows} />
        </Card>

        <Card style={box(660, 600, { w: 360, bottom: 16 })}>
          <div className="statusRootLawOverlay__sub statusRootLawOverlay__sub--jade">How to Improve</div>
          <div className="statusRootLawOverlay__improve">
            {improveRows.map(([what, where]) => (
              <div key={what} className="statusRootLawOverlay__improveRow">
                <span>{what}</span>
                <em>{where}</em>
              </div>
            ))}
          </div>
        </Card>

        <Card style={box(1040, 600, { right: 18, bottom: 16 })}>
          <div className="statusRootLawOverlay__sub statusRootLawOverlay__sub--gold">Compatible Heart Laws</div>
          <div className="statusRootLawOverlay__improve">
            {variantRows.map(([law, verdict, good]) => (
              <div key={law} className="statusRootLawOverlay__improveRow">
                <span>{law}</span>
                <b data-bad={verdict === 'Opposed' ? 'true' : 'false'} data-good={good ? 'true' : 'false'}>{verdict}</b>
              </div>
            ))}
          </div>
          <p className="statusRootLawOverlay__notesBody">
            {opposed ? `Switching to an aligned law removes the ${mult} penalty.` : 'Current pairing is favourable.'}
          </p>
        </Card>
      </div>
    </StatusObservatoryOverlayShell>
  );
}
