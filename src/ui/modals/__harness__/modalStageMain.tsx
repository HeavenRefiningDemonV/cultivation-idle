import { createRoot } from 'react-dom/client';

import '../../../styles/paperInkTokens.scss';
import { FxQualityProvider } from '../../fx/FxQualityProvider.js';
import { RitualCeremonyShell } from '../../shell/RitualCeremonyShell.js';
import { ItemDetailInspector } from '../ItemDetailInspector.js';
import {
  buildItemDetailSurface,
  buildRitualFrameSurface,
} from '../../../systems/ui/modals/index.js';

/**
 * F2-MODALS dev-only screenshot harness (modal-stage.html?modal=itemDetail|ritual&state=<seed>).
 * Drives the modals from deterministic fixtures (no live RNG, not in production). Wrapped in
 * <FxQualityProvider> so useRitualMotion resolves (the live GameLayout wraps modals the same way).
 *
 * S0 renders a typed STUB that proves the fixture→surface→component wiring; S1–S4 replace the
 * stub branches with the real <RitualCeremonyShell> / <ItemDetailInspector>.
 */

function main(): void {
  const params = new URLSearchParams(window.location.search);
  const modal = params.get('modal') ?? 'itemDetail';
  const state = params.get('state') ?? (modal === 'ritual' ? 'tribulation-not-yet' : 'item-legendary');

  const host = document.getElementById('root');
  if (!host) return;

  const noop = (intent: string) => { if (import.meta.env.DEV) console.info('[modal-stage] intent:', intent); };

  const node =
    modal === 'ritual'
      ? (
        <RitualCeremonyShell
          open
          surface={buildRitualFrameSurface(state)}
          onIntent={noop}
          onClose={() => noop('close')}
        />
      )
      : (
        <ItemDetailInspector
          open
          surface={buildItemDetailSurface(state)}
          onAction={noop}
          onClose={() => noop('close')}
        />
      );

  createRoot(host).render(<FxQualityProvider>{node}</FxQualityProvider>);
}

main();
