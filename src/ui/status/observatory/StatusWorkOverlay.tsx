import type { CSSProperties, ReactNode } from 'react';
import type { StatusLedgerActionSurface } from '../../../systems/ui/status/statusLedgerTypes.js';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { StatusObservatoryOverlayShell, type StatusOverlayGoalContext } from './StatusObservatoryOverlayShell.js';
import { StatusCurrentWorkTimeWheel } from './StatusCurrentWorkTimeWheel.js';
import './StatusWorkOverlay.scss';

type WorkSurface = StatusObservatorySurfaceV1['workWheel'];
type RecentChanges = StatusObservatorySurfaceV1['ledgerRail']['recentChanges'];

export interface StatusWorkOverlayProps {
  open: boolean;
  surface: WorkSurface;
  recentChanges: RecentChanges;
  qisLabel?: string;
  goal?: StatusOverlayGoalContext | null;
  onClose: () => void;
  onAction?: (action: StatusLedgerActionSurface) => void;
}

const CW = 1810;
const CH = 900;
const pc = (v: number, dim: number): string => `${((v / dim) * 100).toFixed(2)}%`;
function box(opts: { left?: number; top?: number; w?: number; right?: number; h?: number }): CSSProperties {
  const s: CSSProperties = { position: 'absolute' };
  if (opts.left != null) s.left = pc(opts.left, CW);
  if (opts.top != null) s.top = pc(opts.top, CH);
  if (opts.w != null) s.width = pc(opts.w, CW);
  if (opts.right != null) s.right = pc(opts.right, CW);
  if (opts.h != null) s.height = pc(opts.h, CH);
  return s;
}

function systemColor(label: string): string {
  const n = label.toLowerCase();
  if (/combat|attack|battle/.test(n)) return '#8b3028';
  if (/bounty|quest|mission/.test(n)) return '#a2712a';
  if (/exped|gather|scout/.test(n)) return '#2a668d';
  if (/prof|forge|craft|alchemy/.test(n)) return '#8d642d';
  return 'var(--observatory-jade)';
}
function isIdle(value: string | null): boolean {
  return !value || /none|idle|no /i.test(value);
}

