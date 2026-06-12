import type { StatusObservatorySurfaceV1 } from '../../../systems/ui/status/statusObservatoryTypes.js';
import { ObservatoryDiscMedallion } from './ObservatoryDiscMedallion.js';

interface StatusVitalsSealRibbonProps {
  surface: StatusObservatorySurfaceV1['vitalsRibbon'];
}

/* W6-decorative gold-disc glyphs. Keyed on the live runtime metric ids
   (combat-strength / crit-rate) AND the fixture ids (qi / qi-rate / stability / hp /
   combat / crit / ...), so both render; an unmapped id omits the glyph (disc only) and
   never breaks. The adjacent label + value are always the truth. */
const VITALS_GLYPH: Record<string, string> = {
  qi: '氣',
  'qi-rate': '速',
  stability: '穩',
  hp: '命',
  combat: '戰',
  'combat-strength': '戰',
  attack: '攻',
  defense: '守',
  crit: '暴',
  'crit-rate': '暴',
};

export function StatusVitalsSealRibbon({ surface }: StatusVitalsSealRibbonProps) {
  return (
    <section
      className="statusObservatoryVitals statusVitalsRibbon"
      data-testid="status-ledger-metrics"
      data-surface-testid={surface.rootTestId}
      aria-label={surface.title}
    >
      {surface.seals.map((seal) => (
        <div
          key={seal.id}
          className="statusVitalsRibbon__seal"
          data-tone={seal.tone}
          aria-label={
            seal.tone === 'danger'
              ? `${seal.ariaLabel} At risk.`
              : seal.tone === 'warning'
                ? `${seal.ariaLabel} Caution.`
                : seal.ariaLabel
          }
        >
          <ObservatoryDiscMedallion
            className="statusVitalsRibbon__medallion"
            glyph={VITALS_GLYPH[seal.id] ?? null}
            variant={seal.tone === 'danger' ? 'cinnabar' : 'gold'}
          />
          <span className="statusVitalsRibbon__label">{seal.label}</span>
          <strong className="statusVitalsRibbon__value">{seal.value ?? 'Unavailable'}</strong>
        </div>
      ))}
    </section>
  );
}
