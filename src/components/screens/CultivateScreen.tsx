import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { formatNumber } from '../../utils/numbers';
import { REALMS } from '../../constants';
import { PathSelectionModal } from '../modals/PathSelectionModal';
import { PerkSelectionModal } from '../modals/PerkSelectionModal';

/**
 * Mountain Background SVG
 */
function MountainBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-30"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Far mountains */}
      <path
        d="M0,400 Q200,300 400,350 T800,320 L1200,380 L1200,600 L0,600 Z"
        fill="currentColor"
        className="text-slate-700/50"
      />
      {/* Near mountains */}
      <path
        d="M0,450 Q150,350 300,400 T600,380 Q750,360 900,420 T1200,440 L1200,600 L0,600 Z"
        fill="currentColor"
        className="text-slate-600/70"
      />
    </svg>
  );
}

/**
 * Pine Tree SVG (corner decoration)
 */
function PineTree() {
  return (
    <svg
      className="absolute bottom-4 right-4 w-24 h-32 opacity-40"
      viewBox="0 0 100 120"
    >
      {/* Tree trunk */}
      <rect x="45" y="80" width="10" height="40" fill="currentColor" className="text-slate-600" />
      {/* Tree layers */}
      <polygon points="50,20 30,50 70,50" fill="currentColor" className="text-slate-700" />
      <polygon points="50,40 25,70 75,70" fill="currentColor" className="text-slate-700" />
      <polygon points="50,60 20,90 80,90" fill="currentColor" className="text-slate-700" />
    </svg>
  );
}

/**
 * Qi Orb (glowing blue circle)
 */
function QiOrb({ size = 80, intensity = 1 }: { size?: number; intensity?: number }) {
  return (
    <div
      className="relative rounded-full animate-pulse"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(59, 130, 246, ${0.8 * intensity}) 0%, rgba(59, 130, 246, ${0.3 * intensity}) 50%, transparent 70%)`,
        boxShadow: `0 0 ${20 * intensity}px rgba(59, 130, 246, ${0.6 * intensity}), 0 0 ${40 * intensity}px rgba(59, 130, 246, ${0.3 * intensity})`,
      }}
    >
      <div
        className="absolute inset-2 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(147, 197, 253, ${0.9 * intensity}) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

/**
 * Meditating Character with Qi Aura
 */
function MeditatingCharacter() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Qi aura rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-48 h-48 rounded-full border-2 border-blue-400/30 animate-ping" />
        <div className="absolute w-40 h-40 rounded-full border-2 border-blue-300/40 animate-pulse" />
        <div className="absolute w-32 h-32 rounded-full border border-blue-200/50" />
      </div>

      {/* Meditating emoji */}
      <div className="relative z-10 text-8xl filter drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]">
        🧘
      </div>

      {/* Floating qi orbs */}
      <div className="absolute top-0 left-1/4 animate-float">
        <QiOrb size={40} intensity={0.6} />
      </div>
      <div className="absolute top-8 right-1/4 animate-float-delayed">
        <QiOrb size={30} intensity={0.5} />
      </div>
      <div className="absolute bottom-0 left-1/3 animate-float-slow">
        <QiOrb size={35} intensity={0.7} />
      </div>
    </div>
  );
}

/**
 * Ornate Progress Bar with gradient fill
 */
function OrnateProgressBar({
  current,
  max,
  label,
}: {
  current: string;
  max: string;
  label: string;
}) {
  const percent = Math.min(100, parseFloat((Number(current) / Number(max) * 100).toFixed(2)));

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gold-accent font-cinzel font-semibold">{label}</span>
        <span className="text-slate-300">
          {formatNumber(current)} / {formatNumber(max)}
        </span>
      </div>

      {/* Ornate container */}
      <div className="relative h-8 bg-ink-dark rounded-lg border-2 border-gold-accent/30 overflow-hidden shadow-inner">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
          }} />
        </div>

        {/* Gradient fill */}
        <div
          className="absolute inset-0 transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(147,197,253,0.9) 50%, rgba(59,130,246,0.8) 100%)',
            boxShadow: '0 0 20px rgba(59,130,246,0.5)',
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>

        {/* Percentage text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">
            {percent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Upgrade Card Component
 * (Currently unused - kept for future upgrades feature)
 */
/*
function UpgradeCard({
  title,
  description,
  cost,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  cost: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-4 rounded-lg border-2 transition-all text-left
        ${
          disabled
            ? 'border-slate-700 bg-slate-800/30 opacity-50 cursor-not-allowed'
            : 'border-gold-accent/50 bg-ink-dark/50 hover:border-gold-accent hover:bg-ink-dark/70 hover:scale-105 cursor-pointer'
        }
      `}
    >
      <div className="font-cinzel font-bold text-gold-accent mb-1">{title}</div>
      <div className="text-xs text-slate-400 mb-3">{description}</div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-qi-blue">Cost:</span>
        <span className="text-white font-bold">{formatNumber(cost)}</span>
        <span className="text-qi-blue">Qi</span>
      </div>
    </button>
  );
}
*/

/**
 * Main Cultivate Screen Component
 */
