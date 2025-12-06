import { useState } from 'react';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import './PrestigeScreen.scss';

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
    <div className={'prestige-screen'}>
      <div className={'prestige-screen__background'} />

      <div className={'prestige-screen__content'}>
        {/* Header */}
        <div className={'prestige-screen__header'}>
          <h1 className={'prestige-screen__title'}>Reincarnation</h1>
          <p className={'prestige-screen__subtitle'}>Restart your cultivation journey with powerful blessings</p>
        </div>

        {/* AP Display */}
        <div className={'prestige-screen__ap-card'}>
          <div className={'prestige-screen__ap-value'}>{totalAP}</div>
          <div className={'prestige-screen__ap-label'}>Ascension Points Available</div>
          <div className={'prestige-screen__ap-meta'}>
            {lifetimeAP} Total Earned • {prestigeCount} Reincarnations
          </div>
        </div>

        {/* Current Run & Benefits */}
        <div className={'prestige-screen__info-grid'}>
          <div className={'prestige-screen__info-card'}>
            <h3 className={'prestige-screen__info-title'}>Current Run</h3>
            <div className={'prestige-screen__info-rows'}>
              <div className={'prestige-screen__info-row'}>
                <span className={'prestige-screen__info-label'}>Current Realm:</span>
                <span className={'prestige-screen__info-value'}>{realmNames[realm?.index || 0] || 'Unknown'}</span>
              </div>
              <div className={'prestige-screen__info-row'}>
                <span className={'prestige-screen__info-label'}>Potential AP Gain:</span>
                <span className={'prestige-screen__info-value-accent'}>+{apGain} AP</span>
              </div>
            </div>
          </div>

          <div className={'prestige-screen__info-card'}>
            <h3 className={'prestige-screen__info-title'}>Reincarnation Benefits</h3>
            <ul className={'prestige-screen__benefits-list'}>
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
        <div className={'prestige-screen__prestige-section'}>
          <h2 className={'prestige-screen__prestige-title'}>Reincarnate &amp; Grow Stronger</h2>
          <p className={'prestige-screen__prestige-text'}>
            Each reincarnation grants Ascension Points to unlock permanent upgrades. You'll return to the mortal realm but
            with newfound power and potential.
          </p>
          <button
            onClick={handlePrestige}
            disabled={!canPrestigeNow}
            className={`${'prestige-screen__prestige-button'} ${canPrestigeNow ? 'prestige-screen__prestige-ready' : 'prestige-screen__prestige-locked'}`}
          >
            {canPrestigeNow ? 'Reincarnate Now' : 'Not Ready Yet'}
          </button>
          {!canPrestigeNow && <p className={'prestige-screen__prestige-hint'}>Reach Soul Formation 8/10 to reincarnate.</p>}
        </div>

        {/* Ascension Shop */}
        <div className={'prestige-screen__shop-section'}>
          <h2 className={'prestige-screen__shop-title'}>Ascension Shop</h2>

          <div className={'prestige-screen__shop-grid'}>
            {Object.values(upgrades).map((upgrade) => {
              const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;
              const canAfford = totalAP >= upgrade.cost;
              const isLocked = upgrade.id === 'dual_path';
              const cardClasses = ['prestige-screen__shop-card'];

              if (isMaxed) cardClasses.push('prestige-screen__shop-maxed');
              else if (isLocked) cardClasses.push('prestige-screen__shop-locked');
              else if (canAfford) cardClasses.push('prestige-screen__shop-affordable');

              return (
                <div key={upgrade.id} className={cardClasses.join(' ')}>
                  <div className={'prestige-screen__shop-header'}>
                    <h3 className={'prestige-screen__shop-name'}>{upgrade.name}</h3>
                    {isMaxed && <span className={'prestige-screen__shop-tag-max'}>MAX</span>}
                    {isLocked && <span className={'prestige-screen__shop-tag-locked'}>LOCKED</span>}
                  </div>
                  <p className={'prestige-screen__shop-description'}>{upgrade.description}</p>

                  <div className={'prestige-screen__shop-level'}>
                    <div className={'prestige-screen__shop-level-row'}>
                      <span className={'prestige-screen__info-label'}>Level</span>
                      <span className={'prestige-screen__info-value'}>
                        {upgrade.currentLevel} / {upgrade.maxLevel}
                      </span>
                    </div>
                    <div className={'prestige-screen__shop-progress'}>
                      <div
                        className={'prestige-screen__shop-progress-fill'}
                        style={{ width: `${(upgrade.currentLevel / upgrade.maxLevel) * 100}%` }}
                      />
                    </div>
                  </div>

                  {upgrade.currentLevel > 0 && (
                    <div className={'prestige-screen__shop-effect'}>
                      <div className={'prestige-screen__shop-effect-label'}>Current Effect:</div>
                      <div className={'prestige-screen__shop-effect-value'}>
                        {upgrade.effect.type === 'multiplier' && upgrade.effect.valuePerLevel
                          ? `+${(upgrade.effect.valuePerLevel * upgrade.currentLevel * 100).toFixed(0)}% ${upgrade.effect.stat}`
                          : upgrade.effect.type === 'flat_bonus' && upgrade.effect.value
                          ? `+${upgrade.effect.value * upgrade.currentLevel} ${upgrade.effect.stat}`
                          : 'Unlocked'}
                      </div>
                    </div>
                  )}

                  {!isMaxed && !isLocked && (
                    <div className={'prestige-screen__shop-actions'}>
                      <div className={'prestige-screen__shop-cost'}>
                        <span className={'prestige-screen__info-label'}>Cost: </span>
                        <span className={`${'prestige-screen__shop-cost-value'} ${canAfford ? 'prestige-screen__shop-cost-ready' : 'prestige-screen__shop-cost-missing'}`}>
                          {upgrade.cost} AP
                        </span>
                      </div>
                      <button
                        onClick={() => purchaseUpgrade(upgrade.id)}
                        disabled={!canAfford}
                        className={`${'prestige-screen__shop-button'} ${canAfford ? 'prestige-screen__shop-button-ready' : 'prestige-screen__shop-button-disabled'}`}
                      >
                        Purchase
                      </button>
                    </div>
                  )}

                  {isLocked && <div className={'prestige-screen__locked-note'}>Unlock condition not met</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prestige History */}
        {prestigeRuns.length > 0 && (
          <details className={'prestige-screen__history'}>
            <summary className={'prestige-screen__history-summary'}>
              Reincarnation History ({prestigeRuns.length} runs)
            </summary>
            <div className={'prestige-screen__history-list'}>
              {prestigeRuns
                .slice()
                .reverse()
                .map((run) => (
                  <div key={run.runNumber} className={'prestige-screen__history-row'}>
                    <div>
                      <span className={'prestige-screen__info-value'}>Run #{run.runNumber}</span>
                      <span className={'prestige-screen__info-label-muted'}>{realmNames[run.realmReached]}</span>
                    </div>
                    <div className={'prestige-screen__history-gain'}>
                      <span className={'prestige-screen__info-value-accent'}>+{run.apGained} AP</span>
                      <span className={'prestige-screen__info-label-muted'}>{Math.floor(run.timeSpent / 60)}m</span>
                    </div>
                  </div>
                ))}
            </div>
          </details>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className={'prestige-screen__modal-overlay'}>
            <div className={'prestige-screen__modal-card'}>
              <h2 className={'prestige-screen__modal-title'}>Confirm Reincarnation</h2>
              <p className={'prestige-screen__modal-text'}>
                Are you sure you want to reincarnate? This will reset your cultivation progress, but you'll gain{' '}
                <strong className={'prestige-screen__modal-highlight'}>{apGain} AP</strong> to purchase permanent upgrades.
              </p>
              <div className={'prestige-screen__modal-actions'}>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className={`${'prestige-screen__modal-button'} ${'prestige-screen__modal-cancel'}`}
                >
                  Cancel
                </button>
                <button onClick={confirmPrestige} className={`${'prestige-screen__modal-button'} ${'prestige-screen__modal-confirm'}`}>
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
