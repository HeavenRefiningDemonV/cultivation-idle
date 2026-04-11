import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../../stores/uiStore.js';
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
import type { FxEffectiveQuality } from '../../ui/fx/types.js';

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
  moduleMetadataByKey?: Readonly<Record<string, {
    roleTag: string;
    bestUsedWhen: string;
    outputs: readonly string[];
    chipKind: string | null;
  }>>;
  getModuleLabel: (moduleKey: string) => string;
  /** Deprecated W2 compatibility prop. Do not invoke for direct-open behavior; W3 rewires parent selection contract. */
  onOpenModule?: (moduleKey: string) => void;
  /** Deprecated W2 compatibility prop retained to keep WorldScreen unchanged during W2. */
  atmosphereQuality?: FxEffectiveQuality;
  /** Deprecated W2 compatibility prop retained to keep WorldScreen unchanged during W2. */
  prefersReducedMotion?: boolean;
  onSelectModule?: (moduleKey: string) => void;
  onPreviewModuleChange?: (moduleKey: string | null) => void;
}

export function CityMapHub({
  modules,
  activeModuleKey,
  recommendedModuleKey: _recommendedModuleKey = null,
  moduleMetadataByKey: _moduleMetadataByKey = {},
  getModuleLabel,
  onOpenModule: _onOpenModule,
  atmosphereQuality: _atmosphereQuality = 'medium',
  prefersReducedMotion: _prefersReducedMotion = false,
  onSelectModule,
  onPreviewModuleChange,
}: CityMapHubProps) {
  const setLayoutBackgroundOverride = useUIStore((state) => state.setLayoutBackgroundOverride);
  const [localLockedSelectedModuleKey, setLocalLockedSelectedModuleKey] = useState<string | null>(activeModuleKey);
  const [localPreviewModuleKey, setLocalPreviewModuleKey] = useState<string | null>(null);
  const lastSeenActiveModuleRef = useRef<string | null>(activeModuleKey);

  useEffect(() => {
    if (lastSeenActiveModuleRef.current === activeModuleKey) return;
    lastSeenActiveModuleRef.current = activeModuleKey;
    setLocalLockedSelectedModuleKey(activeModuleKey);
  }, [activeModuleKey]);

  const updatePreview = (moduleKey: string | null) => {
    setLocalPreviewModuleKey(moduleKey);
    onPreviewModuleChange?.(moduleKey);
    if (moduleKey && MODULE_BACKGROUNDS[moduleKey]) {
      setLayoutBackgroundOverride(MODULE_BACKGROUNDS[moduleKey]);
      return;
    }
    setLayoutBackgroundOverride(null);
  };

  useEffect(() => {
    return () => {
      setLayoutBackgroundOverride(null);
      onPreviewModuleChange?.(null);
    };
  }, [onPreviewModuleChange, setLayoutBackgroundOverride]);

  const handleSelect = (moduleKey: string) => {
    setLocalLockedSelectedModuleKey(moduleKey);
    onSelectModule?.(moduleKey);
  };

  return (
    <div className="cityMapHub">
      <div className="cityMapHubMap" aria-label="City map">
        {modules.map((moduleKey) => {
          const position = MODULE_POSITIONS[moduleKey];
          if (!position) return null;

          const isLockedSelected = localLockedSelectedModuleKey === moduleKey;
          const isPreviewed = localPreviewModuleKey === moduleKey;

          return (
            <div
              key={moduleKey}
              className={`cityMapHubHotspot ${isLockedSelected ? 'cityMapHubHotspot--selected' : ''} ${isPreviewed ? 'cityMapHubHotspot--preview' : ''}`}
              style={{ left: `${position.leftPct}%`, top: `${position.topPct}%` }}
            >
              <button
                type="button"
                className="cityMapHubHotspotButton uiNoShift"
                onClick={() => handleSelect(moduleKey)}
                onMouseEnter={() => updatePreview(moduleKey)}
                onMouseLeave={() => updatePreview(null)}
                onFocus={() => updatePreview(moduleKey)}
                onBlur={() => updatePreview(null)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleSelect(moduleKey);
                  }
                }}
                title={getModuleLabel(moduleKey)}
                aria-pressed={isLockedSelected}
              >
                <span className="cityMapHubHotspotLabel">
                  <span className="cityMapHubHotspotLabelName">{getModuleLabel(moduleKey)}</span>
                  <span className="cityMapHubHotspotStateSlot" aria-hidden="true" />
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
