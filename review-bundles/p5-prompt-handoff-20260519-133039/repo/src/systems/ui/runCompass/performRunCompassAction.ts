import type { RunCompassActionLine } from './index.js';
import { useUIStore } from '../../../stores/uiStore.js';
import { openWorldModule } from '../../world/openWorldModule.js';

export function performRunCompassAction(action: RunCompassActionLine): void {
  if (action.blocked || !action.target) return;

  if (action.target.kind === 'tab') {
    useUIStore.getState().setActiveTab(action.target.tab);
    return;
  }

  openWorldModule({ cityId: action.target.cityId, moduleKey: action.target.moduleKey, source: 'run-compass' });
}
