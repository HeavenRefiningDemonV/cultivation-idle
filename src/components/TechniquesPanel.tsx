import { useMemo, type ChangeEvent } from 'react';
import type { TechniqueDef } from '../content';
import { useContentStore } from '../stores/contentStore';
import { useTechCollectionStore } from '../stores/techCollectionStore';
import { useTechniqueStore, type AiProfile } from '../stores/techniqueStore';

const aiProfiles: AiProfile[] = ['balanced', 'survivor', 'burst', 'farmer'];

function getDisplayName(def: TechniqueDef | undefined, techId: string) {
  if (def?.name) return def.name;
  return `Unknown technique (${techId})`;
}

function isPassive(def: TechniqueDef | undefined) {
  if (!def) return false;
  if (def.type === 'passive') return true;
  return def.tags?.some((tag) => tag.toLowerCase() === 'passive') ?? false;
}

function isUltimate(def: TechniqueDef | undefined) {
  return def?.type === 'ultimate';
}

function describeTags(def: TechniqueDef | undefined) {
  return def?.tags?.join(', ') ?? '—';
}

export function TechniquesPanel() {
  const { loadouts, selectedLoadoutId, setSelectedLoadout, setAiProfile, equipTechnique } =
    useTechniqueStore();
  const unlockedTechs = useTechCollectionStore((state) => state.unlockedTechs);
  const techniquesById = useContentStore((state) => state.maps.techniquesById);

  const selectedLoadout = useMemo(() => {
    return loadouts.find((loadout) => loadout.id === selectedLoadoutId);
  }, [loadouts, selectedLoadoutId]);

  const unlockedList = useMemo(() => {
    return Object.entries(unlockedTechs)
      .filter(([, meta]) => meta?.unlocked)
      .map(([techId]) => ({ id: techId, def: techniquesById[techId] }))
      .sort((a, b) => getDisplayName(a.def, a.id).localeCompare(getDisplayName(b.def, b.id)));
  }, [techniquesById, unlockedTechs]);

  const activeCandidates = unlockedList.filter((entry) => !isPassive(entry.def) && !isUltimate(entry.def));
  const passiveCandidates = unlockedList.filter((entry) => isPassive(entry.def));
  const ultimateCandidates = unlockedList.filter((entry) => isUltimate(entry.def));

  const handleLoadoutChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedLoadout(event.target.value);
  };

  const handleAiProfileChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!selectedLoadout) return;
    setAiProfile(selectedLoadout.id, event.target.value as AiProfile);
  };

  const handleEquip = (slotType: 'active' | 'passive' | 'ultimate', index: number) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      equipTechnique(slotType, index, event.target.value);
    };

  const activeSlots = selectedLoadout?.slots.active ?? ['', ''];
  const passiveSlots = selectedLoadout?.slots.passive ?? [''];
  const ultimateSlot = selectedLoadout?.slots.ultimate ?? null;

  return (
    <div className={'worldScreenPlaceholder'}>
      <div className={'worldScreenPlaceholderHeader'}>
        <div className={'worldScreenPlaceholderTitle'}>Techniques</div>
        <div className={'worldScreenPlaceholderKey'}>techniquesPanel</div>
      </div>

      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine'}>
          <label>
            Loadout:{' '}
            <select value={selectedLoadoutId} onChange={handleLoadoutChange}>
              {loadouts.map((loadout) => (
                <option key={loadout.id} value={loadout.id}>
                  {loadout.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className={'worldScreenPlaceholderLine'}>
          <label>
            AI Profile:{' '}
            <select value={selectedLoadout?.aiProfile ?? 'balanced'} onChange={handleAiProfileChange}>
              {aiProfiles.map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine worldScreenHighlight'}>Active Slots</div>
        {activeSlots.map((techId, index) => (
          <div key={`active-${index}`} className={'worldScreenPlaceholderLine'}>
            Slot {index + 1}:{' '}
            <select value={techId} onChange={handleEquip('active', index)}>
              <option value="">(Empty)</option>
              {activeCandidates.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {getDisplayName(entry.def, entry.id)}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className={'worldScreenPlaceholderLine worldScreenHighlight'}>Passive Slot</div>
        <div className={'worldScreenPlaceholderLine'}>
          <select value={passiveSlots[0]} onChange={handleEquip('passive', 0)}>
            <option value="">(Empty)</option>
            {passiveCandidates.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {getDisplayName(entry.def, entry.id)}
              </option>
            ))}
          </select>
        </div>

        <div className={'worldScreenPlaceholderLine worldScreenHighlight'}>Ultimate</div>
        <div className={'worldScreenPlaceholderLine'}>
          <select value={ultimateSlot ?? ''} onChange={handleEquip('ultimate', 0)} disabled={ultimateCandidates.length === 0}>
            <option value="">{ultimateCandidates.length === 0 ? 'Coming later' : '(Empty)'}</option>
            {ultimateCandidates.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {getDisplayName(entry.def, entry.id)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={'worldScreenPlaceholderBody'}>
        <div className={'worldScreenPlaceholderLine worldScreenHighlight'}>Unlocked techniques</div>
        {unlockedList.length === 0 && (
          <div className={'worldScreenPlaceholderLine'}>Buy manuals to unlock techniques.</div>
        )}
        {unlockedList.map((entry) => (
          <div key={entry.id} className={'worldScreenPlaceholderLine'}>
            <div>{getDisplayName(entry.def, entry.id)}</div>
            <div>
              Tags: {describeTags(entry.def)}
              {entry.def?.cooldownSec ? ` • Cooldown: ${entry.def.cooldownSec}s` : ''}
              {entry.def?.resourceCost ? ` • Cost: ${entry.def.resourceCost}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechniquesPanel;
