import type {
  SpiritRootObservationSurfaceV1,
  SpiritRootObservationTabId,
} from './spiritRootObservationTypes.js';
import { useDialogFocusTrap } from '../../ui/status/observatory/useDialogFocusTrap.js';
import './SpiritRootObservationDrawer.scss';

interface SpiritRootObservationDrawerProps {
  surface: SpiritRootObservationSurfaceV1;
  open: boolean;
  activeTab: SpiritRootObservationTabId;
  onTabChange: (tab: SpiritRootObservationTabId) => void;
  onClose: () => void;
}

export function SpiritRootObservationDrawer({
  surface,
  open,
  activeTab,
  onTabChange,
  onClose,
}: SpiritRootObservationDrawerProps) {
  const dialogRef = useDialogFocusTrap<HTMLElement>(open, onClose);
  if (!open) return null;

  const selectedTab = surface.tabs.find((tab) => tab.id === activeTab) ?? surface.tabs[0];

  return (
    <aside
      ref={dialogRef}
      className="spiritRootObservationDrawer"
      data-testid="spirit-root-observation-drawer"
      data-owner={surface.owner}
      data-active-tab={selectedTab.id}
      role="dialog"
      aria-modal="true"
      aria-label="Spirit Root Observation"
    >
      <header className="spiritRootObservationDrawer__header">
        <div>
          <span>Spirit Root Observation</span>
          <h2>{surface.profile.displayName}</h2>
          <p>{surface.profile.playstyleLabel} - {surface.fit.label}</p>
        </div>
        <button type="button" className="uiNoShift" onClick={onClose} aria-label="Close Spirit Root Observation">
          Close
        </button>
      </header>

      <nav className="spiritRootObservationDrawer__tabs" aria-label="Spirit Root Observation tabs">
        {surface.tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`uiNoShift ${tab.id === selectedTab.id ? 'spiritRootObservationDrawer__tab--active' : ''}`}
            aria-pressed={tab.id === selectedTab.id}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="spiritRootObservationDrawer__body" aria-label={selectedTab.label}>
        {selectedTab.rows.map((row) => (
          <article key={row.id} className={`spiritRootObservationDrawer__row spiritRootObservationDrawer__row--${row.tone}`}>
            <span>{row.label}</span>
            {row.value ? <strong>{row.value}</strong> : null}
            <p>{row.detail}</p>
          </article>
        ))}
      </section>

      <section className="spiritRootObservationDrawer__vfx" aria-label="Elemental VFX state">
        {surface.vfxRows.map((row) => (
          <span key={row.id} className={`spiritRootObservationDrawer__vfxRow spiritRootObservationDrawer__vfxRow--${row.tone}`}>
            <strong>{row.label}</strong>
            <small>{row.detail}</small>
          </span>
        ))}
      </section>
    </aside>
  );
}
