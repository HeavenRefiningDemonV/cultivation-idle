import './WorldOverlayRibbon.scss';

export interface WorldOverlayRibbonCityOption {
  cityId: string;
  label: string;
  isUnlocked: boolean;
  isCurrent: boolean;
  requirementText?: string | null;
}

interface WorldOverlayRibbonProps {
  worldLabel?: string;
  cityOptions: readonly WorldOverlayRibbonCityOption[];
  selectedCityId: string | null;
  onSelectCity: (cityId: string) => void;
  supportCapsuleText: string | null;
  phaseLine?: string | null;
  pressureLine?: string | null;
}

export function WorldOverlayRibbon({
  worldLabel = 'World',
  cityOptions,
  selectedCityId,
  onSelectCity,
  supportCapsuleText,
  phaseLine,
  pressureLine,
}: WorldOverlayRibbonProps) {
  return (
    <div className="worldOverlayRibbon" role="region" aria-label="World overlay ribbon">
      <div className="worldOverlayRibbon__left">
        <span className="worldOverlayRibbon__label">{worldLabel}</span>
        {phaseLine ? <span className="worldOverlayRibbon__phaseLine">{phaseLine}</span> : null}
      </div>

      <div className="worldOverlayRibbon__center">
        <label className="worldOverlayRibbon__srOnly" htmlFor="world-overlay-city-selector">
          Select city
        </label>
        <select
          id="world-overlay-city-selector"
          className="worldOverlayRibbon__citySelect uiNoShift"
          value={selectedCityId ?? ''}
          onChange={(event) => onSelectCity(event.target.value)}
        >
          {cityOptions.map((option) => (
            <option key={option.cityId} value={option.cityId} disabled={!option.isUnlocked}>
              {option.isUnlocked
                ? option.label
                : `${option.label} — Locked — ${option.requirementText ?? 'Requirement unavailable'}`}
            </option>
          ))}
        </select>
      </div>

      <div className="worldOverlayRibbon__right">
        {pressureLine ? <span className="worldOverlayRibbon__pressure">{pressureLine}</span> : null}
        {supportCapsuleText ? <span className="worldOverlayRibbon__capsule">{supportCapsuleText}</span> : null}
      </div>
    </div>
  );
}
