/**
 * Dungeon Screen - Placeholder
 *
 * This screen will contain:
 * - Special dungeon instances
 * - Challenge mode content
 * - Boss rush modes
 * - Unique rewards and progression
 */
export function DungeonScreen() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 40% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%), radial-gradient(circle at 60% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">
            Secret Dungeons
          </h1>
          <p className="text-slate-400 text-sm">
            Enter mysterious dungeons filled with powerful challenges
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-12 backdrop-blur-sm text-center">
          <div className="text-6xl mb-6">🏛️</div>
          <h2 className="font-cinzel text-2xl font-bold text-white mb-4">
            Dungeon System
          </h2>
          <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
            This screen will feature special dungeon instances with unique challenges,
            boss rush modes, and exclusive rewards. Dungeons will provide advanced
            progression content for experienced cultivators.
          </p>

          {/* Placeholder features list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mt-8">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-bold text-white mb-1">Challenge Dungeons</div>
              <div className="text-xs text-slate-400">
                Test your skills against difficult encounters
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-2xl mb-2">👑</div>
              <div className="font-bold text-white mb-1">Boss Rush</div>
              <div className="text-xs text-slate-400">
                Face consecutive boss battles
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-2xl mb-2">💎</div>
              <div className="font-bold text-white mb-1">Unique Rewards</div>
              <div className="text-xs text-slate-400">
                Obtain rare and legendary treasures
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-2xl mb-2">⏰</div>
              <div className="font-bold text-white mb-1">Time Trials</div>
              <div className="text-xs text-slate-400">
                Complete dungeons within time limits
              </div>
            </div>
          </div>

          {/* Coming Soon Badge */}
          <div className="mt-8 inline-block">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm">
              🔜 Coming Soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
