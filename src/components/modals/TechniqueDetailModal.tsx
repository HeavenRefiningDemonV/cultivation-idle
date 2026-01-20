import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useId, useMemo } from 'react';
import type { TechniqueDef } from '../../content';
import { useContentStore } from '../../stores/contentStore';
import { normalizeGrade } from '../../stores/techCollectionStore';
import { getPathIcon, getTierIcon, getTypeIcon, resolveTechniqueType } from '../../features/manuals/manualIconMap';
import './TechniqueDetailModal.scss';

export interface TechniqueDetailModalProps {
  open: boolean;
  techniqueId: string | null;
  onClose: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const resolveTechnique = (
  techniquesById: Record<string, TechniqueDef>,
  techniqueId: string | null,
): TechniqueDef | null => {
  if (!techniqueId) return null;
  return techniquesById[techniqueId] ?? null;
};

export function TechniqueDetailModal({
  open,
  techniqueId,
  onClose,
  initialFocusRef,
}: TechniqueDetailModalProps) {
  const titleId = useId();
  const techniquesById = useContentStore((state) => state.maps.techniquesById);

  const technique = useMemo(
    () => resolveTechnique(techniquesById, techniqueId),
    [techniqueId, techniquesById],
  );

  const displayName = technique?.name ?? techniqueId ?? 'Technique';
  const typeKey = resolveTechniqueType(technique ?? undefined);
  const tierKey = normalizeGrade(technique?.tier);
  const pathKey = technique?.path ?? 'unknown';
  const tierIcon = getTierIcon(tierKey);
  const pathIcon = getPathIcon(pathKey);
  const typeIcon = getTypeIcon(typeKey);
  const isMissing = !technique;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="techniqueDetailModal"
      initialFocus={initialFocusRef}
    >
      <DialogBackdrop className="techniqueDetailModalOverlay" />
      <div className="techniqueDetailModalPosition">
        <DialogPanel className="techniqueDetailModalPanel" aria-labelledby={titleId}>
          <header className="techniqueDetailModalHeader">
            <div className="techniqueDetailModalHeaderMain">
              <DialogTitle id={titleId} className="techniqueDetailModalTitle">
                {displayName}
              </DialogTitle>
              <div className="techniqueDetailModalMeta" aria-label="Technique metadata">
                <span className="techniqueDetailModalMetaIcon" role="img" aria-label={tierIcon.label} title={tierIcon.label}>
                  {tierIcon.icon}
                </span>
                <span className="techniqueDetailModalMetaIcon" role="img" aria-label={pathIcon.label} title={pathIcon.label}>
                  {pathIcon.icon}
                </span>
                <span className="techniqueDetailModalMetaIcon" role="img" aria-label={typeIcon.label} title={typeIcon.label}>
                  {typeIcon.icon}
                </span>
              </div>
            </div>
            <button
              ref={initialFocusRef}
              type="button"
              className="techniqueDetailModalClose"
              onClick={onClose}
            >
              Close
            </button>
          </header>

          <div className="techniqueDetailModalBody">
            {isMissing && (
              <div className="techniqueDetailModalMissing">Technique data not found.</div>
            )}
            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Overview (placeholder)</h4>
              <p>Overview content will appear here once the full detail panel is migrated.</p>
            </section>
            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Effects (placeholder)</h4>
              <p>Primary and secondary effects will be listed here.</p>
            </section>
            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Upgrade (placeholder)</h4>
              <p>Rank, mastery, and upgrade actions will live in this section.</p>
            </section>
            <section
              className={`techniqueDetailModalSection ${isMissing ? 'is-disabled' : ''}`}
              aria-disabled={isMissing}
            >
              <h4>Equip (placeholder)</h4>
              <p>Equip and loadout actions will be placed here.</p>
            </section>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default TechniqueDetailModal;
