import { useEffect, useMemo, useState } from 'react';
import './TechniqueLearnedModal.scss';
import { GameIcon } from '../../ui/icons/index.js';
import { useUIStore } from '../../stores/uiStore.js';
import { useContentStore } from '../../stores/contentStore.js';
import { useTechniqueStore, type SlotType } from '../../stores/techniqueStore.js';
import { useGameStore } from '../../stores/gameStore.js';
import { useTechCollectionStore } from '../../stores/techCollectionStore.js';
import { GameEvents } from '../../services/events/GameEvents.js';
import { formatProgressionFloorContextLabel } from '../../systems/builds/loadoutProgressionContract.js';

function recommendProfile(tags?: string[]) {
  const lowered = (tags ?? []).map((tag) => tag.toLowerCase());
  if (lowered.some((tag) => ['shield', 'heal', 'defense', 'defence', 'guard'].includes(tag))) {
    return { label: 'Defensive', mapped: 'Defensive (Survivor)' };
  }
  if (lowered.some((tag) => ['damage', 'burst', 'crit'].includes(tag))) {
    return { label: 'Aggressive', mapped: 'Aggressive (Burst)' };
  }
  return { label: 'Balanced', mapped: 'Balanced (Balanced)' };
}

function slotTypeFromTechnique(type?: string): SlotType {
  if (type === 'passive' || type === 'ultimate') return type;
  return 'active';
}

type SlotButtonModel = {
  slotType: SlotType;
  slotIndex: number;
  techId: string;
  isUnlocked: boolean;
  unlockLabel: string | null;
  title: string;
};

const LOCKED_SLOT_TOOLTIP = 'Breakthrough to unlock this meridian.';

