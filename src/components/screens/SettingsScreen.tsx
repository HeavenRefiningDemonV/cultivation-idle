import { useState } from 'react';
import { deleteSaveAndHardReset } from '../../utils/saveload';
import { useUIStore } from '../../stores/uiStore';

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
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 30%, rgba(14, 165, 233, 0.3) 0%, transparent 45%), radial-gradient(circle at 70% 70%, rgba(248, 113, 113, 0.25) 0%, transparent 45%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="text-center">
          <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">Settings</h1>
          <p className="text-slate-300">Configure UI behavior and manage your save data.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-ink-dark/50 rounded-lg border border-slate-700/60 p-5 shadow-lg backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white mb-3">Gameplay & UI</h2>
            <p className="text-sm text-slate-400 mb-4">Toggle interface elements and confirmations.</p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOfflineModal}
                  onChange={toggleOfflineModal}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <div className="text-white font-semibold">Show offline progress modal</div>
                  <p className="text-sm text-slate-400">Display rewards earned while away when you return.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCombatLog}
                  onChange={toggleCombatLog}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <div className="text-white font-semibold">Show combat log</div>
                  <p className="text-sm text-slate-400">Hide or reveal the detailed combat event log.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePrestigeConfirm}
                  onChange={togglePrestigeConfirm}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <div className="text-white font-semibold">Require prestige confirmation</div>
                  <p className="text-sm text-slate-400">Ask for confirmation before reincarnating.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-ink-dark/50 rounded-lg border border-red-700/40 p-5 shadow-lg backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white mb-3">Save Management</h2>
            <p className="text-sm text-slate-400 mb-4">
              Delete all progress and restart as if the game was freshly installed.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-3 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              Delete Save & Hard Reset
            </button>
            <p className="text-xs text-red-300 mt-3">
              This will remove all saves, Ascension Points, upgrades, spirit roots, auras, and items. This action
              cannot be undone.
            </p>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-red-600/60 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-2xl font-bold text-white">Delete All Save Data?</h3>
            <p className="text-slate-300 text-sm">
              This will delete all save data, including AP, upgrades, auras, items, and progress. This cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSave}
                className="px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-600 transition-colors"
              >
                Delete & Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
