import { useEffect, useState } from 'react';
import { GameLayout } from './components/GameLayout';
import { GameShell } from './components/layout/GameShell';
import { images } from './assets/images';
import { initializeGame } from './systems/gameLoop';

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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Initialization Error
          </h1>
          <p className="text-slate-300 mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">⚡</div>
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">
            Cultivation Idle
          </h1>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render game layout once initialized
  return (
    <GameShell background={images.backgrounds.cultivation}>
      <GameLayout />
    </GameShell>
  );
}

export default App;
