import { useState } from 'react';
import { deleteSaveAndHardReset } from '../../utils/saveload';
import { useUIStore } from '../../stores/uiStore';
import './SettingsScreen.scss';

export function SettingsScreen() {
  const showOfflineModal = useUIStore((state) => state.settings.showOfflineModal);
  const showCombatLog = useUIStore((state) => state.settings.showCombatLog);
  const requirePrestigeConfirm = useUIStore((state) => state.settings.requirePrestigeConfirm);
  const setSettings = useUIStore((state) => state.setSettings);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const toggleOfflineModal = () => setSettings({ showOfflineModal: !showOfflineModal });
  const toggleCombatLog = () => setSettings({ showCombatLog: !showCombatLog });
  const togglePrestigeConfirm = () =>
    setSettings({ requirePrestigeConfirm: !requirePrestigeConfirm });

  const handleDeleteSave = () => {
    setShowDeleteModal(false);
    deleteSaveAndHardReset();
  };

  return (
    <div className={'settingsScreenRoot'}>
      <div className={'settingsScreenBackground'} />

      <div className={'settingsScreenContent'}>
        <div className={'settingsScreenHeader'}>
          <h1 className={'settingsScreenTitle'}>Settings</h1>
          <p className={'settingsScreenSubtitle'}>Configure UI behavior and manage your save data.</p>
        </div>

        <div className={'settingsScreenGrid'}>
          <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDefault'}`}>
            <h2 className={'settingsScreenPanelTitle'}>Gameplay &amp; UI</h2>
            <p className={'settingsScreenPanelSubtitle'}>Toggle interface elements and confirmations.</p>
            <div className={'settingsScreenOptionList'}>
              <label className={'settingsScreenOptionRow'}>
                <input
                  type="checkbox"
                  checked={showOfflineModal}
                  onChange={toggleOfflineModal}
                  className={'settingsScreenCheckbox'}
                />
                <div>
                  <div className={'settingsScreenOptionLabel'}>Show offline progress modal</div>
                  <p className={'settingsScreenOptionDescription'}>Display rewards earned while away when you return.</p>
                </div>
              </label>

              <label className={'settingsScreenOptionRow'}>
                <input
                  type="checkbox"
                  checked={showCombatLog}
                  onChange={toggleCombatLog}
                  className={'settingsScreenCheckbox'}
                />
                <div>
                  <div className={'settingsScreenOptionLabel'}>Show combat log</div>
                  <p className={'settingsScreenOptionDescription'}>Hide or reveal the detailed combat event log.</p>
                </div>
              </label>

              <label className={'settingsScreenOptionRow'}>
                <input
                  type="checkbox"
                  checked={requirePrestigeConfirm}
                  onChange={togglePrestigeConfirm}
                  className={'settingsScreenCheckbox'}
                />
                <div>
                  <div className={'settingsScreenOptionLabel'}>Require prestige confirmation</div>
                  <p className={'settingsScreenOptionDescription'}>Ask for confirmation before reincarnating.</p>
                </div>
              </label>
            </div>
          </div>

          <div className={`${'settingsScreenPanel'} ${'settingsScreenPanelDanger'}`}>
            <h2 className={'settingsScreenPanelTitle'}>Save Management</h2>
            <p className={'settingsScreenPanelSubtitle'}>
              Delete all progress and restart as if the game was freshly installed.
            </p>
            <button onClick={() => setShowDeleteModal(true)} className={'settingsScreenDangerButton'}>
              Delete Save &amp; Hard Reset
            </button>
            <p className={'settingsScreenDangerNote'}>
              This will remove all saves, Ascension Points, upgrades, spirit roots, auras, and items. This action
              cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className={'settingsScreenModalOverlay'}>
          <div className={'settingsScreenModalCard'}>
            <h3 className={'settingsScreenModalTitle'}>Delete All Save Data?</h3>
            <p className={'settingsScreenModalText'}>
              This will delete all save data, including AP, upgrades, auras, items, and progress. This cannot be undone.
            </p>
            <div className={'settingsScreenModalActions'}>
              <button onClick={() => setShowDeleteModal(false)} className={`${'settingsScreenModalButton'} ${'settingsScreenModalCancel'}`}>
                Cancel
              </button>
              <button onClick={handleDeleteSave} className={`${'settingsScreenModalButton'} ${'settingsScreenModalConfirm'}`}>
                Delete &amp; Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
