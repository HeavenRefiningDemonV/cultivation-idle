import './CityMapHub.scss';

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
              <span className="cityMapHubHotspotLabel">{getModuleLabel(moduleKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
