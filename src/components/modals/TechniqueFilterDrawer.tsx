import { useEffect, useId, useRef } from 'react';
import type { RefObject } from 'react';
import './TechniqueFilterDrawer.scss';

export type SortKey = 'power' | 'recent' | 'used' | 'rarity';
export type TypeFilter = 'all' | 'active' | 'passive' | 'ultimate';
export type GradeFilter = 'all' | 'mortal' | 'earth' | 'heaven' | 'mystic';

type FilterDrawerProps = {
  open: boolean;
  sortKey: SortKey;
  typeFilter: TypeFilter;
  pathFilter: string;
  roleFilter: string;
  gradeFilter: GradeFilter;
  favoritesOnly: boolean;
  uniquePaths: string[];
  uniqueRoles: string[];
  onSortChange: (value: SortKey) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
  onPathFilterChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onGradeFilterChange: (value: GradeFilter) => void;
  onFavoritesChange: (value: boolean) => void;
  onReset: () => void;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement>;
};

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [] as HTMLElement[];
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors.join(','))).filter(
    (element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'),
  );
};

export function TechniqueFilterDrawer({
  open,
  sortKey,
  typeFilter,
  pathFilter,
  roleFilter,
  gradeFilter,
  favoritesOnly,
  uniquePaths,
  uniqueRoles,
  onSortChange,
  onTypeFilterChange,
  onPathFilterChange,
  onRoleFilterChange,
  onGradeFilterChange,
  onFavoritesChange,
  onReset,
  onClose,
  triggerRef,
}: FilterDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    lastFocusedRef.current = (triggerRef?.current ?? document.activeElement) as HTMLElement | null;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${(scrollbarWidth / 1920) * 100}vw`;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      lastFocusedRef.current?.focus();
    };
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const focusables = getFocusableElements(panelRef.current);
    const target = focusables[0] ?? panelRef.current;
    requestAnimationFrame(() => {
      target?.focus();
    });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = getFocusableElements(panelRef.current);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || active === panelRef.current) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="techniqueFilterDrawerOverlay" onClick={onClose}>
      <div
        className="techniqueFilterDrawerPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="techniqueFilterDrawerHeader">
          <div>
            <h2 id={titleId} className="techniqueFilterDrawerTitle">
              Sort & Filters
            </h2>
            <p className="techniqueFilterDrawerSubtitle">Refine the library without leaving the altar.</p>
          </div>
          <button type="button" className="techniqueFilterDrawerClose" onClick={onClose} aria-label="Close filters">
            Close
          </button>
        </div>

        <div className="techniqueFilterDrawerSection">
          <div className="techniqueFilterDrawerSectionTitle">Sort</div>
          <label className="techniqueFilterDrawerField" htmlFor="drawerSort">
            <span>Sort by</span>
            <select id="drawerSort" value={sortKey} onChange={(e) => onSortChange(e.target.value as SortKey)}>
              <option value="power">Power</option>
              <option value="recent">Recently Learned</option>
              <option value="used">Most Used</option>
              <option value="rarity">Rarity</option>
            </select>
          </label>
        </div>

        <div className="techniqueFilterDrawerSection">
          <div className="techniqueFilterDrawerSectionTitle">Filters</div>
          <div className="techniqueFilterDrawerGrid">
            <label className="techniqueFilterDrawerField" htmlFor="drawerType">
              <span>Type</span>
              <select id="drawerType" value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value as TypeFilter)}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="passive">Passive</option>
                <option value="ultimate">Ultimate</option>
              </select>
            </label>
            <label className="techniqueFilterDrawerField" htmlFor="drawerPath">
              <span>Path</span>
              <select id="drawerPath" value={pathFilter} onChange={(e) => onPathFilterChange(e.target.value)}>
                <option value="all">All</option>
                {uniquePaths.map((path) => (
                  <option key={path} value={path}>
                    {path}
                  </option>
                ))}
              </select>
            </label>
            <label className="techniqueFilterDrawerField" htmlFor="drawerRole">
              <span>Role</span>
              <select id="drawerRole" value={roleFilter} onChange={(e) => onRoleFilterChange(e.target.value)}>
                <option value="all">All</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label className="techniqueFilterDrawerField" htmlFor="drawerGrade">
              <span>Grade</span>
              <select id="drawerGrade" value={gradeFilter} onChange={(e) => onGradeFilterChange(e.target.value as GradeFilter)}>
                <option value="all">All</option>
                <option value="mortal">Mortal</option>
                <option value="earth">Earth</option>
                <option value="heaven">Heaven</option>
                <option value="mystic">Mystic</option>
              </select>
            </label>
          </div>
        </div>

        <div className="techniqueFilterDrawerSection">
          <div className="techniqueFilterDrawerSectionTitle">Quick toggles</div>
          <label className="techniqueFilterDrawerToggle" htmlFor="drawerFavorites">
            <input
              id="drawerFavorites"
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => onFavoritesChange(e.target.checked)}
            />
            <span>Favorites only</span>
          </label>
        </div>

        <div className="techniqueFilterDrawerActions">
          <button type="button" className="techniqueFilterDrawerReset" onClick={onReset}>
            Reset filters
          </button>
          <button type="button" className="techniqueFilterDrawerApply" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default TechniqueFilterDrawer;
