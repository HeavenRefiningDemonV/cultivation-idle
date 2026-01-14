import { useEffect, useMemo, useState } from 'react';
import './TechniqueLearnedModal.scss';
import { useUIStore } from '../../stores/uiStore';
import { useContentStore } from '../../stores/contentStore';
import { useTechniqueStore, type SlotType } from '../../stores/techniqueStore';
import { useTechCollectionStore } from '../../stores/techCollectionStore';
import { GameEvents } from '../../services/events/GameEvents';

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

  const hasTech = useTechCollectionStore((state) => state.hasTech);

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
    setSlotIndex(0);
    setShowEquipPanel(false);
  }, [payload, showModal, techniquesById]);

  const technique = payload ? techniquesById[payload.techId] : undefined;
  const recommendedProfile = useMemo(() => recommendProfile(technique?.tags), [technique?.tags]);

  if (!showModal || !payload) return null;

  const loadout = loadouts.find((l) => l.id === loadoutId) ?? loadouts[0];
  const slotNames = loadout
    ? slotType === 'active'
      ? loadout.slots.active
      : slotType === 'passive'
        ? loadout.slots.passive
        : [loadout.slots.ultimate ?? '']
    : [];

  const slotLabel = (techId: string, index: number) => {
    const name = techId ? techniquesById[techId]?.name ?? techId : 'Empty';
    if (slotType === 'ultimate') {
      return `Ultimate Slot — ${name}`;
    }
    return `Slot ${index + 1} — ${name}`;
  };

  const handleLoadoutChange = (id: string) => {
    setLoadoutId(id);
    setSelectedLoadout(id);
    setSlotIndex(0);
  };

  const handleEquip = () => {
    if (!payload) return;
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
    // Ensure store selected loadout matches the chosen one
    setSelectedLoadout(targetLoadout.id);

    equipTechnique(slotType, slotIndex, payload.techId);
    const after = getEquippedTechIds(targetLoadout.id);
    const equipped =
      slotType === 'active'
        ? after.active[slotIndex] === payload.techId
        : slotType === 'passive'
          ? after.passive[slotIndex] === payload.techId
          : after.ultimate === payload.techId;

    if (!equipped) {
      addNotification('error', 'Unable to equip technique. Check slot compatibility.');
      return;
    }

    addNotification('success', `Equipped Technique: ${technique?.name ?? payload.techId}`);
    closeModal();
  };

  const renderSlotPicker = () => {
    if (!loadout) return <div className={'techniqueLearnedNote'}>Loadout missing.</div>;
    if (slotType === 'ultimate') {
      return (
        <div className={'techniqueLearnedSlots'}>
          <button
            className={`techniqueSlotButton ${slotIndex === 0 ? 'selected' : ''}`}
            onClick={() => setSlotIndex(0)}
          >
            {slotLabel(slotNames[0] ?? '', 0)}
          </button>
        </div>
      );
    }

    return (
      <div className={'techniqueLearnedSlots'}>
        {slotNames.map((techId, idx) => (
          <button
            key={`${slotType}-${idx}`}
            className={`techniqueSlotButton ${slotIndex === idx ? 'selected' : ''}`}
            onClick={() => setSlotIndex(idx)}
          >
            {slotLabel(techId, idx)}
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
            ✕
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

              <div className={'techniqueEquipConfirm'}>
                <button className={'techniqueLearnedButton'} onClick={handleEquip}>
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
