import InventoryScreen from './InventoryScreen.js';
import { PanoplyScreenOwner } from '../../features/equipment/panoply/index.js';
import { resolvePanoplyFlag } from '../../features/equipment/panoply/panoplyFlag.js';

/**
 * M.III.3 EQ-PORT — additive, preserve-first screen-swap for the Equipment tab. The live Panoply/Vault
 * surface is flag-gated (public default OFF). Dev/QA reach it via `?panoply=live|fixture`; the legacy
 * `InventoryScreen` stays the default and is reachable via `?panoply=legacy|off`. No cutover here.
 * Mirrors `CultivateScreen` (Seat vs legacy).
 */
export default function EquipmentScreen() {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const panoply = resolvePanoplyFlag(search);
  if (panoply.enabled) {
    return <PanoplyScreenOwner mode={panoply.mode} fixtureId={panoply.fixtureId} initialSurface={panoply.surface} />;
  }
  return <InventoryScreen />;
}
