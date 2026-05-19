import { SystemStatusPanel as BaseSystemStatusPanel } from '../../components/SystemStatusPanel.js';
import './SystemStatusPanel.css';

export function SystemStatusPanelOverlay() {
  return (
    <div className="systemStatusOverlay">
      <BaseSystemStatusPanel />
    </div>
  );
}
