import { useEffect } from 'react';
import { useUIStore } from '../../stores/uiStore.js';
import { DEFERRED_WORLD_MODULES } from '../../systems/world/liveWorldSchema.js';
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
import { ScenicLabel } from '../../ui/shell/index.js';

export type WorldHotspotChipKind = 'NOW' | 'SOON' | 'CLAIM' | 'IDLE' | 'FIX' | 'GATE' | 'LOW';

const HIDDEN_HUB_MODULES = new Set<string>(DEFERRED_WORLD_MODULES);
const CITY_MAP_HUB_SCENIC_LABEL_VARIANT = 'building' as const;
const CITY_MAP_HUB_SCENIC_LABEL_RESERVE_STATE_SLOT = true;
const WORLD_MAP_CHIP_ABBREVIATIONS: Record<WorldHotspotChipKind, string> = {
  NOW: 'NOW',
  SOON: 'SOON',
  CLAIM: 'CLM',
  IDLE: 'IDLE',
  FIX: 'FIX',
  GATE: 'GATE',
  LOW: 'LOW',
};

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
  trainingHall: { leftPct: 47.5, topPct: 24 },
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
  trainingHall: cityManualBg,
  ruins: cityRuinsBg,
};

export interface CityMapHubProps {
  modules: string[];
  activeModuleKey: string | null;
  moduleCueByKey?: Partial<Record<string, WorldHotspotChipKind>>;
  glintModuleKey?: string | null;
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
  moduleCueByKey = {},
  glintModuleKey = null,
  recommendedModuleKey = null,
  moduleMetadataByKey,
  getModuleLabel,
  onOpenModule,
  atmosphereQuality = 'medium',
  prefersReducedMotion = false,
  onSelectModule,
  onPreviewModuleChange,
}: CityMapHubProps) {
  const setLayoutBackgroundOverride = useUIStore((state) => state.setLayoutBackgroundOverride);

  const handleHover = (moduleKey: string | null) => {
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

  const handleOpen = (moduleKey: string) => {
    onSelectModule?.(moduleKey);
    onOpenModule?.(moduleKey);
  };

  return (
    <div className="cityMapHub">
      <div
        className="cityMapHubMap"
        aria-label="City map"
        data-atmosphere-quality={atmosphereQuality}
        data-reduced-motion={prefersReducedMotion ? '1' : '0'}
      >
        {modules.map((moduleKey) => {
          if (HIDDEN_HUB_MODULES.has(moduleKey)) return null;
          const position = MODULE_POSITIONS[moduleKey];
          if (!position) return null;
          const isActive = activeModuleKey === moduleKey;
          const cueKind = moduleCueByKey[moduleKey] ?? null;
          const isRecommended = recommendedModuleKey === moduleKey;
          const isGlinting = glintModuleKey === moduleKey;
          const metadata = moduleMetadataByKey?.[moduleKey] ?? null;
          const outputsPreview = metadata?.outputs.slice(0, 2).join(' / ') ?? null;
          const labelState = isActive ? 'active' : isRecommended ? 'recommended' : 'default';
          const stateSlot = cueKind ? WORLD_MAP_CHIP_ABBREVIATIONS[cueKind] : undefined;
          const ariaDescription = metadata
            ? `${metadata.roleTag}. ${metadata.bestUsedWhen}`
            : `Open ${getModuleLabel(moduleKey)}`;

          return (
            <button
              key={moduleKey}
              type="button"
              className={[
                'cityMapHubHotspot',
                isActive ? 'cityMapHubHotspot--active' : '',
                isRecommended ? 'cityMapHubHotspot--recommended' : '',
                isGlinting ? 'cityMapHubHotspot--glint' : '',
              ].filter(Boolean).join(' ')}
              data-cue-kind={cueKind ?? undefined}
              style={{ left: `${position.leftPct}%`, top: `${position.topPct}%` }}
              onClick={() => handleOpen(moduleKey)}
              onMouseEnter={() => handleHover(moduleKey)}
              onMouseLeave={() => handleHover(null)}
              onFocus={() => handleHover(moduleKey)}
              onBlur={() => handleHover(null)}
              title={metadata ? `${metadata.roleTag} - ${metadata.bestUsedWhen}` : `Open ${getModuleLabel(moduleKey)}`}
              aria-label={`Open ${getModuleLabel(moduleKey)}: ${metadata?.roleTag ?? 'World module'}`}
            >
              <ScenicLabel
                variant={CITY_MAP_HUB_SCENIC_LABEL_VARIANT}
                state={labelState}
                reserveStateSlot={CITY_MAP_HUB_SCENIC_LABEL_RESERVE_STATE_SLOT}
                stateSlot={stateSlot}
                emphasis="medium"
                className="cityMapHubHotspotTrigger uiNoShift"
                label={(
                  <>
                    <span className="cityMapHubHotspotLabel">{getModuleLabel(moduleKey)}</span>
                    {metadata ? (
                      <span className="cityMapHubHotspotMeta" aria-hidden="true">
                        <span className="cityMapHubHotspotRole">{metadata.roleTag}</span>
                        {outputsPreview ? <span className="cityMapHubHotspotOutputs">{outputsPreview}</span> : null}
                      </span>
                    ) : null}
                  </>
                )}
              />
              <span className="cityMapHubSrOnly">{ariaDescription}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
