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
    return { level: 'ready', className: 'dungeonScreenReadinessReady', text: 'READY' };
  }
  if (avgRatio >= 0.8) {
    return { level: 'caution', className: 'dungeonScreenReadinessCaution', text: 'CAUTION' };
  }
  return { level: 'danger', className: 'dungeonScreenReadinessDanger', text: 'DANGER' };
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
    if (value >= target) return 'dungeonScreenProgressFill';
    if (value >= target * 0.8) return `${'dungeonScreenProgressFill'} ${'dungeonScreenProgressFillWarning'}`;
    return `${'dungeonScreenProgressFill'} ${'dungeonScreenProgressFillDanger'}`;
  };

  return (
    <div className={'dungeonScreenOverlay'}>
      <div className={'dungeonScreenModal'}>
        {/* Header */}
        <div className={'dungeonScreenModalHeader'}>
          <div>
            <h2 className={'dungeonScreenModalTitle'}>{dungeon.name}</h2>
            <p className={'dungeonScreenModalSubtitle'}>{dungeon.description}</p>
          </div>
          <button onClick={onClose} className={'dungeonScreenCloseButton'} aria-label="Close preview">
            ×
          </button>
        </div>

        {/* Content */}
        <div className={'dungeonScreenModalBody'}>
          {/* Boss Info */}
          <div className={`${'dungeonScreenPanel'} ${'dungeonScreenPanelAccentRed'}`}>
            <h3 className={'dungeonScreenSectionTitle'}>{dungeon.boss.name}</h3>

            <div className={'dungeonScreenStatsGrid'}>
              <div className={'dungeonScreenStatsCell'}>
                <div className={'dungeonScreenStatsLabel'}>HP</div>
                <div className={'dungeonScreenStatsValue'}>{formatNumber(dungeon.boss.hp)}</div>
              </div>
              <div className={'dungeonScreenStatsCell'}>
                <div className={'dungeonScreenStatsLabel'}>ATK</div>
                <div className={'dungeonScreenStatsValue'}>{formatNumber(dungeon.boss.atk)}</div>
              </div>
              <div className={'dungeonScreenStatsCell'}>
                <div className={'dungeonScreenStatsLabel'}>DEF</div>
                <div className={'dungeonScreenStatsValue'}>{formatNumber(dungeon.boss.def)}</div>
              </div>
            </div>

            {/* Boss Mechanics */}
            {dungeon.boss.mechanics && dungeon.boss.mechanics.length > 0 && (
              <div>
                <h4 className={'dungeonScreenSectionTitle'}>Boss Mechanics</h4>
                <div className={'dungeonScreenMechanicsList'}>
                  {dungeon.boss.mechanics.map((mechanic, idx) => (
                    <div key={idx} className={'dungeonScreenMechanicCard'}>
                      <div className={'dungeonScreenMechanicHeader'}>
                        <span className={'dungeonScreenMechanicTitle'}>{mechanic.description}</span>
                        <span className={'dungeonScreenMechanicMeta'}>@ {mechanic.trigger.hpPercent}% HP</span>
                      </div>
                      <div className={'dungeonScreenMechanicBody'}>
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
          <div className={'dungeonScreenPanel'}>
            <h4 className={'dungeonScreenSectionTitle'}>Readiness Check</h4>

            <div className={'dungeonScreenProgressGroup'}>
              <div className={'dungeonScreenProgressLabelRow'}>
                <span>Attack Power</span>
                <span>
                  <span className={'dungeonScreenStatsValue'}>{formatNumber(playerDPS)}</span>{' '}
                  <span className={'dungeonScreenStatsLabel'}>/ {formatNumber(dungeon.suggestedDPS)}</span>
                </span>
              </div>
              <div className={'dungeonScreenProgressBar'}>
                <div
                  className={getBarClass(playerDPS, dungeon.suggestedDPS)}
                  style={{ width: `${Math.min(100, (playerDPS / dungeon.suggestedDPS) * 100)}%` }}
                />
              </div>
            </div>

            <div className={'dungeonScreenProgressGroup'}>
              <div className={'dungeonScreenProgressLabelRow'}>
                <span>Hit Points</span>
                <span>
                  <span className={'dungeonScreenStatsValue'}>{formatNumber(playerHP)}</span>{' '}
                  <span className={'dungeonScreenStatsLabel'}>/ {formatNumber(dungeon.suggestedHP)}</span>
                </span>
              </div>
              <div className={'dungeonScreenProgressBar'}>
                <div
                  className={getBarClass(playerHP, dungeon.suggestedHP)}
                  style={{ width: `${Math.min(100, (playerHP / dungeon.suggestedHP) * 100)}%` }}
                />
              </div>
            </div>

            <div className={'dungeonScreenReadinessBlock'}>
              <div className={'dungeonScreenReadinessLabel'}>Overall Readiness</div>
              <div className={`${'dungeonScreenReadinessValue'} ${readiness.className}`}>{readiness.text}</div>
            </div>
          </div>

          {/* Rewards */}
          <div className={'dungeonScreenPanel'}>
            <h4 className={'dungeonScreenSectionTitle'}>Rewards</h4>
            <div className={'dungeonScreenRewardList'}>
              <div className={'dungeonScreenRewardRow'}>
                <span>Gold:</span>
                <span className={'dungeonScreenRewardValue'}>{formatNumber(dungeon.rewards.gold)}</span>
              </div>
              {dungeon.rewards.guaranteedDrop && (
                <div className={'dungeonScreenRewardRow'}>
                  <span>First Clear:</span>
                  <span className={'dungeonScreenRewardValue'}>{dungeon.rewards.guaranteedDrop.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={'dungeonScreenFooterActions'}>
          <button onClick={onClose} className={'dungeonScreenSecondaryButton'}>
            Cancel
          </button>
          <button onClick={onEnter} className={'dungeonScreenDangerButton'}>
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
      ? `${'dungeonScreenBadge'} ${'dungeonScreenBadgeReady'}`
      : readiness.level === 'caution'
        ? `${'dungeonScreenBadge'} ${'dungeonScreenBadgeCaution'}`
        : `${'dungeonScreenBadge'} ${'dungeonScreenBadgeDanger'}`;

  return (
    <>
      <div className={`${'dungeonScreenDungeonCard'} ${isLocked ? 'dungeonScreenButtonDisabled' : ''}`}>
        {/* Header */}
        <div className={'dungeonScreenDungeonHeader'}>
          <div>
            <h3 className={'dungeonScreenDungeonTitle'}>{dungeon.name}</h3>
            <div className={'dungeonScreenDungeonTier'}>Tier {dungeon.tier}</div>
          </div>

          {!isLocked && (
            <div className={'dungeonScreenTagRow'}>
              {isFirstClear && <div className={'dungeonScreenTagPurple'}>FIRST CLEAR</div>}
              {!isFirstClear && <div className={'dungeonScreenTagMuted'}>Clears: {totalClears}</div>}
            </div>
          )}
        </div>

        <p className={'dungeonScreenDungeonDescription'}>{dungeon.description}</p>

        {isLocked ? (
          <div className={'dungeonScreenReadinessDanger'}>🔒 Requires Realm {dungeon.minRealm}</div>
        ) : (
          <div className={'dungeonScreenMechanicsList'}>
            <div className={'dungeonScreenReadinessRow'}>
              <span className={'dungeonScreenStatsLabel'}>Readiness:</span>
              <span className={badgeClass}>{readiness.text}</span>
            </div>

            <div className={'dungeonScreenStatsLabel'}>
              Suggested ATK: {formatNumber(dungeon.suggestedDPS)}
            </div>
            <div className={'dungeonScreenStatsLabel'}>
              Suggested HP: {formatNumber(dungeon.suggestedHP)}
            </div>

            <div className={'dungeonScreenReadinessRow'}>
              <span className={'dungeonScreenStatsLabel'}>Boss:</span>
              <span className={'dungeonScreenRewardValue'}>{dungeon.boss.name}</span>
            </div>

            {isFirstClear && dungeon.rewards.guaranteedDrop && (
              <div className={'dungeonScreenRewardPanel'}>
                ✨ First Clear: <span className={'dungeonScreenRewardHighlight'}>{dungeon.rewards.guaranteedDrop.name}</span>
              </div>
            )}

            <div className={'dungeonScreenCardActions'}>
              <button
                onClick={() => setShowPreview(true)}
                className={`${'dungeonScreenActionPrimary'} ${isLocked ? 'dungeonScreenButtonDisabled' : ''}`}
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
      <div className={'dungeonScreenLoadingCard'}>
        <div className={'dungeonScreenLoadingIcon'}>⚔️</div>
        <div className={'dungeonScreenScreenSubtitle'}>Loading dungeons...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={'dungeonScreenErrorCard'}>
        <h2 className={'dungeonScreenErrorTitle'}>Error Loading Dungeons</h2>
        <p className={'dungeonScreenErrorMessage'}>{error}</p>
      </div>
    );
  }

  // Show combat view if in dungeon
  if (inCombat && currentDungeon) {
    const dungeon = dungeons.find((d) => d.id === currentDungeon);
    return (
      <div className={'dungeonScreenScreenRoot'}>
        <div className={'dungeonScreenScreenBackground'} />
        <div className={'dungeonScreenScreenContent'}>
          <div className={'dungeonScreenScreenHeader'}>
            <div className={'dungeonScreenTagPurple'}>🏛️ DUNGEON TRIAL</div>
            <h1 className={'dungeonScreenScreenTitle'}>{dungeon?.name || 'Dungeon Trial'}</h1>
            <p className={'dungeonScreenScreenSubtitle'}>
              Defeat <span className={'dungeonScreenReadinessDanger'}>{dungeon?.boss.name}</span> to claim your rewards
            </p>
          </div>

          <div className={'dungeonScreenPanel'}>
            <CombatView />
          </div>
        </div>
      </div>
    );
  }

  // Show dungeon selection grid
  return (
    <div className={'dungeonScreenScreenRoot'}>
      <div className={'dungeonScreenScreenBackground'} />
      <div className={'dungeonScreenScreenContent'}>
        <div className={'dungeonScreenScreenHeader'}>
          <h1 className={'dungeonScreenScreenTitle'}>Trial Dungeons</h1>
          <p className={'dungeonScreenScreenSubtitle'}>Challenge powerful bosses to obtain breakthrough materials</p>
        </div>

        {dungeons.length === 0 ? (
          <div className={'dungeonScreenEmptyCard'}>No dungeons available</div>
        ) : (
          <div className={'dungeonScreenDungeonGrid'}>
            {dungeons.map((dungeon) => (
              <DungeonCard key={dungeon.id} dungeon={dungeon} playerStats={stats} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
