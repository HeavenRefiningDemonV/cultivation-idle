import { useEffect } from 'react';
import InventoryScreen from './InventoryScreen.js';
import { PanoplyScreenOwner } from '../../features/equipment/panoply/index.js';
import { resolvePanoplyFlag } from '../../features/equipment/panoply/panoplyFlag.js';
import { grantPanoplyTestGear } from '../../features/equipment/panoply/panoplyTestGear.js';

/**
 * M.III.3 EQ-PORT — additive, preserve-first screen-swap for the Equipment tab. The live Panoply/Vault
 * surface is flag-gated (public default OFF). Dev/QA reach it via `?panoply=live|fixture`; the legacy
 * `InventoryScreen` stays the default and is reachable via `?panoply=legacy|off`. No cutover here.
 * Mirrors `CultivateScreen` (Seat vs legacy).
 */
export default function EquipmentScreen() {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  useEffect(() => {
    // dev/test: ?giveTestGear=1 grants 1 of each demo gear item (real instances) so the surface populates.
    if (new URLSearchParams(search).get('giveTestGear') === '1') grantPanoplyTestGear();
  }, [search]);
  const panoply = resolvePanoplyFlag(search);
  if (panoply.enabled) {
    return <PanoplyScreenOwner mode={panoply.mode} fixtureId={panoply.fixtureId} initialSurface={panoply.surface} />;
  }
  return <InventoryScreen />;
}
