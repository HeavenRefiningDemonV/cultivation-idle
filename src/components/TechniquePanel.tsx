import { useTechniqueStore } from '../stores/techniqueStore.js';
import { useContentStore } from '../stores/contentStore.js';
import { useUIStore } from '../stores/uiStore.js';
import './TechniquePanel.scss';

export function TechniquePanel() {
  const loadouts = useTechniqueStore((state) => state.loadouts);
  const selectedLoadoutId = useTechniqueStore((state) => state.selectedLoadoutId);
  const setSelectedLoadout = useTechniqueStore((state) => state.setSelectedLoadout);
  const getEquippedTechIds = useTechniqueStore((state) => state.getEquippedTechIds);
  const getSelectedAiProfile = useTechniqueStore((state) => state.getSelectedAiProfile);
  const { maps } = useContentStore();
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  const selectedProfile = getSelectedAiProfile();

  const getTechniqueName = (techId: string | null) => {
    if (!techId) return 'Empty Slot';
    return maps.techniquesById[techId]?.name ?? techId;
  };

  return (
    <div className={'techniquePanelRoot'}>
      <div className={'techniquePanelHeaderRow'}>
        <h3 className={'techniquePanelTitle'}>Technique Loadouts</h3>
        <button className={'techniquePanelOpenLibrary'} onClick={() => setActiveTab('techniques')}>
          Open Technique Library
        </button>
      </div>
      <p className={'techniquePanelFooterNote'}>
        Loadouts are used by your AI during combat. Switching loadouts adjusts priorities but techniques still
        auto-cast.
      </p>

      <div className={'techniquePanelTechniqueList'}>
        {loadouts.map((loadout) => {
          const isSelected = loadout.id === selectedLoadoutId;
          const equipped = getEquippedTechIds(loadout.id);

          return (
            <div
              key={loadout.id}
              className={`techniquePanelTechniqueCard ${isSelected ? 'techniquePanelTier1' : ''}`}
              onClick={() => setSelectedLoadout(loadout.id)}
            >
              <div className={'techniquePanelTechniqueHeader'}>
                <div className={'techniquePanelTechniqueName'}>{loadout.name}</div>
                <div className={'techniquePanelLevelBadge'}>{isSelected ? 'Selected' : 'Tap to select'}</div>
              </div>

              <p className={'techniquePanelTechniqueDescription'}>
                AI Profile: <strong>{loadout.aiProfile}</strong>
                {isSelected && ` (active)`}
              </p>

              <div className={'techniquePanelTechniqueStats'}>
                <span className={'techniquePanelIntentCost'}>Active: {equipped.active.map(getTechniqueName).join(', ') || 'Empty'}</span>
                <span className={'techniquePanelCooldownLabel'}>
                  Passive: {equipped.passive.map(getTechniqueName).join(', ') || 'Empty'}
                </span>
              </div>

              <div className={'techniquePanelProficiencyHeader'}>
                Ultimate: {getTechniqueName(equipped.ultimate)}
              </div>
            </div>
          );
        })}
      </div>

      <div className={'techniquePanelFooterNote'}>Current AI profile: {selectedProfile}</div>
    </div>
  );
}
