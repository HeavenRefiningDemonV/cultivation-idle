import { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useCombatStore } from '../../stores/combatStore';
import { useZoneStore } from '../../stores/zoneStore';
import { useUIStore } from '../../stores/uiStore';
import { formatNumber, formatPercentFromValue } from '../../utils/numbers';
import { REALMS } from '../../constants';
import { SpiritRootDisplay } from '../SpiritRootDisplay';
import { StatusSummaryHeader } from '../../ui/status/StatusSummaryHeader';
import { CombatStatTile } from '../../ui/status/CombatStatTile';
import type { IconId } from '../../ui/icons';
import { GameIcon } from '../../ui/icons';
import {
  Crosshair,
  Droplets,
  Footprints,
  Heart,
  Shield,
  Sparkles,
  Sword,
} from 'lucide-react';
import './StatusScreen.scss';
import '../../ui/status/StatusSummaryHeader.scss';
import '../../ui/status/CombatStatTile.scss';

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
  gold: 'statusScreenStatGold',
  qi: 'statusScreenStatQi',
  green: 'statusScreenStatGreen',
  red: 'statusScreenStatRed',
  blue: 'statusScreenStatBlue',
  yellow: 'statusScreenStatYellow',
  cyan: 'statusScreenStatCyan',
  pink: 'statusScreenStatPink',
  muted: 'statusScreenStatMuted',
  none: '',
};

/**
 * Stat Row Component for displaying key-value pairs
 */
function StatRow({ label, value, tone = 'muted' }: { label: string; value: string | number; tone?: StatTone }) {
  const toneClass = toneClassMap[tone];

  return (
    <div className={'statusScreenStatRow'}>
      <span className={'statusScreenStatLabel'}>{label}</span>
      <span className={`${'statusScreenStatValue'} ${toneClass}`}>{value}</span>
    </div>
  );
}

/**
 * Section Header Component
 */
function SectionHeader({ icon, title }: { icon: IconId; title: string }) {
  return (
    <div className={'statusScreenSectionHeader'}>
      <span className={'statusScreenSectionIcon'}>
        <GameIcon icon={icon} size={16} decorative />
      </span>
      <h2 className={'statusScreenSectionTitle'}>{title}</h2>
    </div>
  );
}

/**
 * Stat Card Component (for grouped stats)
 */
type StatCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

function StatCard({ title, children, className = '' }: StatCardProps) {
  return (
    <div className={`statusScreenStatCard statusScreenCardBase ${className}`}>
      <h3 className={'statusScreenStatCardTitle'}>{title}</h3>
      <div className={'statusScreenStatList'}>{children}</div>
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
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);

  // Inventory Store
  const gold = useInventoryStore((state) => state.gold);
  const items = useInventoryStore((state) => state.items);

  // Combat Store (for statistics)
  const combatLog = useCombatStore((state) => state.combatLog);

  // Zone Store
  const getTotalEnemiesDefeated = useZoneStore((state) => state.getTotalEnemiesDefeated);

  // Calculate some derived stats
  const currentRealm = REALMS[realm.index];
  const totalEnemiesDefeated = getTotalEnemiesDefeated('all');
  const realmName = currentRealm.name;
  const stageText = `Stage ${realm.substage}/${currentRealm.substages}`;
  const qiText = formatNumber(qi);
  const qiPerSecondText = `${formatNumber(qiPerSecond)}/s`;
  const focusModeText = focusMode.toUpperCase();
  const totalAurasText = formatNumber(totalAuras);
  const hasQiFlow = qiPerSecond > 0;

  useEffect(() => {
    setHeaderTitles('Character Status', 'View your cultivation progress and combat statistics');
  }, [setHeaderTitles]);

  return (
    <div className={'statusScreenRoot'}>
      {/* Main Content */}
      <div className={'statusScreenContent'}>
        <StatusSummaryHeader
          realmName={realmName}
          realmIndex={realm.index}
          stageText={stageText}
          qiText={qiText}
          qiPerSecondText={qiPerSecondText}
          focusModeText={focusModeText}
          totalAurasText={totalAurasText}
          hasQiFlow={hasQiFlow}
        />
        {/* Main Grid Layout */}
        <div className={'statusScreenGrid'}>
          {/* LEFT COLUMN */}
          <div className={'statusScreenColumn'}>
            {/* Cultivation Progress Section */}
            <div className={'statusScreenPanel statusScreenCardBase'}>
              <SectionHeader icon="inkBolt" title="Cultivation Progress" />

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
              <div className="combatStatTilesGrid">
                <CombatStatTile
                  label="Max HP"
                  value={formatNumber(stats.hp)}
                  icon={<Heart size={16} />}
                  tone="hp"
                  pulseKey={stats.hp}
                />
                <CombatStatTile
                  label="Attack Power"
                  value={formatNumber(stats.atk)}
                  icon={<Sword size={16} />}
                  tone="offense"
                  pulseKey={stats.atk}
                />
                <CombatStatTile
                  label="Defense"
                  value={formatNumber(stats.def)}
                  icon={<Shield size={16} />}
                  tone="defense"
                  pulseKey={stats.def}
                />
                <CombatStatTile
                  label="HP Regen/s"
                  value={formatNumber(stats.regen)}
                  icon={<Droplets size={16} />}
                  tone="recovery"
                />
                <CombatStatTile
                  label="Critical Rate"
                  value={formatPercentFromValue(stats.crit)}
                  icon={<Crosshair size={16} />}
                  tone="crit"
                />
                <CombatStatTile
                  label="Critical Damage"
                  value={formatPercentFromValue(stats.critDmg, 0)}
                  icon={<Sparkles size={16} />}
                  tone="crit"
                />
                <CombatStatTile
                  label="Dodge Chance"
                  value={formatPercentFromValue(stats.dodge)}
                  icon={<Footprints size={16} />}
                  tone="evasion"
                />
                <CombatStatTile
                  label="Total Enemies Defeated"
                  value={formatNumber(totalEnemiesDefeated)}
                  icon={<Sword size={16} />}
                  tone="neutral"
                />
              </div>
            </StatCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className={'statusScreenColumn'}>
            {/* Spirit Root Display */}
            <SpiritRootDisplay />

            {/* Resources */}
            <StatCard title="Resources">
              <StatRow label="Gold" value={formatNumber(gold)} tone="gold" />
              <StatRow label="Inventory Items" value={Object.keys(items).length} tone="muted" />
            </StatCard>

            {/* Additional Info */}
            <StatCard title="Miscellaneous" className="statusScreenMiscPanel">
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
  );
}
