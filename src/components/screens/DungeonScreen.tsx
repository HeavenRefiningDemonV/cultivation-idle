import { useState, useEffect } from 'react';
import { useCombatStore } from '../../stores/combatStore';
import { useDungeonStore } from '../../stores/dungeonStore';
import { useGameStore } from '../../stores/gameStore';
import { formatNumber } from '../../utils/numbers';
import { CombatView } from './AdventureScreen';
import styles from './DungeonScreen.module.css';

/**
 * Dungeon definition from config
 */
interface Dungeon {
  id: string;
  name: string;
  tier: number;
  description: string;
  minRealm: number;
  suggestedDPS: number;
  suggestedHP: number;
  boss: {
    id: string;
    name: string;
    hp: number;
    atk: number;
    def: number;
    mechanics: Array<{
      type: 'shield' | 'aura' | 'enrage';
      trigger: { hpPercent: number };
      effect: { shieldAmount?: number; auraDamagePerSec?: number };
      description: string;
    }>;
  };
  rewards: {
    gold: number;
    exp: number;
    guaranteedDrop: {
      itemId: string;
      name: string;
      firstClearOnly: boolean;
    };
  };
  unlocked: boolean;
}

/**
 * Calculate player readiness for a dungeon
 */
function getReadinessLevel(
  playerDPS: number,
  playerHP: number,
  suggestedDPS: number,
  suggestedHP: number
): { level: 'ready' | 'caution' | 'danger'; text: string; valueClass: string; fillClass: string } {
  const dpsRatio = playerDPS / suggestedDPS;
  const hpRatio = playerHP / suggestedHP;
  const avgRatio = (dpsRatio + hpRatio) / 2;

  if (avgRatio >= 1.2) {
    return { level: 'ready', text: 'READY', valueClass: styles.readinessValueReady, fillClass: styles.progressFillReady };
  } else if (avgRatio >= 0.8) {
    return { level: 'caution', text: 'CAUTION', valueClass: styles.readinessValueCaution, fillClass: styles.progressFillCaution };
  } else {
    return { level: 'danger', text: 'DANGER', valueClass: styles.readinessValueDanger, fillClass: styles.progressFillDanger };
  }
}

/**
 * Boss Preview Modal
 */