function Card({ style, className = '', children }: { style: CSSProperties; className?: string; children: ReactNode }) {
  return (
    <div className={`statusWorkOverlay__card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

const QUEUE = [true, false, false];
const OFFLINE_FORECAST: Array<[string, string]> = [
  ['Projected Qi in 1h', '+229.5K'],
  ['Projected Qi in 8h', '+1.83M'],
  ['Combat while offline', 'Paused — by law'],
];
const TIMELINE: Array<[string, number, string]> = [
  ['Cultivate', 38, 'var(--observatory-gold-deep, var(--observatory-gold))'],
  ['Gate trial', 8, 'var(--observatory-cinnabar)'],
  ['Idle', 54, 'rgba(120,110,90,.45)'],
];
const EARLIER = ['Reached Qi Condensation Stage 9', 'Learned Iron Palm (Rank 1)', 'First gate writ purchased', 'Joined Pinewind Hamlet'];
const OWNERSHIP: Array<[string, string]> = [
  ['功', 'Cultivation'],
  ['兵', 'Combat'],
  ['賞', 'Bounty'],
  ['旅', 'Expedition'],
  ['工', 'Profession'],
];

/**
 * Full-screen "Current Work Time Wheel" detail overlay (artifact `ovWork`): the
 * reused activity wheel, the active/queued systems list, the offline & yield
 * reading with queue slots + forecast, and the recent work log + session timeline.
 */
export function StatusWorkOverlay({ open, surface, recentChanges, qisLabel = '—', goal, onClose, onAction }: StatusWorkOverlayProps) {
  const systems: Array<{ id: string; label: string; value: string | null; detail: string }> = [];
  if (surface.foreground) {
    systems.push({ id: surface.foreground.id, label: 'Foreground', value: surface.foreground.value ?? surface.foreground.detail, detail: surface.foreground.detail });
  }
  for (const spoke of surface.spokes) {
    systems.push({ id: spoke.id, label: spoke.label, value: spoke.value, detail: spoke.detail });
  }

  const offlineRows: Array<[string, string]> = [
    ['Last offline duration', '—'],
    ['Qi gained offline', '—'],
    ['Foreground yield / s', qisLabel],
    ['Foreground since', 'Idle after failure'],
    ['Queue slots free', '2 / 3'],
  ];

  return (
    <StatusObservatoryOverlayShell
      open={open}
      title="Current Work Time Wheel"
      subtitle="Foreground activity, queues, and idle systems"
      tagChars="行功"
      sealChars="行功"
      sealVariant="jade"
      watermark="行功時輪"
      goal={goal}
      onClose={onClose}
      dataTestId="status-work-overlay"
      ariaLabel="Current Work Time Wheel detail"
      className="statusWorkOverlayPanel"
    >
      <div className="statusWorkOverlay">
        {/* Left: reused activity wheel */}
        <Card style={box({ left: 18, top: 14, w: 470 })} className="statusWorkOverlay__wheelCard">
          <div className="statusWorkOverlay__sub">Activity Wheel</div>
          <div className="statusWorkOverlay__wheel">
            <StatusCurrentWorkTimeWheel surface={surface} onAction={onAction} />
          </div>
          <p>Hub shows the foreground occupation; satellites show queued systems. The brass ring turns while any system works.</p>
        </Card>

        {/* Center top: active & queued systems */}
        <Card style={box({ left: 500, top: 14, w: 430, h: 330 })}>
          <div className="statusWorkOverlay__sub statusWorkOverlay__sub--jade">Active &amp; Queued Systems</div>
          {systems.map((s) => {
            const idle = isIdle(s.value);
            return (
              <div key={s.id} className="statusWorkOverlay__system">
                <div className="statusWorkOverlay__systemHead">
                  <span className="statusWorkOverlay__systemName">
                    <i style={{ background: systemColor(s.label) }} aria-hidden="true" />
                    <b>{s.label}</b>
                  </span>
                  <span style={{ color: idle ? 'var(--observatory-muted)' : 'var(--observatory-jade)' }}>{s.value ?? 'None'}</span>
                </div>
                <div className="statusWorkOverlay__systemSub">{s.detail}</div>
              </div>
            );
          })}
        </Card>

        {/* Center bottom: offline & yield */}
        <Card style={box({ left: 500, top: 360, w: 430 })}>
          <div className="statusWorkOverlay__sub statusWorkOverlay__sub--gold">Offline &amp; Yield</div>
          {offlineRows.map(([label, value]) => (
            <div key={label} className="statusWorkOverlay__row">
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
          <div className="statusWorkOverlay__sub" style={{ marginTop: '9px' }}>Queue Slots</div>
          <div className="statusWorkOverlay__queue">
            {QUEUE.map((filled, i) => (
              <svg key={i} width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
                <circle cx="17" cy="17" r="14" fill={filled ? 'url(#jadeRad)' : 'none'} stroke={filled ? '#1c3128' : 'rgba(120,110,90,.55)'} strokeWidth="1.8" strokeDasharray={filled ? undefined : '4 3'} />
                <text x="17" y="22" textAnchor="middle" fontFamily="var(--kai)" fontSize="13" fill={filled ? '#e9efe2' : 'rgba(120,110,90,.7)'}>{filled ? '修' : '空'}</text>
              </svg>
            ))}
            <span className="statusWorkOverlay__queueNote">1 queued · 2 open. Everything except combat progresses offline.</span>
          </div>
          <div className="statusWorkOverlay__sub" style={{ marginTop: '10px' }}>Offline Forecast</div>
          {OFFLINE_FORECAST.map(([label, value]) => (
            <div key={label} className="statusWorkOverlay__row statusWorkOverlay__row--tight">
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </Card>

        {/* Right: recent work log + timeline + history + ownership */}
        <Card style={box({ left: 942, top: 14, right: 18 })}>
          <div className="statusWorkOverlay__sub statusWorkOverlay__sub--cinnabar">Recent Work Log</div>
          {recentChanges.rows.slice(0, 5).map((change, i) => (
            <div key={`${change.label}-${i}`} className="statusWorkOverlay__logRow">
              <span className="statusWorkOverlay__logDot" data-bad={change.tone === 'danger' ? 'true' : 'false'} />
              <span>{change.label}</span>
            </div>
          ))}
          <div className="statusWorkOverlay__sub" style={{ marginTop: '12px' }}>Session Timeline</div>
          <div className="statusWorkOverlay__timeline">
            {TIMELINE.map(([label, pctW, color]) => (
              <span key={label} style={{ width: `${pctW}%`, background: color }} />
            ))}
          </div>
          <div className="statusWorkOverlay__timelineKeys">
            {TIMELINE.map(([label, pctW]) => (
              <span key={label}>{label} {pctW}%</span>
            ))}
          </div>
          <div className="statusWorkOverlay__sub" style={{ marginTop: '11px' }}>Earlier This Life</div>
          {EARLIER.map((t) => (
            <div key={t} className="statusWorkOverlay__logRow statusWorkOverlay__logRow--muted">
              <span className="statusWorkOverlay__logDot" data-muted="true" />
              <span>{t}</span>
            </div>
          ))}
          <div className="statusWorkOverlay__sub" style={{ marginTop: '11px' }}>System Ownership</div>
          <div className="statusWorkOverlay__ownership">
            {OWNERSHIP.map(([glyph, name]) => (
              <div key={name}>
                <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                  <circle cx="13" cy="13" r="11" fill="none" stroke="var(--observatory-cinnabar)" strokeWidth="1.4" />
                  <text x="13" y="17" textAnchor="middle" fontFamily="var(--kai)" fontSize="11" fill="var(--observatory-cinnabar)">{glyph}</text>
                </svg>
                <small>{name}</small>
              </div>
            ))}
          </div>
          <p className="statusWorkOverlay__note">The work wheel records foreground activity, queued systems, and idle yield. Switch foreground in Cultivation or the Training Hall.</p>
        </Card>
      </div>
    </StatusObservatoryOverlayShell>
  );
}
