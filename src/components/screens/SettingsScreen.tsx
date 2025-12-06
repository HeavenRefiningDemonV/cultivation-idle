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
    <div className={'settings-screen'}>
      <div className={'settings-screen__background'} />

      <div className={'settings-screen__content'}>
        <div className={'settings-screen__header'}>
          <h1 className={'settings-screen__title'}>Settings</h1>
          <p className={'settings-screen__subtitle'}>Configure UI behavior and manage your save data.</p>
        </div>

        <div className={'settings-screen__grid'}>
          <div className={`${'settings-screen__panel'} ${'settings-screen__panel-default'}`}>
            <h2 className={'settings-screen__panel-title'}>Gameplay &amp; UI</h2>
            <p className={'settings-screen__panel-subtitle'}>Toggle interface elements and confirmations.</p>
            <div className={'settings-screen__option-list'}>
              <label className={'settings-screen__option-row'}>
                <input
                  type="checkbox"
                  checked={showOfflineModal}
                  onChange={toggleOfflineModal}
                  className={'settings-screen__checkbox'}
                />
                <div>
                  <div className={'settings-screen__option-label'}>Show offline progress modal</div>
                  <p className={'settings-screen__option-description'}>Display rewards earned while away when you return.</p>
                </div>
              </label>

              <label className={'settings-screen__option-row'}>
                <input
                  type="checkbox"
                  checked={showCombatLog}
                  onChange={toggleCombatLog}
                  className={'settings-screen__checkbox'}
                />
                <div>
                  <div className={'settings-screen__option-label'}>Show combat log</div>
                  <p className={'settings-screen__option-description'}>Hide or reveal the detailed combat event log.</p>
                </div>
              </label>

              <label className={'settings-screen__option-row'}>
                <input
                  type="checkbox"
                  checked={requirePrestigeConfirm}
                  onChange={togglePrestigeConfirm}
                  className={'settings-screen__checkbox'}
                />
                <div>
                  <div className={'settings-screen__option-label'}>Require prestige confirmation</div>
                  <p className={'settings-screen__option-description'}>Ask for confirmation before reincarnating.</p>
                </div>
              </label>
            </div>
          </div>

          <div className={`${'settings-screen__panel'} ${'settings-screen__panel-danger'}`}>
            <h2 className={'settings-screen__panel-title'}>Save Management</h2>
            <p className={'settings-screen__panel-subtitle'}>
              Delete all progress and restart as if the game was freshly installed.
            </p>
            <button onClick={() => setShowDeleteModal(true)} className={'settings-screen__danger-button'}>
              Delete Save &amp; Hard Reset
            </button>
            <p className={'settings-screen__danger-note'}>
              This will remove all saves, Ascension Points, upgrades, spirit roots, auras, and items. This action
              cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className={'settings-screen__modal-overlay'}>
          <div className={'settings-screen__modal-card'}>
            <h3 className={'settings-screen__modal-title'}>Delete All Save Data?</h3>
            <p className={'settings-screen__modal-text'}>
              This will delete all save data, including AP, upgrades, auras, items, and progress. This cannot be undone.
            </p>
            <div className={'settings-screen__modal-actions'}>
              <button onClick={() => setShowDeleteModal(false)} className={`${'settings-screen__modal-button'} ${'settings-screen__modal-cancel'}`}>
                Cancel
              </button>
              <button onClick={handleDeleteSave} className={`${'settings-screen__modal-button'} ${'settings-screen__modal-confirm'}`}>
                Delete &amp; Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
