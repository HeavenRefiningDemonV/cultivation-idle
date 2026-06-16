import './courtRegions.scss';
import { CourtChip, CourtRootChip } from '../courtChips';
import { CourtFlame, CourtMedallion, CourtWaxSeal } from '../courtSeals';
import { COURT_INTENSITIES, COURT_PATH_DISPLAY } from '../courtPathDisplay';
import {
  COURT_REALM_NAMES,
  type CourtIntensityId,
  type MeridianView,
  type TemperingCourtSurface,
} from '../../../systems/meridians/index.js';

function realmNameForUnlock(unlockRealm: number): string {
  return COURT_REALM_NAMES[Math.min(Math.max(unlockRealm, 1), 7) - 1];
}

function rootChipLabel(view: MeridianView): string {
  return view.root.label.replace(' Root', '');
}

/**
 * W7 region content (artifact §1.5). Each component renders one region's interior from
 * the W6 TemperingCourtSurface; TemperingCourt wraps them in <CourtPanel>. Render-only.
 * (Regimens shelf, Path Meridians, and the Room are built in later passes.)
 */

export function LintelContent({ surface }: { surface: TemperingCourtSurface }) {
  const display = surface.path ? COURT_PATH_DISPLAY[surface.path] : null;
  const { realm } = surface;
  const pct = Math.round(realm.cultPct * 100);
  return (
    <div className="court-lintel-grid">
      <div />
      <div>
        <div className="court-sub">TRAINING HALL · {(display?.label ?? 'No').toUpperCase()} PATH</div>
        <div className="court-lintel-title">
          The Tempering Court
          {display ? <CourtWaxSeal chars={display.sealGlyph} size={34} rotation={-6} jade={display.sealJade} /> : null}
        </div>
        {display ? <div className="court-lintel-sub">{display.subtitle}</div> : null}
        <div className="court-realm-pips">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className={['court-rp', i < realm.index1to7 ? 'is-on' : '', i === realm.index1to7 - 1 ? 'is-cur' : '']
                .filter(Boolean)
                .join(' ')}
            />
          ))}
          <span className="court-micro" style={{ marginLeft: 6 }}>{realm.name}</span>
        </div>
        <div className="court-cbar-wrap">
          <span className="court-micro">修为 Cultivation Base</span>
          <div className="court-cbar">
            <div className="court-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="court-micro">{pct}% → breakthrough</span>
        </div>
      </div>
      <div className="court-lintel-right">
        <span className="court-rchip">{realm.name}</span>
        <span className="court-rchip">Meridian Cap {realm.cap}</span>
        <span className="court-rchip">{realm.unlockedCount}/7 meridians</span>
        {surface.activeMeridian ? <CourtChip tone="jade">▸ {surface.activeMeridian.name}</CourtChip> : null}
        <span className="court-micro">
          {realm.nextUnlock ? `Next: ${realm.nextUnlock.name} · ${realm.nextUnlock.realm}` : 'All meridians revealed'}
        </span>
      </div>
    </div>
  );
}

export function ConstitutionContent({ surface }: { surface: TemperingCourtSurface }) {
  return (
    <div className="court-fcol">
      <div className="court-tier-head court-tier-head--jade">Cultivation Axes · 修为</div>
      <div className="court-cgrid">
        {surface.tiers.axes.map((axis) => (
          <div key={axis.id} className="court-ccell">
            <span className="court-zi">{axis.zi}</span>
            <span className="court-cn">{axis.name}</span>
            <span className="court-cv">{axis.value}</span>
          </div>
        ))}
      </div>
      <div className="court-tier-head">Mortal Foundation · 体</div>
      <div className="court-cgrid">
        {surface.tiers.foundation.map((stat) => (
          <div key={stat.id} className="court-ccell">
            <span className="court-zi">{stat.zi}</span>
            <span className="court-cn">{stat.name}</span>
            {stat.grade ? <span className="court-cg">{stat.grade}</span> : <span className="court-cv">{stat.value}</span>}
          </div>
        ))}
      </div>
      <div className="court-micro" style={{ marginTop: 6 }}>
        Shared tiers grow via the cultivation loop &amp; pills; the Court tempers path meridians, one at a time.
      </div>
    </div>
  );
}

