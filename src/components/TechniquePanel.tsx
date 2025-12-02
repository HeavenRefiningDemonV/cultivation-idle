import { useTechniqueStore } from '../stores/techniqueStore';
import { useGameStore } from '../stores/gameStore';
import { D } from '../utils/numbers';
import styles from './TechniquePanel.module.css';

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
    <div className={styles.root}>
      <h3 className={styles.title}>Techniques</h3>

      {/* Intent Bar */}
      <div className={styles.intentSection}>
        <div className={styles.intentHeader}>
          <span className={styles.intentLabel}>Intent</span>
          <span className={styles.intentValue}>
            {D(currentIntent).toFixed(0)} / {D(maxIntent).toFixed(0)}
          </span>
        </div>
        <div className={styles.intentBar}>
          <div className={styles.intentFill} style={{ width: `${intentPercent}%` }} />
        </div>
      </div>

      {/* Techniques List */}
      <div className={styles.techniqueList}>
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
                return styles.tier1;
              case 2:
                return styles.tier2;
              case 3:
                return styles.tier3;
              default:
                return styles.tierDefault;
            }
          };

          const tierClass = getTierClass();

          return (
            <div
              key={tech.id}
              className={`${styles.techniqueCard} ${tierClass} ${
                canUse && !isOnCooldown ? '' : styles.disabled
              }`}
              onClick={() => canUse && !isOnCooldown && executeTechnique(tech.id)}
            >
              {/* Header */}
              <div className={styles.techniqueHeader}>
                <div className={styles.techniqueName}>
                  {tech.name}
                </div>
                <div className={styles.levelBadge}>
                  Lv {tech.level}
                </div>
              </div>

              {/* Description */}
              <p className={styles.techniqueDescription}>
                {tech.description}
              </p>

              {/* Stats */}
              <div className={styles.techniqueStats}>
                <span className={styles.intentCost}>
                  💫 {tech.intentCost} Intent
                </span>
                <span className={styles.cooldownLabel}>
                  ⏱️ CD: {(tech.cooldown / 1000).toFixed(1)}s
                </span>
              </div>

              {/* Cooldown Bar */}
              {isOnCooldown && (
                <div className={styles.cooldownBar}>
                  <div className={styles.cooldownFill} style={{ width: `${cooldownPercent}%` }} />
                </div>
              )}

              {/* Proficiency Bar */}
              <div>
                <div className={styles.proficiencyHeader}>
                  <span>Proficiency</span>
                  <span className={styles.proficiencyValue}>
                    {tech.proficiency % 1000} / 1000
                  </span>
                </div>
                <div className={styles.proficiencyBar}>
                  <div className={styles.proficiencyFill} style={{ width: `${proficiencyPercent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-cast Indicator */}
      <div className={styles.footerNote}>
        ✨ Techniques auto-cast in combat
      </div>
    </div>
  );
}
