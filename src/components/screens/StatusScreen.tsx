import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useCombatStore } from '../../stores/combatStore';
import { useZoneStore } from '../../stores/zoneStore';
import { formatNumber } from '../../utils/numbers';
import { REALMS } from '../../constants';
import { SpiritRootDisplay } from '../SpiritRootDisplay';
import styles from './StatusScreen.module.css';

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
  gold: styles.statGold,
  qi: styles.statQi,
  green: styles.statGreen,
  red: styles.statRed,
  blue: styles.statBlue,
  yellow: styles.statYellow,
  cyan: styles.statCyan,
  pink: styles.statPink,
  muted: styles.statMuted,
  none: '',
};

/**
 * Stat Row Component for displaying key-value pairs
 */
function StatRow({ label, value, tone = 'muted' }: { label: string; value: string | number; tone?: StatTone }) {
  const toneClass = toneClassMap[tone];

  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statValue} ${toneClass}`}>{value}</span>
    </div>
  );
}

/**
 * Section Header Component
 */
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionIcon}>{icon}</span>
      <h2 className={styles.sectionTitle}>{title}</h2>
    </div>
  );
}

/**
 * Stat Card Component (for grouped stats)
 */
function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.statCard}>
      <h3 className={styles.statCardTitle}>{title}</h3>
      <div className={styles.statList}>{children}</div>
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
    <div className={styles.root}>
      {/* Background decoration */}
      <div className={styles.backgroundGlow}>
        <div className={styles.glowPattern} />
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Character Status</h1>
          <p className={styles.subtitle}>View your cultivation progress and combat statistics</p>
        </div>

        {/* Main Grid Layout */}
        <div className={styles.grid}>
          {/* LEFT COLUMN */}
          <div className={styles.column}>
            {/* Cultivation Progress Section */}
            <div className={styles.panel}>
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
          <div className={styles.column}>
            {/* Spirit Root Display */}
            <SpiritRootDisplay />

            {/* Resources */}
            <StatCard title="Resources">
              <StatRow label="Gold" value={formatNumber(gold)} tone="gold" />
              <StatRow label="Inventory Items" value={items.length} tone="muted" />
            </StatCard>

            {/* Equipment Section */}
            <div className={styles.equipmentSection}>
              <SectionHeader icon="⚔️" title="Equipment" />

              {/* Weapon */}
              <div className={styles.equipmentBlock}>
                <div className={styles.equipmentLabel}>Weapon</div>
                {equippedWeapon ? (
                  <div className={styles.equipmentCard}>
                    <div className={styles.equipmentNamePurple}>{equippedWeapon.name}</div>
                    <div className={styles.equipmentMeta}>
                      {equippedWeapon.rarity.charAt(0).toUpperCase() + equippedWeapon.rarity.slice(1)} Weapon
                    </div>
                    {equippedWeapon.stats && (
                      <div className={styles.equipmentStats}>
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
                  <div className={styles.equipmentEmpty}>No weapon equipped</div>
                )}
              </div>

              {/* Accessory */}
              <div>
                <div className={styles.equipmentLabel}>Accessory</div>
                {equippedAccessory ? (
                  <div className={`${styles.equipmentCard} ${styles.equipmentCardAccessory}`}>
                    <div className={styles.equipmentNameCyan}>{equippedAccessory.name}</div>
                    <div className={styles.equipmentMeta}>
                      {equippedAccessory.rarity.charAt(0).toUpperCase() + equippedAccessory.rarity.slice(1)} Accessory
                    </div>
                    {equippedAccessory.stats && (
                      <div className={styles.equipmentStats}>
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
                  <div className={styles.equipmentEmpty}>No accessory equipped</div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className={styles.miscPanel}>
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
