/**
 * The artifact panel chrome (living-state-observatory (3).html): the gold
 * double-frame (.__gframe gradient border + .__gframe2 inner hairline), four
 * corner brackets (.__gc), a feTurbulence grain wash (.__grain), an optional
 * ink-wash mountain backdrop (.__mtn, artifact `.panel.mtn` + paintMountains),
 * an optional faint vertical calligraphy watermark column (.__gcol, artifact
 * paintGlyphCols), and an optional centered jade title banner (.__banner)
 * straddling the top edge.
 *
 * Rendered as a fragment INSIDE each region <section> so the literal
 * data-testid="obs-region-*" stays in the shell source (the contract tests
 * grep shell source text, since jsdom cannot render). The instrument content
 * goes in a sibling .obsRegion__content wrapper.
 */

/* Per-panel ink-wash ridge geometry — the verbatim output of the artifact's
 * inkMountains(w,h) generator evaluated at each `.panel.mtn`'s exact pixel box
 * inside the fixed 2048×1152 stage grid (root-law 502×600, vessel 858×600,
 * canopy 632×600, constellation 700×232, ledgers 416×232). The viewBox matches
 * that box 1:1 and preserveAspectRatio="none" stretches it to fill, so the SVG
 * paints identically to the runtime-measured artifact. Ridge fills + the misty
 * stroke colors are the artifact's exact rgba/gradient constants. */
type MtnKey = 'root-law' | 'vessel' | 'canopy' | 'constellation' | 'ledgers';

interface MtnSpec {
  w: number;
  h: number;
  gradientId: string;
  ridges: { fill: string; d: string }[];
  mist: string;
}

