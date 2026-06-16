import type { CSSProperties, ReactNode } from 'react';
import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';
import { StatusObservatoryOverlayShell, type StatusOverlayGoalContext } from './StatusObservatoryOverlayShell.js';
import './StatusLedgerOverlay.scss';

type LedgerRailSurface = StatusObservatorySurfaceV1['ledgerRail'];

export interface StatusLedgerOverlayProps {
  open: boolean;
  recentChanges: LedgerRailSurface['recentChanges'];
  details: LedgerRailSurface['details'];
  goal?: StatusOverlayGoalContext | null;
  onClose: () => void;
}

const CW = 1810;
const pc = (v: number): string => `${((v / CW) * 100).toFixed(2)}%`;

const CHANGE_GLYPHS = ['功', '根', '備', '兵', '心'];
const EXTRA_CHANGES: Array<{ label: string; glyph: string }> = [
  { label: 'Technique rank checked vs floor', glyph: '術' },
  { label: 'Loadout policy mismatch noted', glyph: '策' },
  { label: 'Mercy-path progress +1', glyph: '藥' },
];
const TIMES = ['just now', '2m ago', '5m ago', '12m ago', '41m ago', '1h ago', '2h ago', '3h ago'];
const FILTERS = ['All', 'Cultivation', 'Combat', 'Prep', 'Root & Law'];

// Static formula breakdowns + owners (artifact hardcodes these; Status reads
// values, never recomputes).
const BREAKDOWN: Record<string, Array<[string, string]>> = {
  'Qi / s': [['Base cultivation', '+92 / s'], ['Heart Law parity', '×0.74'], ['Root fit penalty', '×0.62'], ['Foreground bonus', '+0 (idle)']],
  Stability: [['Base', '40'], ['Dao Heart clarity', '−24'], ['Turbulence', '−16'], ['Floor', '0 / 100']],
  'Combat Strength': [['Attack contribution', '+208'], ['Defense contribution', '+70'], ['Technique mult.', '×1.0'], ['Expression cap', 'suppressed']],
  'Breakthrough Chance': [['Base chance', '22%'], ['Stability penalty', '−14%'], ['Preparation penalty', '−6%'], ['Net chance', '2%']],
};
const OWNER: Record<string, string> = {
  'Qi / s': 'Cultivation',
  Stability: 'Dao Heart',
  'Combat Strength': 'Training Hall',
  'Breakthrough Chance': 'Cultivation',
  'All sources': 'All systems',
};

function Card({ style, className = '', children }: { style: CSSProperties; className?: string; children: ReactNode }) {
  return (
    <div className={`statusLedgerOverlay__card ${className}`.trim()} style={style}>
      <span className="statusLedgerOverlay__rod statusLedgerOverlay__rod--top" aria-hidden="true" />
      <span className="statusLedgerOverlay__rod statusLedgerOverlay__rod--bottom" aria-hidden="true" />
      {children}
    </div>
  );
}

/**
 * Full-screen "Folded Ledgers" detail overlay (artifact `ovLedger`): the Recent
 * Changes ledger (source-ordered, filterable) on the left, and the How-Calculated
 * formula-source breakdowns on the right — both on brass scroll rods.
 */
export function StatusLedgerOverlay({ open, recentChanges, details, goal, onClose }: StatusLedgerOverlayProps) {
  const changes = recentChanges.rows
    .map((row, i) => ({ label: row.label, bad: row.tone === 'danger', glyph: CHANGE_GLYPHS[i % CHANGE_GLYPHS.length] }))
    .concat(EXTRA_CHANGES.map((e) => ({ label: e.label, bad: false, glyph: e.glyph })));

  return (
    <StatusObservatoryOverlayShell
      open={open}
      title="Folded Ledgers"
      subtitle="Recent changes and calculation evidence"
      tagChars="歷記"
      sealChars="歷記"
      sealVariant="cinnabar"
      watermark="摺記簿冊"
      goal={goal}
      onClose={onClose}
      dataTestId="status-ledger-overlay"
      ariaLabel="Folded Ledgers detail"
      className="statusLedgerOverlayPanel"
    >
      <div className="statusLedgerOverlay">
        {/* Left: recent changes ledger */}
        <Card style={{ position: 'absolute', left: pc(18), top: '22px', width: '40%' }}>
          <div className="statusLedgerOverlay__sub statusLedgerOverlay__sub--cinnabar">Recent Changes Ledger</div>
          <div className="statusLedgerOverlay__filters">
            {FILTERS.map((f, k) => (
              <span key={f} className="statusLedgerOverlay__chip" data-active={k === 0 ? 'true' : 'false'}>{f}</span>
            ))}
          </div>
          {changes.map((c, i) => (
            <div key={`${c.label}-${i}`} className="statusLedgerOverlay__change">
              <span className="statusLedgerOverlay__changeName">
                <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
                  <circle cx="11" cy="11" r="9.5" fill={c.bad ? 'url(#cinnDisc)' : 'url(#goldRad)'} stroke={c.bad ? '#54190f' : '#6e4c16'} />
                  <text x="11" y="15" textAnchor="middle" fontFamily="var(--kai)" fontSize="10" fill={c.bad ? '#f4dccb' : '#2a1d08'}>{c.glyph}</text>
                </svg>
                <span>{c.label}</span>
              </span>
              <em>{TIMES[i] ?? ''}</em>
            </div>
          ))}
          <p className="statusLedgerOverlay__note">Every gameplay event that changes a Status value is recorded here in source order. Status never edits the record.</p>
          <div className="statusLedgerOverlay__folded">
            <span>Older entries folded — open <b>Records</b> for the full chronicle.</span>
            <InkWaxSeal chars="歷" size={26} rotation={-5} variant="cinnabar" />
          </div>
        </Card>

        {/* Right: how calculated — formula sources */}
        <Card style={{ position: 'absolute', right: pc(18), top: '22px', width: '55%' }}>
          <div className="statusLedgerOverlay__sub statusLedgerOverlay__sub--jade">How Calculated — Formula Sources</div>
          {details.rows.map((row) => {
            const bd = BREAKDOWN[row.label];
            return (
              <div key={row.id} className="statusLedgerOverlay__calc">
                <div className="statusLedgerOverlay__calcHead">
                  <b>{row.label}</b>
                  <span className="statusLedgerOverlay__calcMeta">
                    <small>Owner: <b>{OWNER[row.label] ?? '—'}</b></small>
                    <span className="statusLedgerOverlay__formulaChip">View formula</span>
                  </span>
                </div>
                {bd ? (
                  <div className="statusLedgerOverlay__breakdown">
                    {bd.map(([label, value]) => (
                      <div key={label} className="statusLedgerOverlay__breakdownRow">
                        <span>{label}</span>
                        <b>{value}</b>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
          <p className="statusLedgerOverlay__note">Cultivation base, build, preparation, safety net, heart law, spirit root, equipment, and active effects all contribute. Status reads these values; it never recomputes gameplay truth.</p>
        </Card>
      </div>
    </StatusObservatoryOverlayShell>
  );
}
