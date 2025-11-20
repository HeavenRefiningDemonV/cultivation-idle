import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteSaveAndResetGame } from '../../utils/saveload';

export function SettingsScreen() {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-ink-dark/60 border border-gold-accent/30 rounded-lg p-6 shadow-lg">
        <h1 className="font-cinzel text-3xl font-bold text-gold-accent mb-2">Settings</h1>
        <p className="text-ink-light">Game settings and save management.</p>
      </div>

      <div className="bg-slate-900/70 border border-red-500/40 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-semibold text-red-400">Delete Save & Restart Run</h2>
            <p className="text-sm text-slate-300">
              Deletes your current run and wipes all local saves. Ascension Points and permanent upgrades remain.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold shadow-lg"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 className="h-5 w-5" />
            Delete Save & Restart
          </button>
        </div>
        <p className="text-xs text-slate-400">
          This action also removes backup saves so you can start completely fresh.
        </p>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-red-500 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-300">
              <Trash2 className="h-6 w-6" />
              <h3 className="text-2xl font-bold">Delete Save Data?</h3>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              This will delete your current run and all local save data. Permanent Ascension Points stay, but your current
              progress, items, gold, and unlocked areas will be reset. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md border border-slate-500 text-slate-200 hover:bg-slate-800"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold inline-flex items-center gap-2"
                onClick={() => {
                  deleteSaveAndResetGame();
                  setShowConfirm(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete & Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