export function TechniqueLearnedModal() {
  const showModal = useUIStore((state) => state.showTechniqueLearnedModal);
  const payload = useUIStore((state) => state.techniqueLearnedPayload);
  const closeModal = useUIStore((state) => state.closeTechniqueLearned);
  const addNotification = useUIStore((state) => state.addNotification);

  const contentMaps = useContentStore((state) => state.maps);
  const techniquesById = contentMaps.techniquesById ?? {};

  const loadouts = useTechniqueStore((state) => state.loadouts);
  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const setSelectedLoadout = useTechniqueStore((state) => state.setSelectedLoadout);
  const equipTechnique = useTechniqueStore((state) => state.equipTechnique);
  const getEquippedTechIds = useTechniqueStore((state) => state.getEquippedTechIds);
  const getSlotProgressionSnapshot = useTechniqueStore((state) => state.getSlotProgressionSnapshot);

  const hasTech = useTechCollectionStore((state) => state.hasTech);
  const realmIndex = useGameStore((state) => state.realm.index);

  const [loadoutId, setLoadoutId] = useState(selectedLoadoutId);
  const [slotType, setSlotType] = useState<SlotType>('active');
  const [slotIndex, setSlotIndex] = useState(0);
  const [showEquipPanel, setShowEquipPanel] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    setLoadoutId(selectedLoadoutId);
  }, [selectedLoadoutId, showModal]);

  useEffect(() => {
    if (!showModal || !payload) return;
    const nextSlotType = slotTypeFromTechnique(techniquesById[payload.techId]?.type);
    setSlotType(nextSlotType);
    setShowEquipPanel(false);
  }, [payload, showModal, techniquesById]);

  const technique = payload ? techniquesById[payload.techId] : undefined;
  const recommendedProfile = useMemo(() => recommendProfile(technique?.tags), [technique?.tags]);
  const progression = useMemo(() => getSlotProgressionSnapshot(realmIndex), [getSlotProgressionSnapshot, realmIndex]);

  const loadout = useMemo(
    () => loadouts.find((l) => l.id === loadoutId) ?? loadouts[0],
    [loadoutId, loadouts],
  );

  const normalizedSlots = useMemo(
    () => (loadout ? getEquippedTechIds(loadout.id) : { active: [], passive: [], ultimate: null }),
    [getEquippedTechIds, loadout, loadouts, progression],
  );

  const slotButtons = useMemo<SlotButtonModel[]>(() => {
    if (!loadout) return [];

    if (slotType === 'ultimate') {
      const unlockLabel = formatProgressionFloorContextLabel(progression.unlockRequirements.ultimate);
      return [{
        slotType: 'ultimate',
        slotIndex: 0,
        techId: normalizedSlots.ultimate ?? '',
        isUnlocked: progression.unlocked.ultimate,
        unlockLabel,
        title: `${unlockLabel ?? ''}${unlockLabel ? ' • ' : ''}${LOCKED_SLOT_TOOLTIP}` ,
      }];
    }

    const displayedCount = progression.displayed[slotType];
    const unlockedCount = progression.unlocked[slotType];
    const storedIds = slotType === 'active' ? normalizedSlots.active : normalizedSlots.passive;

    return Array.from({ length: displayedCount }, (_, index) => {
      const requirement = progression.unlockRequirements[slotType][index];
      const unlockLabel = formatProgressionFloorContextLabel(requirement);
      return {
        slotType,
        slotIndex: index,
        techId: storedIds[index] ?? '',
        isUnlocked: index < unlockedCount,
        unlockLabel,
        title: `${unlockLabel ?? ''}${unlockLabel ? ' • ' : ''}${LOCKED_SLOT_TOOLTIP}` ,
      };
    });
  }, [loadout, normalizedSlots.active, normalizedSlots.passive, normalizedSlots.ultimate, progression, slotType]);

  const firstUnlockedSlotIndex = useMemo(
    () => slotButtons.find((slot) => slot.isUnlocked)?.slotIndex ?? 0,
    [slotButtons],
  );

  useEffect(() => {
    if (!showModal) return;
    setSlotIndex(firstUnlockedSlotIndex);
  }, [firstUnlockedSlotIndex, loadoutId, showModal, slotType]);

  const hasUnlockedCompatibleSlot = slotButtons.some((slot) => slot.isUnlocked);
  const selectedSlotButton = slotButtons.find((slot) => slot.slotIndex === slotIndex) ?? slotButtons[0] ?? null;
  const equipBlockedNote = !hasUnlockedCompatibleSlot
    ? selectedSlotButton?.unlockLabel
      ? `This slot type is still locked. ${selectedSlotButton.unlockLabel}.`
      : 'This slot type is still locked.'
    : null;

  if (!showModal || !payload) return null;

  const slotLabel = (slot: SlotButtonModel) => {
    const name = slot.techId ? techniquesById[slot.techId]?.name ?? slot.techId : 'Empty';
    const unlockSuffix = !slot.isUnlocked && slot.unlockLabel ? ` — ${slot.unlockLabel}` : '';
    if (slot.slotType === 'ultimate') {
      return `Ultimate Slot — ${name}${unlockSuffix}`;
    }
    return `Slot ${slot.slotIndex + 1} — ${name}${unlockSuffix}`;
  };

  const handleLoadoutChange = (id: string) => {
    setLoadoutId(id);
    setSelectedLoadout(id);
  };

  const handleEquip = () => {
    if (!payload) return;
    if (!hasUnlockedCompatibleSlot || !selectedSlotButton?.isUnlocked) {
      addNotification('error', equipBlockedNote ?? 'That slot is locked.');
      return;
    }

    GameEvents.emit({ type: 'techniques/equip_now_clicked', payload: { techniqueId: payload.techId } });
    const targetLoadout = loadouts.find((l) => l.id === loadoutId) ?? loadouts[0];
    if (!targetLoadout) {
      addNotification('error', 'No loadout available to equip.');
      return;
    }
    if (!hasTech(payload.techId)) {
      addNotification('error', 'Technique is not learned yet.');
      return;
    }

    setSelectedLoadout(targetLoadout.id);

    const result = equipTechnique(slotType, slotIndex, payload.techId, targetLoadout.id);
    if (!result.ok) {
      addNotification('error', result.unlockAt ? `${result.message} Unlocks at ${result.unlockAt.realmName}.` : result.message);
      return;
    }

    addNotification('success', `Equipped Technique: ${technique?.name ?? payload.techId}`);
    closeModal();
  };

  const renderSlotPicker = () => {
    if (!loadout) return <div className={'techniqueLearnedNote'}>Loadout missing.</div>;

    return (
      <div className={'techniqueLearnedSlots'}>
        {slotButtons.map((slot) => (
          <button
            key={`${slot.slotType}-${slot.slotIndex}`}
            className={`techniqueSlotButton ${slotIndex === slot.slotIndex ? 'selected' : ''}`}
            onClick={() => setSlotIndex(slot.slotIndex)}
            disabled={!slot.isUnlocked}
            title={!slot.isUnlocked ? slot.title : undefined}
          >
            {slotLabel(slot)}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={'techniqueLearnedOverlay'}>
      <div className={'techniqueLearnedModal'}>
        <div className={'techniqueLearnedHeader'}>
          <div>
            <div className={'techniqueLearnedTitle'}>Technique Learned</div>
            <div className={'techniqueLearnedSubtitle'}>Auto-Used in Combat when equipped.</div>
          </div>
          <button className={'techniqueLearnedClose'} onClick={closeModal} aria-label="Close Technique Learned modal">
            <GameIcon icon="inkX" size={14} decorative />
          </button>
        </div>

        <div className={'techniqueLearnedBody'}>
          <div className={'techniqueLearnedCard'}>
            <div className={'techniqueLearnedName'}>{technique?.name ?? payload.techId}</div>
            <div className={'techniqueLearnedMeta'}>
              <span className={`techBadge rarity-${payload.rarity}`}>{payload.rarity}</span>
              <span className={'techBadge'}>{payload.grade}</span>
              {technique?.type && <span className={'techBadge'}>{technique.type}</span>}
              {technique?.path && <span className={'techBadge'}>{technique.path}</span>}
            </div>
            {technique?.role && <div className={'techniqueLearnedNote'}>Role: {technique.role}</div>}
            <div className={'techniqueLearnedNote'}>
              Recommended AI Profile: {recommendedProfile.label} ({recommendedProfile.mapped})
            </div>
          </div>

          <div className={'techniqueLearnedActions'}>
            <button className={'techniqueLearnedButton'} onClick={() => setShowEquipPanel(true)}>
              Equip Technique
            </button>
            <button className={'techniqueLearnedButton techniqueLearnedButtonSecondary'} onClick={closeModal}>
              Close
            </button>
          </div>

          {showEquipPanel && (
            <div className={'techniqueEquipPanel'}>
              <div className={'techniqueEquipHeader'}>Equip Technique</div>
              <div className={'techniqueEquipRow'}>
                <label className={'techniqueEquipLabel'} htmlFor="technique-equip-loadout">
                  Loadout
                </label>
                <select
                  id="technique-equip-loadout"
                  className={'techniqueEquipSelect'}
                  value={loadout?.id ?? loadoutId}
                  onChange={(e) => handleLoadoutChange(e.target.value)}
                >
                  {loadouts.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — AI: {l.aiProfile}
                    </option>
                  ))}
                </select>
              </div>

              <div className={'techniqueEquipRow'}>
                <div className={'techniqueEquipLabel'}>Slot</div>
                {renderSlotPicker()}
              </div>

              <div className={'techniqueEquipFootnote'}>Chosen slot type: {slotType}</div>
              {equipBlockedNote && <div className={'techniqueLearnedNote'}>{equipBlockedNote}</div>}

              <div className={'techniqueEquipConfirm'}>
                <button className={'techniqueLearnedButton'} onClick={handleEquip} disabled={!hasUnlockedCompatibleSlot}>
                  Equip Technique
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
