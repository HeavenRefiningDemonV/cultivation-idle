import { PrestigeLedgerScreenOwner } from '../../features/prestige/prestigeLedgerExact/index.js';
import './PrestigeScreen.scss';

export function PrestigeScreen() {
  return (
    <div className="prestigeScreenRoot prestigeScreenRoot--exact">
      <PrestigeLedgerScreenOwner />
    </div>
  );
}
