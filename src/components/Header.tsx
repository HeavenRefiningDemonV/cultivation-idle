import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { formatNumber } from '../utils/numbers';
import { getSaveInfo } from '../utils/saveload';

/**
 * Header component - Top bar with game stats and save indicator
 */
export function Header() {
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const realm = useGameStore((state) => state.realm);

  const [lastSavedText, setLastSavedText] = useState<string>('Never');
  const [lastSavedColor, setLastSavedColor] = useState<string>('text-gray-400');

  // Update "Last saved" indicator every second
  useEffect(() => {
    const updateLastSaved = () => {
      const saveInfo = getSaveInfo();

      if (!saveInfo) {
        setLastSavedText('Never');
        setLastSavedColor('text-gray-400');
        return;
      }

      const now = Date.now();
      const diff = now - saveInfo.timestamp;
      const secondsAgo = Math.floor(diff / 1000);

      if (secondsAgo < 60) {
        setLastSavedText(`${secondsAgo}s ago`);
        setLastSavedColor('text-green-400');
      } else if (secondsAgo < 3600) {
        const minutesAgo = Math.floor(secondsAgo / 60);
        setLastSavedText(`${minutesAgo}m ago`);
        setLastSavedColor('text-yellow-400');
      } else {
        const hoursAgo = Math.floor(secondsAgo / 3600);
        setLastSavedText(`${hoursAgo}h ago`);
        setLastSavedColor('text-orange-400');
      }
    };

    // Update immediately
    updateLastSaved();

    // Update every second
    const interval = setInterval(updateLastSaved, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side - Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Cultivation Idle
          </h1>
          <div className="h-6 w-px bg-slate-600" />
          <div className="text-sm">
            <div className="text-slate-300 font-medium">
              {realm.name}
            </div>
            <div className="text-slate-500 text-xs">
              Substage {realm.substage + 1}
            </div>
          </div>
        </div>

        {/* Center - Qi Display */}
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Qi
            </div>
            <div className="text-3xl font-bold text-cyan-400">
              {formatNumber(qi)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Qi/s
            </div>
            <div className="text-xl font-semibold text-cyan-300">
              {formatNumber(qiPerSecond)}
            </div>
          </div>
        </div>

        {/* Right side - Save indicator */}
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            Last Saved
          </div>
          <div className={`text-sm font-medium ${lastSavedColor}`}>
            {lastSavedText}
          </div>
        </div>
      </div>
    </header>
  );
}
