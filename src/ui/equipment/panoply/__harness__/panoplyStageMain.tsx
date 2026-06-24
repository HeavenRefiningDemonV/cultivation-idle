import { createRoot } from 'react-dom/client';

import '../../../../styles/paperInkTokens.scss';
import { PanoplyScreenOwner } from '../../../../features/equipment/panoply/index.js';

/**
 * M.III.3 EQ-PORT — dev-only entry for panoply-stage.html. Drives the stage from the deterministic fixtures
 * (no live RNG) via `?panoplyFixture=<seed>&panoplySurface=<panoply|vault>`. The owner in fixture mode builds
 * buildPanoply/VaultExactFixture(seed) and renders the full PanoplyVaultScreen + reused F2 modal. Not in
 * production (the live tab uses ?panoply=live behind the default-OFF flag).
 */
function main(): void {
  const params = new URLSearchParams(window.location.search);
  const fixtureId = params.get('panoplyFixture') ?? 'healthy';
  const surfaceParam = params.get('panoplySurface');
  const initialSurface: 'panoply' | 'vault' = surfaceParam === 'vault' ? 'vault' : 'panoply';
  const host = document.getElementById('root');
  if (host) {
    createRoot(host).render(
      <PanoplyScreenOwner mode="fixture" fixtureId={fixtureId} initialSurface={initialSurface} />,
    );
  }
}

main();
