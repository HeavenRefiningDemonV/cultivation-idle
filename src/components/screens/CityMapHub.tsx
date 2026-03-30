import { useEffect } from 'react';
import classNames from 'classnames';
import { useUIStore } from '../../stores/uiStore.js';
import { DEFERRED_WORLD_MODULES } from '../../systems/world/liveWorldSchema.js';
import { ScenicLabel, type ScenicLabelState } from '../../ui/shell/index.js';
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

const HIDDEN_HUB_MODULES = new Set<string>(DEFERRED_WORLD_MODULES);

const MODULE_POSITIONS: Record<string, { leftPct: number; topPct: number }> = {
  manualPavilion: { leftPct: 85.6, topPct: 14.5 },
  apothecary: { leftPct: 31, topPct: 41.5 },
  alchemy: { leftPct: 39.8, topPct: 62 },
  forge: { leftPct: 60.1, topPct: 82 },
  talismanStudio: { leftPct: 44.8, topPct: 80 },
  bounties: { leftPct: 28, topPct: 77 },
  expeditions: { leftPct: 28, topPct: 82.5 },
  outskirts: { leftPct: 58, topPct: 45.5 },
  gateTrial: { leftPct: 90, topPct: 74 },
  ruins: { leftPct: 72, topPct: 57 },
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
  recommendedModuleKey?: string | null;
  getModuleLabel: (moduleKey: string) => string;
  onOpenModule: (moduleKey: string) => void;
}

export function CityMapHub({
  modules,
  activeModuleKey,
  recommendedModuleKey = null,
  getModuleLabel,
  onOpenModule,
}: CityMapHubProps) {
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
          if (HIDDEN_HUB_MODULES.has(moduleKey)) return null;
          const position = MODULE_POSITIONS[moduleKey];
          if (!position) return null;
          const isActive = activeModuleKey === moduleKey;
          const isRecommended = !isActive && recommendedModuleKey === moduleKey;
          const labelState: ScenicLabelState = isActive ? 'active' : isRecommended ? 'recommended' : 'default';

          return (
            <div
              key={moduleKey}
              className={classNames('cityMapHubHotspot', `cityMapHubHotspot--${moduleKey}`, {
                'cityMapHubHotspot--active': isActive,
                'cityMapHubHotspot--recommended': isRecommended,
              })}
              style={{ left: `${position.leftPct}%`, top: `${position.topPct}%` }}
            >
              <ScenicLabel
                label={getModuleLabel(moduleKey)}
                variant="building"
                state={labelState}
                reserveStateSlot
                emphasis={isActive ? 'medium' : 'quiet'}
                className="cityMapHubHotspotTrigger uiNoShift"
                onClick={() => onOpenModule(moduleKey)}
                onMouseEnter={() => handleHover(moduleKey)}
                onMouseLeave={() => handleHover(null)}
                onFocus={() => handleHover(moduleKey)}
                onBlur={() => handleHover(null)}
                title={`Open ${getModuleLabel(moduleKey)}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
