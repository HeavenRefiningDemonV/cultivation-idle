import { useContentStore } from '../stores/contentStore.js';
import type { RewardBundle } from '../services/rewards.js';

const clampQty = (value: number, fallback: number): number => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.floor(value);
};

const MANUAL_GRADE = 'mortal' as const;
const MANUAL_RARITY = 'common' as const;

export function buildMegaRewardBundle(): RewardBundle {
  const content = useContentStore.getState();
  const items = Object.values(content.maps.itemsById ?? {});
  const techniques = Object.values(content.maps.techniquesById ?? {});

  const itemsBundle = items
    .filter((item) => item?.id)
    .map((item) => {
      const qty = item.category === 'consumable' ? 200 : 1000;
      return { itemId: item.id, qty: clampQty(qty, 1) };
    });

  const manuals = techniques
    .filter((tech) => tech?.id)
    .map((tech) => ({
      manualId: `${tech.id}:${MANUAL_GRADE}:${MANUAL_RARITY}:manual`,
      techId: tech.id,
      grade: MANUAL_GRADE,
      rarity: MANUAL_RARITY,
      qty: 5,
    }));

  const techniqueFragments = techniques
    .filter((tech) => tech?.id)
    .map((tech) => ({ techId: tech.id, qty: 5000 }));

  return {
    currencies: {
      gold: '1000000',
      spiritStones: '100000',
      merit: '50000',
    },
    items: itemsBundle,
    manuals,
    techniqueFragments,
  };
}
