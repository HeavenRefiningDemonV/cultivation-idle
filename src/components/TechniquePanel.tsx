import { useTechniqueStore } from '../stores/techniqueStore';
import { useContentStore } from '../stores/contentStore';
import './TechniquePanel.scss';

export function TechniquePanel() {
  const { loadouts, selectedLoadoutId, setSelectedLoadout, getEquippedTechIds, getSelectedAiProfile } =
    useTechniqueStore();
  const { maps } = useContentStore();

  const selectedProfile = getSelectedAiProfile();

  const getTechniqueName = (techId: string | null) => {
    if (!techId) return 'Empty Slot';
    return maps.techniquesById[techId]?.name ?? techId;
  };

  return (
    <div className={'techniquePanelRoot'}>
      <h3 className={'techniquePanelTitle'}>Technique Loadouts</h3>
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
