import './courtRoom.scss';
import { CourtChip } from '../courtChips';
import { arcPath } from '../courtHelpers';
import {
  COURT_THEME,
  buildCourtFigure,
  buildCourtScene,
  buildCourtSmoke,
  courtCornerUriString,
  waxSealString,
} from './courtRoomSprites';
import type { CourtStatus, TemperingCourtSurface } from '../../../systems/meridians/index.js';

/**
 * W7 — the Room (artifact §1.5.3), the hero panel. Full-bleed layered backdrop
 * (atmos → scenery → figure → motes → smoke → scrim → corners) + the surface-driven
 * overlays (alerts, status seal, Practice-Tempo lens, meridian codex, forges strip).
 * Render-only. Placed in the Room CourtPanel with `flush` (no content padding).
 */

const SEAL_MAP: Record<Exclude<CourtStatus, 'no_path'>, { chars: string; size: number; rot: number; jade: boolean; tone: 'jade' | 'gold' | 'cinn'; label: string }> = {
  active: { chars: '炼', size: 64, rot: -7, jade: true, tone: 'jade', label: 'Tempering' },
  idle: { chars: '待', size: 60, rot: -5, jade: false, tone: 'gold', label: 'Ready to Temper' },
  blocked_by_combat: { chars: '戰', size: 64, rot: 4, jade: false, tone: 'cinn', label: 'Court Closed · Combat' },
  blocked_by_activity: { chars: '占', size: 60, rot: 3, jade: false, tone: 'gold', label: 'Hall Occupied' },
};

function moteCount(status: CourtStatus, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  if (status === 'active') return 24;
  if (status === 'idle') return 12;
  if (status === 'no_path') return 0;
  return 6;
}

