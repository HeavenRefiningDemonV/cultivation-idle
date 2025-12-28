import { useMemo } from 'react';
import { useCombatStore } from '../../../stores/combatStore';
import { useContentStore } from '../../../stores/contentStore';
import { formatNumber } from '../../../utils/numbers';

const MAX_LOOT_ENTRIES = 5;

export function LootTicker() {
  const events = useCombatStore((state) => state.events);
  const itemsById = useContentStore((state) => state.maps.itemsById);

  const entries = useMemo(() => {
    const lootEvents = events.filter((event) => event.type === 'LOOT_DROP');
    return lootEvents
      .slice(-MAX_LOOT_ENTRIES)
      .reverse()
      .map((event, idx) => {
        const itemDef = itemsById[event.itemId];
        const name = itemDef?.name ?? event.itemId;
        const rarity = itemDef?.rarity ?? event.rarity ?? 'common';
        const reason = event.reason ? ` — ${event.reason}` : '';
        return {
          id: `${event.id}-${idx}`,
          text: `+${formatNumber(event.qty)} ${name}${reason}`,
          rarity,
        };
      });
  }, [events, itemsById]);

  return (
    <div className="combat-theater__loot-ticker">
      <div className="combat-theater__section-title">Recent loot</div>
      {entries.length === 0 ? (
        <div className="combat-theater__loot-empty">No drops yet</div>
      ) : (
        <ul className="combat-theater__loot-list">
          {entries.map((entry) => (
            <li key={entry.id} className={`combat-theater__loot-entry combat-theater__loot-entry--${entry.rarity}`}>
              {entry.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
