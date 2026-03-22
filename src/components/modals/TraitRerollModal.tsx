import { useEffect, useMemo, useState } from 'react';
import './TraitRerollModal.scss';
import { GameIcon } from '../../ui/icons/index.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';

interface TraitRerollModalProps {
  techId: string;
  onClose: () => void;
}

type InlineStatus = { type: 'success' | 'error'; text: string } | null;

const SOUL_INK_REROLL_ITEM_ID = 'reagent_soul_ink_t0';

export function TraitRerollModal({ techId, onClose }: TraitRerollModalProps) {
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const itemsById = useContentStore((state) => state.maps.itemsById);
  const entry = useTechCollectionStore((state) => state.unlockedTechs[techId]);
  const ensureTraits = useTechCollectionStore((state) => state.ensureTraits);
  const rerollTraits = useTechCollectionStore((state) => state.rerollTraits);
  const getTraitDefinition = useTechCollectionStore((state) => state.getTraitDefinition);
  const getTraitRollRangeLabel = useTechCollectionStore((state) => state.getTraitRollRangeLabel);
  const getTraitQualityPct = useTechCollectionStore((state) => state.getTraitQualityPct);
  const getTraitSlotBreakdown = useTechCollectionStore((state) => state.getTraitSlotBreakdown);

  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockIndex, setLockIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<InlineStatus>(null);

  useEffect(() => {
    ensureTraits(techId);
    setLockEnabled(false);
    setLockIndex(null);
    setStatus(null);
  }, [ensureTraits, techId]);

  const traits = entry?.traits ?? [];
  const traitSlots = useMemo(
    () => getTraitSlotBreakdown(techId),
    [getTraitSlotBreakdown, techId, entry?.manualGrade, entry?.rarity],
  );
  const traitName = techniquesById[techId]?.name ?? techId;
  const rerollCostQty = lockEnabled && lockIndex !== null ? 2 : 1;
  const rerollItemName = itemsById[SOUL_INK_REROLL_ITEM_ID]?.name ?? 'Soul Ink';
  const noSlotsAvailable = traitSlots.effectiveSlots <= 0;

  const handleLockToggle = (checked: boolean) => {
    setLockEnabled(checked);
    if (!checked) {
      setLockIndex(null);
      return;
    }

    if (traits.length && (lockIndex === null || lockIndex >= traits.length)) {
      setLockIndex(0);
    }
  };

  const handleReroll = () => {
    if (lockEnabled && (lockIndex === null || lockIndex >= traits.length)) {
      setStatus({ type: 'error', text: 'Select a valid trait slot to lock first.' });
      return;
    }

    const result = rerollTraits(techId, {
      lockEnabled,
      lockIndex: lockEnabled ? lockIndex ?? undefined : undefined,
    });

    if (result.ok) {
      const lockedNote = result.lockedIndex !== undefined ? ` (kept slot ${result.lockedIndex + 1})` : '';
      setStatus({ type: 'success', text: `Re-scribed insights${lockedNote}.` });
      return;
    }

    const message =
      result.reason === 'invalid_lock'
        ? 'Select a valid trait slot to lock first.'
        : result.reason === 'insufficient_items'
          ? 'Insufficient Soul Ink to reroll.'
          : result.reason ?? 'Unable to reroll traits.';
    setStatus({ type: 'error', text: message });
  };

  return (
    <div className="traitRerollOverlay">
      <div className="traitRerollModal">
        <div className="traitRerollHeader">
          <div>
            <div className="traitRerollTitle">Re-scribe Sub-Insights</div>
            <div className="traitRerollSubtitle">Lock one trait for extra cost; others will be rediscovered.</div>
          </div>
          <button className="traitRerollClose" onClick={onClose} aria-label="Close Trait Reroll">
            <GameIcon icon="inkX" size={14} decorative />
          </button>
        </div>

        <div className="traitRerollBody">
          <div className="traitRerollName">{traitName}</div>
          <div className="traitRerollSlots">
            Rarity slots: {traitSlots.raritySlots} · Grade cap: {traitSlots.gradeCap} → {traitSlots.effectiveSlots} available
          </div>

          <div className="traitRerollList">
            {traits.length === 0 && !noSlotsAvailable && <div className="traitRerollHint">No traits yet. A reroll will inscribe new ones.</div>}
            {traits.length === 0 && noSlotsAvailable && <div className="traitRerollHint">No trait slots available for this technique.</div>}
            {traits.map((trait, idx) => {
              const def = getTraitDefinition(trait.id);
              const range = getTraitRollRangeLabel(trait.id);
              const quality = getTraitQualityPct(trait);
              const valuePct = trait.value ?? trait.valuePct ?? 0;
              const label = def?.name || def?.label || trait.id;
              return (
                <div key={`${trait.id}-${idx}`} className="traitRerollRow">
                  <div className="traitRerollMain">
                    <div className="traitRerollLabel">{label}</div>
                    <div className="traitRerollValue">{(valuePct * 100).toFixed(1)}%</div>
                    <div className="traitRerollRange">{range}</div>
                  </div>
                  <div className="traitRerollQuality">
                    <div className="traitRerollQualityBar">
                      <div className="traitRerollQualityFill" style={{ width: `${quality * 100}%` }} />
                    </div>
                    <label className="traitRerollLock">
                      <input
                        type="radio"
                        name="traitLock"
                        checked={lockIndex === idx}
                        onChange={() => {
                          setLockIndex(idx);
                          setLockEnabled(true);
                        }}
                        disabled={!lockEnabled}
                      />
                      Keep this trait
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="traitRerollLockRow">
            <label className="traitRerollToggle">
              <input
                type="checkbox"
                checked={lockEnabled}
                onChange={(e) => handleLockToggle(e.target.checked)}
                disabled={traits.length === 0}
              />
              Lock 1 trait (costs +1 {rerollItemName})
            </label>
            <div className="traitRerollCost">
              Cost: {rerollCostQty}× {rerollItemName}
            </div>
          </div>

          {status && (
            <div className={`traitRerollStatus ${status.type === 'success' ? 'is-success' : 'is-error'}`}>
              {status.text}
            </div>
          )}
        </div>

        <div className="traitRerollActions">
          <button className="traitRerollButton traitRerollButtonSecondary" onClick={onClose}>
            Close
          </button>
          <button
            className="traitRerollButton"
            onClick={handleReroll}
            disabled={noSlotsAvailable}
            title={noSlotsAvailable ? 'No trait slots available.' : undefined}
          >
            Re-scribe Insights
          </button>
        </div>
      </div>
    </div>
  );
}
