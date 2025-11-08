/**
 * Adventure Screen - Placeholder
 *
 * This screen will contain:
 * - Zone selection and exploration
 * - Enemy encounters and combat
 * - Loot rewards
 * - Boss battles
 */
export function AdventureScreen() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 50%, rgba(239, 68, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(251, 191, 36, 0.3) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">
            Adventure Zones
          </h1>
          <p className="text-slate-400 text-sm">
            Explore dangerous territories and battle fearsome enemies
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-12 backdrop-blur-sm text-center">
          <div className="text-6xl mb-6">⚔️</div>
          <h2 className="font-cinzel text-2xl font-bold text-white mb-4">
            Adventure System
          </h2>
          <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
            This screen will feature zone exploration, enemy encounters, combat mechanics,
            and loot rewards. The full implementation will be integrated with the existing
            combat and zone systems.
          </p>

          {/* Placeholder features list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-8">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-2xl mb-2">🗺️</div>
              <div className="font-bold text-white mb-1">Zone Selection</div>
              <div className="text-xs text-slate-400">
                Choose from multiple adventure zones
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-2xl mb-2">👹</div>
              <div className="font-bold text-white mb-1">Enemy Encounters</div>
              <div className="text-xs text-slate-400">
                Battle various enemies and bosses
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-bold text-white mb-1">Loot Rewards</div>
              <div className="text-xs text-slate-400">
                Earn gold, items, and equipment
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-bold text-white mb-1">Auto Combat</div>
              <div className="text-xs text-slate-400">
                Enable automated battle system
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
