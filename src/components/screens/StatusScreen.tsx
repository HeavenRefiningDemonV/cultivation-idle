import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useCombatStore } from '../../stores/combatStore';
import { useZoneStore } from '../../stores/zoneStore';
import { formatNumber } from '../../utils/numbers';
import { REALMS } from '../../constants';
import { SpiritRootDisplay } from '../SpiritRootDisplay';
import './StatusScreen.scss';

type StatTone =
  | 'gold'
  | 'qi'
  | 'green'
  | 'red'
  | 'blue'
  | 'yellow'
  | 'cyan'
  | 'pink'
  | 'muted'
  | 'none';

const toneClassMap: Record<StatTone, string> = {
  gold: 'status-screen__stat-gold',
  qi: 'status-screen__stat-qi',
  green: 'status-screen__stat-green',
  red: 'status-screen__stat-red',
  blue: 'status-screen__stat-blue',
  yellow: 'status-screen__stat-yellow',
  cyan: 'status-screen__stat-cyan',
  pink: 'status-screen__stat-pink',
  muted: 'status-screen__stat-muted',
  none: '',
};

/**
 * Stat Row Component for displaying key-value pairs
 */
function StatRow({ label, value, tone = 'muted' }: { label: string; value: string | number; tone?: StatTone }) {
  const toneClass = toneClassMap[tone];

  return (
    <div className={'status-screen__stat-row'}>
      <span className={'status-screen__stat-label'}>{label}</span>
      <span className={`${'status-screen__stat-value'} ${toneClass}`}>{value}</span>
    </div>
  );
}

/**
 * Section Header Component
 */
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className={'status-screen__section-header'}>
      <span className={'status-screen__section-icon'}>{icon}</span>
      <h2 className={'status-screen__section-title'}>{title}</h2>
    </div>
  );
}

/**
 * Stat Card Component (for grouped stats)
 */
function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={'status-screen__stat-card'}>
      <h3 className={'status-screen__stat-card-title'}>{title}</h3>
      <div className={'status-screen__stat-list'}>{children}</div>
    </div>
  );
}

/**
 * Main Status Screen Component
 */
