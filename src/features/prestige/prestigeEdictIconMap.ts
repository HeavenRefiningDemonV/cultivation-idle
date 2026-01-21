import {
  BookOpen,
  Bot,
  CircleHelp,
  Cog,
  Grid2X2,
  Hammer,
  KeyRound,
  ListPlus,
  Percent,
  ScrollText,
  Sparkles,
  Swords,
  TrendingUp,
  Unlock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PrestigeCategoryKey } from './prestigeCategories';

export type PrestigeEdictKind =
  | 'multiplier'
  | 'unlock'
  | 'slot'
  | 'discount'
  | 'automation'
  | 'queue'
  | 'misc';

type IconMeta = {
  Icon: LucideIcon;
  label: string;
};

const CATEGORY_ICON_MAP: Record<PrestigeCategoryKey, IconMeta> = {
  laws: { Icon: ScrollText, label: 'Heavenly Laws' },
  combat: { Icon: Swords, label: 'Combat' },
  techniques: { Icon: Sparkles, label: 'Techniques' },
  crafting: { Icon: Hammer, label: 'Crafting' },
  automation: { Icon: Cog, label: 'Automation' },
  unlocks: { Icon: KeyRound, label: 'Unlocks' },
  misc: { Icon: CircleHelp, label: 'Miscellaneous' },
};

const KIND_ICON_MAP: Record<PrestigeEdictKind, IconMeta> = {
  multiplier: { Icon: TrendingUp, label: 'Multiplier' },
  unlock: { Icon: Unlock, label: 'Unlock' },
  slot: { Icon: Grid2X2, label: 'Slot' },
  discount: { Icon: Percent, label: 'Discount' },
  automation: { Icon: Bot, label: 'Automation' },
  queue: { Icon: ListPlus, label: 'Queue' },
  misc: { Icon: CircleHelp, label: 'Miscellaneous' },
};

export function getPrestigeEdictKind(upgradeId: string): PrestigeEdictKind {
  if (upgradeId.includes('slot')) return 'slot';
  if (upgradeId.includes('discount')) return 'discount';
  if (upgradeId.includes('queue')) return 'queue';
  if (upgradeId.includes('auto') || upgradeId.includes('loot_filter')) return 'automation';
  if (upgradeId.includes('unlock')) return 'unlock';
  if (
    upgradeId.includes('mult') ||
    upgradeId.includes('gain') ||
    upgradeId.includes('retention') ||
    upgradeId.includes('efficiency')
  ) {
    return 'multiplier';
  }
  return 'misc';
}

export function getPrestigeCategoryIcon(category: PrestigeCategoryKey): IconMeta {
  return CATEGORY_ICON_MAP[category] ?? { Icon: BookOpen, label: 'Decree' };
}

export function getPrestigeKindIcon(kind: PrestigeEdictKind): IconMeta {
  return KIND_ICON_MAP[kind] ?? { Icon: CircleHelp, label: 'Unknown' };
}
