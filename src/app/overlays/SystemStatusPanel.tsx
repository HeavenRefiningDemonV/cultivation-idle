import { SystemStatusPanel as BaseSystemStatusPanel } from '../../components/SystemStatusPanel';
import './SystemStatusPanel.css';

export function SystemStatusPanelOverlay() {
  return (
    <div className="systemStatusOverlay">
      <BaseSystemStatusPanel />
    </div>
  );
}
