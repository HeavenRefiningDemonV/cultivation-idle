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
    <div className={'prestigeScreenRoot'}>
      <div className={'prestigeScreenBackground'} />

      <div className={'prestigeScreenContent'}>
        {/* Header */}
        <div className={'prestigeScreenHeader'}>
          <h1 className={'prestigeScreenTitle'}>Reincarnation</h1>
          <p className={'prestigeScreenSubtitle'}>Restart your cultivation journey with powerful blessings</p>
        </div>

        {/* AP Display */}
        <div className={'prestigeScreenApCard'}>
          <div className={'prestigeScreenApValue'}>{totalAP}</div>
          <div className={'prestigeScreenApLabel'}>Ascension Points Available</div>
          <div className={'prestigeScreenApMeta'}>
            {lifetimeAP} Total Earned • {prestigeCount} Reincarnations
          </div>
        </div>

        {/* Current Run & Benefits */}
        <div className={'prestigeScreenInfoGrid'}>
          <div className={'prestigeScreenInfoCard'}>
            <h3 className={'prestigeScreenInfoTitle'}>Current Run</h3>
            <div className={'prestigeScreenInfoRows'}>
              <div className={'prestigeScreenInfoRow'}>
                <span className={'prestigeScreenInfoLabel'}>Current Realm:</span>
                <span className={'prestigeScreenInfoValue'}>{realmNames[realm?.index || 0] || 'Unknown'}</span>
              </div>
              <div className={'prestigeScreenInfoRow'}>
                <span className={'prestigeScreenInfoLabel'}>Potential AP Gain:</span>
                <span className={'prestigeScreenInfoValueAccent'}>+{apGain} AP</span>
              </div>
            </div>
          </div>

          <div className={'prestigeScreenInfoCard'}>
            <h3 className={'prestigeScreenInfoTitle'}>Reincarnation Benefits</h3>
            <ul className={'prestigeScreenBenefitsList'}>
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
        <div className={'prestigeScreenPrestigeSection'}>
          <h2 className={'prestigeScreenPrestigeTitle'}>Reincarnate &amp; Grow Stronger</h2>
          <p className={'prestigeScreenPrestigeText'}>
            Each reincarnation grants Ascension Points to unlock permanent upgrades. You'll return to the mortal realm but
            with newfound power and potential.
          </p>
          <button
            onClick={handlePrestige}
            disabled={!canPrestigeNow}
            className={`${'prestigeScreenPrestigeButton'} ${canPrestigeNow ? 'prestigeScreenPrestigeReady' : 'prestigeScreenPrestigeLocked'}`}
          >
            {canPrestigeNow ? 'Reincarnate Now' : 'Not Ready Yet'}
          </button>
          {!canPrestigeNow && <p className={'prestigeScreenPrestigeHint'}>Reach Soul Formation 8/10 to reincarnate.</p>}
        </div>

        {/* Ascension Shop */}
        <div className={'prestigeScreenShopSection'}>
          <h2 className={'prestigeScreenShopTitle'}>Ascension Shop</h2>

          <div className={'prestigeScreenShopGrid'}>
            {Object.values(upgrades).map((upgrade) => {
              const isMaxed = upgrade.currentLevel >= upgrade.maxLevel;
              const canAfford = totalAP >= upgrade.cost;
              const isLocked = upgrade.id === 'dual_path';
              const cardClasses = ['prestigeScreenShopCard'];

              if (isMaxed) cardClasses.push('prestigeScreenShopMaxed');
              else if (isLocked) cardClasses.push('prestigeScreenShopLocked');
              else if (canAfford) cardClasses.push('prestigeScreenShopAffordable');

              return (
                <div key={upgrade.id} className={cardClasses.join(' ')}>
                  <div className={'prestigeScreenShopHeader'}>
                    <h3 className={'prestigeScreenShopName'}>{upgrade.name}</h3>
                    {isMaxed && <span className={'prestigeScreenShopTagMax'}>MAX</span>}
                    {isLocked && <span className={'prestigeScreenShopTagLocked'}>LOCKED</span>}
                  </div>
                  <p className={'prestigeScreenShopDescription'}>{upgrade.description}</p>

                  <div className={'prestigeScreenShopLevel'}>
                    <div className={'prestigeScreenShopLevelRow'}>
                      <span className={'prestigeScreenInfoLabel'}>Level</span>
                      <span className={'prestigeScreenInfoValue'}>
                        {upgrade.currentLevel} / {upgrade.maxLevel}
                      </span>
                    </div>
                    <div className={'prestigeScreenShopProgress'}>
                      <div
                        className={'prestigeScreenShopProgressFill'}
                        style={{ width: `${(upgrade.currentLevel / upgrade.maxLevel) * 100}%` }}
                      />
                    </div>
                  </div>

                  {upgrade.currentLevel > 0 && (
                    <div className={'prestigeScreenShopEffect'}>
                      <div className={'prestigeScreenShopEffectLabel'}>Current Effect:</div>
                      <div className={'prestigeScreenShopEffectValue'}>
                        {upgrade.effect.type === 'multiplier' && upgrade.effect.valuePerLevel
                          ? `+${(upgrade.effect.valuePerLevel * upgrade.currentLevel * 100).toFixed(0)}% ${upgrade.effect.stat}`
                          : upgrade.effect.type === 'flat_bonus' && upgrade.effect.value
                          ? `+${upgrade.effect.value * upgrade.currentLevel} ${upgrade.effect.stat}`
                          : 'Unlocked'}
                      </div>
                    </div>
                  )}

                  {!isMaxed && !isLocked && (
                    <div className={'prestigeScreenShopActions'}>
                      <div className={'prestigeScreenShopCost'}>
                        <span className={'prestigeScreenInfoLabel'}>Cost: </span>
                        <span className={`${'prestigeScreenShopCostValue'} ${canAfford ? 'prestigeScreenShopCostReady' : 'prestigeScreenShopCostMissing'}`}>
                          {upgrade.cost} AP
                        </span>
                      </div>
                      <button
                        onClick={() => purchaseUpgrade(upgrade.id)}
                        disabled={!canAfford}
                        className={`${'prestigeScreenShopButton'} ${canAfford ? 'prestigeScreenShopButtonReady' : 'prestigeScreenShopButtonDisabled'}`}
                      >
                        Purchase
                      </button>
                    </div>
                  )}

                  {isLocked && <div className={'prestigeScreenLockedNote'}>Unlock condition not met</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prestige History */}
        {prestigeRuns.length > 0 && (
          <details className={'prestigeScreenHistory'}>
            <summary className={'prestigeScreenHistorySummary'}>
              Reincarnation History ({prestigeRuns.length} runs)
            </summary>
            <div className={'prestigeScreenHistoryList'}>
              {prestigeRuns
                .slice()
                .reverse()
                .map((run) => (
                  <div key={run.runNumber} className={'prestigeScreenHistoryRow'}>
                    <div>
                      <span className={'prestigeScreenInfoValue'}>Run #{run.runNumber}</span>
                      <span className={'prestigeScreenInfoLabelMuted'}>{realmNames[run.realmReached]}</span>
                    </div>
                    <div className={'prestigeScreenHistoryGain'}>
                      <span className={'prestigeScreenInfoValueAccent'}>+{run.apGained} AP</span>
                      <span className={'prestigeScreenInfoLabelMuted'}>{Math.floor(run.timeSpent / 60)}m</span>
                    </div>
                  </div>
                ))}
            </div>
          </details>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className={'prestigeScreenModalOverlay'}>
            <div className={'prestigeScreenModalCard'}>
              <h2 className={'prestigeScreenModalTitle'}>Confirm Reincarnation</h2>
              <p className={'prestigeScreenModalText'}>
                Are you sure you want to reincarnate? This will reset your cultivation progress, but you'll gain{' '}
                <strong className={'prestigeScreenModalHighlight'}>{apGain} AP</strong> to purchase permanent upgrades.
              </p>
              <div className={'prestigeScreenModalActions'}>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className={`${'prestigeScreenModalButton'} ${'prestigeScreenModalCancel'}`}
                >
                  Cancel
                </button>
                <button onClick={confirmPrestige} className={`${'prestigeScreenModalButton'} ${'prestigeScreenModalConfirm'}`}>
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