function BossPreviewModal({
  dungeon,
  onClose,
  onEnter,
  playerStats,
}: {
  dungeon: Dungeon;
  onClose: () => void;
  onEnter: () => void;
  playerStats: { atk: string; hp: string };
}) {
  const playerDPS = Number(playerStats.atk);
  const playerHP = Number(playerStats.hp);
  const readiness = getReadinessLevel(playerDPS, playerHP, dungeon.suggestedDPS, dungeon.suggestedHP);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <div>
              <h2 className={styles.modalTitle}>{dungeon.name}</h2>
              <p className={styles.modalSubtitle}>{dungeon.description}</p>
            </div>
            <button onClick={onClose} className={styles.closeButton} aria-label="Close preview">
              ×
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.panel}>
            <h3 className={`${styles.panelTitle} ${styles.panelTitleDanger}`}>{dungeon.boss.name}</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>HP</div>
                <div className={styles.statValue}>{formatNumber(dungeon.boss.hp)}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>ATK</div>
                <div className={styles.statValue}>{formatNumber(dungeon.boss.atk)}</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statLabel}>DEF</div>
                <div className={styles.statValue}>{formatNumber(dungeon.boss.def)}</div>
              </div>
            </div>

            {dungeon.boss.mechanics && dungeon.boss.mechanics.length > 0 && (
              <div className={styles.mechanicsList}>
                <h4 className={styles.sectionTitle}>Boss Mechanics:</h4>
                {dungeon.boss.mechanics.map((mechanic, idx) => (
                  <div key={idx} className={styles.mechanicCard}>
                    <div className={styles.mechanicHeader}>
                      <span className={styles.mechanicTitle}>{mechanic.description}</span>
                      <span className={styles.mechanicMeta}>@ {mechanic.trigger.hpPercent}% HP</span>
                    </div>
                    <div className={styles.sectionText}>
                      {mechanic.type === 'shield' && `Gains ${formatNumber(mechanic.effect.shieldAmount ?? 0)} shield`}
                      {mechanic.type === 'aura' && `Deals ${mechanic.effect.auraDamagePerSec} damage per second`}
                      {mechanic.type === 'enrage' && 'Increases attack power'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${styles.panel} ${styles.panelGold}`}>
            <h4 className={styles.sectionTitle}>Readiness Check:</h4>

            <div>
              <div className={styles.readinessRow}>
                <span className={styles.readinessLabel}>Attack Power</span>
                <span>
                  <span className={styles.statValue}>{formatNumber(playerDPS)}</span>{' '}
                  <span className={styles.sectionText}>/ {formatNumber(dungeon.suggestedDPS)}</span>
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${readiness.fillClass}`}
                  style={{ width: `${Math.min(100, (playerDPS / dungeon.suggestedDPS) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className={styles.readinessRow}>
                <span className={styles.readinessLabel}>Hit Points</span>
                <span>
                  <span className={styles.statValue}>{formatNumber(playerHP)}</span>{' '}
                  <span className={styles.sectionText}>/ {formatNumber(dungeon.suggestedHP)}</span>
                </span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${readiness.fillClass}`}
                  style={{ width: `${Math.min(100, (playerHP / dungeon.suggestedHP) * 100)}%` }}
                />
              </div>
            </div>

            <div className={styles.readinessRow}>
              <span className={styles.readinessLabel}>Overall Readiness</span>
              <span className={readiness.valueClass}>{readiness.text}</span>
            </div>
          </div>

          <div className={`${styles.panel} ${styles.panelGold}`}>
            <h4 className={styles.sectionTitle}>Rewards:</h4>
            <div className={styles.rewardsList}>
              <div className={styles.rewardRow}>
                <span className={styles.sectionText}>Gold:</span>
                <span className={styles.statValue}>{formatNumber(dungeon.rewards.gold)}</span>
              </div>
              {dungeon.rewards.guaranteedDrop && (
                <div className={styles.rewardRow}>
                  <span className={styles.sectionText}>First Clear:</span>
                  <span className={styles.statValue}>{dungeon.rewards.guaranteedDrop.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={`${styles.footerButton} ${styles.buttonNeutral}`}>
            Cancel
          </button>
          <button onClick={onEnter} className={`${styles.footerButton} ${styles.buttonPrimary}`}>
            Enter Dungeon
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dungeon Card Component
 */
function DungeonCard({ dungeon, playerStats }: { dungeon: Dungeon; playerStats: { atk: string; hp: string } }) {
  const [showPreview, setShowPreview] = useState(false);
  const realm = useGameStore((state) => state.realm);
  const startDungeonCombat = useCombatStore((state) => state.startDungeonCombat);
  const isDungeonUnlocked = useDungeonStore((state) => state.isDungeonUnlocked(dungeon.id));
  const isFirstClear = useDungeonStore((state) => state.isFirstClear(dungeon.id));
  const totalClears = useDungeonStore((state) => state.getTotalClears(dungeon.id));

  if (!realm) return null;

  const isLocked = realm.index < dungeon.minRealm || !isDungeonUnlocked;

  const playerDPS = Number(playerStats.atk);
  const playerHP = Number(playerStats.hp);
  const readiness = getReadinessLevel(playerDPS, playerHP, dungeon.suggestedDPS, dungeon.suggestedHP);

  const handleEnterDungeon = () => {
    startDungeonCombat(dungeon.id, dungeon.boss, dungeon);
    setShowPreview(false);
  };

  const cardBorder = isLocked ? styles.buttonNeutral : styles.panelGold;

  return (
    <>
      <div className={`${styles.panel} ${cardBorder}`} style={{ opacity: isLocked ? 0.6 : 1 }}>
        <div className={styles.readinessRow}>
          <div>
            <h3 className={styles.sectionTitle}>{dungeon.name}</h3>
            <div className={styles.sectionText}>Tier {dungeon.tier}</div>
          </div>
          {!isLocked && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {isFirstClear ? (
                <div className={styles.heroBadge}>FIRST CLEAR</div>
              ) : (
                <div className={styles.sectionText}>Clears: {totalClears}</div>
              )}
            </div>
          )}
        </div>

        <p className={styles.sectionText}>{dungeon.description}</p>

        {isLocked ? (
          <div className={`${styles.sectionText} ${styles.readinessValueDanger}`}>🔒 Requires Realm {dungeon.minRealm}</div>
        ) : (
          <div className={styles.rewardsList}>
            <div className={styles.sectionText}>Suggested: {dungeon.suggestedDPS} DPS • {dungeon.suggestedHP} HP</div>
            <div className={styles.sectionText}>Boss: {dungeon.boss.name}</div>
            <div className={styles.sectionText}>Readiness: <span className={readiness.valueClass}>{readiness.text}</span></div>
          </div>
        )}

        {!isLocked && (
          <div className={styles.modalFooter}>
            <button onClick={() => setShowPreview(true)} className={`${styles.footerButton} ${styles.buttonNeutral}`}>
              Preview
            </button>
            <button onClick={handleEnterDungeon} className={`${styles.footerButton} ${styles.buttonPrimary}`}>
              Enter
            </button>
          </div>
        )}
      </div>

      {showPreview && (
        <BossPreviewModal dungeon={dungeon} onClose={() => setShowPreview(false)} onEnter={handleEnterDungeon} playerStats={playerStats} />
      )}
    </>
  );
}

/**
 * Main Dungeon Screen Component
 */
export function DungeonScreen() {
  const stats = useGameStore((state) => state.stats);
  const currentDungeon = useDungeonStore((state) => state.currentDungeon);
  const inCombat = useCombatStore((state) => state.inCombat);
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/config/dungeons.json')
      .then((res) => res.json())
      .then((data) => {
        setDungeons(data.dungeons || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[DungeonScreen] Error loading dungeons:', err);
        setError('Failed to load dungeons');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className={styles.cardWrapper}>
        <div className={styles.backgroundOverlay} />
        <div className={styles.cardContent}>
          <div className={styles.loading}>
            <div className={styles.cardTitle}>⚔️</div>
            <div className={styles.sectionText}>Loading dungeons...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.cardWrapper}>
        <div className={styles.backgroundOverlay} />
        <div className={styles.cardContent}>
          <div className={styles.error}>
            <div className={styles.errorTitle}>Error Loading Dungeons</div>
            <p className={styles.sectionText}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (inCombat && currentDungeon) {
    const dungeon = dungeons.find((d) => d.id === currentDungeon);
    return (
      <div className={styles.cardWrapper}>
        <div className={styles.backgroundOverlay} />
        <div className={styles.cardContent}>
          <div className={styles.cardHeader}>
            <div className={styles.heroBadge}>🏛️ DUNGEON TRIAL</div>
            <h1 className={styles.cardTitle}>{dungeon?.name || 'Dungeon Trial'}</h1>
            <p className={styles.cardSubtitle}>
              Defeat <span className={styles.readinessValueDanger}>{dungeon?.boss.name}</span> to claim your rewards
            </p>
          </div>
          <div className={styles.cardGrid}>
            <CombatView />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.backgroundOverlay} />
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h1 className={styles.cardTitle}>Trial Dungeons</h1>
          <p className={styles.cardSubtitle}>Challenge powerful bosses to obtain breakthrough materials</p>
        </div>

        {dungeons.length === 0 ? (
          <div className={styles.loading}>No dungeons available</div>
        ) : (
          <div className={styles.cardGrid}>
            {dungeons.map((dungeon) => (
              <DungeonCard key={dungeon.id} dungeon={dungeon} playerStats={stats} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