export function StatusScreen() {
  // Game Store
  const realm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const stats = useGameStore((state) => state.stats);
  const focusMode = useGameStore((state) => state.focusMode);
  const totalAuras = useGameStore((state) => state.totalAuras);

  // Inventory Store
  const gold = useInventoryStore((state) => state.gold);
  const items = useInventoryStore((state) => state.items);
  const equippedWeapon = useInventoryStore((state) => state.equippedWeapon);
  const equippedAccessory = useInventoryStore((state) => state.equippedAccessory);

  // Combat Store (for statistics)
  const combatLog = useCombatStore((state) => state.combatLog);

  // Zone Store
  const getTotalEnemiesDefeated = useZoneStore((state) => state.getTotalEnemiesDefeated);

  // Calculate some derived stats
  const currentRealm = REALMS[realm.index];
  const totalEnemiesDefeated = getTotalEnemiesDefeated('all');

  return (
    <div className={'status-screen'}>
      {/* Background decoration */}
      <div className={'status-screen__background-glow'}>
        <div className={'status-screen__glow-pattern'} />
      </div>

      {/* Main Content */}
      <div className={'status-screen__content'}>
        {/* Header */}
        <div className={'status-screen__header'}>
          <h1 className={'status-screen__title'}>Character Status</h1>
          <p className={'status-screen__subtitle'}>View your cultivation progress and combat statistics</p>
        </div>

        {/* Main Grid Layout */}
        <div className={'status-screen__grid'}>
          {/* LEFT COLUMN */}
          <div className={'status-screen__column'}>
            {/* Cultivation Progress Section */}
            <div className={'status-screen__panel'}>
              <SectionHeader icon="⚡" title="Cultivation Progress" />

              <StatRow label="Current Realm" value={currentRealm.name} tone="gold" />
              <StatRow
                label="Substage"
                value={`Stage ${realm.substage}/${currentRealm.substages}`}
                tone="qi"
              />
              <StatRow label="Current Qi" value={formatNumber(qi)} tone="qi" />
              <StatRow label="Qi per Second" value={`${formatNumber(qiPerSecond)}/s`} tone="qi" />
              <StatRow label="Focus Mode" value={focusMode.toUpperCase()} tone="pink" />
              <StatRow label="Total Auras" value={formatNumber(totalAuras)} tone="pink" />
            </div>

            {/* Combat Statistics */}
            <StatCard title="Combat Statistics">
              <StatRow label="Max HP" value={formatNumber(stats.hp)} tone="green" />
              <StatRow label="Attack Power" value={formatNumber(stats.atk)} tone="red" />
              <StatRow label="Defense" value={formatNumber(stats.def)} tone="blue" />
              <StatRow label="HP Regen/s" value={formatNumber(stats.regen)} tone="green" />
              <StatRow label="Critical Rate" value={`${(stats.crit / 100).toFixed(1)}%`} tone="yellow" />
              <StatRow label="Critical Damage" value={`${stats.critDmg}%`} tone="yellow" />
              <StatRow label="Dodge Chance" value={`${(stats.dodge / 100).toFixed(1)}%`} tone="cyan" />
              <StatRow label="Total Enemies Defeated" value={totalEnemiesDefeated} tone="red" />
            </StatCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className={'status-screen__column'}>
            {/* Spirit Root Display */}
            <SpiritRootDisplay />

            {/* Resources */}
            <StatCard title="Resources">
              <StatRow label="Gold" value={formatNumber(gold)} tone="gold" />
              <StatRow label="Inventory Items" value={items.length} tone="muted" />
            </StatCard>

            {/* Equipment Section */}
            <div className={'status-screen__equipment-section'}>
              <SectionHeader icon="⚔️" title="Equipment" />

              {/* Weapon */}
              <div className={'status-screen__equipment-block'}>
                <div className={'status-screen__equipment-label'}>Weapon</div>
                {equippedWeapon ? (
                  <div className={'status-screen__equipment-card'}>
                    <div className={'status-screen__equipment-name-purple'}>{equippedWeapon.name}</div>
                    <div className={'status-screen__equipment-meta'}>
                      {equippedWeapon.rarity.charAt(0).toUpperCase() + equippedWeapon.rarity.slice(1)} Weapon
                    </div>
                    {equippedWeapon.stats && (
                      <div className={'status-screen__equipment-stats'}>
                        {equippedWeapon.stats.atk && (
                          <div>ATK: +{formatNumber(equippedWeapon.stats.atk)}</div>
                        )}
                        {equippedWeapon.stats.crit && (
                          <div>Crit Rate: +{equippedWeapon.stats.crit}%</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={'status-screen__equipment-empty'}>No weapon equipped</div>
                )}
              </div>

              {/* Accessory */}
              <div>
                <div className={'status-screen__equipment-label'}>Accessory</div>
                {equippedAccessory ? (
                  <div className={`${'status-screen__equipment-card'} ${'status-screen__equipment-card-accessory'}`}>
                    <div className={'status-screen__equipment-name-cyan'}>{equippedAccessory.name}</div>
                    <div className={'status-screen__equipment-meta'}>
                      {equippedAccessory.rarity.charAt(0).toUpperCase() + equippedAccessory.rarity.slice(1)} Accessory
                    </div>
                    {equippedAccessory.stats && (
                      <div className={'status-screen__equipment-stats'}>
                        {equippedAccessory.stats.hp && (
                          <div>HP: +{formatNumber(equippedAccessory.stats.hp)}</div>
                        )}
                        {equippedAccessory.stats.def && (
                          <div>DEF: +{formatNumber(equippedAccessory.stats.def)}</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={'status-screen__equipment-empty'}>No accessory equipped</div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className={'status-screen__misc-panel'}>
              <StatCard title="Miscellaneous">
                <StatRow label="Combat Logs" value={combatLog.length} tone="muted" />
                <StatRow
                  label="Player Luck"
                  value={formatNumber(useGameStore.getState().playerLuck || 0)}
                  tone="pink"
                />
              </StatCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
