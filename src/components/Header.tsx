import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { formatNumber } from '../utils/numbers';
import { getSaveInfo } from '../utils/saveload';
import styles from './Header.module.css';

/**
 * Header component - Top bar with game stats and save indicator
 */
export function Header() {
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const realm = useGameStore((state) => state.realm);

  const [lastSavedText, setLastSavedText] = useState<string>('Never');
  const [lastSavedTone, setLastSavedTone] = useState<'neutral' | 'fresh' | 'warn' | 'old'>('neutral');

  // Update "Last saved" indicator every second
  useEffect(() => {
    const updateLastSaved = () => {
      const saveInfo = getSaveInfo();

      if (!saveInfo) {
        setLastSavedText('Never');
        setLastSavedTone('neutral');
        return;
      }

      const now = Date.now();
      const diff = now - saveInfo.timestamp;
      const secondsAgo = Math.floor(diff / 1000);

      if (secondsAgo < 60) {
        setLastSavedText(`${secondsAgo}s ago`);
        setLastSavedTone('fresh');
      } else if (secondsAgo < 3600) {
        const minutesAgo = Math.floor(secondsAgo / 60);
        setLastSavedText(`${minutesAgo}m ago`);
        setLastSavedTone('warn');
      } else {
        const hoursAgo = Math.floor(secondsAgo / 3600);
        setLastSavedText(`${hoursAgo}h ago`);
        setLastSavedTone('old');
      }
    };

    // Update immediately
    updateLastSaved();

    // Update every second
    const interval = setInterval(updateLastSaved, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        {/* Left side - Qi & Realm */}
        <div className={styles.statBlock}>
          <div className={styles.qiLine}>
            Qi: <span className={styles.qiValue}>{formatNumber(qi)}</span>
            <span className={styles.qiRate}>({formatNumber(qiPerSecond)}/s)</span>
          </div>
          <div className={styles.realmLine}>
            REALM:<span className={styles.realmAccent}>{realm.name}</span>
            <span className={styles.realmSubstage}>Substage {realm.substage + 1}</span>
          </div>
        </div>

        {/* Right side - Save indicator & actions */}
        <div className={styles.saveBlock}>
          <div className={styles.saveLabel}>
            Last Saved
          </div>
          <div className={`${styles.saveTime} ${styles[lastSavedTone]}`}>
            {lastSavedText}
          </div>
        </div>
      </div>
    </header>
  );
}
