import { useCallback, useEffect, type ReactNode } from 'react';
import { useContentStore } from '../../stores/contentStore';
import { useUIStore, type WorldBuildingKey } from '../../stores/uiStore';
import './WorldBuildingModal.scss';

export interface WorldBuildingModalProps {
  open?: boolean;
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  children?: ReactNode;
  useStore?: boolean;
}

export function WorldBuildingModal({
  open: controlledOpen,
  title: controlledTitle,
  subtitle: controlledSubtitle,
  onClose: controlledOnClose,
  children,
  useStore = true,
}: WorldBuildingModalProps) {
  const storeOpen = useUIStore((state) => state.showWorldBuildingModal);
  const storeCityId = useUIStore((state) => state.worldBuildingModalCityId);
  const storeBuildingKey = useUIStore((state) => state.worldBuildingModalKey);
  const closeFromStore = useUIStore((state) => state.closeWorldBuildingModal);
  const city = useContentStore((state) => (storeCityId ? state.maps.citiesById[storeCityId] : undefined));

  const isStoreMode = useStore;
  const open = isStoreMode ? storeOpen : Boolean(controlledOpen);
  const buildingKey: WorldBuildingKey | null | undefined = isStoreMode ? storeBuildingKey : undefined;
  const close = isStoreMode ? closeFromStore : controlledOnClose || (() => {});
  const title = isStoreMode
    ? `${city?.name ?? 'City'} — ${buildingKey ?? ''}`
    : controlledTitle || 'World Building';
  const subtitle = isStoreMode ? (storeCityId && buildingKey ? `${storeCityId} • ${buildingKey}` : undefined) : controlledSubtitle;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close?.();
      }
    },
    [close],
  );

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, open]);

  if ((isStoreMode && (!storeOpen || !storeCityId || !buildingKey)) || (!isStoreMode && !open)) {
    return null;
  }

  return (
    <div className="worldBuildingOverlay" role="dialog" aria-modal="true" onMouseDown={close}>
      <div className="worldBuildingModal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="worldBuildingHeader">
          <div className="worldBuildingTitleGroup">
            <div className="worldBuildingTitle">{title}</div>
            {subtitle && <div className="worldBuildingSubtitle">{subtitle}</div>}
          </div>
          <button type="button" className="worldBuildingClose" onClick={close} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="worldBuildingBody">
          {isStoreMode ? (
            <div className="worldBuildingPlaceholder">TODO: {buildingKey}</div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
