import { createRoot } from 'react-dom/client';

import '../../../styles/paperInkTokens.scss';
import type { PathMeridianDef } from '../../../systems/meridians/index.js';
import { TemperingCourt } from '../TemperingCourt';
import { buildCourtFixture } from './courtFixtures';

/** Dev-only entry for the W7 Court (court-stage.html?state=<id>). Drives the stage from
 *  the Appendix-F fixture surfaces (deterministic, no live RNG). Not in production. */
async function main(): Promise<void> {
  const response = await fetch('/cultivation_idle_content_bible_v1_config/path_meridians.json');
  const pack = (await response.json()) as { meridians: PathMeridianDef[] };
  const stateId = new URLSearchParams(window.location.search).get('state') ?? '01_martial_R2';
  const { surface, reducedMotion } = buildCourtFixture(stateId, pack.meridians);

  const host = document.getElementById('root');
  if (host) {
    createRoot(host).render(<TemperingCourt surface={surface} reducedMotion={reducedMotion} />);
  }
}

void main();
