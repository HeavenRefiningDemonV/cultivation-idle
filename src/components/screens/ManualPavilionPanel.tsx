import { useMemo, useState } from 'react';
import type { PavilionDef, PavilionPoolEntry, TechniqueDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useGameStore } from '../../stores/gameStore';
import { useTechCollectionStore } from '../../stores/techCollectionStore';
import type { LifePath } from '../../types';
import { weightedPick } from '../../utils/weightedPick';
import { resolvePavilionPool } from '../../utils/techResolver';
import { TechniquesPanel } from '../TechniquesPanel';

interface ManualPavilionPanelProps {
  pavilionId: string | null;
}

interface LastResultState {
  techId: string;
  status: 'new' | 'duplicate';
  fragmentsGained: number;
}

const DEFAULT_COST: Record<'gold' | 'spiritStones' | 'merit', string | undefined> = {
  gold: '250',
  spiritStones: undefined,
  merit: undefined,
};
const PATHS: LifePath[] = ['heaven', 'earth', 'martial'];

function normalizeCost(cost?: PavilionDef['cost']): Record<'gold' | 'spiritStones' | 'merit', string | undefined> {
  if (!cost) return DEFAULT_COST;
  const normalized: Record<'gold' | 'spiritStones' | 'merit', string | undefined> = {
    gold: undefined,
    spiritStones: undefined,
    merit: undefined,
  };
  (['gold', 'spiritStones', 'merit'] as const).forEach((key) => {
    const value = (cost as any)[key];
    if (value !== undefined && value !== null) {
      normalized[key] = typeof value === 'number' ? value.toString() : String(value);
    }
  });
  return normalized.gold || normalized.spiritStones || normalized.merit ? normalized : DEFAULT_COST;
}

function describePool(entries: { technique?: TechniqueDef; techId: string }[]) {
  if (entries.length === 0) return 'No techniques configured';
  const names = entries
    .slice(0, 3)
    .map((entry) => entry.technique?.name ?? entry.techId)
    .join(', ');
  const more = entries.length > 3 ? ` +${entries.length - 3} more` : '';
  return `${entries.length} techniques (${names}${more})`;
}

