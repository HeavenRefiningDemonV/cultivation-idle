import { useEffect, useMemo, useState } from 'react';
import { usePrestigeStore } from '../../stores/prestigeStore';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { useContentStore } from '../../stores/contentStore';
import './PrestigeScreen.scss';

export function PrestigeScreen() {
  const totalAP = usePrestigeStore((state) => state.totalAP);
  const lifetimeAP = usePrestigeStore((state) => state.lifetimeAP);
  const prestigeCount = usePrestigeStore((state) => state.prestigeCount);
  const prestigeRuns = usePrestigeStore((state) => state.prestigeRuns);
  const calculateAPGain = usePrestigeStore((state) => state.calculateAPGain);
  const canPrestige = usePrestigeStore((state) => state.canPrestige);
  const performPrestige = usePrestigeStore((state) => state.performPrestige);
  const purchaseUpgrade = usePrestigeStore((state) => state.purchaseUpgrade);
  const getCurrentLevel = usePrestigeStore((state) => state.getCurrentLevel);
  const getMaxLevel = usePrestigeStore((state) => state.getMaxLevel);
  const getNextLevelCost = usePrestigeStore((state) => state.getNextLevelCost);
  const checkPrereqs = usePrestigeStore((state) => state.checkPrereqs);
  const isContentLoaded = useContentStore((state) => state.isLoaded);
  const getPrestigeUpgrades = useContentStore((state) => state.getPrestigeUpgrades);

  const realm = useGameStore((state) => state.realm);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const setHeaderTitles = useUIStore((state) => state.setHeaderTitles);

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

  useEffect(() => {
    setHeaderTitles('Reincarnation', 'Restart your cultivation journey with powerful blessings');
  }, [setHeaderTitles]);

  const upgradeList = useMemo(() => {
    if (!isContentLoaded) return [];
    return getPrestigeUpgrades();
  }, [getPrestigeUpgrades, isContentLoaded]);

  const handlePurchase = (upgradeId: string) => {
    const result = purchaseUpgrade(upgradeId);
    if (!result.ok) {
      setPurchaseMessage(result.reason ?? 'Purchase failed');
    } else {
      setPurchaseMessage(null);
    }
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
            className={`${'button-standard'} ${'prestigeScreenPrestigeButton'} ${
              canPrestigeNow ? 'prestigeScreenPrestigeReady' : 'prestigeScreenPrestigeLocked'
            }`}
          >
            {canPrestigeNow ? 'Reincarnate Now' : 'Not Ready Yet'}
          </button>
          {!canPrestigeNow && (
            <p className={'prestigeScreenPrestigeHint'}>Reach Foundation Establishment to unlock Reincarnation.</p>
          )}
        </div>

        {/* Ascension Shop */}
        <div className={'prestigeScreenShopSection'}>
          <h2 className={'prestigeScreenShopTitle'}>Ascension Shop</h2>

          <div className={'prestigeScreenShopGrid'}>
            {upgradeList.map((upgrade) => {
              const currentLevel = getCurrentLevel(upgrade.id);
              const maxLevel = getMaxLevel(upgrade.id);
              const isMaxed = currentLevel >= maxLevel;
              const nextCost = getNextLevelCost(upgrade.id);
              const prereqCheck = checkPrereqs(upgrade.id);
              const canAfford = nextCost !== null && totalAP >= nextCost;
              const isLocked = !prereqCheck.ok;
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
                        {currentLevel} / {maxLevel}
                      </span>
                    </div>
                    <div className={'prestigeScreenShopProgress'}>
                      <div
                        className={'prestigeScreenShopProgressFill'}
                        style={{ width: `${maxLevel ? (currentLevel / maxLevel) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {currentLevel > 0 && (
                    <div className={'prestigeScreenShopEffect'}>
                      <div className={'prestigeScreenShopEffectLabel'}>Current Effect:</div>
                      <div className={'prestigeScreenShopEffectValue'}>
                        {upgrade.type === 'multiplier' && typeof upgrade.effectPerLevel === 'number'
                          ? `+${(upgrade.effectPerLevel * currentLevel * 100).toFixed(0)}% ${upgrade.stat ?? ''}`
                          : 'Unlocked'}
                      </div>
                    </div>
                  )}

                  {!isMaxed && !isLocked && (
                    <div className={'prestigeScreenShopActions'}>
                      <div className={'prestigeScreenShopCost'}>
                        <span className={'prestigeScreenInfoLabel'}>Cost: </span>
                        <span className={`${'prestigeScreenShopCostValue'} ${canAfford ? 'prestigeScreenShopCostReady' : 'prestigeScreenShopCostMissing'}`}>
                          {nextCost ?? 'N/A'} AP
                        </span>
                      </div>
                      <button
                        onClick={() => handlePurchase(upgrade.id)}
                        disabled={!canAfford}
                        className={`${'button-standard'} ${'prestigeScreenShopButton'} ${
                          canAfford ? 'prestigeScreenShopButtonReady' : 'prestigeScreenShopButtonDisabled'
                        }`}
                      >
                        Purchase
                      </button>
                    </div>
                  )}

                  {isLocked && (
                    <div className={'prestigeScreenLockedNote'}>
                      {prereqCheck.reason ?? 'Unlock condition not met'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {purchaseMessage && <div className={'prestigeScreenLockedNote'}>{purchaseMessage}</div>}
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
                  className={`${'button-standard'} ${'prestigeScreenModalButton'} ${'prestigeScreenModalCancel'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPrestige}
                  className={`${'button-standard'} ${'prestigeScreenModalButton'} ${'prestigeScreenModalConfirm'}`}
                >
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
