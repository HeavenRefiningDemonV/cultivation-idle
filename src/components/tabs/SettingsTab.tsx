import { useState } from 'react';
import { deleteSaveAndResetGame } from '../../utils/saveload';

export function SettingsTab() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmDelete = () => {
    setShowConfirm(false);
    deleteSaveAndResetGame();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-ink-paper">Settings</h1>
            <p className="text-ink-light mt-1">Configure the game and manage your save data.</p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-ink-paper">Save Management</h2>
          <p className="text-sm text-ink-light">
            Delete your current run and restart fresh. Permanent AP upgrades remain, but all current progress
            will be lost.
          </p>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition"
          >
            Delete Save &amp; Restart Run
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-ink-paper">Delete Save Data?</h3>
            <p className="text-sm text-ink-light mt-3 leading-relaxed">
              This will delete your current run and all local save data. Permanent AP upgrades stay, but your
              current life, items, gold, and progression will be reset. This cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-ink-paper font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition"
              >
                Delete &amp; Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
