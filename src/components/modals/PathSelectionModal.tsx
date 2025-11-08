import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { CultivationPath } from '../../types';

interface PathSelectionModalProps {
  onClose: () => void;
}

export function PathSelectionModal({ onClose }: PathSelectionModalProps) {
  const { selectPath } = useGameStore();
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const paths = [
    {
      id: 'heaven' as CultivationPath,
      name: 'Heaven Path',
      color: 'from-blue-400 to-purple-500',
      borderColor: 'border-blue-500',
      icon: '☁️',
      theme: 'Spiritual Cultivation',
      description:
        'Masters of Qi and spiritual energy. Heaven cultivators focus on pure energy accumulation and efficient breakthroughs.',
      bonuses: [
        '+50% Idle Qi Generation',
        '+30% Attack Power',
        '+10% Critical Hit Chance',
        '+5% Dodge Chance',
        '-20% HP (Glass Cannon)',
        '-10% Defense',
      ],
      playstyle:
        'Ideal for fast progression. Highest Qi generation with strong offense but lower defenses.',
    },
    {
      id: 'earth' as CultivationPath,
      name: 'Earth Path',
      color: 'from-green-600 to-yellow-700',
      borderColor: 'border-green-600',
      icon: '⛰️',
      theme: 'Body Cultivation',
      description:
        'Masters of physical endurance and defense. Earth cultivators temper their bodies to withstand immense punishment.',
      bonuses: [
        '+50% Maximum HP',
        '+40% Defense',
        'Normal Qi Generation',
        'Highest Survivability',
        '-10% Attack Power',
      ],
      playstyle:
        'Ideal for survival-focused play. Best for difficult dungeons and bosses. Slow but steady.',
    },
    {
      id: 'martial' as CultivationPath,
      name: 'Martial Path',
      color: 'from-red-500 to-orange-600',
      borderColor: 'border-red-500',
      icon: '⚔️',
      theme: 'Combat Cultivation',
      description:
        'Masters of battle and techniques. Martial cultivators hone their combat prowess to devastating levels.',
      bonuses: [
        '+50% Attack Damage',
        '+30% Critical Damage',
        '+20% Qi Generation',
        '+20% HP',
        'Balanced Combat Style',
      ],
      playstyle:
        'Ideal for combat-focused play. Highest damage output and fastest enemy kills. Well-rounded stats.',
    },
  ];

  const handleSelectPath = (pathId: CultivationPath) => {
    selectPath(pathId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border-4 border-gold-accent rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto p-8">
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-gold-accent mb-3">
            Choose Your Cultivation Path
          </h1>
          <p className="text-lg text-slate-300">
            This choice is permanent and defines your cultivation journey
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Each path grants unique bonuses and playstyle characteristics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paths.map((path) => (
            <div
              key={path.id}
              onMouseEnter={() => setHoveredPath(path.id)}
              onMouseLeave={() => setHoveredPath(null)}
              className={`bg-slate-800/50 border-4 rounded-lg p-6 cursor-pointer transition-all transform backdrop-blur-sm ${
                hoveredPath === path.id
                  ? `${path.borderColor} scale-105 shadow-2xl shadow-${path.borderColor}/50`
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onClick={() => handleSelectPath(path.id)}
            >
              <div
                className={`text-6xl mb-4 text-center ${
                  hoveredPath === path.id ? 'animate-bounce' : ''
                }`}
              >
                {path.icon}
              </div>

              <div
                className={`bg-gradient-to-r ${path.color} text-white text-center py-3 px-4 rounded-lg mb-4`}
              >
                <h2 className="text-2xl font-bold">{path.name}</h2>
                <p className="text-sm opacity-90">{path.theme}</p>
              </div>

              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                {path.description}
              </p>

              <div className="bg-green-900/30 border-2 border-green-500/50 rounded-lg p-3 mb-4">
                <h3 className="text-sm font-semibold text-green-300 mb-2">
                  Path Bonuses:
                </h3>
                <ul className="space-y-1">
                  {path.bonuses.map((bonus, idx) => (
                    <li key={idx} className="text-xs text-green-200">
                      {bonus.includes('-') ? '⚠' : '✓'} {bonus}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-lg p-3 mb-4">
                <h3 className="text-sm font-semibold text-blue-300 mb-1">Playstyle:</h3>
                <p className="text-xs text-blue-200">{path.playstyle}</p>
              </div>

              <button
                className={`w-full bg-gradient-to-r ${path.color} text-white font-bold py-3 px-4 rounded-lg transition-all hover:shadow-lg`}
              >
                Choose {path.name}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 italic">
            💡 Tip: All paths are viable! Choose based on your preferred playstyle.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            You cannot change your path after selection
          </p>
        </div>
      </div>
    </div>
  );
}
