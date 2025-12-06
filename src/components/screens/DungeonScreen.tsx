import { useState, useEffect } from 'react';
import { useCombatStore } from '../../stores/combatStore';
import { useDungeonStore } from '../../stores/dungeonStore';
import { useGameStore } from '../../stores/gameStore';
import { formatNumber } from '../../utils/numbers';
import { CombatView } from './AdventureScreen';
import './DungeonScreen.scss';

type ReadinessClass = 'ready' | 'caution' | 'danger';

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
): { level: ReadinessClass; className: string; text: string } {
  const dpsRatio = playerDPS / suggestedDPS;
  const hpRatio = playerHP / suggestedHP;
  const avgRatio = (dpsRatio + hpRatio) / 2;

  if (avgRatio >= 1.2) {
    return { level: 'ready', className: 'dungeon-screen__readiness-ready', text: 'READY' };
  }
  if (avgRatio >= 0.8) {
    return { level: 'caution', className: 'dungeon-screen__readiness-caution', text: 'CAUTION' };
  }
  return { level: 'danger', className: 'dungeon-screen__readiness-danger', text: 'DANGER' };
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

  const getBarClass = (value: number, target: number) => {
    if (value >= target) return 'dungeon-screen__progress-fill';
    if (value >= target * 0.8) return `${'dungeon-screen__progress-fill'} ${'dungeon-screen__progress-fill-warning'}`;
    return `${'dungeon-screen__progress-fill'} ${'dungeon-screen__progress-fill-danger'}`;
  };

  return (
    <div className={'dungeon-screen__overlay'}>
      <div className={'dungeon-screen__modal'}>
        {/* Header */}
        <div className={'dungeon-screen__modal-header'}>
          <div>
            <h2 className={'dungeon-screen__modal-title'}>{dungeon.name}</h2>
            <p className={'dungeon-screen__modal-subtitle'}>{dungeon.description}</p>
          </div>
          <button onClick={onClose} className={'dungeon-screen__close-button'} aria-label="Close preview">
            ×
          </button>
        </div>

        {/* Content */}
        <div className={'dungeon-screen__modal-body'}>
          {/* Boss Info */}
          <div className={`${'dungeon-screen__panel'} ${'dungeon-screen__panel-accent-red'}`}>
            <h3 className={'dungeon-screen__section-title'}>{dungeon.boss.name}</h3>

            <div className={'dungeon-screen__stats-grid'}>
              <div className={'dungeon-screen__stats-cell'}>
                <div className={'dungeon-screen__stats-label'}>HP</div>
                <div className={'dungeon-screen__stats-value'}>{formatNumber(dungeon.boss.hp)}</div>
              </div>
              <div className={'dungeon-screen__stats-cell'}>
                <div className={'dungeon-screen__stats-label'}>ATK</div>
                <div className={'dungeon-screen__stats-value'}>{formatNumber(dungeon.boss.atk)}</div>
              </div>
              <div className={'dungeon-screen__stats-cell'}>
                <div className={'dungeon-screen__stats-label'}>DEF</div>
                <div className={'dungeon-screen__stats-value'}>{formatNumber(dungeon.boss.def)}</div>
              </div>
            </div>

            {/* Boss Mechanics */}
            {dungeon.boss.mechanics && dungeon.boss.mechanics.length > 0 && (
              <div>
                <h4 className={'dungeon-screen__section-title'}>Boss Mechanics</h4>
                <div className={'dungeon-screen__mechanics-list'}>
                  {dungeon.boss.mechanics.map((mechanic, idx) => (
                    <div key={idx} className={'dungeon-screen__mechanic-card'}>
                      <div className={'dungeon-screen__mechanic-header'}>
                        <span className={'dungeon-screen__mechanic-title'}>{mechanic.description}</span>
                        <span className={'dungeon-screen__mechanic-meta'}>@ {mechanic.trigger.hpPercent}% HP</span>
                      </div>
                      <div className={'dungeon-screen__mechanic-body'}>
                        {mechanic.type === 'shield' && `Gains ${formatNumber(mechanic.effect.shieldAmount ?? 0)} shield`}
                        {mechanic.type === 'aura' && `Deals ${mechanic.effect.auraDamagePerSec} damage per second`}
                        {mechanic.type === 'enrage' && 'Increases attack power'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stat Comparison */}
          <div className={'dungeon-screen__panel'}>
            <h4 className={'dungeon-screen__section-title'}>Readiness Check</h4>

            <div className={'dungeon-screen__progress-group'}>
              <div className={'dungeon-screen__progress-label-row'}>
                <span>Attack Power</span>
                <span>
                  <span className={'dungeon-screen__stats-value'}>{formatNumber(playerDPS)}</span>{' '}
                  <span className={'dungeon-screen__stats-label'}>/ {formatNumber(dungeon.suggestedDPS)}</span>
                </span>
              </div>
              <div className={'dungeon-screen__progress-bar'}>
                <div
                  className={getBarClass(playerDPS, dungeon.suggestedDPS)}
                  style={{ width: `${Math.min(100, (playerDPS / dungeon.suggestedDPS) * 100)}%` }}
                />
              </div>
            </div>

            <div className={'dungeon-screen__progress-group'}>
              <div className={'dungeon-screen__progress-label-row'}>
                <span>Hit Points</span>
                <span>
                  <span className={'dungeon-screen__stats-value'}>{formatNumber(playerHP)}</span>{' '}
                  <span className={'dungeon-screen__stats-label'}>/ {formatNumber(dungeon.suggestedHP)}</span>
                </span>
              </div>
              <div className={'dungeon-screen__progress-bar'}>
                <div
                  className={getBarClass(playerHP, dungeon.suggestedHP)}
                  style={{ width: `${Math.min(100, (playerHP / dungeon.suggestedHP) * 100)}%` }}
                />
              </div>
            </div>

            <div className={'dungeon-screen__readiness-block'}>
              <div className={'dungeon-screen__readiness-label'}>Overall Readiness</div>
              <div className={`${'dungeon-screen__readiness-value'} ${readiness.className}`}>{readiness.text}</div>
            </div>
          </div>

          {/* Rewards */}
          <div className={'dungeon-screen__panel'}>
            <h4 className={'dungeon-screen__section-title'}>Rewards</h4>
            <div className={'dungeon-screen__reward-list'}>
              <div className={'dungeon-screen__reward-row'}>
                <span>Gold:</span>
                <span className={'dungeon-screen__reward-value'}>{formatNumber(dungeon.rewards.gold)}</span>
              </div>
              {dungeon.rewards.guaranteedDrop && (
                <div className={'dungeon-screen__reward-row'}>
                  <span>First Clear:</span>
                  <span className={'dungeon-screen__reward-value'}>{dungeon.rewards.guaranteedDrop.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={'dungeon-screen__footer-actions'}>
          <button onClick={onClose} className={'dungeon-screen__secondary-button'}>
            Cancel
          </button>
          <button onClick={onEnter} className={'dungeon-screen__danger-button'}>
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

  const badgeClass =
    readiness.level === 'ready'
      ? `${'dungeon-screen__badge'} ${'dungeon-screen__badge-ready'}`
      : readiness.level === 'caution'
        ? `${'dungeon-screen__badge'} ${'dungeon-screen__badge-caution'}`
        : `${'dungeon-screen__badge'} ${'dungeon-screen__badge-danger'}`;

  return (
    <>
      <div className={`${'dungeon-screen__dungeon-card'} ${isLocked ? 'dungeon-screen__button-disabled' : ''}`}>
        {/* Header */}
        <div className={'dungeon-screen__dungeon-header'}>
          <div>
            <h3 className={'dungeon-screen__dungeon-title'}>{dungeon.name}</h3>
            <div className={'dungeon-screen__dungeon-tier'}>Tier {dungeon.tier}</div>
          </div>

          {!isLocked && (
            <div className={'dungeon-screen__tag-row'}>
              {isFirstClear && <div className={'dungeon-screen__tag-purple'}>FIRST CLEAR</div>}
              {!isFirstClear && <div className={'dungeon-screen__tag-muted'}>Clears: {totalClears}</div>}
            </div>
          )}
        </div>

        <p className={'dungeon-screen__dungeon-description'}>{dungeon.description}</p>

        {isLocked ? (
          <div className={'dungeon-screen__readiness-danger'}>🔒 Requires Realm {dungeon.minRealm}</div>
        ) : (
          <div className={'dungeon-screen__mechanics-list'}>
            <div className={'dungeon-screen__readiness-row'}>
              <span className={'dungeon-screen__stats-label'}>Readiness:</span>
              <span className={badgeClass}>{readiness.text}</span>
            </div>

            <div className={'dungeon-screen__stats-label'}>
              Suggested ATK: {formatNumber(dungeon.suggestedDPS)}
            </div>
            <div className={'dungeon-screen__stats-label'}>
              Suggested HP: {formatNumber(dungeon.suggestedHP)}
            </div>

            <div className={'dungeon-screen__readiness-row'}>
              <span className={'dungeon-screen__stats-label'}>Boss:</span>
              <span className={'dungeon-screen__reward-value'}>{dungeon.boss.name}</span>
            </div>

            {isFirstClear && dungeon.rewards.guaranteedDrop && (
              <div className={'dungeon-screen__reward-panel'}>
                ✨ First Clear: <span className={'dungeon-screen__reward-highlight'}>{dungeon.rewards.guaranteedDrop.name}</span>
              </div>
            )}

            <div className={'dungeon-screen__card-actions'}>
              <button
                onClick={() => setShowPreview(true)}
                className={`${'dungeon-screen__action-primary'} ${isLocked ? 'dungeon-screen__button-disabled' : ''}`}
                disabled={isLocked}
              >
                Preview & Enter
              </button>
            </div>
          </div>
        )}
      </div>

      {showPreview && (
        <BossPreviewModal
          dungeon={dungeon}
          onClose={() => setShowPreview(false)}
          onEnter={handleEnterDungeon}
          playerStats={playerStats}
        />
      )}
    </>
  );
}

/**
 * Main Dungeon Screen Component
 */
export function DungeonScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dungeons, setDungeons] = useState<Dungeon[]>([]);
  const inCombat = useCombatStore((state) => state.inCombat);
  const currentDungeon = useCombatStore((state) => state.currentDungeon);
  const stats = useGameStore((state) => state.stats);

  useEffect(() => {
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

  // Show loading state
  if (loading) {
    return (
      <div className={'dungeon-screen__loading-card'}>
        <div className={'dungeon-screen__loading-icon'}>⚔️</div>
        <div className={'dungeon-screen__screen-subtitle'}>Loading dungeons...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={'dungeon-screen__error-card'}>
        <h2 className={'dungeon-screen__error-title'}>Error Loading Dungeons</h2>
        <p className={'dungeon-screen__error-message'}>{error}</p>
      </div>
    );
  }

  // Show combat view if in dungeon
  if (inCombat && currentDungeon) {
    const dungeon = dungeons.find((d) => d.id === currentDungeon);
    return (
      <div className={'dungeon-screen__screen-root'}>
        <div className={'dungeon-screen__screen-background'} />
        <div className={'dungeon-screen__screen-content'}>
          <div className={'dungeon-screen__screen-header'}>
            <div className={'dungeon-screen__tag-purple'}>🏛️ DUNGEON TRIAL</div>
            <h1 className={'dungeon-screen__screen-title'}>{dungeon?.name || 'Dungeon Trial'}</h1>
            <p className={'dungeon-screen__screen-subtitle'}>
              Defeat <span className={'dungeon-screen__readiness-danger'}>{dungeon?.boss.name}</span> to claim your rewards
            </p>
          </div>

          <div className={'dungeon-screen__panel'}>
            <CombatView />
          </div>
        </div>
      </div>
    );
  }

  // Show dungeon selection grid
  return (
    <div className={'dungeon-screen__screen-root'}>
      <div className={'dungeon-screen__screen-background'} />
      <div className={'dungeon-screen__screen-content'}>
        <div className={'dungeon-screen__screen-header'}>
          <h1 className={'dungeon-screen__screen-title'}>Trial Dungeons</h1>
          <p className={'dungeon-screen__screen-subtitle'}>Challenge powerful bosses to obtain breakthrough materials</p>
        </div>

        {dungeons.length === 0 ? (
          <div className={'dungeon-screen__empty-card'}>No dungeons available</div>
        ) : (
          <div className={'dungeon-screen__dungeon-grid'}>
            {dungeons.map((dungeon) => (
              <DungeonCard key={dungeon.id} dungeon={dungeon} playerStats={stats} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
