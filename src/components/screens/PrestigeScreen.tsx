import { useState } from 'react';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import styles from './PrestigeScreen.module.css';

export function PrestigeScreen() {
  const {
    totalAP,
    lifetimeAP,
    prestigeCount,
    prestigeRuns,
    upgrades,
    calculateAPGain,
    canPrestige,
    performPrestige,
    purchaseUpgrade,
  } = usePrestigeStore();

  const realm = useGameStore((state) => state.realm);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const apGain = calculateAPGain();
  const canPrestigeNow = canPrestige();
  const requirePrestigeConfirm = useUIStore((state) => state.settings.requirePrestigeConfirm);

  const handlePrestige = () => {
    if (!canPrestigeNow) return;

    if (requirePrestigeConfirm) {
      setShowConfirmation(true);
      return;
    }

    performPrestige();
  };

  const confirmPrestige = () => {
    performPrestige();
    setShowConfirmation(false);
  };

  const realmNames = [
    'Qi Refining',
    'Foundation Establishment',
    'Core Formation',
    'Nascent Soul',
    'Soul Formation',
    'Void Tribulation',
    'Mahayana',
    'True Immortal',
  ];

  return (
    <div className={styles.root}>
      <div className={styles.background} />

      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Reincarnation</h1>
          <p className={styles.subtitle}>Restart your cultivation journey with powerful blessings</p>
        </div>

        {/* AP Display */}
        <div className={styles.apCard}>
          <div className={styles.apValue}>{totalAP}</div>
          <div className={styles.apLabel}>Ascension Points Available</div>
          <div className={styles.apMeta}>
            {lifetimeAP} Total Earned • {prestigeCount} Reincarnations
          </div>
        </div>

        {/* Current Run & Benefits */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Current Run</h3>
            <div className={styles.infoRows}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Current Realm:</span>
                <span className={styles.infoValue}>{realmNames[realm?.index || 0] || 'Unknown'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Potential AP Gain:</span>
                <span className={styles.infoValueAccent}>+{apGain} AP</span>
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <h3 className={styles.infoTitle}>Reincarnation Benefits</h3>
            <ul className={styles.benefitsList}>
              <li>✓ Keep all Ascension Points</li>
              <li>✓ Keep all AP upgrades</li>
              <li>✓ Keep spirit root floor level</li>
              <li>✓ Unlock new content faster</li>
              <li>✗ Reset cultivation progress</li>
              <li>✗ Reset inventory & gold</li>
            </ul>
          </div>
        </div>

        {/* Prestige Action */}
        <div className={styles.prestigeSection}>
          <h2 className={styles.prestigeTitle}>Reincarnate &amp; Grow Stronger</h2>
          <p className={styles.prestigeText}>
            Each reincarnation grants Ascension Points to unlock permanent upgrades. You'll return to the mortal realm but
            with newfound power and potential.
          </p>
          <button
            onClick={handlePrestige}
            disabled={!canPrestigeNow}
            className={`${styles.prestigeButton} ${canPrestigeNow ? styles.prestigeReady : styles.prestigeLocked}`}
          >
            {canPrestigeNow ? 'Reincarnate Now' : 'Not Ready Yet'}
          </button>
          {!canPrestigeNow && <p className={styles.prestigeHint}>Reach Soul Formation 8/10 to reincarnate.</p>}
        </div>

        {/* Ascension Shop */}
        <div className={styles.shopSection}>
          <h2 className={styles.shopTitle}>Ascension Shop</h2>

          <div className={styles.shopGrid}>
            {Object.values(upgrades).map((upgrade) => {
              const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;
              const canAfford = totalAP >= upgrade.cost;
              const isLocked = upgrade.id === 'dual_path';
              const cardClasses = [styles.shopCard];

              if (isMaxed) cardClasses.push(styles.shopMaxed);
              else if (isLocked) cardClasses.push(styles.shopLocked);
              else if (canAfford) cardClasses.push(styles.shopAffordable);

              return (
                <div key={upgrade.id} className={cardClasses.join(' ')}>
                  <div className={styles.shopHeader}>
                    <h3 className={styles.shopName}>{upgrade.name}</h3>
                    {isMaxed && <span className={styles.shopTagMax}>MAX</span>}
                    {isLocked && <span className={styles.shopTagLocked}>LOCKED</span>}
                  </div>
                  <p className={styles.shopDescription}>{upgrade.description}</p>

                  <div className={styles.shopLevel}>
                    <div className={styles.shopLevelRow}>
                      <span className={styles.infoLabel}>Level</span>
                      <span className={styles.infoValue}>
                        {upgrade.currentLevel} / {upgrade.maxLevel}
                      </span>
                    </div>
                    <div className={styles.shopProgress}>
                      <div
                        className={styles.shopProgressFill}
                        style={{ width: `${(upgrade.currentLevel / upgrade.maxLevel) * 100}%` }}
                      />
                    </div>
                  </div>

                  {upgrade.currentLevel > 0 && (
                    <div className={styles.shopEffect}>
                      <div className={styles.shopEffectLabel}>Current Effect:</div>
                      <div className={styles.shopEffectValue}>
                        {upgrade.effect.type === 'multiplier' && upgrade.effect.valuePerLevel
                          ? `+${(upgrade.effect.valuePerLevel * upgrade.currentLevel * 100).toFixed(0)}% ${upgrade.effect.stat}`
                          : upgrade.effect.type === 'flat_bonus' && upgrade.effect.value
                          ? `+${upgrade.effect.value * upgrade.currentLevel} ${upgrade.effect.stat}`
                          : 'Unlocked'}
                      </div>
                    </div>
                  )}

                  {!isMaxed && !isLocked && (
                    <div className={styles.shopActions}>
                      <div className={styles.shopCost}>
                        <span className={styles.infoLabel}>Cost: </span>
                        <span className={`${styles.shopCostValue} ${canAfford ? styles.shopCostReady : styles.shopCostMissing}`}>
                          {upgrade.cost} AP
                        </span>
                      </div>
                      <button
                        onClick={() => purchaseUpgrade(upgrade.id)}
                        disabled={!canAfford}
                        className={`${styles.shopButton} ${canAfford ? styles.shopButtonReady : styles.shopButtonDisabled}`}
                      >
                        Purchase
                      </button>
                    </div>
                  )}

                  {isLocked && <div className={styles.lockedNote}>Unlock condition not met</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prestige History */}
        {prestigeRuns.length > 0 && (
          <details className={styles.history}>
            <summary className={styles.historySummary}>
              Reincarnation History ({prestigeRuns.length} runs)
            </summary>
            <div className={styles.historyList}>
              {prestigeRuns
                .slice()
                .reverse()
                .map((run) => (
                  <div key={run.runNumber} className={styles.historyRow}>
                    <div>
                      <span className={styles.infoValue}>Run #{run.runNumber}</span>
                      <span className={styles.infoLabelMuted}>{realmNames[run.realmReached]}</span>
                    </div>
                    <div className={styles.historyGain}>
                      <span className={styles.infoValueAccent}>+{run.apGained} AP</span>
                      <span className={styles.infoLabelMuted}>{Math.floor(run.timeSpent / 60)}m</span>
                    </div>
                  </div>
                ))}
            </div>
          </details>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <h2 className={styles.modalTitle}>Confirm Reincarnation</h2>
              <p className={styles.modalText}>
                Are you sure you want to reincarnate? This will reset your cultivation progress, but you'll gain{' '}
                <strong className={styles.modalHighlight}>{apGain} AP</strong> to purchase permanent upgrades.
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className={`${styles.modalButton} ${styles.modalCancel}`}
                >
                  Cancel
                </button>
                <button onClick={confirmPrestige} className={`${styles.modalButton} ${styles.modalConfirm}`}>
                  Reincarnate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
