import { useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore';
import './CityMapHub.scss';
import cityAlchemyBg from '../../assets/background/citystates/city_alchemy.png';
import cityApothecaryBg from '../../assets/background/citystates/city_apothecary.png';
import cityBountiesBg from '../../assets/background/citystates/city_bounties_expeditions.png';
import cityForgeBg from '../../assets/background/citystates/city_forge.png';
import cityGateBg from '../../assets/background/citystates/city_gate.png';
import cityManualBg from '../../assets/background/citystates/city_manual.png';
import cityOutskirtsBg from '../../assets/background/citystates/city_outskirts.png';
import cityRuinsBg from '../../assets/background/citystates/city_ruins.png';
import cityTalismanBg from '../../assets/background/citystates/city_talisman.png';

const MODULE_POSITIONS: Record<string, { leftPct: number; topPct: number }> = {
  manualPavilion: { leftPct: 86.6, topPct: 13 },
  apothecary: { leftPct: 30.5, topPct: 41 },
  alchemy: { leftPct: 39.4, topPct: 63 },
  forge: { leftPct: 60.3, topPct: 85 },
  talismanStudio: { leftPct: 44.5, topPct: 82 },
  bounties: { leftPct: 27.3, topPct: 80 },
  expeditions: { leftPct: 27.3, topPct: 85.5 },
  outskirts: { leftPct: 57, topPct: 45 },
  gateTrial: { leftPct: 91.2, topPct: 76 },
  ruins: { leftPct: 73, topPct: 58 },
};

const MODULE_BACKGROUNDS: Record<string, string> = {
  apothecary: cityApothecaryBg,
  manualPavilion: cityManualBg,
  alchemy: cityAlchemyBg,
  forge: cityForgeBg,
  talismanStudio: cityTalismanBg,
  bounties: cityBountiesBg,
  expeditions: cityBountiesBg,
  outskirts: cityOutskirtsBg,
  gateTrial: cityGateBg,
  ruins: cityRuinsBg,
};

export interface CityMapHubProps {
  modules: string[];
  activeModuleKey: string | null;
  getModuleLabel: (moduleKey: string) => string;
  onOpenModule: (moduleKey: string) => void;
}

export function CityMapHub({ modules, activeModuleKey, getModuleLabel, onOpenModule }: CityMapHubProps) {
  const setLayoutBackgroundOverride = useUIStore((state) => state.setLayoutBackgroundOverride);

  const handleHover = (moduleKey: string | null) => {
    if (moduleKey && MODULE_BACKGROUNDS[moduleKey]) {
      setLayoutBackgroundOverride(MODULE_BACKGROUNDS[moduleKey]);
      return;
    }
    setLayoutBackgroundOverride(null);
  };

  useEffect(() => {
    return () => setLayoutBackgroundOverride(null);
  }, [setLayoutBackgroundOverride]);

  return (
    <div className="cityMapHub">
      <div className="cityMapHubMap" aria-label="City map">
        {modules.map((moduleKey) => {
          const position = MODULE_POSITIONS[moduleKey];
          if (!position) return null;
          const isActive = activeModuleKey === moduleKey;
          return (
            <button
              key={moduleKey}
              type="button"
              className={`cityMapHubHotspot ${isActive ? 'cityMapHubHotspot--active' : ''}`}
              style={{ left: `${position.leftPct}%`, top: `${position.topPct}%` }}
              onClick={() => onOpenModule(moduleKey)}
              onMouseEnter={() => handleHover(moduleKey)}
              onMouseLeave={() => handleHover(null)}
            >
              <span className="cityMapHubHotspotLabel">{getModuleLabel(moduleKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
