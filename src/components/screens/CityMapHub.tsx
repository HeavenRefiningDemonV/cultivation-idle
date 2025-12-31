import React from 'react';
import './CityMapHub.scss';

const MODULE_POSITIONS: Record<string, { leftPct: number; topPct: number }> = {
  meditationHall: { leftPct: 24, topPct: 42 },
  manualPavilion: { leftPct: 40, topPct: 30 },
  apothecary: { leftPct: 58, topPct: 48 },
  alchemy: { leftPct: 72, topPct: 35 },
  forge: { leftPct: 34, topPct: 65 },
  talismanStudio: { leftPct: 50, topPct: 70 },
  bounties: { leftPct: 65, topPct: 62 },
  expeditions: { leftPct: 78, topPct: 56 },
  outskirts: { leftPct: 14, topPct: 62 },
  gateTrial: { leftPct: 12, topPct: 30 },
  ruins: { leftPct: 86, topPct: 44 },
};

export interface CityMapHubProps {
  modules: string[];
  activeModuleKey: string | null;
  getModuleLabel: (moduleKey: string) => string;
  onOpenModule: (moduleKey: string) => void;
}

export function CityMapHub({ modules, activeModuleKey, getModuleLabel, onOpenModule }: CityMapHubProps) {
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
            >
              {getModuleLabel(moduleKey)}
            </button>
          );
        })}
      </div>
      <div className="cityMapHubTabs" aria-label="City buildings">
        {modules.map((moduleKey) => {
          const isActive = activeModuleKey === moduleKey;
          return (
            <button
              key={moduleKey}
              type="button"
              className={`cityMapHubTab ${isActive ? 'cityMapHubTab--active' : ''}`}
              onClick={() => onOpenModule(moduleKey)}
            >
              <div className="cityMapHubTabLabel">{getModuleLabel(moduleKey)}</div>
              <div className="cityMapHubTabKey">{moduleKey}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
