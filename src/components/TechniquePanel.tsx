import { useTechniqueStore } from '../stores/techniqueStore';
import { useGameStore } from '../stores/gameStore';
import { D } from '../utils/numbers';
import './TechniquePanel.scss';

export function TechniquePanel() {
  const {
    techniques,
    currentIntent,
    maxIntent,
    useTechnique: executeTechnique,
    canUseTechnique,
  } = useTechniqueStore();
  const selectedPath = useGameStore((state) => state.selectedPath);

  if (!selectedPath) return null;

  const pathTechniques = Object.values(techniques).filter(
    (t) => t.path === selectedPath && t.unlocked
  );

  if (pathTechniques.length === 0) return null;

  // Calculate intent percentage
  const intentPercent = D(currentIntent).dividedBy(D(maxIntent)).times(100).toNumber();

  return (
    <div className={'techniquePanelRoot'}>
      <h3 className={'techniquePanelTitle'}>Techniques</h3>

      {/* Intent Bar */}
      <div className={'techniquePanelIntentSection'}>
        <div className={'techniquePanelIntentHeader'}>
          <span className={'techniquePanelIntentLabel'}>Intent</span>
          <span className={'techniquePanelIntentValue'}>
            {D(currentIntent).toFixed(0)} / {D(maxIntent).toFixed(0)}
          </span>
        </div>
        <div className={'techniquePanelIntentBar'}>
          <div className={'techniquePanelIntentFill'} style={{ width: `${intentPercent}%` }} />
        </div>
      </div>

      {/* Techniques List */}
      <div className={'techniquePanelTechniqueList'}>
        {pathTechniques.map((tech) => {
          const canUse = canUseTechnique(tech.id);
          const cooldownPercent = Math.min(
            ((Date.now() - tech.lastUsed) / tech.cooldown) * 100,
            100
          );
          const isOnCooldown = Date.now() - tech.lastUsed < tech.cooldown;
          const proficiencyPercent =
            (tech.proficiency % 1000) / 10;

          // Tier-based styling
          const getTierClass = () => {
            switch (tech.tier) {
              case 1:
                return 'techniquePanelTier1';
              case 2:
                return 'techniquePanelTier2';
              case 3:
                return 'techniquePanelTier3';
              default:
                return 'techniquePanelTierDefault';
            }
          };

          const tierClass = getTierClass();

          return (
            <div
              key={tech.id}
              className={`${'techniquePanelTechniqueCard'} ${tierClass} ${
                canUse && !isOnCooldown ? '' : 'techniquePanelDisabled'
              }`}
              onClick={() => canUse && !isOnCooldown && executeTechnique(tech.id)}
            >
              {/* Header */}
              <div className={'techniquePanelTechniqueHeader'}>
                <div className={'techniquePanelTechniqueName'}>
                  {tech.name}
                </div>
                <div className={'techniquePanelLevelBadge'}>
                  Lv {tech.level}
                </div>
              </div>

              {/* Description */}
              <p className={'techniquePanelTechniqueDescription'}>
                {tech.description}
              </p>

              {/* Stats */}
              <div className={'techniquePanelTechniqueStats'}>
                <span className={'techniquePanelIntentCost'}>
                  💫 {tech.intentCost} Intent
                </span>
                <span className={'techniquePanelCooldownLabel'}>
                  ⏱️ CD: {(tech.cooldown / 1000).toFixed(1)}s
                </span>
              </div>

              {/* Cooldown Bar */}
              {isOnCooldown && (
                <div className={'techniquePanelCooldownBar'}>
                  <div className={'techniquePanelCooldownFill'} style={{ width: `${cooldownPercent}%` }} />
                </div>
              )}

              {/* Proficiency Bar */}
              <div>
                <div className={'techniquePanelProficiencyHeader'}>
                  <span>Proficiency</span>
                  <span className={'techniquePanelProficiencyValue'}>
                    {tech.proficiency % 1000} / 1000
                  </span>
                </div>
                <div className={'techniquePanelProficiencyBar'}>
                  <div className={'techniquePanelProficiencyFill'} style={{ width: `${proficiencyPercent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-cast Indicator */}
      <div className={'techniquePanelFooterNote'}>
        ✨ Techniques auto-cast in combat
      </div>
    </div>
  );
}
