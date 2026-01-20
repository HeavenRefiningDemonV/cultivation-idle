import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { TechniqueDef } from '../../content';
import type { EquipResult, SlotType } from '../../stores/techniqueStore';
import { getPathIcon, getTierIcon, getTypeIcon, resolveTechniqueType } from '../../features/manuals/manualIconMap';
import { normalizeGrade, normalizeRarity } from '../../stores/techCollectionStore';
import './InnerPalaceEquipAltar.scss';

export type InnerPalaceSlot = {
  key: string;
  label: string;
  accepts: SlotType;
  slotType: SlotType;
  slotIndex: number;
  techId: string | null;
  isUnlocked: boolean;
  unlockLabel?: string;
};

export type InnerPalaceFeedback = {
  tone: 'success' | 'error' | 'info';
  message: string;
};

export interface InnerPalaceEquipAltarProps {
  slots: InnerPalaceSlot[];
  selectedTechId: string | null;
  selectedSlotKey?: string | null;
  highlightedTechId?: string | null;
  flashSlot?: { key: string; tone: 'equip' | 'unequip' } | null;
  techniquesById: Record<string, TechniqueDef | undefined>;
  onRequestViewTech: (techId: string) => void;
  onRequestEquip: (slotType: SlotType, slotIndex: number, techId: string) => EquipResult;
  onRequestUnequip: (slotType: SlotType, slotIndex: number) => EquipResult;
  onSelectSlot: (slotType: SlotType, slotIndex: number) => void;
  onClearSelectedTech?: () => void;
  feedback: InnerPalaceFeedback | null;
  onFeedback: (feedback: InnerPalaceFeedback | null) => void;
}

const slotGlyphMap: Record<SlotType, string> = {
  active: '⚔',
  passive: '⛩',
  ultimate: '☄',
};

const isTechniqueCompatibleWithSlot = (technique: TechniqueDef | undefined, slotType: SlotType) => {
  const resolved = resolveTechniqueType(technique);
  return resolved !== 'unknown' && resolved === slotType;
};

