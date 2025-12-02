import { useState } from 'react';
import { deleteSaveAndHardReset } from '../../utils/saveload';
import { useUIStore } from '../../stores/uiStore';
import styles from './SettingsScreen.module.css';

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
    <div className={styles.root}>
      <div className={styles.background} />

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Configure UI behavior and manage your save data.</p>
        </div>

        <div className={styles.grid}>
          <div className={`${styles.panel} ${styles.panelDefault}`}>
            <h2 className={styles.panelTitle}>Gameplay &amp; UI</h2>
            <p className={styles.panelSubtitle}>Toggle interface elements and confirmations.</p>
            <div className={styles.optionList}>
              <label className={styles.optionRow}>
                <input
                  type="checkbox"
                  checked={showOfflineModal}
                  onChange={toggleOfflineModal}
                  className={styles.checkbox}
                />
                <div>
                  <div className={styles.optionLabel}>Show offline progress modal</div>
                  <p className={styles.optionDescription}>Display rewards earned while away when you return.</p>
                </div>
              </label>

              <label className={styles.optionRow}>
                <input
                  type="checkbox"
                  checked={showCombatLog}
                  onChange={toggleCombatLog}
                  className={styles.checkbox}
                />
                <div>
                  <div className={styles.optionLabel}>Show combat log</div>
                  <p className={styles.optionDescription}>Hide or reveal the detailed combat event log.</p>
                </div>
              </label>

              <label className={styles.optionRow}>
                <input
                  type="checkbox"
                  checked={requirePrestigeConfirm}
                  onChange={togglePrestigeConfirm}
                  className={styles.checkbox}
                />
                <div>
                  <div className={styles.optionLabel}>Require prestige confirmation</div>
                  <p className={styles.optionDescription}>Ask for confirmation before reincarnating.</p>
                </div>
              </label>
            </div>
          </div>

          <div className={`${styles.panel} ${styles.panelDanger}`}>
            <h2 className={styles.panelTitle}>Save Management</h2>
            <p className={styles.panelSubtitle}>
              Delete all progress and restart as if the game was freshly installed.
            </p>
            <button onClick={() => setShowDeleteModal(true)} className={styles.dangerButton}>
              Delete Save &amp; Hard Reset
            </button>
            <p className={styles.dangerNote}>
              This will remove all saves, Ascension Points, upgrades, spirit roots, auras, and items. This action
              cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Delete All Save Data?</h3>
            <p className={styles.modalText}>
              This will delete all save data, including AP, upgrades, auras, items, and progress. This cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)} className={`${styles.modalButton} ${styles.modalCancel}`}>
                Cancel
              </button>
              <button onClick={handleDeleteSave} className={`${styles.modalButton} ${styles.modalConfirm}`}>
                Delete &amp; Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
