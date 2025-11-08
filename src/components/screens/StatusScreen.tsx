import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useCombatStore } from '../../stores/combatStore';
import { useZoneStore } from '../../stores/zoneStore';
import { formatNumber } from '../../utils/numbers';
import { REALMS } from '../../constants';

/**
 * Stat Row Component for displaying key-value pairs
 */
function StatRow({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

/**
 * Section Header Component
 */
function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-gold-accent/30">
      <span className="text-2xl">{icon}</span>
      <h2 className="font-cinzel text-xl font-bold text-gold-accent">{title}</h2>
    </div>
  );
}

/**
 * Stat Card Component (for grouped stats)
 */
function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6 backdrop-blur-sm">
      <h3 className="font-cinzel font-bold text-gold-accent mb-4">{title}</h3>
      <div className="space-y-1">{children}</div>
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
  const currentSubstage = currentRealm.substages[realm.substage - 1];
  const totalEnemiesDefeated = getTotalEnemiesDefeated('all');

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">
            Character Status
          </h1>
          <p className="text-slate-400 text-sm">
            View your cultivation progress and combat statistics
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Cultivation Progress Section */}
            <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6 backdrop-blur-sm">
              <SectionHeader icon="⚡" title="Cultivation Progress" />

              <StatRow label="Current Realm" value={currentRealm.name} color="text-gold-accent" />
              <StatRow
                label="Substage"
                value={`${currentSubstage?.name || 'Unknown'} (${realm.substage}/${currentRealm.substages.length})`}
                color="text-qi-blue"
              />
              <StatRow label="Current Qi" value={formatNumber(qi)} color="text-qi-blue" />
              <StatRow label="Qi per Second" value={`${formatNumber(qiPerSecond)}/s`} color="text-qi-blue" />
              <StatRow label="Focus Mode" value={focusMode.toUpperCase()} color="text-purple-400" />
              <StatRow label="Total Auras" value={formatNumber(totalAuras)} color="text-pink-400" />
            </div>

            {/* Combat Statistics */}
            <StatCard title="Combat Statistics">
              <StatRow label="Max HP" value={formatNumber(stats.hp)} color="text-green-400" />
              <StatRow label="Attack Power" value={formatNumber(stats.atk)} color="text-red-400" />
              <StatRow label="Defense" value={formatNumber(stats.def)} color="text-blue-400" />
              <StatRow label="HP Regen/s" value={formatNumber(stats.hpRegen)} color="text-green-300" />
              <StatRow label="Critical Rate" value={`${(stats.critRate * 100).toFixed(1)}%`} color="text-yellow-400" />
              <StatRow label="Critical Damage" value={`${(stats.critDamage * 100).toFixed(0)}%`} color="text-yellow-400" />
              <StatRow label="Dodge Chance" value={`${(stats.dodge * 100).toFixed(1)}%`} color="text-cyan-400" />
              <StatRow label="Total Enemies Defeated" value={totalEnemiesDefeated} color="text-red-300" />
            </StatCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Resources */}
            <StatCard title="Resources">
              <StatRow label="Gold" value={formatNumber(gold)} color="text-yellow-400" />
              <StatRow label="Inventory Items" value={items.length} color="text-slate-300" />
            </StatCard>

            {/* Equipment Section */}
            <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6 backdrop-blur-sm">
              <SectionHeader icon="⚔️" title="Equipment" />

              {/* Weapon */}
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">Weapon</div>
                {equippedWeapon ? (
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/50">
                    <div className="font-bold text-purple-400">{equippedWeapon.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {equippedWeapon.rarity.charAt(0).toUpperCase() + equippedWeapon.rarity.slice(1)} •{' '}
                      {equippedWeapon.itemType}
                    </div>
                    {equippedWeapon.stats && (
                      <div className="text-xs text-slate-300 mt-2">
                        {equippedWeapon.stats.atk && (
                          <div>ATK: +{formatNumber(equippedWeapon.stats.atk)}</div>
                        )}
                        {equippedWeapon.stats.critRate && (
                          <div>Crit Rate: +{(equippedWeapon.stats.critRate * 100).toFixed(1)}%</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700 text-slate-500 text-sm">
                    No weapon equipped
                  </div>
                )}
              </div>

              {/* Accessory */}
              <div>
                <div className="text-sm text-slate-400 mb-2">Accessory</div>
                {equippedAccessory ? (
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/50">
                    <div className="font-bold text-cyan-400">{equippedAccessory.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {equippedAccessory.rarity.charAt(0).toUpperCase() + equippedAccessory.rarity.slice(1)} •{' '}
                      {equippedAccessory.itemType}
                    </div>
                    {equippedAccessory.stats && (
                      <div className="text-xs text-slate-300 mt-2">
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
                  <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700 text-slate-500 text-sm">
                    No accessory equipped
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <StatCard title="Miscellaneous">
              <StatRow label="Combat Logs" value={combatLog.length} color="text-slate-300" />
              <StatRow label="Player Luck" value={formatNumber(useGameStore.getState().playerLuck || 0)} color="text-pink-400" />
            </StatCard>
          </div>
        </div>
      </div>
    </div>
  );
}
