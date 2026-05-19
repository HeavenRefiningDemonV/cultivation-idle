import { useMemo, useRef } from 'react';
import type { TechniqueTypeKey } from '../../features/manuals/manualIconMap.js';
import { getPathIcon, getTierIcon, getTypeIcon } from '../../features/manuals/manualIconMap.js';
import { GameIcon } from '../../ui/icons/index.js';
import './TechniqueSpine.scss';

export type TechniqueSpineState = 'available' | 'locked' | 'equipped' | 'unknown';

export interface TechniqueSpineProps {
  id: string;
  title: string;
  rarity?: string;
  tierKey?: string;
  pathKey?: string;
  typeKey?: TechniqueTypeKey;
  rank?: number;
  mastery?: number;
  equipped?: boolean;
  disabledReason?: string;
  selected?: boolean;
  onSelect: () => void;
  onHover?: (rect: DOMRect) => void;
  onClearHover?: () => void;
}

const formatRarity = (rarity?: string) => {
  if (!rarity) return 'Unknown';
  return rarity.charAt(0).toUpperCase() + rarity.slice(1);
};

const unknownTierIcon = { iconId: 'inkSparkles', label: 'Unranked Tier', key: 'unknown' };

export function TechniqueSpine({
  id,
  title,
  rarity,
  tierKey,
  pathKey,
  typeKey,
  rank,
  mastery,
  equipped,
  disabledReason,
  selected,
  onSelect,
  onHover,
  onClearHover,
}: TechniqueSpineProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const tierIcon = useMemo(() => (tierKey ? getTierIcon(tierKey) : unknownTierIcon), [tierKey]);
  const pathIcon = useMemo(() => getPathIcon(pathKey ?? null), [pathKey]);
  const typeIcon = useMemo(() => getTypeIcon(typeKey ?? 'unknown'), [typeKey]);

  const isLocked = Boolean(disabledReason);
  const state: TechniqueSpineState = isLocked ? 'locked' : equipped ? 'equipped' : 'available';

  const ariaLabel = useMemo(() => {
    const rarityLabel = formatRarity(rarity);
    const parts = [
      title || id,
      `Tier: ${tierIcon.label}`,
      `Path: ${pathIcon.label}`,
      `Type: ${typeIcon.label}`,
      `Rarity: ${rarityLabel}`,
    ];
    if (typeof rank === 'number') parts.push(`Rank ${rank}`);
    if (typeof mastery === 'number') parts.push(`Mastery ${mastery}`);
    if (equipped) parts.push('Equipped');
    if (disabledReason) parts.push(disabledReason);
    return parts.join(' · ');
  }, [disabledReason, equipped, id, mastery, pathIcon.label, rarity, rank, tierIcon.label, title, typeIcon.label]);

  const handleHover = () => {
    if (!onHover || !buttonRef.current) return;
    onHover(buttonRef.current.getBoundingClientRect());
  };

  const handleClearHover = () => {
    onClearHover?.();
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`techSpine ${selected ? 'is-selected' : ''}`}
      data-state={state}
      data-rarity={rarity ?? 'unknown'}
      data-path={pathKey ?? 'unknown'}
      data-type={typeKey ?? 'unknown'}
      aria-label={ariaLabel}
      title={disabledReason || title}
      disabled={Boolean(disabledReason)}
      onClick={() => {
        if (!disabledReason) onSelect();
      }}
      onMouseEnter={handleHover}
      onMouseLeave={handleClearHover}
      onFocus={handleHover}
      onBlur={handleClearHover}
    >
      <span className="techSpinePress" aria-hidden="true" />
      <div className="techSpineTop">
        <span className="techSpineTierIcon" role="img" aria-label={tierIcon.label} title={tierIcon.label}>
          {tierIcon.iconId ? <GameIcon icon={tierIcon.iconId} size={14} decorative /> : (tierIcon.iconText ?? '—')}
        </span>
        <div className="techSpineStatus" aria-hidden={!equipped && !selected && !isLocked}>
          {selected && (
            <span className="techSpineStatusBadge techSpineStatusBadge--selected" aria-label="Selected">
              ◆
            </span>
          )}
          {equipped && !isLocked && (
            <span className="techSpineStatusBadge techSpineStatusBadge--equipped" aria-label="Equipped">
              <GameIcon icon="inkCheck" size={12} decorative />
            </span>
          )}
          {isLocked && (
            <span className="techSpineStatusBadge techSpineStatusBadge--locked" aria-label="Locked">
              <GameIcon icon="inkLock" size={12} decorative />
            </span>
          )}
        </div>
      </div>

      <div className="techSpineTitle" title={title || id}>
        {title || id}
      </div>

      <div className="techSpineBottom">
        {pathIcon.iconId ? (
          <span className="techSpineMetaIcon" role="img" aria-label={pathIcon.label} title={pathIcon.label}>
            <GameIcon icon={pathIcon.iconId} size={14} decorative />
          </span>
        ) : null}
        {typeIcon.iconId ? (
          <span className="techSpineMetaIcon" role="img" aria-label={typeIcon.label} title={typeIcon.label}>
            <GameIcon icon={typeIcon.iconId} size={14} decorative />
          </span>
        ) : null}
      </div>
    </button>
  );
}

export default TechniqueSpine;
