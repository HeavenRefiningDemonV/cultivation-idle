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
    <div className="technique-panel">
      <h3 className="technique-panel__title">Techniques</h3>

      {/* Intent Bar */}
      <div className="technique-panel__intent">
        <div className="technique-panel__intent-header">
          <span className="technique-panel__intent-label">Intent</span>
          <span className="technique-panel__intent-value">
            {D(currentIntent).toFixed(0)} / {D(maxIntent).toFixed(0)}
          </span>
        </div>
        <div className="technique-panel__intent-bar">
          <div className="technique-panel__intent-fill" style={{ width: `${intentPercent}%` }} />
        </div>
      </div>

      {/* Techniques List */}
      <div className="technique-panel__list">
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
                return 'technique-panel__card--tier1';
              case 2:
                return 'technique-panel__card--tier2';
              case 3:
                return 'technique-panel__card--tier3';
              default:
                return 'technique-panel__card--tier-default';
            }
          };

          const tierClass = getTierClass();

          return (
            <div
              key={tech.id}
              className={`technique-panel__card ${tierClass} ${
                canUse && !isOnCooldown ? '' : 'technique-panel__card--disabled'
              }`}
              onClick={() => canUse && !isOnCooldown && executeTechnique(tech.id)}
            >
              {/* Header */}
              <div className="technique-panel__card-header">
                <div className="technique-panel__card-name">
                  {tech.name}
                </div>
                <div className="technique-panel__level-badge">
                  Lv {tech.level}
                </div>
              </div>

              {/* Description */}
              <p className="technique-panel__description">
                {tech.description}
              </p>

              {/* Stats */}
              <div className="technique-panel__stats">
                <span className="technique-panel__intent-cost">
                  💫 {tech.intentCost} Intent
                </span>
                <span className="technique-panel__cooldown-label">
                  ⏱️ CD: {(tech.cooldown / 1000).toFixed(1)}s
                </span>
              </div>

              {/* Cooldown Bar */}
              {isOnCooldown && (
                <div className="technique-panel__cooldown-bar">
                  <div className="technique-panel__cooldown-fill" style={{ width: `${cooldownPercent}%` }} />
                </div>
              )}

              {/* Proficiency Bar */}
              <div>
                <div className="technique-panel__proficiency-header">
                  <span>Proficiency</span>
                  <span className="technique-panel__proficiency-value">
                    {tech.proficiency % 1000} / 1000
                  </span>
                </div>
                <div className="technique-panel__proficiency-bar">
                  <div className="technique-panel__proficiency-fill" style={{ width: `${proficiencyPercent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-cast Indicator */}
      <div className="technique-panel__footer">
        ✨ Techniques auto-cast in combat
      </div>
    </div>
  );
}