const OBS_MTN: Record<MtnKey, MtnSpec> = {
  'root-law': {
    w: 502,
    h: 600,
    gradientId: 'obsMtnRootLaw',
    ridges: [
      { fill: 'rgba(120,138,150,.10)', d: 'M0,614 L0,409 Q0,409 36,400 Q72,391 72,391 Q72,391 108,413 Q143,435 143,435 Q143,435 179,442 Q215,449 215,449 Q215,449 251,444 Q287,440 287,440 Q287,440 323,420 Q359,401 359,401 Q359,401 394,422 Q430,442 430,442 Q430,442 466,437 Q502,432 502,432 L502,614 Z' },
      { fill: 'rgba(86,108,122,.13)', d: 'M0,637 L0,468 Q0,468 36,470 Q72,471 72,471 Q72,471 108,461 Q143,451 143,451 Q143,451 179,459 Q215,468 215,468 Q215,468 251,464 Q287,460 287,460 Q287,460 323,472 Q359,485 359,485 Q359,485 394,469 Q430,453 430,453 Q430,453 466,459 Q502,465 502,465 L502,637 Z' },
      { fill: 'url(#obsMtnRootLaw)', d: 'M0,657 L0,556 Q0,556 36,556 Q72,555 72,555 Q72,555 108,556 Q143,557 143,557 Q143,557 179,557 Q215,558 215,558 Q215,558 251,558 Q287,558 287,558 Q287,558 323,545 Q359,533 359,533 Q359,533 394,524 Q430,516 430,516 Q430,516 466,536 Q502,555 502,555 L502,657 Z' },
    ],
    mist: 'M0,516 Q151,498 301,516 T502,510',
  },
  vessel: {
    w: 858,
    h: 600,
    gradientId: 'obsMtnVessel',
    ridges: [
      { fill: 'rgba(120,138,150,.10)', d: 'M0,614 L0,409 Q0,409 61,400 Q123,391 123,391 Q123,391 184,413 Q245,435 245,435 Q245,435 306,442 Q368,449 368,449 Q368,449 429,444 Q490,440 490,440 Q490,440 552,420 Q613,401 613,401 Q613,401 674,422 Q735,442 735,442 Q735,442 797,437 Q858,432 858,432 L858,614 Z' },
      { fill: 'rgba(86,108,122,.13)', d: 'M0,637 L0,468 Q0,468 61,470 Q123,471 123,471 Q123,471 184,461 Q245,451 245,451 Q245,451 306,459 Q368,468 368,468 Q368,468 429,464 Q490,460 490,460 Q490,460 552,472 Q613,485 613,485 Q613,485 674,469 Q735,453 735,453 Q735,453 797,459 Q858,465 858,465 L858,637 Z' },
      { fill: 'url(#obsMtnVessel)', d: 'M0,657 L0,556 Q0,556 61,556 Q123,555 123,555 Q123,555 184,556 Q245,557 245,557 Q245,557 306,557 Q368,558 368,558 Q368,558 429,558 Q490,558 490,558 Q490,558 552,545 Q613,533 613,533 Q613,533 674,524 Q735,516 735,516 Q735,516 797,536 Q858,555 858,555 L858,657 Z' },
    ],
    mist: 'M0,516 Q257,498 515,516 T858,510',
  },
  canopy: {
    w: 632,
    h: 600,
    gradientId: 'obsMtnCanopy',
    ridges: [
      { fill: 'rgba(120,138,150,.10)', d: 'M0,614 L0,409 Q0,409 45,400 Q90,391 90,391 Q90,391 135,413 Q181,435 181,435 Q181,435 226,442 Q271,449 271,449 Q271,449 316,444 Q361,440 361,440 Q361,440 406,420 Q451,401 451,401 Q451,401 497,422 Q542,442 542,442 Q542,442 587,437 Q632,432 632,432 L632,614 Z' },
      { fill: 'rgba(86,108,122,.13)', d: 'M0,637 L0,468 Q0,468 45,470 Q90,471 90,471 Q90,471 135,461 Q181,451 181,451 Q181,451 226,459 Q271,468 271,468 Q271,468 316,464 Q361,460 361,460 Q361,460 406,472 Q451,485 451,485 Q451,485 497,469 Q542,453 542,453 Q542,453 587,459 Q632,465 632,465 L632,637 Z' },
      { fill: 'url(#obsMtnCanopy)', d: 'M0,657 L0,556 Q0,556 45,556 Q90,555 90,555 Q90,555 135,556 Q181,557 181,557 Q181,557 226,557 Q271,558 271,558 Q271,558 316,558 Q361,558 361,558 Q361,558 406,545 Q451,533 451,533 Q451,533 497,524 Q542,516 542,516 Q542,516 587,536 Q632,555 632,555 L632,657 Z' },
    ],
    mist: 'M0,516 Q190,498 379,516 T632,510',
  },
  constellation: {
    w: 700,
    h: 232,
    gradientId: 'obsMtnConstellation',
    ridges: [
      { fill: 'rgba(120,138,150,.10)', d: 'M0,238 L0,158 Q0,158 50,155 Q100,151 100,151 Q100,151 150,160 Q200,168 200,168 Q200,168 250,171 Q300,173 300,173 Q300,173 350,172 Q400,170 400,170 Q400,170 450,163 Q500,155 500,155 Q500,155 550,163 Q600,171 600,171 Q600,171 650,169 Q700,167 700,167 L700,238 Z' },
      { fill: 'rgba(86,108,122,.13)', d: 'M0,246 L0,181 Q0,181 50,182 Q100,182 100,182 Q100,182 150,178 Q200,174 200,174 Q200,174 250,178 Q300,181 300,181 Q300,181 350,179 Q400,178 400,178 Q400,178 450,183 Q500,187 500,187 Q500,187 550,181 Q600,175 600,175 Q600,175 650,177 Q700,180 700,180 L700,246 Z' },
      { fill: 'url(#obsMtnConstellation)', d: 'M0,254 L0,215 Q0,215 50,215 Q100,215 100,215 Q100,215 150,215 Q200,215 200,215 Q200,215 250,215 Q300,216 300,216 Q300,216 350,216 Q400,216 400,216 Q400,216 450,211 Q500,206 500,206 Q500,206 550,203 Q600,199 600,199 Q600,199 650,207 Q700,215 700,215 L700,254 Z' },
    ],
    mist: 'M0,200 Q210,193 420,200 T700,197',
  },
  ledgers: {
    w: 416,
    h: 232,
    gradientId: 'obsMtnLedgers',
    ridges: [
      { fill: 'rgba(120,138,150,.10)', d: 'M0,238 L0,158 Q0,158 30,155 Q59,151 59,151 Q59,151 89,160 Q119,168 119,168 Q119,168 149,171 Q178,173 178,173 Q178,173 208,172 Q238,170 238,170 Q238,170 267,163 Q297,155 297,155 Q297,155 327,163 Q357,171 357,171 Q357,171 386,169 Q416,167 416,167 L416,238 Z' },
      { fill: 'rgba(86,108,122,.13)', d: 'M0,246 L0,181 Q0,181 30,182 Q59,182 59,182 Q59,182 89,178 Q119,174 119,174 Q119,174 149,178 Q178,181 178,181 Q178,181 208,179 Q238,178 238,178 Q238,178 267,183 Q297,187 297,187 Q297,187 327,181 Q357,175 357,175 Q357,175 386,177 Q416,180 416,180 L416,246 Z' },
      { fill: 'url(#obsMtnLedgers)', d: 'M0,254 L0,215 Q0,215 30,215 Q59,215 59,215 Q59,215 89,215 Q119,215 119,215 Q119,215 149,215 Q178,216 178,216 Q178,216 208,216 Q238,216 238,216 Q238,216 267,211 Q297,206 297,206 Q297,206 327,203 Q357,199 357,199 Q357,199 386,207 Q416,215 416,215 L416,254 Z' },
    ],
    mist: 'M0,200 Q125,193 250,200 T416,197',
  },
};

