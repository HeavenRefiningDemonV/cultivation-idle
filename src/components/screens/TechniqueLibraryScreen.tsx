import { useEffect, useMemo, useState, useCallback } from 'react';
import { REALMS } from '../../constants';
import { useContentStore } from '../../stores/contentStore';
import { useGameStore } from '../../stores/gameStore';
import { useTechCollectionStore } from '../../stores/techCollectionStore';
import type { SlotType } from '../../stores/techniqueStore';
import { useTechniqueStore } from '../../stores/techniqueStore';
import { useUIStore } from '../../stores/uiStore';
import './TechniqueLibraryScreen.scss';

type InlineMessage = { type: 'error' | 'info' | 'success'; text: string } | null;

type SlotSelection = { type: SlotType; index: number };

const techniqueType = (technique: { type?: string; tags?: string[] } | undefined): SlotType => {
  if (!technique) return 'active';
  if (technique.type === 'ultimate') return 'ultimate';
  if (technique.type === 'passive' || technique.tags?.includes('passive')) return 'passive';
  return 'active';
};

const slotLabel = (slot: SlotSelection) => {
  if (slot.type === 'ultimate') return 'Ultimate';
  return `${slot.type === 'active' ? 'Active' : 'Passive'} ${slot.index + 1}`;
};

const formatResourceCost = (resourceModel?: string, resourceCost?: number | string) => {
  if (!resourceModel) return 'N/A';
  if (resourceCost === undefined || resourceCost === null || resourceCost === '') return resourceModel;
  return `${resourceCost} ${resourceModel}`;
};

