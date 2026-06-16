import { createRoot } from 'react-dom/client';

import '../../../styles/paperInkTokens.scss';
import { CourtPanelHarness } from './CourtPanelHarness';

/** Dev-only entry for the W1 Court panel-material harness (court-harness.html).
 *  Not part of the production bundle (vite build only inputs index.html). */
const host = document.getElementById('root');
if (host) {
  createRoot(host).render(<CourtPanelHarness />);
}