export function InnerPalaceEquipAltar({
  slots,
  selectedTechId,
  selectedSlotKey,
  highlightedTechId,
  flashSlot,
  techniquesById,
  onRequestViewTech,
  onRequestEquip,
  onRequestUnequip,
  onSelectSlot,
  onClearSelectedTech,
  feedback,
  onFeedback,
}: InnerPalaceEquipAltarProps) {
  const [popoverSlotKey, setPopoverSlotKey] = useState<string | null>(null);
  const [shakeSlotKey, setShakeSlotKey] = useState<string | null>(null);
  const [flashState, setFlashState] = useState<{ key: string; tone: 'equip' | 'unequip' } | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const popoverFirstActionRef = useRef<HTMLButtonElement | null>(null);
  const slotButtonRefs = useRef(new Map<string, HTMLButtonElement | null>());

  const selectedTechnique = selectedTechId ? techniquesById[selectedTechId] : undefined;
  const selectedTechniqueName = selectedTechnique?.name ?? selectedTechId ?? 'Unknown technique';
  const highlightedTechnique = highlightedTechId ? techniquesById[highlightedTechId] : undefined;

  const slotByKey = useMemo(() => {
    const map = new Map<string, InnerPalaceSlot>();
    slots.forEach((slot) => map.set(slot.key, slot));
    return map;
  }, [slots]);

  const popoverSlot = popoverSlotKey ? slotByKey.get(popoverSlotKey) ?? null : null;
  const popoverTechnique = popoverSlot?.techId ? techniquesById[popoverSlot.techId] : undefined;
  const popoverTechniqueName = popoverTechnique?.name ?? popoverSlot?.techId ?? 'Unknown technique';

  const setFeedback = (next: InnerPalaceFeedback) => {
    onFeedback(next);
  };

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = window.setTimeout(() => onFeedback(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [feedback, onFeedback]);

  useEffect(() => {
    if (!popoverSlotKey) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setPopoverSlotKey(null);
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      const popover = popoverRef.current;
      const slotButton = slotButtonRefs.current.get(popoverSlotKey);
      if (popover && popover.contains(target)) return;
      if (slotButton && slotButton.contains(target)) return;
      setPopoverSlotKey(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mousedown', handleMouseDown, true);

    window.requestAnimationFrame(() => {
      popoverFirstActionRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousedown', handleMouseDown, true);
      const fallback = slotButtonRefs.current.get(popoverSlotKey ?? '');
      fallback?.focus();
    };
  }, [popoverSlotKey]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setStageSize({ width, height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const triggerShake = (slotKey: string) => {
    setShakeSlotKey(slotKey);
    window.setTimeout(() => setShakeSlotKey((current) => (current === slotKey ? null : current)), 450);
  };

  const triggerFlash = useCallback((slotKey: string, tone: 'equip' | 'unequip') => {
    setFlashState({ key: slotKey, tone });
    window.setTimeout(
      () => setFlashState((current) => (current?.key === slotKey ? null : current)),
      450,
    );
  }, []);

  useEffect(() => {
    if (!flashSlot) return;
    triggerFlash(flashSlot.key, flashSlot.tone);
  }, [flashSlot, triggerFlash]);

  const orderedSlots = useMemo(() => {
    const order: SlotType[] = ['active', 'passive', 'ultimate'];
    return [...slots].sort((a, b) => {
      const typeDelta = order.indexOf(a.slotType) - order.indexOf(b.slotType);
      if (typeDelta !== 0) return typeDelta;
      return a.slotIndex - b.slotIndex;
    });
  }, [slots]);

  const slotPositions = useMemo(() => {
    const slotCount = orderedSlots.length || 1;
    const size = Math.min(stageSize.width, stageSize.height);
    if (size <= 0) return new Map<string, { left: number; top: number }>();
    const radius = size * 0.38;
    const center = size / 2;
    const positions = new Map<string, { left: number; top: number }>();
    orderedSlots.forEach((slot, index) => {
      const angleDeg = -90 + (360 / slotCount) * index;
      const angleRad = (angleDeg * Math.PI) / 180;
      const left = center + radius * Math.cos(angleRad);
      const top = center + radius * Math.sin(angleRad);
      positions.set(slot.key, { left, top });
    });
    return positions;
  }, [orderedSlots, stageSize.height, stageSize.width]);

  const handleEquipAttempt = (slot: InnerPalaceSlot, techId: string) => {
    const result = onRequestEquip(slot.slotType, slot.slotIndex, techId);
    if (!result.ok) {
      const message = result.reason === 'locked' && result.unlockAt
        ? `${result.message} Unlocks at ${result.unlockAt.realmName}.`
        : result.message;
      setFeedback({ tone: 'error', message });
      triggerShake(slot.key);
      return;
    }

    setFeedback({ tone: 'success', message: `Equipped ${selectedTechniqueName} to ${slot.label}.` });
    triggerFlash(slot.key, 'equip');
    onClearSelectedTech?.();
  };

  const handleUnequipAttempt = (slot: InnerPalaceSlot) => {
    const result = onRequestUnequip(slot.slotType, slot.slotIndex);
    if (!result.ok) {
      setFeedback({ tone: 'error', message: result.message });
      triggerShake(slot.key);
      return;
    }
    const unequippedName = popoverTechniqueName;
    setFeedback({ tone: 'success', message: `Unequipped ${unequippedName} from ${slot.label}.` });
    triggerFlash(slot.key, 'unequip');
  };

  const handleSlotClick = (slot: InnerPalaceSlot) => {
    onSelectSlot(slot.slotType, slot.slotIndex);

    if (!slot.isUnlocked) {
      const unlockLine = slot.unlockLabel ? ` ${slot.unlockLabel}.` : '';
      setFeedback({ tone: 'error', message: `That slot is locked.${unlockLine}`.trim() });
      triggerShake(slot.key);
      return;
    }

    const hasSelected = Boolean(selectedTechId);
    const hasTechEquipped = Boolean(slot.techId);
    const compatible = hasSelected ? isTechniqueCompatibleWithSlot(selectedTechnique, slot.accepts) : false;

      if (hasTechEquipped) {
      if (hasSelected && !compatible) {
        setFeedback({
          tone: 'error',
          message: `Cannot replace: ${selectedTechniqueName} is not compatible with ${slot.label}.`,
        });
        triggerShake(slot.key);
      }
      setPopoverSlotKey(slot.key);
      return;
    }

    if (!hasSelected) {
      setFeedback({ tone: 'info', message: 'Select a technique spine first.' });
      return;
    }

    if (!compatible) {
      setFeedback({
        tone: 'error',
        message: `Cannot equip: ${selectedTechniqueName} is not compatible with ${slot.label}.`,
      });
      triggerShake(slot.key);
      return;
    }

    handleEquipAttempt(slot, selectedTechId ?? '');
  };

  const handlePopoverAction = (action: 'view' | 'unequip' | 'replace') => {
    if (!popoverSlot) return;

    if (action === 'view' && popoverSlot.techId) {
      onRequestViewTech(popoverSlot.techId);
      setPopoverSlotKey(null);
      return;
    }

    if (action === 'unequip') {
      handleUnequipAttempt(popoverSlot);
      setPopoverSlotKey(null);
      return;
    }

    if (action === 'replace' && selectedTechId) {
      handleEquipAttempt(popoverSlot, selectedTechId);
      setPopoverSlotKey(null);
    }
  };

  return (
    <div className="innerPalaceAltar">
      <div className="innerPalaceHeader">
        <div className="innerPalaceTitle">Inner Palace Equip Altar</div>
        <div className="innerPalaceSubtitle">Seat your techniques around the core.</div>
      </div>

      <div className="innerPalaceStage" ref={stageRef}>
        <div className="innerPalaceCore" aria-hidden="true" />
        <div className="innerPalaceRing" aria-hidden="true" />

        {orderedSlots.map((slot) => {
          const technique = slot.techId ? techniquesById[slot.techId] : undefined;
          const displayName = technique?.name ?? slot.techId ?? slot.label;
          const rarityKey = normalizeRarity(technique?.rarity);
          const gradeKey = normalizeGrade(technique?.tier);
          const pathIcon = getPathIcon(technique?.path ?? null);
          const tierIcon = getTierIcon(gradeKey);
          const typeIcon = getTypeIcon(resolveTechniqueType(technique));
          const isSelected = selectedSlotKey === slot.key;
          const canEquipSelected = Boolean(
            selectedTechId && slot.isUnlocked && isTechniqueCompatibleWithSlot(selectedTechnique, slot.accepts),
          );
          const shouldHighlight = Boolean(
            highlightedTechId && slot.isUnlocked && isTechniqueCompatibleWithSlot(highlightedTechnique, slot.accepts),
          );
          const state = slot.isUnlocked ? (slot.techId ? 'occupied' : 'empty') : 'locked';
          const position = slotPositions.get(slot.key);

          return (
            <button
              key={slot.key}
              ref={(node) => slotButtonRefs.current.set(slot.key, node)}
              type="button"
              className={`innerPalaceSlot ${isSelected ? 'is-selected' : ''} ${
                shakeSlotKey === slot.key ? 'is-shaking' : ''
              } ${flashState?.key === slot.key ? 'is-flashing' : ''}`}
              style={{
                left: position?.left ?? '50%',
                top: position?.top ?? '50%',
              }}
              data-slot-type={slot.slotType}
              data-state={state}
              data-path={technique?.path ?? 'unknown'}
              data-rarity={rarityKey}
              data-can-equip={canEquipSelected ? 'true' : 'false'}
              data-highlighted={shouldHighlight ? 'true' : 'false'}
              data-flash-tone={flashState?.key === slot.key ? flashState?.tone : undefined}
              aria-label={`${slot.label}: ${
                slot.techId ? displayName : 'Empty slot'
              }${slot.isUnlocked ? '' : ' (Locked)'}`}
              aria-haspopup={slot.techId ? 'dialog' : undefined}
              aria-expanded={popoverSlotKey === slot.key}
              onClick={() => handleSlotClick(slot)}
            >
              <div className="innerPalaceSlotFrame">
                {slot.techId ? (
                  <div className="innerPalaceSlotSpine">
                    <div className="innerPalaceSlotIcons" aria-hidden="true">
                      <span className="innerPalaceSlotIcon" title={tierIcon.label}>
                        {tierIcon.icon}
                      </span>
                      <span className="innerPalaceSlotIcon" title={pathIcon.label}>
                        {pathIcon.icon}
                      </span>
                      <span className="innerPalaceSlotIcon" title={typeIcon.label}>
                        {typeIcon.icon}
                      </span>
                    </div>
                    <div className="innerPalaceSlotTitle" title={displayName}>
                      {displayName}
                    </div>
                    <div className="innerPalaceSlotLabel">{slot.label}</div>
                  </div>
                ) : (
                  <div className="innerPalaceSlotEmpty">
                    <div className="innerPalaceSlotGlyph" aria-hidden="true">
                      {slotGlyphMap[slot.accepts]}
                    </div>
                    <div className="innerPalaceSlotLabel">{slot.label}</div>
                    {!slot.isUnlocked && (
                      <div className="innerPalaceSlotLocked">
                        <span aria-hidden="true">🔒</span> Locked
                      </div>
                    )}
                  </div>
                )}
              </div>

              {popoverSlotKey === slot.key && popoverSlot ? (
                <div ref={popoverRef} className="innerPalaceSlotPopover" role="dialog" aria-label="Slot actions">
                  <div className="innerPalaceSlotPopoverTitle">{popoverTechniqueName}</div>
                  <div className="innerPalaceSlotPopoverActions">
                    <button
                      type="button"
                      ref={popoverFirstActionRef}
                      onClick={() => handlePopoverAction('view')}
                    >
                      View
                    </button>
                    <button type="button" onClick={() => handlePopoverAction('unequip')}>
                      Unequip
                    </button>
                    {selectedTechId &&
                      isTechniqueCompatibleWithSlot(selectedTechnique, slot.accepts) && (
                        <button type="button" onClick={() => handlePopoverAction('replace')}>
                          Replace
                        </button>
                      )}
                  </div>
                  {selectedTechId && !isTechniqueCompatibleWithSlot(selectedTechnique, slot.accepts) && (
                    <div className="innerPalaceSlotPopoverHint">Selected technique is incompatible.</div>
                  )}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className={`innerPalaceFeedback tone-${feedback?.tone ?? 'idle'}`} aria-live="polite">
        {feedback?.message ?? ''}
      </div>
    </div>
  );
}

export default InnerPalaceEquipAltar;
