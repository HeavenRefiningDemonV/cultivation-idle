import { useTechniqueStore } from '../stores/techniqueStore';
import { useGameStore } from '../stores/gameStore';
import { D } from '../utils/numbers';

export function TechniquePanel() {
  const { techniques, currentIntent, maxIntent, useTechnique, canUseTechnique } =
    useTechniqueStore();
  const selectedPath = useGameStore((state) => state.selectedPath);

  if (!selectedPath) return null;

  const pathTechniques = Object.values(techniques).filter(
    (t) => t.path === selectedPath && t.unlocked
  );

  if (pathTechniques.length === 0) return null;

  // Calculate intent percentage
  const intentPercent = D(currentIntent).dividedBy(D(maxIntent)).times(100).toNumber();

  return (
    <div className="bg-slate-800/50 border-2 border-gold-accent/30 rounded-lg p-4 backdrop-blur-sm">
      <h3 className="text-xl font-cinzel font-bold text-gold-accent mb-3">
        Techniques
      </h3>

      {/* Intent Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-purple-400 font-semibold">Intent</span>
          <span className="font-mono text-purple-300">
            {D(currentIntent).toFixed(0)} / {D(maxIntent).toFixed(0)}
          </span>
        </div>
        <div className="h-3 bg-slate-900 rounded-full overflow-hidden border-2 border-purple-500/50">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
            style={{ width: `${intentPercent}%` }}
          />
        </div>
      </div>

      {/* Techniques List */}
      <div className="space-y-2">
        {pathTechniques.map((tech) => {
          const canUse = canUseTechnique(tech.id);
          const cooldownPercent = Math.min(
            ((Date.now() - tech.lastUsed) / tech.cooldown) * 100,
            100
          );
          const isOnCooldown = Date.now() - tech.lastUsed < tech.cooldown;
          const proficiencyPercent =
            (tech.proficiency % 1000) / 10;

          // Tier-based styling
          const getTierColor = () => {
            switch (tech.tier) {
              case 1:
                return {
                  border: 'border-blue-400',
                  bg: 'bg-blue-900/30',
                  text: 'text-blue-300',
                  badge: 'bg-blue-500',
                };
              case 2:
                return {
                  border: 'border-purple-400',
                  bg: 'bg-purple-900/30',
                  text: 'text-purple-300',
                  badge: 'bg-purple-500',
                };
              case 3:
                return {
                  border: 'border-orange-400',
                  bg: 'bg-orange-900/30',
                  text: 'text-orange-300',
                  badge: 'bg-orange-500',
                };
              default:
                return {
                  border: 'border-gray-400',
                  bg: 'bg-gray-900/30',
                  text: 'text-gray-300',
                  badge: 'bg-gray-500',
                };
            }
          };

          const tierColors = getTierColor();

          return (
            <div
              key={tech.id}
              className={`border-2 rounded-lg p-3 transition-all ${tierColors.border} ${tierColors.bg} ${
                canUse && !isOnCooldown
                  ? 'cursor-pointer hover:scale-105 hover:shadow-lg'
                  : 'opacity-60'
              }`}
              onClick={() => canUse && !isOnCooldown && useTechnique(tech.id)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold font-cinzel text-slate-100">
                  {tech.name}
                </div>
                <div className={`text-xs ${tierColors.badge} text-white px-2 py-1 rounded font-bold`}>
                  Lv {tech.level}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                {tech.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={tierColors.text}>
                  💫 {tech.intentCost} Intent
                </span>
                <span className="text-slate-400">
                  ⏱️ CD: {(tech.cooldown / 1000).toFixed(1)}s
                </span>
              </div>

              {/* Cooldown Bar */}
              {isOnCooldown && (
                <div className="mb-2 h-2 bg-slate-900 rounded-full overflow-hidden border border-red-500/50">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-100"
                    style={{ width: `${cooldownPercent}%` }}
                  />
                </div>
              )}

              {/* Proficiency Bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Proficiency</span>
                  <span className="text-slate-300 font-mono">
                    {tech.proficiency % 1000} / 1000
                  </span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-gold-accent/30">
                  <div
                    className="h-full bg-gradient-to-r from-gold-accent to-yellow-500 transition-all"
                    style={{ width: `${proficiencyPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Auto-cast Indicator */}
      <div className="mt-3 text-xs text-center text-slate-400 italic">
        ✨ Techniques auto-cast in combat
      </div>
    </div>
  );
}
