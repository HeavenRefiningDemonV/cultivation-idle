import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { PrestigeUpgradeDef } from '../../../content/index.js';
import { buildPrestigeCategorySections } from '../prestigeCategories.js';

type PrestigeDecreeLibraryDrawerProps = {
  open: boolean;
  upgrades: PrestigeUpgradeDef[];
  totalAP: number;
  getCurrentLevel: (upgradeId: string) => number;
  getMaxLevel: (upgradeId: string) => number;
  getNextLevelCost: (upgradeId: string) => number | null;
  checkPrereqs: (upgradeId: string) => { ok: boolean; reason?: string };
  onSelectUpgrade: (upgradeId: string) => void;
  onClose: () => void;
};

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
};

const formatCost = (cost: number | null): string => (cost === null ? 'Sealed' : `${cost} AP`);

export function PrestigeDecreeLibraryDrawer({
  open,
  upgrades,
  totalAP,
  getCurrentLevel,
  getMaxLevel,
  getNextLevelCost,
  checkPrereqs,
  onSelectUpgrade,
  onClose,
}: PrestigeDecreeLibraryDrawerProps) {
  const titleId = useId();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const sections = buildPrestigeCategorySections(upgrades);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      const focusables = getFocusableElements(drawerRef.current);
      (focusables[0] ?? drawerRef.current)?.focus();
    });
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusables = getFocusableElements(drawerRef.current);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === drawerRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div className="prestigeLedgerDrawerOverlay" role="presentation" onMouseDown={onClose}>
      <aside
        className="prestigeLedgerDrawer parchmentPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        ref={drawerRef}
      >
        <header className="prestigeLedgerDrawer__header">
          <div>
            <h2 id={titleId}>Full Decree Library</h2>
            <p>Runtime-backed permanent decrees only. Hidden or deferred edicts are absent from this ledger.</p>
          </div>
          <button type="button" className="prestigeLedgerDrawer__close" onClick={onClose} aria-label="Close decree library">
            Close
          </button>
        </header>

        <div className="prestigeLedgerDrawer__ap">AP Reserve: {totalAP}</div>

        <div className="prestigeLedgerDrawer__scroll">
          {sections.length === 0 ? (
            <div className="prestigeLedgerDrawer__empty">No visible live decrees are available.</div>
          ) : null}
          {sections.map((section) => (
            <section key={section.category.key} className="prestigeLedgerDrawerSection">
              <header>
                <h3>{section.category.title}</h3>
                <p>{section.category.subtitle}</p>
              </header>
              <div className="prestigeLedgerDrawerSection__grid">
                {section.upgrades.map((upgrade) => {
                  const currentLevel = getCurrentLevel(upgrade.id);
                  const maxLevel = getMaxLevel(upgrade.id);
                  const nextCost = getNextLevelCost(upgrade.id);
                  const prereq = checkPrereqs(upgrade.id);
                  const isMaxed = currentLevel >= maxLevel;
                  const canAfford = nextCost !== null && totalAP >= nextCost;

                  return (
                    <button
                      type="button"
                      key={upgrade.id}
                      className="prestigeLedgerDrawerCard"
                      onClick={() => onSelectUpgrade(upgrade.id)}
                      title={prereq.reason}
                    >
                      <span className="prestigeLedgerDrawerCard__seal" aria-hidden="true" />
                      <span className="prestigeLedgerDrawerCard__copy">
                        <strong>{upgrade.name}</strong>
                        <span>{upgrade.description ?? 'A permanent decree for future lives.'}</span>
                        <small>Lv {currentLevel}/{maxLevel}</small>
                      </span>
                      <span className={`prestigeLedgerDrawerCard__cost${canAfford ? ' is-affordable' : ''}`}>
                        {formatCost(nextCost)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
