import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useCombatStore } from '../../stores/combatStore';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { formatNumber, divide, D } from '../../utils/numbers';
import type { EnemyDefinition } from '../../types';
import { CombatCanvas } from '../combat/CombatCanvas';

/**
 * Zone definition from JSON
 */
interface Zone {
  id: string;
  name: string;
  description: string;
  levelRange: {
    min: number;
    max: number;
  };
  realmRequirement: {
    index: number;
    substage: number;
  };
  enemyIds: string[];
  locked: boolean;
}

/**
 * HP Bar component
 */
function HPBar({
  current,
  max,
  label,
  color = 'bg-red-500'
}: {
  current: string;
  max: string;
  label: string;
  color?: string;
}) {
  const percent = Math.min(100, parseFloat(divide(current, max).times(100).toFixed(2)));

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-400">
          {formatNumber(current)} / {formatNumber(max)}
        </span>
      </div>
      <div className="h-6 bg-slate-700 rounded-lg overflow-hidden border border-slate-600">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

/**
 * Combat Log component
 */
function CombatLog() {
  const combatLog = useCombatStore((state) => state.combatLog);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatLog]);

  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 h-64 overflow-y-auto">
      <div className="space-y-1">
        {combatLog.length === 0 ? (
          <div className="text-slate-500 text-sm text-center py-8">
            Combat log is empty
          </div>
        ) : (
          combatLog.map((entry, index) => (
            <div
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.text}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

/**
 * Adventure Tab Component
 */
export function AdventureTab() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [enemies, setEnemies] = useState<Record<string, EnemyDefinition>>({});
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Combat store
  const inCombat = useCombatStore((state) => state.inCombat);
  const currentEnemy = useCombatStore((state) => state.currentEnemy);
  const playerHP = useCombatStore((state) => state.playerHP);
  const playerMaxHP = useCombatStore((state) => state.playerMaxHP);
  const enemyHP = useCombatStore((state) => state.enemyHP);
  const enemyMaxHP = useCombatStore((state) => state.enemyMaxHP);
  const autoAttack = useCombatStore((state) => state.autoAttack);

  const enterCombat = useCombatStore((state) => state.enterCombat);
  const exitCombat = useCombatStore((state) => state.exitCombat);
  const playerAttack = useCombatStore((state) => state.playerAttack);
  const setAutoAttack = useCombatStore((state) => state.setAutoAttack);

  // Game store
  const realm = useGameStore((state) => state.realm);
  const stats = useGameStore((state) => state.stats);

  // Inventory store
  const gold = useInventoryStore((state) => state.gold);

  // Load zones and enemies data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch zones
        const zonesResponse = await fetch('/config/zones.json');
        const zonesData = await zonesResponse.json();
        setZones(zonesData.zones || []);

        // Fetch enemies
        const enemiesResponse = await fetch('/config/enemies.json');
        const enemiesData = await enemiesResponse.json();

        // Convert enemies array to object keyed by id
        const enemiesMap: Record<string, EnemyDefinition> = {};
        (enemiesData.enemies || []).forEach((enemy: EnemyDefinition) => {
          enemiesMap[enemy.id] = enemy;
        });
        setEnemies(enemiesMap);

        console.log('[AdventureTab] Loaded zones and enemies');
      } catch (error) {
        console.error('[AdventureTab] Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if zone is unlocked
  const isZoneUnlocked = (zone: Zone): boolean => {
    if (zone.locked) return false;

    const reqRealm = zone.realmRequirement;
    if (realm.index > reqRealm.index) return true;
    if (realm.index === reqRealm.index && realm.substage >= reqRealm.substage) return true;

    return false;
  };

  // Handle zone selection and enter combat
  const handleZoneClick = (zone: Zone) => {
    if (!isZoneUnlocked(zone)) {
      console.warn('[AdventureTab] Zone is locked');
      return;
    }

    setSelectedZoneId(zone.id);

    // Get random enemy from zone
    const enemyIds = zone.enemyIds;
    if (enemyIds.length === 0) {
      console.warn('[AdventureTab] No enemies in zone');
      return;
    }

    const randomEnemyId = enemyIds[Math.floor(Math.random() * enemyIds.length)];
    const enemy = enemies[randomEnemyId];

    if (!enemy) {
      console.warn('[AdventureTab] Enemy not found:', randomEnemyId);
      return;
    }

    // Enter combat
    enterCombat(zone.id, enemy);
  };

  // Handle flee
  const handleFlee = () => {
    exitCombat();
    setSelectedZoneId(null);
  };

  // Handle manual attack
  const handleAttack = () => {
    playerAttack();
  };

  // Handle auto-attack toggle
  const handleAutoAttackToggle = () => {
    setAutoAttack(!autoAttack);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⚔️</div>
          <div className="text-slate-400">Loading adventure zones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT PANEL - Zone Selection */}
      <div className="lg:col-span-1">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">
            🗺️ Adventure Zones
          </h2>
          <div className="space-y-3">
            {zones.map((zone) => {
              const unlocked = isZoneUnlocked(zone);
              const isSelected = selectedZoneId === zone.id;

              return (
                <motion.button
                  key={zone.id}
                  onClick={() => handleZoneClick(zone)}
                  disabled={!unlocked}
                  className={`
                    w-full p-4 rounded-lg border-2 transition-all text-left
                    ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400/10'
                        : unlocked
                        ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                        : 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
                    }
                  `}
                  whileHover={unlocked ? { scale: 1.02 } : {}}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold text-white">{zone.name}</div>
                    <div className="text-xs text-slate-400">
                      Lv. {zone.levelRange.min}-{zone.levelRange.max}
                    </div>
                  </div>
                  <div className="text-sm text-slate-300 mb-2">
                    {zone.description}
                  </div>
                  {!unlocked && (
                    <div className="text-xs text-red-400">
                      🔒 Requires Realm {zone.realmRequirement.index} Substage{' '}
                      {zone.realmRequirement.substage + 1}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Combat Area */}
      <div className="lg:col-span-2 space-y-4">
        {!inCombat ? (
          // Not in combat - show selection message
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700">
            <div className="text-center">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedZoneId ? 'Ready for Combat' : 'Select a Zone'}
              </h2>
              <p className="text-slate-400 mb-6">
                {selectedZoneId
                  ? 'Click on the zone again to find an enemy'
                  : 'Choose an adventure zone from the list to begin'}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 uppercase mb-1">HP</div>
                  <div className="text-lg font-bold text-green-400">
                    {formatNumber(stats.hp)}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 uppercase mb-1">ATK</div>
                  <div className="text-lg font-bold text-red-400">
                    {formatNumber(stats.atk)}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 uppercase mb-1">DEF</div>
                  <div className="text-lg font-bold text-blue-400">
                    {formatNumber(stats.def)}
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 uppercase mb-1">Gold</div>
                  <div className="text-lg font-bold text-yellow-400">
                    {formatNumber(gold)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // In combat - show combat interface
          <>
            {/* Combat Canvas */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 flex justify-center">
              <CombatCanvas
                width={800}
                height={400}
                inCombat={inCombat}
                playerHP={D(playerHP).toNumber()}
                enemyHP={D(enemyHP).toNumber()}
              />
            </div>

            {/* Enemy Info */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {currentEnemy?.name || 'Unknown Enemy'}
                  </h2>
                  <div className="text-sm text-slate-400">
                    Level {currentEnemy?.level || 1}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase mb-1">Gold Reward</div>
                  <div className="text-lg font-bold text-yellow-400">
                    {formatNumber(currentEnemy?.goldReward || '0')}
                  </div>
                </div>
              </div>

              {/* Enemy HP Bar */}
              <HPBar
                current={enemyHP}
                max={enemyMaxHP}
                label="Enemy HP"
                color="bg-red-500"
              />

              {/* Player HP Bar */}
              <HPBar
                current={playerHP}
                max={playerMaxHP}
                label="Your HP"
                color="bg-green-500"
              />

              {/* Combat Controls */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={handleAttack}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-lg hover:from-red-500 hover:to-red-600 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ⚔️ Attack
                </motion.button>

                <motion.button
                  onClick={handleAutoAttackToggle}
                  className={`
                    px-6 py-3 font-bold rounded-lg transition-all
                    ${
                      autoAttack
                        ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {autoAttack ? '⚡ Auto (ON)' : '⚡ Auto (OFF)'}
                </motion.button>

                <motion.button
                  onClick={handleFlee}
                  className="px-6 py-3 bg-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-600 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🏃 Flee
                </motion.button>
              </div>
            </div>

            {/* Combat Log */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-3">Combat Log</h3>
              <CombatLog />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
