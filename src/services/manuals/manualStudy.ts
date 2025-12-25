import { GameEvents } from '../events/GameEvents';
import { useManualSatchelStore } from '../../stores/manualSatchelStore';
import { useTechCollectionStore, normalizeGrade, normalizeRarity } from '../../stores/techCollectionStore';
import type { ManualGrade, ManualRarity } from '../../features/manuals/pavilionStockTypes';

export function studyManualFromSatchel({
  satchelKey,
  manualId,
  techId,
  grade,
  rarity,
}: {
  satchelKey: string;
  manualId: string;
  techId: string;
  grade: ManualGrade;
  rarity: ManualRarity;
}): { ok: boolean; reason?: string } {
  const satchel = useManualSatchelStore.getState();
  const collection = useTechCollectionStore.getState();
  const qty = satchel.getQty(satchelKey);
  if (qty <= 0) {
    return { ok: false, reason: 'no_manual_available' };
  }

  satchel.removeManual(satchelKey, 1);
  const normalizedGrade = normalizeGrade(grade);
  const normalizedRarity = normalizeRarity(rarity);

  if (!collection.hasTech(techId)) {
    collection.unlockTech(techId, { manualGrade: normalizedGrade, rarity: normalizedRarity });
  } else {
    collection.setManualGrade(techId, normalizedGrade);
    collection.setRarityIfHigher(techId, normalizedRarity);
  }

  GameEvents.emit({ type: 'manuals/studied', payload: { manualId, progress: 1 } });

  return { ok: true };
}