function ObsInkMountains({ mtn }: { mtn: MtnKey }) {
  const spec = OBS_MTN[mtn];
  return (
    <div className="obsRegion__mtn" aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${spec.w} ${spec.h}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id={spec.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5b7382" stopOpacity="0" />
            <stop offset=".55" stopColor="#56707f" stopOpacity=".5" />
            <stop offset="1" stopColor="#3f5566" stopOpacity=".9" />
          </linearGradient>
        </defs>
        {spec.ridges.map((ridge, index) => (
          <path key={index} d={ridge.d} fill={ridge.fill} opacity="0.5" />
        ))}
        <path
          d={spec.mist}
          fill="none"
          stroke="rgba(245,240,228,.5)"
          strokeWidth="6"
          opacity=".35"
          filter="url(#soft)"
        />
      </svg>
    </div>
  );
}

export interface ObsPanelChromeProps {
  banner?: string;
  /** Ink-wash mountain backdrop key (artifact `.panel.mtn`). */
  mtn?: MtnKey;
  /** Faint vertical calligraphy watermark (artifact paintGlyphCols `.gcol`). */
  glyphColumn?: { text: string; modifier: string };
}

export function ObsPanelChrome({ banner, mtn, glyphColumn }: ObsPanelChromeProps) {
  return (
    <>
      <div className="obsRegion__grain" aria-hidden="true">
        <svg width="100%" height="100%" preserveAspectRatio="none" focusable="false">
          <rect width="100%" height="100%" filter="url(#grainF)" />
        </svg>
      </div>
      {mtn ? <ObsInkMountains mtn={mtn} /> : null}
      {glyphColumn ? (
        <div
          className={`obsRegion__gcol obsRegion__gcol--${glyphColumn.modifier}`}
          aria-hidden="true"
        >
          {glyphColumn.text}
        </div>
      ) : null}
      <div className="obsRegion__gframe" aria-hidden="true" />
      <div className="obsRegion__gframe2" aria-hidden="true" />
      <i className="obsRegion__gc obsRegion__gc--tl" aria-hidden="true" />
      <i className="obsRegion__gc obsRegion__gc--tr" aria-hidden="true" />
      <i className="obsRegion__gc obsRegion__gc--bl" aria-hidden="true" />
      <i className="obsRegion__gc obsRegion__gc--br" aria-hidden="true" />
      {banner ? <div className="obsRegion__banner">{banner}</div> : null}
    </>
  );
}
