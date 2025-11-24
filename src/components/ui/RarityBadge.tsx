import { images } from '../../assets/images';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'uncommon' | 'mythic';

export type RarityBadgeProps = {
  rarity: Rarity;
  useRings?: boolean;
};

export function RarityBadge({ rarity, useRings = false }: RarityBadgeProps) {
  const iconMap: Record<Exclude<Rarity, 'uncommon' | 'mythic'>, string> = {
    common: useRings ? images.rarity.commonRingGroup : images.rarity.common,
    rare: useRings ? images.rarity.rareRingGroup : images.rarity.rare,
    epic: useRings ? images.rarity.epicRingGroup : images.rarity.epic,
    legendary: useRings ? images.rarity.legendaryRingGroup : images.rarity.legendary,
  };

  const normalized: Exclude<Rarity, 'uncommon' | 'mythic'> =
    rarity === 'legendary' || rarity === 'epic' || rarity === 'rare' || rarity === 'common'
      ? rarity
      : rarity === 'mythic'
        ? 'legendary'
        : 'common';

  const icon = iconMap[normalized];

  return (
    <span className="inline-flex w-5 h-5 items-center justify-center">
      <img src={icon} alt={`${normalized} rarity`} className="w-full h-full object-contain" />
    </span>
  );
}
