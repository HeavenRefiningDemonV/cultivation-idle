import { InkBanner } from '../../ink/InkBanner.js';
import { InkGrain } from '../../ink/InkGrain.js';
import { InkObservatoryDefs } from '../../ink/InkObservatoryDefs.js';
import { InkTassel } from '../../ink/InkTassel.js';
import { InkWaxSeal } from '../../ink/InkWaxSeal.js';
import './StatusObservatoryMaterialsGallery.scss';

const ROOT_TOKENS = [
  '--root-wood', '--root-fire', '--root-earth', '--root-metal', '--root-water',
  '--root-wind', '--root-lightning', '--root-ice', '--root-light', '--root-shadow',
  '--root-soul', '--root-void', '--root-time', '--root-astral',
];

const PAPER_TOKENS = [
  '--paper-parchment-warm', '--paper-parchment-deep', '--paper-gold-pale',
  '--paper-gold-deep', '--paper-jade-ink', '--paper-cinnabar-deep', '--paper-foxing',
];

/**
 * Dev-only Wave 0 materials gallery. Renders the shared painterly primitives on
 * the void stage so they can be screenshot-matched against the artifact crops:
 * the paper plate (foxing + vignette), the gold frame + corner brackets + banner,
 * grain, cinnabar/jade wax-seal chops, a row of sway tassels, and a labelled
 * swatch strip of every new token. Mounted via ?obsGallery=materials (DEV only).
 */
export function StatusObservatoryMaterialsGallery() {
  return (
    <div className="materialsGallery obsVoidBackdrop" data-testid="obs-materials-gallery">
      <InkObservatoryDefs />
      <h1 className="materialsGallery__title">Observatory Materials Gallery — Wave 0</h1>

      <div className="materialsGallery__row">
        <figure className="materialsGallery__cell">
          <div className="materialsGallery__plate materialsGallery__plate--foxing obsParchmentPlate">
            <InkGrain />
            <span className="materialsGallery__plateLabel">.panel + foxing + vignette + grain</span>
          </div>
          <figcaption>Paper plate (P2) + grain (P4)</figcaption>
        </figure>

        <figure className="materialsGallery__cell">
          <div className="materialsGallery__plate materialsGallery__plate--foxing materialsGallery__plate--framed obsParchmentPlate">
            <span className="materialsGallery__brackets obsCornerBrackets" aria-hidden="true">
              <span className="obsCornerBrackets__lower" />
            </span>
            <InkGrain />
            <InkBanner title="Meridian Vessel Compass" />
            <span className="materialsGallery__plateLabel">+ gold frame + brackets + banner</span>
          </div>
          <figcaption>Gold frame + brackets + banner (P3)</figcaption>
        </figure>
      </div>

      <div className="materialsGallery__row">
        <figure className="materialsGallery__cell materialsGallery__cell--seals">
          <InkWaxSeal chars="狀態" size={64} rotation={-4} variant="cinnabar" />
          <InkWaxSeal chars="觀" size={64} rotation={5} variant="jade" />
          <figcaption>Wax-seal chops (P6) — cinnabar / jade</figcaption>
        </figure>

        <figure className="materialsGallery__cell materialsGallery__cell--tassels">
          <svg width="200" height="64" viewBox="0 0 200 64" aria-hidden="true">
            <InkTassel x={24} y={8} color="var(--paper-stamp)" />
            <InkTassel x={72} y={8} color="var(--paper-amber)" />
            <InkTassel x={120} y={8} color="var(--paper-jade-bright)" />
            <InkTassel x={168} y={8} color="var(--paper-rare)" />
          </svg>
          <figcaption>Sway tassels (P6) — reduced-motion safe</figcaption>
        </figure>
      </div>

      <div className="materialsGallery__swatches">
        <h2 className="materialsGallery__swTitle">14-root palette</h2>
        <div className="materialsGallery__swatchStrip">
          {ROOT_TOKENS.map((t) => (
            <div key={t} className="materialsGallery__swatch">
              <span className="materialsGallery__chip" style={{ background: `var(${t})` }} />
              <span className="materialsGallery__swatchLabel">{t}</span>
            </div>
          ))}
        </div>
        <h2 className="materialsGallery__swTitle">New paper tokens</h2>
        <div className="materialsGallery__swatchStrip">
          {PAPER_TOKENS.map((t) => (
            <div key={t} className="materialsGallery__swatch">
              <span className="materialsGallery__chip" style={{ background: `var(${t})` }} />
              <span className="materialsGallery__swatchLabel">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
