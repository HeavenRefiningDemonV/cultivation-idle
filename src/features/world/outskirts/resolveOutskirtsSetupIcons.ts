import type { OutskirtsLabeledValue, OutskirtsSetupCard } from './types.js';

const PRIMARY_ROW_ICONS: Record<'loadoutSet' | 'aiProfile' | 'attackFocus', string> = {
  loadoutSet: '/assets/icons/foundationpill.png',
  aiProfile: '/assets/icons/book_martial.png',
  attackFocus: '/assets/icons/rustysword.png',
};

const STAT_ROW_ICONS: Record<string, string> = {
  atk: '/assets/icons/rustysword.png',
  acc: '/assets/icons/book_heaven.png',
  crit: '/assets/icons/dust_purple.png',
  hp: '/assets/icons/foundationpill.png',
  eva: '/assets/icons/spiritgrass.png',
  res: '/assets/icons/prayerbeads.png',
  medicinePouch: '/assets/icons/herbbundle.png',
};

const EQUIPMENT_SLOT_ICONS: Record<OutskirtsSetupCard['equipmentGrid'][number]['slotId'], string> = {
  weapon: '/assets/icons/rustysword.png',
  armor: '/assets/icons/book_earth.png',
  ring: '/assets/icons/placeholder_ring_large.png',
  talisman: '/assets/icons/prayerbeads.png',
  boots: '/assets/icons/metalchunk.png',
  charm: '/assets/icons/ancientseed.png',
};

const EMPTY_SLOT_ICON = '/assets/icons/placeholder_ring_small.png';

export function resolveSetupPrimaryRowIcon(id: 'loadoutSet' | 'aiProfile' | 'attackFocus'): string {
  return PRIMARY_ROW_ICONS[id];
}

export function resolveSetupStatIcon(row: OutskirtsLabeledValue): string {
  return STAT_ROW_ICONS[row.id] ?? '/assets/icons/spiritgrass.png';
}

export function resolveEquipmentSlotIcon(slot: OutskirtsSetupCard['equipmentGrid'][number]): string {
  if (slot.value === '—' || slot.value.trim().length === 0) return EMPTY_SLOT_ICON;
  return EQUIPMENT_SLOT_ICONS[slot.slotId];
}
