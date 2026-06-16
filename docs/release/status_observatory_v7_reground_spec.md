# Status Observatory — V7-Grounded Re-Implementation Spec (corrected from OBS-1TO1-FIDELITY)

**Status:** authoritative build plan. Supersedes the numeric geometry in the `OBS-1TO1-FIDELITY` packet wherever they differ. Reference of record: `status mockups and docs/STATUS_OBSERVATORY_V7_MASTER_PROTOTYPE.html` (the V7 prototype, `#stage` 2048×1152). The packet's cited artifact `living-state-observatory__3_.html` does **not** exist in the repo; V7 is law.

**Environment reality (decisive):** SCSS does **not** compile in this sandbox (`node_modules/sass` → `vendor/sass-stub`, verified: `compileString` returns input unchanged). So the observatory cannot render here and Playwright screenshots are meaningless in-sandbox. Verifiable gates here: `typecheck`, `check:icons`, `validate:content`, `test:contracts` (512/512 at baseline). **Visual acceptance happens in the real-sass env** (where the evidence PNGs were produced, e.g. by opening the V7 HTML directly). Every change below is authored to be correct real-Sass + gate-verified; the §10 checklist is the hand-back for visual confirmation.

---

## 0. Two corrections to the packet's foundation

### 0.1 There is NO CSS grid — V7 uses absolute slots from a per-state registry
The packet's §3 ("adopt the artifact's 2048×1152 CSS grid with `grid-template-rows`/`mainrow`/`bottomrow`") is **wrong**. V7 has **no grid**. Layout is absolute-positioned `div.slot` elements whose `left/top/width/height` come from a JS registry `OBS_GEO[variant].slots`. This actually **matches the current React build's model** (absolute `.obsRegion--*` rects) — so the fix is to re-base those rects to V7's coordinates, not to introduce a grid.

