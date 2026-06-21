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

// F0-KIT item-language deposit. The rarity ladder proves grayscale legibility by
// FRAME WEIGHT + SEAL + LABEL, not hue alone (Codex D-E2/D-E3/D-E10): r1->r5
// escalate single-hairline -> heavier rule -> double rule -> gold-leaf double ->
// gold-leaf double + corner-bracket + apex wax-seal. Affix/path rows are swatches.
const RARITY_RUNGS = [
  { token: '--rarity-mortal', label: 'Mortal', rung: 'common', frame: 'r1', seal: false },
  { token: '--rarity-spirit', label: 'Spirit', rung: 'uncommon', frame: 'r2', seal: false },
  { token: '--rarity-earth', label: 'Earth', rung: 'rare', frame: 'r3', seal: false },
  { token: '--rarity-heaven', label: 'Heaven', rung: 'epic', frame: 'r4', seal: false },
  { token: '--rarity-immortal', label: 'Immortal', rung: 'legendary', frame: 'r5', seal: true },
] as const;

const AFFIX_TOKENS = ['--affix-prefix-tint', '--affix-suffix-tint', '--affix-bond-tint'];
const PATH_TOKENS = ['--path-heaven-accent', '--path-earth-accent', '--path-martial-accent'];

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

        <h2 className="materialsGallery__swTitle">Item-rarity ramp (frame weight + seal, not hue alone)</h2>
        <div className="materialsGallery__rarityLadder">
          {RARITY_RUNGS.map(({ token, label, rung, frame, seal }) => (
            <figure key={token} className="materialsGallery__rarityCell">
              <span className="materialsGallery__chip" style={{ background: `var(${token})` }} />
              <div className={`materialsGallery__rarityFrame materialsGallery__rarityFrame--${frame} obsParchmentPlate`}>
                {seal && (
                  <span className="materialsGallery__brackets obsCornerBrackets" aria-hidden="true">
                    <span className="obsCornerBrackets__lower" />
                  </span>
                )}
                {seal && (
                  <InkWaxSeal
                    chars="極"
                    size={40}
                    rotation={-3}
                    variant="cinnabar"
                    className="materialsGallery__raritySeal"
                  />
                )}
                <span className="materialsGallery__rarityName">{label}</span>
              </div>
              <span className="materialsGallery__swatchLabel">{token} · {rung}</span>
            </figure>
          ))}
        </div>

        <h2 className="materialsGallery__swTitle">Affix-tier tints</h2>
        <div className="materialsGallery__swatchStrip">
          {AFFIX_TOKENS.map((t) => (
            <div key={t} className="materialsGallery__swatch">
              <span className="materialsGallery__chip" style={{ background: `var(${t})` }} />
              <span className="materialsGallery__swatchLabel">{t}</span>
            </div>
          ))}
        </div>

        <h2 className="materialsGallery__swTitle">Per-path accents</h2>
        <div className="materialsGallery__swatchStrip">
          {PATH_TOKENS.map((t) => (
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