export function CultivateScreen() {
  const realm = useGameStore((state) => state.realm);
  const qi = useGameStore((state) => state.qi);
  const qiPerSecond = useGameStore((state) => state.qiPerSecond);
  const focusMode = useGameStore((state) => state.focusMode);
  const selectedPath = useGameStore((state) => state.selectedPath);
  const breakthroughCost = useGameStore((state) => state.getBreakthroughRequirement());

  const breakthrough = useGameStore((state) => state.breakthrough);
  const setFocusMode = useGameStore((state) => state.setFocusMode);

  const [showPathSelection, setShowPathSelection] = useState(false);
  const [showPerkSelection, setShowPerkSelection] = useState(false);
  const [perkRealmIndex, setPerkRealmIndex] = useState<number>(0);

  // Track previous realm index to detect realm breakthroughs
  const previousRealmIndex = useRef(realm.index);

  const currentRealm = REALMS[realm.index];
  const nextSubstage = realm.substage + 1;
  const isLastSubstage = nextSubstage > currentRealm.substages;

  // Show path selection when player reaches Foundation (realm 1) and hasn't chosen
  useEffect(() => {
    if (realm.index >= 1 && !selectedPath) {
      setShowPathSelection(true);
    }
  }, [realm.index, selectedPath]);

  // Detect realm breakthrough and show perk selection
  useEffect(() => {
    // Check if realm index increased
    if (realm.index > previousRealmIndex.current && selectedPath) {
      // Realm breakthrough occurred - show perk selection for the NEW realm
      setPerkRealmIndex(realm.index);
      setShowPerkSelection(true);
      previousRealmIndex.current = realm.index;
    }
  }, [realm.index, selectedPath]);

  // Check if can breakthrough
  const canBreakthrough = () => {
    return Number(qi) >= Number(breakthroughCost);
  };

  // Handle breakthrough button click
  const handleBreakthrough = () => {
    breakthrough();
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-lg">
      {/* Mountain background */}
      <MountainBackground />

      {/* Pine tree decoration */}
      <PineTree />

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-2">
            Cultivation Chamber
          </h1>
          <p className="text-slate-400 text-sm">
            Meditate and gather Qi to advance your cultivation
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Meditation Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meditating Character */}
            <div className="relative bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-8 backdrop-blur-sm">
              <MeditatingCharacter />

              {/* Qi Stats */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-qi-blue/30">
                  <div className="text-xs text-slate-400 uppercase mb-1">Current Qi</div>
                  <div className="text-2xl font-bold text-qi-blue">{formatNumber(qi)}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-qi-blue/30">
                  <div className="text-xs text-slate-400 uppercase mb-1">Qi per Second</div>
                  <div className="text-2xl font-bold text-qi-blue">
                    {formatNumber(qiPerSecond)}
                  </div>
                </div>
              </div>
            </div>

            {/* Breakthrough Progress */}
            <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6 backdrop-blur-sm">
              <div className="mb-4">
                <div className="font-cinzel text-xl font-bold text-gold-accent mb-1">
                  {currentRealm.name}
                </div>
                <div className="text-sm text-slate-400">
                  {isLastSubstage
                    ? 'Maximum stage reached'
                    : `Stage ${realm.substage} → ${nextSubstage}`}
                </div>
              </div>

              <OrnateProgressBar current={qi} max={breakthroughCost} label="Breakthrough Progress" />

              {/* Breakthrough Button */}
              <button
                onClick={handleBreakthrough}
                disabled={!canBreakthrough()}
                className={`
                  w-full mt-6 py-4 px-6 rounded-lg font-cinzel font-bold text-lg
                  transition-all duration-300
                  ${
                    canBreakthrough()
                      ? 'bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white hover:from-red-500 hover:via-pink-500 hover:to-red-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] cursor-pointer'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                  }
                `}
              >
                {canBreakthrough() ? '✨ Break Through! ✨' : '🔒 Insufficient Qi'}
              </button>
            </div>
          </div>

          {/* RIGHT: Focus & Upgrades */}
          <div className="space-y-6">
            {/* Focus Mode Selector */}
            <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6 backdrop-blur-sm">
              <h3 className="font-cinzel text-lg font-bold text-gold-accent mb-4">
                Cultivation Focus
              </h3>

              <div className="space-y-3">
                {(['balanced', 'body', 'spirit'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFocusMode(mode)}
                    className={`
                      w-full p-3 rounded-lg border-2 transition-all text-left
                      ${
                        focusMode === mode
                          ? 'border-qi-blue bg-qi-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                          : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                      }
                    `}
                  >
                    <div className="font-bold text-white capitalize">{mode}</div>
                    <div className="text-xs text-slate-400">
                      {mode === 'balanced' && 'Equal focus on all aspects'}
                      {mode === 'body' && 'Enhance physical cultivation'}
                      {mode === 'spirit' && 'Focus on spiritual energy'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cultivation Info */}
            <div className="bg-ink-dark/50 rounded-lg border-2 border-gold-accent/30 p-6 backdrop-blur-sm">
              <h3 className="font-cinzel text-lg font-bold text-gold-accent mb-4">
                Cultivation Info
              </h3>

              <div className="space-y-3 text-sm text-slate-300">
                <div>
                  <div className="text-slate-400 mb-1">Current Path</div>
                  <div className="text-white font-bold capitalize">
                    {useGameStore.getState().selectedPath || 'None'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Total Auras</div>
                  <div className="text-pink-400 font-bold">
                    {formatNumber(useGameStore.getState().totalAuras)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shimmer keyframes (add to global CSS or use Tailwind plugin) */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-float-slow {
          animation: float-slow 5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>

      {/* Path Selection Modal */}
      {showPathSelection && (
        <PathSelectionModal onClose={() => setShowPathSelection(false)} />
      )}

      {/* Perk Selection Modal */}
      {showPerkSelection && (
        <PerkSelectionModal
          onClose={() => setShowPerkSelection(false)}
          realmIndex={perkRealmIndex}
        />
      )}
    </div>
  );
}
