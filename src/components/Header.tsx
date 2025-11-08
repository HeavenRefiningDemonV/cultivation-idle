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
    <header className="fixed top-0 left-0 right-0 h-20 bg-ink-darkest border-b-2 border-ink-dark z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Qi & Realm */}
        <div className="flex flex-col gap-1">
          <div className="text-qi-blue text-sm font-mono">
            Qi: <span className="text-xl font-bold text-qi-glow">{formatNumber(qi)}</span>
            <span className="ml-2 text-xs text-ink-light">({formatNumber(qiPerSecond)}/s)</span>
          </div>
          <div className="text-ink-paper text-xs">
            REALM: <span className="text-gold-accent font-semibold">{realm.name}</span>
            <span className="ml-2 text-ink-light">Substage {realm.substage + 1}</span>
          </div>
        </div>

        {/* Right side - Save indicator & actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-ink-light uppercase tracking-wide">
              Last Saved
            </div>
            <div className={`text-sm font-medium ${lastSavedColor}`}>
              {lastSavedText}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