### 0.2 V7 relayouts per state; we keep ONE layout (no-CLS) — packet §0.2 wins
V7's five variants have structurally different slot lists. The packet's §0.2 forbids layout shift between states. **Decision: use V7's `blockedCompass` slot set (V7's declared canonical/default variant) as the single composition for all five states**, re-based to 2048×1152. State is expressed by content + `canopyMode` + decree/vitals seals + tone + scorch/ritual overlays — exactly as the shipped build + W0–W8 already do. This honors §0.2 and §1.1 (match V7's canonical composition) simultaneously. **Accepted deviation:** healthy/postFailure/prestige will not reproduce V7's per-state relayouts (scroll-roller header, split astro/law panels, 3-fix rail, full edict column); they reuse the canonical slots with state-appropriate content. Flagged per packet §0.3/§14.

---

## 1. The canonical slot registry (V7 `blockedCompass`, 2048×1152, verbatim)

Stage: `2048×1152`, single uniform `scale(var(--obs-scale))`, origin top-left. Outer bronze stage frame at `inset:8px` (3px bronze border-image + inner hairline at `inset:5px` + four 24×24 `.br` corner brackets — **the only corner brackets in V7; per-panel brackets are dead CSS**). Void backdrop = `#surround` radial `radial-gradient(120% 95% at 50% 46%, #221a12, #1d1813 42%, #14100c)` + inset shadow; `#l1` paper fill `linear-gradient(178deg, --paper-base, --paper-shade)`; `#l9` grain (multiply .05) + vignette. One empty `#scenic-strip` mountain slot (z-105, opacity .10) — production plate, leave empty.

Slots (`id  x,y,w,h`), all absolute on the 2048×1152 stage:

| Slot (current region) | x | y | w | h | Notes |
|---|---|---|---|---|---|
| `tablet` (decree seal) | 28 | 12 | 60 | 188 | rot −1.5°, cinnabar hall tablet 狀態堂 (part of decree) |
| `title` | 104 | 28 | 1100 | 52 | h1 + 觀 seal |
| `chips` (decree row) | 104 | 92 | 1500 | 64 | 7 chips |
| `goal` | 1640 | 24 | 372 | 136 | Next Goal / Bottleneck / Route |
| `hallSeal` | 1956 | 20 | 72 | 72 | rot +6°, 順遂 seal |
| `vitals` | 24 | 178 | 2000 | **68** | 9 seals (64px in other states; keep 68 canonical) |
| `rootlaw` (`obs-region-root-law`) | 24 | 262 | 512 | 612 | astrolabe + heart-law + fissure/ribbon |
| `hero` (`obs-region-vessel`) | 552 | 262 | 816 | 548 | renderCompass |
| `causes` | 552 | 818 | 816 | 56 | shared-cause ribbon (own slot under hero) |
| `canopy` (`obs-region-canopy`) | 1384 | 262 | 640 | 388 | talisman cluster |
| `charms` | 1384 | 658 | 640 | 108 | best-improvement charm rail |
| `safety` | 1384 | 774 | 640 | 100 | mercy ring safety net |
| `sConst` (`obs-region-constellation`) | 24 | 894 | 640 | 168 | compact strip |
| `sScales` (`obs-region-scales`) | 680 | 894 | 330 | 168 | |
| `sJars` (`obs-region-jars` NEW) | 1026 | 894 | 330 | 168 | own cell (see §6) |
| `sWheel` (`obs-region-wheel`) | 1372 | 894 | 210 | 168 | |
| `sLedgers` (`obs-region-ledgers`) | 1598 | 894 | 426 | 168 | 2 folds |
| `nav` | 24 | 1076 | 2000 | 60 | app shell owns nav → leave empty |

**Scale machinery:** keep `useObservatoryScale`; change design units `1672×941` → `2048×1152`. `s = min(W/2048, H/1152)`, floor 0.55.

**Decision — canopy/charms/safety:** V7 has 3 separate `.fr1` panels. Current build merges them in one `obs-region-canopy` (`grid-template-rows: auto minmax(430,1fr) auto auto`). To match V7 and keep anchors: render canopy as the **cluster panel** (`obs-region-canopy`, 640×388 @1384,262), and add two sibling framed slots **charms** (640×108 @1384,658) and **safety** (640×100 @1384,774). Keep `status-bottleneck-route-charm` on the charm buttons, `status-bottleneck-safety-seal` on the mercy seal — they move into the new sibling panels but keep their testids. (Adds internal regions but does not move the public canopy anchor.)

---

## 2. Panel material (V7 `.fr1`) — replaces card-in-card + ⊕ sigil

V7 panel = **one** `.panel.pN.fr1` div filling its slot, content sitting transparently on it. NO inner `.body`, NO per-panel corner brackets (dead CSS), NO centered jade banner.

```scss
.fr1{ padding:0; border:1.5px solid var(--gold-leaf-lo); border-radius:2px;
  box-shadow: inset 0 0 0 3px rgba(247,239,221,.5),   /* the "double frame" bevel */
              inset 0 0 22px var(--umber-burn),
              0 4px 12px rgba(30,20,12,.22);
  background:linear-gradient(180deg,var(--paper-hi),var(--paper-base)); }
.fr1.p2{ background:linear-gradient(180deg,var(--paper-base),var(--paper-shade)); }   /* default */
.fr1.p3{ background:linear-gradient(180deg,var(--paper-aged),var(--paper-soot)); }     /* compact constellation */
.fr1.p4{ background:linear-gradient(180deg,var(--lacquer-night),var(--lacquer-deep)); border-color:var(--bronze-lo); /* light text */ }
.tone-risk{ box-shadow: inset 0 0 0 3px rgba(247,239,221,.4), inset 0 0 24px rgba(139,48,40,.10), 0 4px 12px rgba(30,20,12,.24); }
```

**Banners (3 kinds, NOT a jade tab):**
- `.plaque` — top-left small-caps label, `left:14 top:9`, `border-bottom:1px var(--ink-15)`. Used by rootlaw, canopy.
- `.hero-plaque-wrap` — centered `left:50% top:8 translateX(-50%)` flex row with two `.chop` (30×30) flanking a static `.plaque`. Used by the hero (compass/constellation).
- `.strip-title` — bronze hexagon end-cap tab, `top:6 left:50% translateX(-50%) height:24`, `clip-path:polygon(8px 0,calc(100% - 8px) 0,100% 50%,calc(100% - 8px) 100%,8px 100%,0 50%)`. Used by sConst, sScales, sJars, sWheel, sLedgers.

Banner texts (exact): rootlaw `Root / Law Coupled Instrument`; hero `Meridian Vessel Compass`; canopy `Bottleneck Talisman Canopy`; charms `Best Improvement Charms`; safety from surface; sConst `Stat Meridian Constellation (28)`; sScales `Build & Preparation Scales`; sJars `Reserve Jars`; sWheel `WHEEL_TITLES[state]` (canonical `Current Work Wheel`); sLedgers folds `Recent Changes` / `How Calculated`.

**Action:** remove `.statusObservatoryInstrument__sigil` rendering (stop emitting the `⊕` + left `<h2>`), make each instrument body `background:transparent` (drop the opaque `linear-gradient(...,.94)`/`--observatory-paper` re-paints), and let the region `.fr1` plate be the single parchment. Keep `aria-label`s. Sigil CSS deletion is R6 (gated).

**Tokens:** the V7 token names (`--paper-base/-hi/-shade/-aged/-soot`, `--gold-leaf-hi/-lo`, `--bronze-hi/-lo`, `--lacquer-night/-deep`, `--umber-burn`, `--ink-15/-30/-40/-60/-70`, `--status-ledger-jade`, `--cinnabar-deep/-soft`, `--jade-deep`) must resolve. Before editing, reconcile against `src/styles/paperInkTokens.scss` + the observatory's `--observatory-*` aliases: add any missing as **named tokens** (no raw hex). The few literals V7 uses inline (`#7a2a22`, `#5a1f18` hall tablet; `rgba(247,239,221,*)` paper-hi bevel; `#221a12` etc void) should become named tokens too.

---

## 3. Instrument geometry (V7 verbatim; packet numbers were stale)

### 3.1 Meridian Vessel Compass (hero 816×548) — organs are CARDS not domes
- Figure: `figurePlate(min(380,H*0.66), min(420,H*0.72))` → 380×420 SVG viewBox `0 0 200 220`; centered at panel `left=W/2−190`, `top=H*0.45−210+10`. Single gold aura disc r70 @ (100,110) op .18; dial ring r92; 8 ticks; 3 dantian dots (cy 92/106/120) on `M100 80v40`; head circle r17 @ (100,46); robe path. Taiji hub overlay 40×40 @ left50% top46%, spins 90s (unless reduced/ash).
- **6 organ cards**, size **252×104** (non-postFailure): `lx=20` (left col), `rx=W−272` (=544). Rows `[38, 162, 286]`. Odd `n`(1,3,5)→left, even `n`(2,4,6)→right; row = `floor(i/2)`. So `[1L|2R]/[3L|4R]/[5L|6R]`.
- `.organ-card`: flex row, `border:1px var(--bronze-lo); border-left-width:4px; border-radius:3px` (left-rail color by state: ok jade / warn gold-lo / risk cinnabar-soft). Children: `numCoin(n,26)` abs `top:-9 left:-9`; `medallion size:40` (metal jade/gold/cinnabar by state); `.oc-tx` column (name t6 + line t8 + `.oc-state` row = wordTag + fully-rounded routeBtn pill).
- Focus/inspection slip `focusLensSlip`: `fw=360`, `top=H−170=378`, `left=W/2−fw/2+30`. Torn-top clip, z-500, cinnabar tether to focus organ card.
- Threads (organ→figure) live on a **stage-level overlay** in absolute coords (current build has `StatusCausalThreadLayer`); risk cards = frayed two-segment path with offshoot; non-risk = single qPath + shimmer dash (motion on).
- **Causes ribbon** is a SEPARATE slot (`causes` 816×56 @552,818), not inside the compass: `.causes` flex row, title + one `.cause-chip` per cause (medallion 30 + name + wordTag), divided by `border-left:1px var(--ink-15)`.
- Packet was wrong: organs are NOT at x:4/x:638; board is NOT 838×560; cx is W/2 (960 abs), not 419. No qi-core sprite (aura only).

### 3.2 Bottleneck Talisman Canopy (board 640×388)
- **Central talisman** (the big slip): `cw=200, chh=150`, `cx=W/2−6=314`, `cy=min(H*0.46,178)=178`. Box `left=214 top=103`, rot **+1°** (authored). 瓶頸 round seal size46 rot9 abs `right:−14 top:−12`. Content: ck title / cb-name (21px cinnabar) / csrc source / cact "Primary Action:" + bold gold.
- **4 satellite slips**: `sw=152, sh=124(min-height)`. `places=[[26,40,−3],[W−sw−26,34,2.5],[14,cy+chh/2−26,−2],[W−sw−16,cy+chh/2−40,3]]`; every `top` gets **+18px**. blockedCompass: Sat0 (26,58,−3°); Sat1 (462,52,+2.5°); Sat2 (14,245,−2°); Sat3 (472,231,+3°).
- **Cords** (on stage overlay, NOT in panel): each satellite → central knot `qPath(satAnchor, centralAnchor, sag=12)` `--thread-red` w2.4 + midpoint dot. Central anchor = slot.(cx, cy+18). Satellite anchor = inner-facing edge midpoint `(px + (px+sw/2<cx?sw:0), py+18+sh/2)`. Optional cross-link central→goal: cubic bezier `--cinnabar-deep` w2.6.
- **Charm rail** (own `charms` slot 640×108): near-flat horizontal rail svg (W−40)×10 (lines y5 bronze-lo w4, y3.4 bronze-hi w1.4) @ left20 top30. 4 charms, `seg=(W−60)/4=145`, charm i `left=30+seg*i+seg/2−74` (28.5/173.5/318.5/463.5), `top:58`. Charm box 148×96, border 2px (`.primary`=jade-deep else gold-lo), hang cord 12×30 top:−30, medallion 36 (jade if primary), tassel 26 bottom:−30.
- **Mercy ring** (own `safety` slot 640×100): `.safety` flex; `dia=min(H−18,84)=82`, `R=dia/2−8`. State `unavailable` (blocked) = broken/drooping rope arc 150°→390° `--cinnabar-soft` w5 + two drooping ends + knot+bow at top + trailing 無緣 seal size44 rot−7. (postFailure: `progressing` segmented arcs lit 2/5 jade + 慈悲護航 seal; healthy: `notNeeded` plain circle.)
- **Slip-geometry correction (the headline fix):** `STATUS_OBSERVATORY_CANOPY_SLIP_GEOMETRY` (presentation.ts L95-102) currently piles slips. Replace with V7 proportions. Convert V7 board-px → percentage of the **640×388 canopy slot**, using slip CENTER (verify the component's anchor model first). See §5.1 for the exact corrected constant.

### 3.3 Root / Law Coupled Instrument (rootlaw 512×612)
- `.rl-cols` flex (left dial col flex:1 / `.rl-channel` 46px / `.rl-right` flex 0 0 34%). Astrolabe **dia 206** (current build uses its own PROTECTED 336 viewBox — keep geometry, only frame the container). Purity banner, dial-core-tx overlay (rootName + grade). Heart-law roundel dia 88 with **9-pip** ring over −130°..+130° (260/8), lit by `chapterPips`. Channel = `fissureSVG(46,180)` if opposed (jagged thread-red crack + branches + embers) else `jadeRibbonSVG(46,180)`. Reads row: Expression-Cap fan gauge (7 strokes) | Root Proc | Validity seal. **Astrolabe SVG is PROTECTED — do not touch geometry.**

### 3.4 Stat Meridian Constellation — COMPACT strip (sConst 640×168)
`renderCompactConstellation` = `.cband` panel (p3), strip-title "Stat Meridian Constellation (28)", a `.cband-spine` row of **8 spine beads** (medallion 28 + numCoin 14) joined by 7 `.cb-link` connectors, then `.cband-chips` row: 3 branch chips (Heaven Locked / Martial Active / Earth Dormant) + a "Weak Link · …" button. The full 28-node atlas (`renderConstellation`, slot-local bead layout in §B) goes in the **drawer**. Current build renders the full 28-node atlas on the board (580px min-height) — replace board form with the compact strip; move full atlas to drawer. Use **full stat names** on beads where they fit (current shortLabel was a clip symptom).

### 3.5 Build & Preparation Scales (sScales 330×168)
`.scales-rows` checklist on the left half (`left:14 top:36 bottom:8 width:slot._w*0.5−14=151`; rows = stateCoin + label + word). `.balance-wrap` on right (`right:8 top:14 width:slot._w*0.46=151.8 height:slot._h−46=122`) = `balanceSVG(tilt, fails, w, h)`: vertical post + base + pivot + tilting group (beam rotate(tilt°) + 2 pans via `arcPath(px,topY+panY−4,panR=20,98,262)` + stacked weights on the failing side). Readiness plaque bottom-right.

### 3.6 Reserve Jars (sJars 330×168) — own cell
**V7 quirk:** `useShelf = mode==='shelf' && slot._w>=340`. At sJars=330 V7 falls back to a **row-list** (medallion + name + microbar + value + word). The mockups + packet want the **glass shelf** (5 jars on a plank). **Decision: render the glass shelf** (give sJars `w≥340`, e.g. widen to 340–360 by rebalancing the bottom row, or force shelf). Shelf: `.shelf` plank; `seg=(w−36)/n`; each `.jar` `left=18+seg*i+seg/2−28 bottom:44`, `.glass` + `.fill` height=`pct%` (gradient by kind via `JAR_FILLS`), `.cork`+`.cord`, `.jlabel` icon; `.jar-cap` caption (value + word + name) `bottom:2`. **Must move OUT of `StatusBuildPreparationScales` (currently rendered at its L187) into its own `obs-region-jars`.**

### 3.7 Current Work Wheel (sWheel 210×168)
`wheelSVG(dia=min(H−34,134)=134)`: outer circle r=c−3 (bronze), 6 sector divider lines (i*60°), rotating 24-tick ring (`.tickring`, animation off when reduced-motion). `.wheel-wrap` centered `translate(-50%,-46%)`. `.hub` button center (hk hub upper + hv label + optional suffix). 4 `.wchip` corner chips (86×28) at the 4 corners (medallion 20 + name + state).

### 3.8 Life Decree header (canonical banded skin)
`tablet` (28,12,60,188 rot−1.5) vertical 狀態堂 cinnabar hall tablet (`.hall-tablet`, gold 26px glyphs, cordloop). `title` h1 (t1) + 觀 square seal size32. `chips` 7 cells `[Realm+Stage, City, Path, Heart Law, Spirit Root, Focus, Breath]` flex:1 each, 1px dividers; risk chip (Spirit Root) gets 剋 seal. `goal` block (3 rows: Next Goal / Main Bottleneck (id anchor-bottleneck) / Primary Route). `hallSeal` corner 順遂 seal size72 rot+6. Per-state decree seal owned here: 順遂/敗/轉生/待續. Keep `status-ledger-hero*` anchors.

### 3.9 Vitals Ribbon (vitals 2000×68)
9 `.vcell` flex cells weighted by width `[Qi 230, Qi/s 200, Stability 230, HP 260, Combat 240, Attack 180, Defense 180, Crit 180, Foreground 250]`, `.v-stitch` dashed dividers between. At-risk cells cinnabar tint + crit-ring pulse. Optional trailing 順遂無礙 jade seal (healthy). Keep `status-ledger-metrics`.

### 3.10 Folded Ledgers (sLedgers 426×168) — TWO folds
`renderLedgers` blocked skin = 2 `.ledger-card` tap-cards: `left=(i?54:18) top=(14+i*72) width=slot._w−110=316 height=62`, rot (i?+1.6:−2.1), with a `::before` rule line + stacked-paper shadow. (How-Calculated `.formula-row`s with "View formula" dotted-jade links live in the second card / drawer.) **Current build renders 3 folds (記/算/源); remove the 3rd (no-loss / source-coverage) from the board — move to drawer.** Keep `status-ledger-details`, `status-ledger-recent-changes`.

---

## 4. Backdrop (R5)
Adopt V7's warm-brown void: `#surround` radial `radial-gradient(120% 95% at 50% 46%, #221a12, #1d1813 42%, #14100c)` + `inset 0 0 140px rgba(0,0,0,.55)`, the `#l1` paper fill, `#l9` grain+vignette, all as **named tokens** filling the viewport so the app shell can't bleed through `.statusObservatoryRoot{background:none}`. Keep `StatusObservatoryStateOverlays` (scorch/ritual) layered over it. This resolves the slate-teal-vs-brown contradiction in favor of the reference (brown) — flagged.

---

## 5. Data / geometry constant changes (gate-verifiable, no surface-shape change)

All in `src/systems/ui/status/statusObservatoryPresentation.ts`. The surface **type** is unchanged; only constant **values** change. Contracts must stay green.

### 5.1 `STATUS_OBSERVATORY_CANOPY_SLIP_GEOMETRY` (L95-102)
Verify first how `StatusBottleneckTalismanCanopy.tsx`/SCSS consume `{x,y}` (center vs top-left, % of board). Target proportions from V7 (board 640×388, slip CENTER as % of board):
- Central (index 0, the big slip): center (314,178) → **x≈49.1, y≈45.9**, rot +1, anchor 'center'.
- Sat0 center (26+76, 58+62)=(102,120) → **x≈15.9, y≈30.9**, rot −3, 'top'.
- Sat1 center (462+76, 52+62)=(538,114) → **x≈84.1, y≈29.4**, rot +2.5, 'top'.
- Sat2 center (14+76, 245+62)=(90,307) → **x≈14.1, y≈79.1**, rot −2, 'left'.
- Sat3 center (472+76, 231+62)=(548,293) → **x≈85.6, y≈75.5**, rot +3, 'right'.
- index 5 (6th slip, non-healthy only) — keep a sane extra position (e.g. lower-center) since V7's canon has 4 satellites + central = 5; the 6th is a current-build extra. Suggest x≈50, y≈62.

### 5.2 `STATUS_OBSERVATORY_CANOPY_CHARM_GEOMETRY` (L104-110)
Charms now live in the **own `charms` slot** (640×108), so the charm geometry should map to that strip (4 charms evenly along it). If charms remain percentage-of-board, recompute for the new charm panel.

---

## 6. Per-file change list

| File | Change |
|---|---|
| `src/styles/paperInkTokens.scss` | Add any missing V7-named tokens (no raw hex). |
| `StatusLivingStateObservatory.tsx` | Re-base region wrappers to V7 slots; add `obs-region-jars`, `obs-region-charms`, `obs-region-safety`, `obs-region-causes` siblings; render `.plaque`/`.strip-title`/`hero-plaque` banners; stop rendering `__sigil`/`__header`. Keep all testids + `status-ledger-grid` canvas. |
| `StatusLivingStateObservatory.scss` | `.obsStage` 1672×941→2048×1152; replace `.obsRegion--*` rects with §1 values; port `.fr1`/`.plaque`/`.strip-title`/`.plq`/`.hall-tablet` material; backdrop layers; reconcile every instrument `min-height` to fit its slot; remove `@media(max-width:1120px)` up-scaling. |
| `useObservatoryScale.ts` | Design units 1672×941 → 2048×1152. |
| `statusObservatoryPresentation.ts` | §5 slip + charm geometry. |
| `StatusMeridianVesselCompass.tsx`/scss | Organ domes→cards (§3.1); declip; move standalone rails to drawer; min-height→fits 548. |
| `StatusBottleneckTalismanCanopy.tsx`/scss | Slip sizes (central 200×150, sats 152×124min); V7 cords; move charms+safety to sibling panels; min-height→388/108/100. |
| `StatusStatMeridianConstellation.tsx`/scss | Board → compact 8-bead strip (§3.4); full atlas → drawer; full names. |
| `StatusBuildPreparationScales.tsx`/scss | Remove internal `<StatusReserveJars>` (L187); checklist+balance to fit 330×168. |
| `StatusReserveJars.tsx`/scss | Mount in own `obs-region-jars`; glass shelf (§3.6). |
| `StatusCurrentWorkTimeWheel.tsx`/scss | Fit 210×168; dia 134; 4 corner chips. |
| `StatusFoldedLedgerRail.tsx`/scss | 3 folds → 2 (drop no-loss/source-coverage to drawer). |
| `StatusLifeDecreeScroll.tsx`/scss | Canonical banded header (§3.8). |
| `StatusVitalsSealRibbon.tsx`/scss | 9 weighted seals (§3.9). |
| `StatusObservatoryDrawers.tsx` | Host full constellation atlas + standalone vessel rails + source-coverage moved off-board. |
| `StatusObservatoryStateOverlays`, `StatusCausalThreadLayer` | Threads on stage overlay (canopy cords + organ threads in abs coords). |

R6 cleanup (gated, after visual acceptance): delete dead grid CSS on `.statusObservatoryCanvas` (keep the element + `status-ledger-grid` testid — LOCKED anchor), dead `grid-area`, `.statusObservatoryInstrument__sigil`/`__header`, standalone min-heights/up-scaling, superseded opaque backgrounds.

---

## 7. Guardrails (unchanged)
No surface-contract shape changes (constants only). All 38 testids survive (move with their elements; `status-ledger-grid` + `status-observatory-drawer` are LOCKED). No raw hex (named tokens). No `⊕`, no card-in-card, no public "Dao Mandate/Omen/Proof/Source". Astrolabe SVG PROTECTED. `forceLegacy` fallback intact; `STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED` stays true. Battery green every step: `typecheck && check:icons && validate:content && test:contracts` (512/512 floor).

---

## 8. Build order (dependency-sequenced)
1. Tokens (§2) — prerequisite.
2. Data geometry constants (§5) — isolated, contract-verifiable; fixes canopy pile-up.
3. Shell re-base (§1) + scale units + region wrappers + banners; reconcile instrument min-heights so nothing exceeds its slot (must be done WITH the per-instrument fits or the screen clips).
4. Panel material (§2): `.fr1` frame, banners, transparent content, backdrop.
5. Per-instrument geometry (§3): vessel cards, canopy slips/cords/charms/safety, constellation strip, scales, jars own cell, wheel, decree, vitals, ledgers.
6. Drawers: full atlas + standalone rails + source-coverage.
7. Gate battery after each milestone.
8. R6 cleanup — gated behind §10 visual acceptance.

---

## 9. What CANNOT be confirmed in this sandbox
Pixel fidelity, clipping, overlap, banner/frame appearance — none render here (sass stub). Confirmed here instead: typecheck, contracts (512/512), testid survival, no-recompute (data mapped straight through), no raw hex, no emoji. **§10 is the hand-back.**

## 10. Visual-acceptance checklist (run in real-sass env, all 5 fixtures `?obsFixture=<id>`)
- [ ] Stage 2048×1152; panels at §1 slot positions; one uniform scale; no clip/overlap (`scrollH<=clientH+1` per region).
- [ ] Every panel: `.fr1` gold frame + bevel + aged parchment showing through; correct banner (`.plaque`/`hero-plaque`/`.strip-title`); NO `⊕`; NO nested cream rectangles.
- [ ] Vessel: 6 rectangular organ cards (3L@20 / 3R@544, rows 38/162/286), centered figure + threads, focus slip, causes ribbon; no domes; nothing clipped.
- [ ] Canopy: central 200×150 @ (214,103) +1°, 4 satellites at V7 places, red cords to knot, charm rail (4) + mercy ring (broken-rope unavailable) as sibling panels; no pile-up.
- [ ] Constellation: compact 8-bead strip fits 168px band, full names, branch chips; full atlas in drawer.
- [ ] Scales: checklist + tilting brass balance, fully visible. Jars: own cell, glass shelf. Wheel: clock dial + hub + 4 corner chips, fully visible.
- [ ] Decree: banded header (hall tablet 狀態堂, 7 chips, goal block, 順遂 seal); per-state seal 敗/轉生/待續. Vitals: 9 weighted seals.
- [ ] Ledgers: 2 folds, no mid-word wrap.
- [ ] Backdrop: warm-brown void fills viewport, no app-shell bleed; scorch (postFailure) / ritual gold (prestige) overlays.
- [ ] All 5 states read distinctly via content/seal/tint/overlay WITHOUT panels moving (no CLS).