export function IntensityBellowsContent({
  surface,
  onSelectIntensity,
}: {
  surface: TemperingCourtSurface;
  onSelectIntensity?: (id: CourtIntensityId) => void;
}) {
  const active = surface.status === 'active';
  return (
    <div className="court-bellows">
      {COURT_INTENSITIES.map((intensity) => {
        const selected = intensity.id === surface.intensity.id;
        return (
          <button
            key={intensity.id}
            type="button"
            className={['court-detent', selected ? 'is-sel' : ''].filter(Boolean).join(' ')}
            aria-pressed={selected}
            aria-label={`${intensity.label}, ${intensity.xp} experience, ${intensity.fpm} fatigue per minute`}
            onClick={() => onSelectIntensity?.(intensity.id)}
          >
            <CourtMedallion glyph={intensity.glyph} ink={selected} />
            <span className="court-detent-label">{intensity.label}</span>
            <div className="court-flamewrap">
              <CourtFlame height={intensity.height} lit={selected && active} />
            </div>
            <span className="court-num">
              {intensity.xp} xp · {intensity.fpm}/min
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ForgeHeatContent({ surface }: { surface: TemperingCourtSurface }) {
  const { heat } = surface;
  const tone = heat.tier === 'overworked' ? 'cinn' : heat.tier === 'fresh' ? 'jade' : 'gold';
  return (
    <div>
      <div className="court-forge-zones">
        <span className="court-zone">fresh</span>
        <span className="court-zone">tiring</span>
        <span className="court-zone">strained</span>
        <span className="court-zone court-zone--cinn">overworked</span>
      </div>
      <div className="court-forgebar">
        <div className="court-ffill" style={{ width: `${Math.min(100, heat.value)}%` }} />
        {heat.value >= 80 ? (
          <div className="court-ffill court-ffill--shim" style={{ left: '80%', width: `${Math.min(20, heat.value - 80)}%` }} />
        ) : null}
        <div className="court-tick" style={{ left: '35%' }} />
        <div className="court-tick" style={{ left: '60%' }} />
        <div className="court-line80" style={{ left: '80%' }}>
          <b>downgrade</b>
        </div>
      </div>
      <div className="court-forge-scale">
        {[0, 35, 60, 80, 100].map((n) => (
          <span key={n} className="court-micro">{n}</span>
        ))}
      </div>
      <div className="court-forge-foot">
        <CourtChip tone={tone}>{heat.tier}</CourtChip>
        <span className="court-val">{Math.round(heat.value)} / 100</span>
        <span className="court-micro">output ×{heat.damp.toFixed(2)}</span>
        {heat.tier === 'overworked' ? <span className="court-micro">⤓ practice eases</span> : null}
      </div>
    </div>
  );
}

export function ThisPracticeContent({ surface }: { surface: TemperingCourtSurface }) {
  const meridian = surface.activeMeridian;
  if (!meridian) {
    return <div className="court-micro">Choose a path at Life Start to begin tempering.</div>;
  }
  const base = 2.4 * surface.rate.mult;
  return (
    <div>
      <div className="court-micro">
        tempering <b>{meridian.name}</b>, at {surface.intensity.label}:
      </div>
      <div className="court-tline">
        <span>
          {meridian.name} {meridian.zi}
        </span>
        <span className="court-tv">≈ +{base.toFixed(1)} xp/min</span>
      </div>
      <div className="court-tline">
        <span>regimen mastery</span>
        <span className="court-tv">≈ +{(base * 0.33).toFixed(1)}/min</span>
      </div>
      <div className="court-tline court-tline--gold">
        <span>forge heat</span>
        <span className="court-tv">+{surface.intensity.fpm}/min</span>
      </div>
      <div className="court-pp-sec">also in combat · passive</div>
      <div className="court-tline court-tline--jade">
        <span>{meridian.trigger}</span>
        <span className="court-tv">≈ +{(base * 0.15).toFixed(1)}/min</span>
      </div>
      {meridian.capState === 'capped' ? (
        <div className="court-tline court-tline--gold">
          <span>at realm cap</span>
          <span className="court-tv">overflow → mastery</span>
        </div>
      ) : (
        <>
          <div className="court-tline">
            <span>
              to next rating ({meridian.rating}→{meridian.rating + 1})
            </span>
          </div>
          <div className="court-tbar">
            <div className="court-fill" style={{ width: `${((meridian.rating % 5) / 5) * 100}%` }} />
          </div>
        </>
      )}
    </div>
  );
}

export function CourtNavContent({
  surface,
  onReturn,
  onStart,
  onCease,
}: {
  surface: TemperingCourtSurface;
  onReturn?: () => void;
  onStart?: () => void;
  onCease?: () => void;
}) {
  const { status } = surface;
  const startEnabled = status === 'idle';
  const ceaseEnabled = status === 'active';
  const reason =
    status === 'blocked_by_combat'
      ? 'Court closed — in combat'
      : status === 'blocked_by_activity'
        ? 'Another activity holds the hall'
        : status === 'no_path'
          ? 'Choose a path at Life Start'
          : null;
  return (
    <div className="court-navrow">
      <div className="court-nav-left">
        <button type="button" className="court-btn" onClick={onReturn}>
          ◂ Return to Cloudreach · Adventure
        </button>
      </div>
      <div className="court-nav-right">
        {!startEnabled && reason ? <span className="court-reason">{reason}</span> : null}
        <button
          type="button"
          className={['court-btn', 'court-btn--jade', 'court-btn--big', startEnabled ? '' : 'is-disabled'].filter(Boolean).join(' ')}
          disabled={!startEnabled}
          onClick={onStart}
        >
          {status === 'active' ? 'Tempering' : 'Begin Tempering'}
        </button>
        <button
          type="button"
          className={['court-btn', ceaseEnabled ? '' : 'is-disabled'].filter(Boolean).join(' ')}
          disabled={!ceaseEnabled}
          onClick={onCease}
        >
          Cease
        </button>
      </div>
    </div>
  );
}

export function RegimensShelfContent({
  surface,
  onSelectMeridian,
}: {
  surface: TemperingCourtSurface;
  onSelectMeridian?: (meridianId: string) => void;
}) {
  const unlocked = surface.meridians.filter((meridian) => meridian.unlocked);
  const sealed = surface.meridians.filter((meridian) => !meridian.unlocked);
  return (
    <div className="court-shelf">
      {unlocked.map((meridian) => (
        <button
          key={meridian.id}
          type="button"
          className={['court-plaque', meridian.isActive ? 'is-sel' : ''].filter(Boolean).join(' ')}
          aria-pressed={meridian.isActive}
          data-mi={meridian.index}
          onClick={() => onSelectMeridian?.(meridian.id)}
        >
          {meridian.isActive ? (
            <span className="court-psel">
              <CourtWaxSeal chars="煉" size={22} jade />
            </span>
          ) : null}
          {meridian.isActive ? <span className="court-ptemper">TEMPERING</span> : null}
          <span className="court-pname">{meridian.exercise}</span>
          <span className="court-proom">
            {meridian.room} · trains <b>{meridian.name}</b> <span className="court-zi">{meridian.zi}</span>
          </span>
          <div className="court-pmeta">
            <CourtRootChip grade={meridian.root.chipClass}>{rootChipLabel(meridian)}</CourtRootChip>
            <div className="court-pbar">
              <div className="court-fill" style={{ width: `${Math.min(100, meridian.capPct * 100)}%` }} />
            </div>
            <span className="court-val">
              {meridian.rating}/{meridian.cap}
            </span>
          </div>
          <div className="court-ladder">
            {Array.from({ length: 10 }, (_, i) => {
              const rank = i + 1;
              return (
                <span
                  key={rank}
                  className={['court-notch', rank <= meridian.mastery.rank ? 'is-on' : '', rank === meridian.mastery.rank ? 'is-cur' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {rank === meridian.traitRank ? <span className="court-trait">◆</span> : null}
                </span>
              );
            })}
          </div>
          <span className="court-micro">
            Mastery {meridian.mastery.rank}/10 · trait ◆ at {meridian.traitRank} — {meridian.trait}
            {meridian.comp < 1 ? ` · learning ${Math.round(meridian.comp * 100)}%` : ''}
          </span>
        </button>
      ))}
      {sealed.length > 0 ? <div className="court-divider">sealed meridians · unlocked by breakthrough</div> : null}
      {sealed.map((meridian) => (
        <div
          key={meridian.id}
          className="court-slip"
          aria-disabled="true"
          aria-label={`${meridian.name}, sealed, opens at ${realmNameForUnlock(meridian.unlockRealm)}`}
        >
          <span className="court-seal-lock">
            <CourtWaxSeal chars="封" size={26} rotation={-8} />
          </span>
          <div className="court-sname">
            {meridian.name} <span className="court-zi">{meridian.zi}</span>
          </div>
          <div className="court-micro">opens at {realmNameForUnlock(meridian.unlockRealm)}</div>
          <div className="court-micro">promise: {meridian.pathEffect}</div>
        </div>
      ))}
    </div>
  );
}

export function PathMeridiansContent({ surface }: { surface: TemperingCourtSurface }) {
  return (
    <div className="court-fcol">
      <div className="court-fsummary">
        Path Meridians <span className="court-val">{surface.realm.unlockedCount}/7 unsealed</span>
      </div>
      {surface.meridians.map((meridian) =>
        meridian.unlocked ? (
          <div key={meridian.id} className={['court-merrow', meridian.isActive ? 'is-active' : ''].filter(Boolean).join(' ')}>
            <svg className="court-fbead" width={20} height={20} viewBox="0 0 20 20" aria-hidden="true">
              <circle
                cx={10}
                cy={10}
                r={8}
                fill={
                  meridian.capState === 'capped'
                    ? 'url(#goldRad)'
                    : meridian.isBottleneck
                      ? 'url(#cinnDisc)'
                      : 'url(#jadeRad)'
                }
              />
            </svg>
            <span className="court-mname">
              {meridian.name} <span className="court-zi">{meridian.zi}</span>
            </span>
            <CourtRootChip grade={meridian.root.chipClass}>{rootChipLabel(meridian)}</CourtRootChip>
            <div className="court-mmeter">
              <div className="court-fill" style={{ width: `${Math.min(100, meridian.capPct * 100)}%` }} />
            </div>
            <span className="court-mr">
              {meridian.rating}/{meridian.cap}
            </span>
            {meridian.isActive ? (
              <CourtChip tone="jade">▸</CourtChip>
            ) : meridian.isBottleneck ? (
              <CourtChip tone="cinn">!</CourtChip>
            ) : meridian.capState === 'capped' ? (
              <CourtChip tone="gold">滿</CourtChip>
            ) : null}
          </div>
        ) : (
          <div key={meridian.id} className="court-merlocked">
            <CourtWaxSeal chars="封" size={20} rotation={-6} />
            <span className="court-mname">
              {meridian.name} <span className="court-zi">{meridian.zi}</span>
            </span>
            <span className="court-sealtag">{realmNameForUnlock(meridian.unlockRealm)}</span>
          </div>
        ),
      )}
    </div>
  );
}