export function TechniqueLibraryScreen() {
  const [selectedTechniqueId, setSelectedTechniqueId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotSelection>({ type: 'active', index: 0 });
  const [inlineMessage, setInlineMessage] = useState<InlineMessage>(null);

  const {
    loadouts,
    selectedLoadoutId,
    setSelectedLoadout,
    equipTechnique,
    getSlotProgressionSnapshot,
  } = useTechniqueStore((state) => ({
    loadouts: state.loadouts,
    selectedLoadoutId: state.selectedLoadoutId,
    setSelectedLoadout: state.setSelectedLoadout,
    equipTechnique: state.equipTechnique,
    getSlotProgressionSnapshot: state.getSlotProgressionSnapshot,
  }));
  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);
  const realmIndex = useGameStore((state) => state.realm.index);
  const { techniqueLibraryIntent, clearTechniqueLibraryIntent, setHeaderTitles } = useUIStore((state) => ({
    techniqueLibraryIntent: state.techniqueLibraryIntent,
    clearTechniqueLibraryIntent: state.clearTechniqueLibraryIntent,
    setHeaderTitles: state.setHeaderTitles,
  }));

  const progression = useMemo(
    () => getSlotProgressionSnapshot(realmIndex),
    [getSlotProgressionSnapshot, realmIndex],
  );

  const selectedLoadout = useMemo(
    () => loadouts.find((l) => l.id === selectedLoadoutId) ?? loadouts[0],
    [loadouts, selectedLoadoutId],
  );

  const equippedSet = useMemo(() => {
    const ids = new Set<string>();
    loadouts.forEach((loadout) => {
      loadout.slots.active.forEach((id) => id && ids.add(id));
      loadout.slots.passive.forEach((id) => id && ids.add(id));
      if (loadout.slots.ultimate) ids.add(loadout.slots.ultimate);
    });
    return ids;
  }, [loadouts]);

  const ownedTechniques = useMemo(() => {
    return Object.entries(unlockedTechs)
      .filter(([, meta]) => meta?.unlocked)
      .map(([id]) => ({ id, def: techniquesById[id] }))
      .sort((a, b) => {
        const nameA = (a.def?.name || a.id).toLowerCase();
        const nameB = (b.def?.name || b.id).toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [techniquesById, unlockedTechs]);

  useEffect(() => {
    setHeaderTitles('Technique Library', 'Equip techniques, view mastery, and manage loadouts');
  }, [setHeaderTitles]);

  useEffect(() => {
    if (techniqueLibraryIntent?.type !== 'equip') return;

    const { techniqueId, preferredSlotType } = techniqueLibraryIntent;
    const def = techniquesById[techniqueId];
    const preferred = preferredSlotType ?? techniqueType(def);
    const defaultSelection: SlotSelection = { type: preferred, index: 0 };
    const unlockedCounts = progression.unlocked;

    if (preferred === 'ultimate' && !unlockedCounts.ultimate) {
      const realmName = progression.unlockRequirements.ultimate?.realmName || REALMS[3]?.name || 'later realms';
      setInlineMessage({
        type: 'error',
        text: `You learned an Ultimate technique, but the Ultimate slot is locked until ${realmName}.`,
      });
    } else if (preferred === 'active' && unlockedCounts.active <= 0) {
      const realmName = progression.unlockRequirements.active[0]?.realmName || REALMS[1]?.name || 'later realms';
      setInlineMessage({ type: 'error', text: `No active slots are available yet. Unlocks at: ${realmName}.` });
    } else if (preferred === 'passive' && unlockedCounts.passive <= 0) {
      const realmName = progression.unlockRequirements.passive[0]?.realmName || REALMS[2]?.name || 'later realms';
      setInlineMessage({ type: 'error', text: `No passive slots are available yet. Unlocks at: ${realmName}.` });
    } else {
      setSelectedSlot(defaultSelection);
    }

    setSelectedTechniqueId(techniqueId);
    clearTechniqueLibraryIntent();
  }, [
    clearTechniqueLibraryIntent,
    progression.unlocked,
    techniqueLibraryIntent,
    techniquesById,
  ]);

  useEffect(() => {
    const { type, index } = selectedSlot;
    if (type === 'ultimate' && !progression.unlocked.ultimate) {
      setSelectedSlot({ type: 'active', index: 0 });
    } else if (type !== 'ultimate') {
      const unlockedCount = type === 'active' ? progression.unlocked.active : progression.unlocked.passive;
      if (index >= unlockedCount) {
        setSelectedSlot({ type, index: Math.max(0, unlockedCount - 1) });
      }
    }
  }, [progression.unlocked, selectedSlot]);

  const handleSlotClick = useCallback(
    (slot: SlotSelection) => {
      const isUnlocked =
        slot.type === 'ultimate'
          ? progression.unlocked.ultimate
          : slot.index < (slot.type === 'active' ? progression.unlocked.active : progression.unlocked.passive);

      if (!isUnlocked) {
        const requirement =
          slot.type === 'ultimate'
            ? progression.unlockRequirements.ultimate
            : progression.unlockRequirements[slot.type][slot.index];

        const realmName = requirement?.realmName || 'a higher realm';
        setInlineMessage({ type: 'error', text: `That slot is locked. Unlocks at: ${realmName}.` });
        return;
      }

      setSelectedSlot(slot);
      setInlineMessage(null);
    },
    [progression.unlockRequirements, progression.unlocked],
  );

  const handleEquip = useCallback(() => {
    if (!selectedTechniqueId || !selectedLoadout) return;

    const result = equipTechnique(selectedSlot.type, selectedSlot.index, selectedTechniqueId, selectedLoadout.id);

    if (result.ok) {
      setInlineMessage({
        type: 'success',
        text: `Equipped to ${slotLabel(selectedSlot)} on ${selectedLoadout.name}.`,
      });
    } else {
      const unlockText = result.unlockAt ? ` Unlocks at: ${result.unlockAt.realmName}.` : '';
      setInlineMessage({ type: 'error', text: `${result.message}${unlockText}` });
    }
  }, [equipTechnique, selectedLoadout, selectedSlot, selectedTechniqueId]);

  const renderSlotRow = (slot: SlotSelection, techId: string | null | undefined) => {
    const isSelected = selectedSlot.type === slot.type && selectedSlot.index === slot.index;
    const isUnlocked =
      slot.type === 'ultimate'
        ? progression.unlocked.ultimate
        : slot.index < (slot.type === 'active' ? progression.unlocked.active : progression.unlocked.passive);
    const requirement =
      slot.type === 'ultimate'
        ? progression.unlockRequirements.ultimate
        : progression.unlockRequirements[slot.type][slot.index];
    const techName = techId ? techniquesById[techId]?.name || techId : '';

    return (
      <div
        key={`${slot.type}-${slot.index}`}
        className={`techniqueLibrarySlotRow ${isSelected ? 'is-selected' : ''} ${isUnlocked ? '' : 'is-locked'}`}
        onClick={() => handleSlotClick(slot)}
        title={!isUnlocked ? 'Breakthrough to unlock this meridian.' : undefined}
      >
        <div className="techniqueLibrarySlotLabel">{slotLabel(slot)}</div>
        <div className="techniqueLibrarySlotContent">
          {isUnlocked ? (
            techName ? (
              <span className="techniqueLibrarySlotTechName">{techName}</span>
            ) : (
              <span className="techniqueLibrarySlotEmpty">(Empty)</span>
            )
          ) : (
            <div className="techniqueLibrarySlotLocked">
              <div>(Locked)</div>
              {requirement?.realmName && (
                <div className="techniqueLibrarySlotSubtext">Unlocks at: {requirement.realmName}</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectedTechDef = selectedTechniqueId ? techniquesById[selectedTechniqueId] : undefined;
  const effectText = selectedTechDef
    ? String(selectedTechDef.effect ?? 'No effect description available.')
    : 'No effect description available.';
  const mastery75Text = selectedTechDef?.secondaryAtMastery75
    ? String(selectedTechDef.secondaryAtMastery75)
    : null;
  const selectedSlotTechId = selectedLoadout
    ? selectedSlot.type === 'ultimate'
      ? selectedLoadout.slots.ultimate
      : selectedLoadout.slots[selectedSlot.type]?.[selectedSlot.index]
    : '';

  const equipButtonLabel = selectedSlotTechId && selectedSlotTechId !== selectedTechniqueId ? 'Swap' : 'Equip';
  const equipDisabled = !selectedTechniqueId || !selectedLoadout;

  return (
    <div className="techniqueLibraryRoot">
      <div className="techniqueLibraryColumn techniqueLibraryColumn--left">
        <div className="techniqueLibraryPanel">
          <div className="techniqueLibraryPanelHeader">Loadouts</div>
          <div className="techniqueLibraryLoadouts">
            {loadouts.map((loadout) => (
              <button
                key={loadout.id}
                className={`techniqueLibraryLoadout ${loadout.id === selectedLoadout?.id ? 'is-active' : ''}`}
                onClick={() => setSelectedLoadout(loadout.id)}
              >
                <div className="techniqueLibraryLoadoutName">{loadout.name}</div>
                <div className="techniqueLibraryLoadoutMeta">AI: {loadout.aiProfile}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="techniqueLibraryPanel">
          <div className="techniqueLibraryPanelHeader">Slots</div>
          <div className="techniqueLibrarySlots">
            <div className="techniqueLibrarySlotGroupLabel">Active Techniques</div>
            {Array.from({ length: progression.displayed.active }).map((_, idx) =>
              renderSlotRow({ type: 'active', index: idx }, selectedLoadout?.slots.active[idx]),
            )}

            <div className="techniqueLibrarySlotGroupLabel">Passive Techniques</div>
            {Array.from({ length: progression.displayed.passive }).map((_, idx) =>
              renderSlotRow({ type: 'passive', index: idx }, selectedLoadout?.slots.passive[idx]),
            )}

            <div className="techniqueLibrarySlotGroupLabel">Ultimate</div>
            {renderSlotRow({ type: 'ultimate', index: 0 }, selectedLoadout?.slots.ultimate)}
          </div>
        </div>
      </div>

      <div className="techniqueLibraryColumn techniqueLibraryColumn--center">
        <div className="techniqueLibraryPanel">
          <div className="techniqueLibraryPanelHeader">Owned Techniques</div>
          <div className="techniqueLibraryOwnedList">
            {ownedTechniques.length === 0 ? (
              <div className="techniqueLibraryEmptyState">
                No techniques learned yet. Buy a Manual in the Manual Pavilion, then Study it to learn the Technique.
              </div>
            ) : (
              ownedTechniques.map(({ id, def }) => {
                const type = techniqueType(def);
                return (
                  <button
                    key={id}
                    className={`techniqueLibraryOwnedRow ${selectedTechniqueId === id ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedTechniqueId(id);
                      setInlineMessage(null);
                    }}
                  >
                    <div className="techniqueLibraryOwnedName">{def?.name || id}</div>
                    <div className="techniqueLibraryOwnedBadges">
                      <span className={`techniqueLibraryTypeBadge type-${type}`}>{type === 'ultimate' ? 'Ultimate' : type === 'passive' ? 'Passive' : 'Active'}</span>
                      {equippedSet.has(id) && <span className="techniqueLibraryEquippedBadge">Equipped</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="techniqueLibraryColumn techniqueLibraryColumn--right">
        <div className="techniqueLibraryPanel">
          <div className="techniqueLibraryPanelHeader">Technique Details</div>
          <div className="techniqueLibraryDetail">
            {selectedTechniqueId ? (
              <>
                <h3 className="techniqueLibraryDetailTitle">{selectedTechDef?.name || selectedTechniqueId}</h3>
                <div className="techniqueLibraryDetailSection">
                  <div className="techniqueLibraryDetailLine">
                    <strong>In combat:</strong> {effectText}
                  </div>
                  {mastery75Text && (
                    <div className="techniqueLibraryDetailLine">
                      <strong>At Mastery 75:</strong> {mastery75Text}
                    </div>
                  )}
                </div>

                <div className="techniqueLibraryDetailStats">
                  <div>
                    <div className="techniqueLibraryStatLabel">Cooldown</div>
                    <div className="techniqueLibraryStatValue">
                      {selectedTechDef?.cooldownSec !== undefined ? `${selectedTechDef.cooldownSec}s` : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="techniqueLibraryStatLabel">Resource</div>
                    <div className="techniqueLibraryStatValue">
                      {formatResourceCost(selectedTechDef?.resourceModel as string, selectedTechDef?.resourceCost)}
                    </div>
                  </div>
                  {selectedTechDef?.path && (
                    <div>
                      <div className="techniqueLibraryStatLabel">Path</div>
                      <div className="techniqueLibraryStatValue">{selectedTechDef.path}</div>
                    </div>
                  )}
                  {selectedTechDef?.role && (
                    <div>
                      <div className="techniqueLibraryStatLabel">Role</div>
                      <div className="techniqueLibraryStatValue">{selectedTechDef.role}</div>
                    </div>
                  )}
                  {selectedTechDef?.tags?.length ? (
                    <div className="techniqueLibraryTags">
                      {selectedTechDef.tags.map((tag) => (
                        <span key={tag} className="techniqueLibraryTag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="techniqueLibraryButtons">
                  <button
                    className="techniqueLibraryPrimaryButton"
                    disabled={equipDisabled}
                    onClick={handleEquip}
                  >
                    {equipButtonLabel}
                  </button>
                  <button className="techniqueLibraryDisabledButton" title="Implemented in P5" disabled>
                    Upgrade Rank
                  </button>
                  <button className="techniqueLibraryDisabledButton" title="Implemented in P5" disabled>
                    Reroll Traits
                  </button>
                  <button className="techniqueLibraryDisabledButton" title="Implemented in P5" disabled>
                    Socket Rune
                  </button>
                  <button className="techniqueLibraryDisabledButton" title="Implemented in P5" disabled>
                    Favorite
                  </button>
                </div>
              </>
            ) : (
              <div className="techniqueLibraryEmptyDetail">Select a technique to see details and equip it.</div>
            )}
          </div>
        </div>

        {inlineMessage && (
          <div className={`techniqueLibraryInlineMessage inline-${inlineMessage.type}`}>
            {inlineMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
