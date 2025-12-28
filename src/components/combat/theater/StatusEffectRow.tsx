import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useCombatStore } from '../../../stores/combatStore';
import { useGameStore } from '../../../stores/gameStore';
import { formatNumber } from '../../../utils/numbers';

interface StatusChip {
  key: string;
  label: string;
  detail: string;
}

const STAT_LABELS: Record<string, string> = {
  atk: 'ATK',
  def: 'DEF',
  crit: 'Crit',
  crit_chance: 'Crit',
  absorption: 'Absorption',
};

function formatRemaining(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

export function StatusEffectRow() {
  const { combatBuffs, combatShield, activeAura } = useCombatStore(
    useShallow((state) => ({
      combatBuffs: state.combatBuffs,
      combatShield: state.combatShield,
      activeAura: state.activeAura,
    })),
  );
  const absorptionShield = useGameStore((state) => state.absorptionShield);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const chips = useMemo<StatusChip[]>(() => {
    const list: StatusChip[] = [];

    combatBuffs
      .filter((buff) => buff.endsAt > now)
      .forEach((buff) => {
        const remainingSec = Math.max(0, (buff.endsAt - now) / 1000);
        const statLabel = STAT_LABELS[buff.stat] ?? buff.stat.toUpperCase();
        const valueLabel = buff.mode === 'pct' ? `${buff.value}%` : formatNumber(buff.value);
        list.push({
          key: `buff-${buff.id}`,
          label: `Buff: ${statLabel}`,
          detail: `${valueLabel} (${formatRemaining(remainingSec)} left)`,
        });
      });

    if (combatShield?.amount && combatShield.amount > 0) {
      const remainingSec = combatShield.expiresAt
        ? Math.max(0, (combatShield.expiresAt - now) / 1000)
        : null;
      const timeLabel = remainingSec != null ? ` (expires in ${formatRemaining(remainingSec)})` : '';
      list.push({
        key: 'combat-shield',
        label: 'Shield',
        detail: `${formatNumber(combatShield.amount)}${timeLabel}`,
      });
    }

    const absorptionValue = parseFloat(absorptionShield);
    if (Number.isFinite(absorptionValue) && absorptionValue > 0) {
      list.push({
        key: 'absorption-shield',
        label: 'Absorption',
        detail: `${formatNumber(absorptionValue)} shield`,
      });
    }

    if (activeAura) {
      const dps = activeAura.damagePerSec ?? 0;
      const description = activeAura.description || 'Enemy aura';
      const detail = dps > 0 ? `${formatNumber(dps)}/s damage aura` : 'Aura active';
      list.push({
        key: 'enemy-aura',
        label: description,
        detail,
      });
    }

    return list;
  }, [absorptionShield, activeAura, combatBuffs, combatShield, now]);

  if (chips.length === 0) {
    return (
      <div className="combat-theater__status-row" aria-label="combat-status-effects">
        <span className="combat-theater__status-chip">No active combat effects</span>
      </div>
    );
  }

  return (
    <div className="combat-theater__status-row" aria-label="combat-status-effects">
      {chips.map((chip) => (
        <span key={chip.key} className="combat-theater__status-chip" title={`${chip.label}: ${chip.detail}`}>
          <span className="combat-theater__status-chip-label">{chip.label}</span>
          <span className="combat-theater__status-chip-detail">{chip.detail}</span>
        </span>
      ))}
    </div>
  );
}