export function ManualPavilionPanel({ pavilionId }: ManualPavilionPanelProps) {
  const pavilion = useContentStore((state) => (pavilionId ? state.maps.pavilionsById[pavilionId] : undefined));
  const lifePath = useGameStore((state) => state.lifePath);
  const spendCurrencies = useInventoryStore((state) => state.spendCurrencies);
  const canAffordCurrency = useInventoryStore((state) => state.canAffordCurrency);
  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const fragments = useTechCollectionStore((state) => state.fragments);
  const hasTech = useTechCollectionStore((state) => state.hasTech);
  const unlockTech = useTechCollectionStore((state) => state.unlockTech);
  const addFragments = useTechCollectionStore((state) => state.addFragments);
  const [lastResult, setLastResult] = useState<LastResultState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poolsByPath = useMemo(() => {
    const poolEntries: Record<LifePath, { techId: string; technique?: TechniqueDef; entry: PavilionPoolEntry }[]> = {
      heaven: [],
      earth: [],
      martial: [],
    };
    if (!pavilion) return poolEntries;

    PATHS.forEach((path) => {
      const resolved = resolvePavilionPool(pavilion.poolByPath?.[path] ?? [], path);
      poolEntries[path] = resolved;
    });
    return poolEntries;
  }, [pavilion]);

  const selectedPool = lifePath ? poolsByPath[lifePath] ?? [] : [];
  const cost = normalizeCost(pavilion?.cost);

  const handleBuy = () => {
    setError(null);
    if (!pavilionId || !pavilion) {
      setError('Pavilion data missing.');
      return;
    }
    if (!lifePath) {
      setError('Choose a path in the Meditation Hall first.');
      return;
    }

    const pool = selectedPool;
    if (!pool || pool.length === 0) {
      setError('No valid techniques configured for this pavilion/path.');
      return;
    }

    if (!canAffordCurrency(cost)) {
      setError('Not enough currency.');
      return;
    }

    const picked = weightedPick(pool.map((entry) => ({ value: entry, weight: typeof entry.entry === 'string' ? 1 : entry.entry.weight })));
    if (!picked) {
      setError('Failed to roll a technique.');
      return;
    }

    const succeeded = spendCurrencies(cost);
    if (!succeeded) {
      setError('Unable to spend currency.');
      return;
    }

    const resolvedTech = picked.techId;
    const meta = typeof picked.entry === 'string' ? undefined : picked.entry;
    if (!hasTech(resolvedTech)) {
      unlockTech(resolvedTech, { rarity: meta?.rarity, tier: meta?.tier });
      setLastResult({ techId: resolvedTech, status: 'new', fragmentsGained: 0 });
      return;
    }

    const fragmentValue =
      (pavilion.duplicateFragmentValue ?? (typeof meta?.fragmentValue === 'number' ? meta.fragmentValue : undefined)) ?? 20;
    addFragments(resolvedTech, fragmentValue);
    setLastResult({ techId: resolvedTech, status: 'duplicate', fragmentsGained: fragmentValue });
  };

  const content = useContentStore.getState();
  const getTechniqueName = (techId: string) => content.maps.techniquesById[techId]?.name ?? techId;

  if (!pavilionId) {
    return (
      <>
        <div className={'worldScreenPlaceholder'}>No pavilion in this city.</div>
        <TechniquesPanel />
      </>
    );
  }

  if (!pavilion) {
    return (
      <>
        <div className={'worldScreenPlaceholder'}>
          Pavilion data missing (pavilionId={pavilionId}).
        </div>
        <TechniquesPanel />
      </>
    );
  }

  return (
    <>
      <div className={'worldScreenPlaceholder'}>
        <div className={'worldScreenPlaceholderHeader'}>
          <div className={'worldScreenPlaceholderTitle'}>{pavilion.id.replace(/_/g, ' ') || 'Manual Pavilion'}</div>
          <div className={'worldScreenPlaceholderKey'}>manualPavilion</div>
        </div>
        <div className={'worldScreenPlaceholderBody'}>
          <div className={'worldScreenPlaceholderLine'}>
            Path: {lifePath ? lifePath.toUpperCase() : 'Choose a Path in Meditation Hall'}
          </div>
          {PATHS.map((path) => (
            <div
              key={path}
              className={`worldScreenPlaceholderLine ${lifePath === path ? 'worldScreenHighlight' : ''}`}
            >
              {path.toUpperCase()}: {describePool(poolsByPath[path])}
            </div>
          ))}
          <div className={'worldScreenPlaceholderLine'}>
            Cost: {[cost.gold ? `${cost.gold} Gold` : null, cost.spiritStones ? `${cost.spiritStones} Spirit Stones` : null]
              .filter(Boolean)
              .join(' / ') || 'Free'}
          </div>
        </div>
        <div className={'worldScreenPlaceholderActions'}>
          <button
            className={'worldScreenModuleButton worldScreenModuleButton--active'}
            onClick={handleBuy}
            disabled={!lifePath || !canAffordCurrency(cost)}
          >
            Buy Manual
          </button>
          {!lifePath && <div className={'worldScreenInlineError'}>Choose a path to buy manuals.</div>}
          {error && <div className={'worldScreenInlineError'}>{error}</div>}
        </div>
        {lastResult && (
          <div className={'worldScreenPlaceholderBody'}>
            <div className={'worldScreenPlaceholderLine'}>
              Last Result: {getTechniqueName(lastResult.techId)} ({lastResult.status === 'new' ? 'New' : 'Duplicate'})
            </div>
            {lastResult.status === 'duplicate' && (
              <div className={'worldScreenPlaceholderLine'}>
                Fragments gained: {lastResult.fragmentsGained} • Total fragments: {fragments[lastResult.techId] ?? 0}
              </div>
            )}
          </div>
        )}
        <div className={'worldScreenPlaceholderBody'}>
          <div className={'worldScreenPlaceholderLine'}>Unlocked techniques:</div>
          {Object.keys(unlockedTechs).length === 0 && <div className={'worldScreenPlaceholderLine'}>None yet.</div>}
          {Object.entries(unlockedTechs).map(([techId]) => (
            <div key={techId} className={'worldScreenPlaceholderLine'}>
              {getTechniqueName(techId)} ({techId}) • Fragments: {fragments[techId] ?? 0}
            </div>
          ))}
        </div>
      </div>
      <TechniquesPanel />
    </>
  );
}
