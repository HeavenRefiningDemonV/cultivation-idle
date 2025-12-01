import { useEffect, useState } from 'react';
import { GameLayout } from './components/GameLayout';
import { initializeGame } from './systems/gameLoop';
import styles from './App.module.css';

/**
 * Main App component
 */
function App() {
  const [gameInitialized, setGameInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize game on mount
  useEffect(() => {
    console.log('[App] Initializing game...');

    try {
      const success = initializeGame();

      if (success) {
        console.log('[App] Game initialized successfully');
        setGameInitialized(true);
      } else {
        console.error('[App] Game initialization failed');
        setInitError('Failed to initialize game. Please refresh the page.');
      }
    } catch (error) {
      console.error('[App] Game initialization error:', error);
      setInitError(`Game initialization error: ${error}`);
    }
  }, []); // Run once on mount

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className={styles.appShell}>
        <div className={styles.messageCard}>
          <div className={styles.heroIcon}>⚠️</div>
          <h1 className={styles.title}>Initialization Error</h1>
          <p className={styles.subtext}>{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.primaryButton}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading screen while initializing
  if (!gameInitialized) {
    return (
      <div className={styles.appShell}>
        <div className={styles.messageCard}>
          <div className={`${styles.heroIcon} ${styles.loader}`}>⚡</div>
          <h1 className={styles.title}>Cultivation Idle</h1>
          <p className={styles.subtext}>Loading...</p>
        </div>
      </div>
    );
  }

  // Render game layout once initialized
  return <GameLayout />;
}

export default App;