function CourtMotes({ surface, reducedMotion }: { surface: TemperingCourtSurface; reducedMotion: boolean }) {
  const count = moteCount(surface.status, reducedMotion);
  const cols = surface.path ? COURT_THEME[surface.path].moteCols : (['transparent', 'transparent'] as const);
  return (
    <div className="court-room-motes" data-th="training-hall-vfx-motes" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="court-mote"
          data-th="training-hall-vfx-mote"
          style={{
            left: `${42 + ((i * 7) % 18)}%`,
            bottom: `${18 + ((i * 5) % 26)}%`,
            background: `radial-gradient(circle at 35% 30%, ${cols[0]}, ${cols[1]} 60%, transparent 75%)`,
            animationDelay: `${((i % 9) * 0.6).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

function StatusSeal({ surface }: { surface: TemperingCourtSurface }) {
  if (surface.status === 'no_path') {
    return (
      <div className="court-room-seal">
        <CourtChip tone="ink">No Path</CourtChip>
      </div>
    );
  }
  const seal = SEAL_MAP[surface.status];
  const label = seal.tone === 'jade' ? `${seal.label} · ${surface.intensity.label}` : seal.label;
  return (
    <div className="court-room-seal">
      <span dangerouslySetInnerHTML={{ __html: waxSealString(seal.chars, seal.size, seal.rot, seal.jade) }} />
      <div className="court-seal-lbl">
        <CourtChip tone={seal.tone}>{label}</CourtChip>
      </div>
    </div>
  );
}

function dirGlyph(dir: string): string {
  return dir === 'up' ? '↑' : dir === 'down' || dir === 'bad' ? '↓' : '–';
}
function dirClass(dir: string): string {
  return dir === 'up' ? 'court-dir-up' : dir === 'down' ? 'court-dir-down' : dir === 'bad' ? 'court-dir-bad' : 'court-dir-flat';
}

function PracticeTempoLens({ surface }: { surface: TemperingCourtSurface }) {
  const mult = surface.rate.mult;
  const ringPct = Math.min(1, mult / 2.25);
  const ringCol = mult < 1.8 ? 'var(--court-jade-deep)' : mult < 2.2 ? 'var(--court-gold)' : 'var(--court-gold-bright)';
  const head =
    surface.status === 'active' ? `${mult.toFixed(2)}× / 2.25×` : surface.status === 'idle' ? `≈ ${mult.toFixed(2)}×` : 'paused';
  return (
    <div className="court-lens">
      <div className="court-lensbar">PRACTICE TEMPO</div>
      <div className="court-lens-head">
        <span>{head}</span>
        <svg width={56} height={56} viewBox="0 0 56 56" aria-hidden="true">
          <circle cx={28} cy={28} r={21} fill="none" stroke="rgba(120,90,46,.2)" strokeWidth={5} />
          <path d={arcPath(28, 28, 21, -130, -130 + 260 * ringPct)} fill="none" stroke={ringCol} strokeWidth={5} strokeLinecap="round" />
        </svg>
      </div>
      {surface.rate.factors.map((factor) => (
        <div key={factor.key} className="court-lens-row">
          <span className="court-nm">
            {factor.label}
            {factor.note ? ` (${factor.note})` : ''}
          </span>
          <span>
            <b>{factor.value.toFixed(2)}×</b> <span className={dirClass(factor.dir)}>{dirGlyph(factor.dir)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function MeridianCodex({ surface }: { surface: TemperingCourtSurface }) {
  const meridian = surface.activeMeridian;
  if (surface.status === 'no_path' || !meridian) return null;
  const comp = Math.round(meridian.comp * 100);
  return (
    <div className="court-codex">
      <div className="court-cbar2">THIS MERIDIAN</div>
      <div className="court-ctitle">
        {meridian.name} <span className="court-zi">{meridian.zi}</span>
      </div>
      <div className="court-crow">
        <span className="court-k">In combat</span>
        <span>
          {meridian.eff.map((effect, i) => (
            <span key={i} className={['court-eff', effect.tone ? `court-eff--${effect.tone}` : ''].filter(Boolean).join(' ')}>
              {effect.label}
            </span>
          ))}
        </span>
      </div>
      <div className="court-crow">
        <span className="court-k">Path</span>
        <span>{meridian.pathEffect}</span>
      </div>
      {meridian.comp < 1 ? (
        <div className="court-crow">
          <span className="court-k">Comprehend</span>
          <span className="court-compbar">
            <span className="court-fill" style={{ width: `${comp}%` }} />
          </span>
          <span style={{ color: 'var(--court-comp)', fontWeight: 700, flex: '0 0 auto' }}>{comp}%</span>
        </div>
      ) : null}
      <div className="court-passive-note">
        Also honed in combat by <b>{meridian.trigger}</b> · ≈15% of training rate
      </div>
    </div>
  );
}

function ForgesStrip({ surface }: { surface: TemperingCourtSurface }) {
  const meridian = surface.activeMeridian;
  if (surface.status === 'no_path' || !meridian) {
    return (
      <div className="court-forges">
        <span className="court-micro">Choose a path at Life Start to begin tempering.</span>
      </div>
    );
  }
  const feeds = meridian.eff[0]?.label ?? '';
  return (
    <div className="court-forges">
      <span>
        Tempering ▸ <span className="court-forges-name">{meridian.name}</span>{' '}
        <span className="court-v">
          {meridian.rating}/{meridian.cap}
        </span>
        {meridian.capState === 'capped' ? (
          <>
            {' '}
            <CourtChip tone="gold">capped → mastery</CourtChip>
          </>
        ) : null}{' '}
        · feeds <span className="court-forges-name">{feeds}</span>
      </span>
    </div>
  );
}

function RoomAlerts({ surface }: { surface: TemperingCourtSurface }) {
  return (
    <div className="court-alerts">
      {surface.alerts.slice(0, 3).map((alert, i) => (
        <div key={i} className={`court-alert court-alert--${alert.tone}`}>
          <span className="court-alert-glyph">{alert.glyph}</span>
          <span>{alert.text}</span>
        </div>
      ))}
    </div>
  );
}

export function Room({ surface, reducedMotion = false }: { surface: TemperingCourtSurface; reducedMotion?: boolean }) {
  const path = surface.path;
  const theme = path ? COURT_THEME[path] : null;
  const scrim =
    surface.status === 'blocked_by_combat'
      ? 'rgba(110,36,30,.12)'
      : surface.status === 'blocked_by_activity'
        ? 'rgba(162,113,42,.08)'
        : 'transparent';
  const corner = theme ? courtCornerUriString(theme.corner) : '';
  return (
    <div className="court-room">
      {theme ? <div className="court-room-atmos" style={{ background: theme.atmos }} /> : null}
      {path ? <div className="court-room-scene" dangerouslySetInnerHTML={{ __html: buildCourtScene(path, surface.heat.value) }} /> : null}
      {path ? <div className="court-room-fig" dangerouslySetInnerHTML={{ __html: buildCourtFigure(surface, reducedMotion) }} /> : null}
      <CourtMotes surface={surface} reducedMotion={reducedMotion} />
      {path ? <div className="court-room-smoke" dangerouslySetInnerHTML={{ __html: buildCourtSmoke(path, reducedMotion) }} /> : null}
      <div className="court-room-scrim" style={{ background: scrim }} />
      {corner ? <img className="court-room-corner tl" src={corner} alt="" /> : null}
      {corner ? <img className="court-room-corner tr" src={corner} alt="" /> : null}
      <RoomAlerts surface={surface} />
      <StatusSeal surface={surface} />
      <PracticeTempoLens surface={surface} />
      <MeridianCodex surface={surface} />
      <ForgesStrip surface={surface} />
    </div>
  );
}
