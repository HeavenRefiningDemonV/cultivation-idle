import { useEffect, useMemo, useRef, useState } from 'react';
import { useCombatStore } from '../../../stores/combatStore';
import { useContentStore } from '../../../stores/contentStore';
import { useGameStore } from '../../../stores/gameStore';
import { useTechniqueStore } from '../../../stores/techniqueStore';
import { formatSeconds } from '../../../systems/combat/minibarModel';
import './TechniqueStrip.scss';

interface TechniqueTileProps {
  techId: string;
  slotType: 'active' | 'passive' | 'ultimate';
  name: string;
  role?: string;
  type?: string;
  remainingMs: number;
  pctRemaining: number;
  isUnknown: boolean;
  isFlashing: boolean;
}

function TechniqueTile({
  techId,
  slotType,
  name,
  role,
  type,
  remainingMs,
  pctRemaining,
  isUnknown,
  isFlashing,
}: TechniqueTileProps) {
  const onCooldown = remainingMs > 0;
  const cooldownPct = Math.min(1, Math.max(0, pctRemaining));

  return (
    <div
      className={[
        'tech-strip__tile',
        `tech-strip__tile--${slotType}`,
        onCooldown ? 'tech-strip__tile--cooldown' : '',
        isUnknown ? 'tech-strip__tile--unknown' : '',
        isFlashing ? 'tech-strip__tile--flash' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="tech-strip__tile-header">
        <div className="tech-strip__tile-name">{name}</div>
        <div className="tech-strip__tile-tags">
          {role && <span className="tech-strip__tag">{role}</span>}
          {type && <span className="tech-strip__tag tech-strip__tag--type">{type}</span>}
        </div>
      </div>
      <div className="tech-strip__tile-meta">
        <span className="tech-strip__slot">{slotType === 'ultimate' ? 'Ultimate' : slotType === 'passive' ? 'Passive' : 'Active'}</span>
        {onCooldown ? <span className="tech-strip__cd-text">CD {formatSeconds(remainingMs)}</span> : <span className="tech-strip__cd-ready">Ready</span>}
      </div>
      {onCooldown && (
        <div
          className="tech-strip__cooldown"
          style={{ width: `${(cooldownPct * 100).toFixed(1)}%` }}
        />
      )}
      <div className="tech-strip__tile-id">{techId || '—'}</div>
    </div>
  );
}

export function TechniqueStrip() {
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const events = useCombatStore((state) => state.events);
  const techniqueCooldowns = useCombatStore((state) => state.techniqueCooldowns);

  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const loadouts = useTechniqueStore((state) => state.loadouts);
  const activeSlots = useTechniqueStore((state) => state.activeSlots);
  const passiveSlots = useTechniqueStore((state) => state.passiveSlots);
  const realmIndex = useGameStore((state) => state.realm.index ?? 0);

  const equipped = useMemo(() => {
    // These dependencies reflect unlock state and loadout changes that affect equipped techniques.
    void loadouts;
    void realmIndex;
    void activeSlots;
    void passiveSlots;
    return useTechniqueStore.getState().getCombatEquippedTechIds(selectedLoadoutId);
  }, [selectedLoadoutId, loadouts, realmIndex, activeSlots, passiveSlots]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const [flashTechId, setFlashTechId] = useState<string | null>(null);
  const lastEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const evt = events[i];
      if (evt.type === 'SKILL_CAST') {
        if (lastEventIdRef.current === evt.id) return;
        lastEventIdRef.current = evt.id;
        setFlashTechId(evt.techniqueId);
        const timeout = setTimeout(() => {
          setFlashTechId((prev) => (prev === evt.techniqueId ? null : prev));
        }, 400);
        return () => clearTimeout(timeout);
      }
    }
    return undefined;
  }, [events]);

  const lastCastByTechId = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const evt = events[i];
      if (evt.type === 'SKILL_CAST' && evt.techniqueId && map[evt.techniqueId] === undefined) {
        map[evt.techniqueId] = evt.at;
      }
    }
    return map;
  }, [events]);

  const renderTile = (techId: string, slotType: 'active' | 'passive' | 'ultimate', fallbackLabel: string) => {
    const def = techId ? techniquesById[techId] : undefined;
    const name = def?.name ?? fallbackLabel;
    const typeLabel = def?.type;
    const roleLabel = def?.role;
    const readyAt = techniqueCooldowns[techId] ?? 0;
    const remainingMs = Math.max(0, readyAt - now);
    const lastCastAt = techId ? lastCastByTechId[techId] : undefined;
    const fallbackCd = def?.cooldownSec ? def.cooldownSec * 1000 : 1000;
    const cdMs = Math.max(1, lastCastAt ? readyAt - lastCastAt : fallbackCd);
    const pctRemaining = remainingMs > 0 ? remainingMs / cdMs : 0;
    const isUnknown = !techId || !def;
    const isFlashing = flashTechId === techId;

    return (
      <TechniqueTile
        key={`${slotType}-${techId || fallbackLabel}`}
        techId={techId}
        slotType={slotType}
        name={name}
        role={roleLabel}
        type={typeLabel}
        remainingMs={remainingMs}
        pctRemaining={pctRemaining}
        isUnknown={isUnknown}
        isFlashing={isFlashing}
      />
    );
  };

  return (
    <div className="tech-strip">
      <div className="tech-strip__section">
        <div className="tech-strip__section-title">Actives</div>
        <div className="tech-strip__tiles">
          {equipped.active.length > 0
            ? equipped.active.map((id, idx) => renderTile(id, 'active', `Active ${idx + 1}`))
            : renderTile('', 'active', 'Empty active')}
        </div>
      </div>

      <div className="tech-strip__section">
        <div className="tech-strip__section-title">Ultimate</div>
        <div className="tech-strip__tiles">
          {equipped.ultimate ? renderTile(equipped.ultimate, 'ultimate', 'Ultimate') : renderTile('', 'ultimate', 'Ultimate locked')}
        </div>
      </div>

      <div className="tech-strip__section">
        <div className="tech-strip__section-title">Passives</div>
        <div className="tech-strip__tiles tech-strip__tiles--passive">
          {equipped.passive.length > 0
            ? equipped.passive.map((id, idx) => renderTile(id, 'passive', `Passive ${idx + 1}`))
            : renderTile('', 'passive', 'Passive slot')}
        </div>
      </div>
    </div>
  );
}
