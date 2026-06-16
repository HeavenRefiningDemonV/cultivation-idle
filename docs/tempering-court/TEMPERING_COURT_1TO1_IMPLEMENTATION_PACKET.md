# THE TEMPERING COURT — 1·TO·1 IMPLEMENTATION PACKET
### Cultivation Idle · Training Hall rework onto the Three Treasures Engine
### Claude Code execution packet — pixel-exact UI parity + reworked stat/training mechanics

---

## 0·A — MASTHEAD (read first, do not skip)

**Model / mode:** Opus, `ultrathink` on every wave. Run **Plan Mode first** for the recon wave (Wave 0). After recon, switch to default edit mode with **per-edit human approval**. End every wave with a **verification gate** (commands below) before the next wave begins. **One commit per wave**, never a squash of multiple waves.

**Claude Code skills to invoke (per wave, where noted):** `frontend-design`, `design:design-system`, `design:accessibility-review`, `engineering:code-review`, `engineering:debug`. Invoke `frontend-design` + `design:design-system` on every UI wave (W1, W7, W8, W9). Invoke `design:accessibility-review` on W10. Invoke `engineering:code-review` at the end of every wave touching `src/`. Invoke `engineering:debug` whenever a verification command fails.

**Two sources of truth, never contradict them:**
1. **`tempering-court.html`** — the standalone artifact delivered with this packet. This is the **PIXEL SOURCE OF TRUTH (visual SoT).** Every measurement, color, gradient, font, layer order, animation, and placement in the shipped React UI must match this file. When this packet's prose and the artifact disagree, **the artifact wins** and you must flag the discrepancy.
2. **`STAT_SYSTEM_OVERHAUL.md`** ("The Three Treasures Engine") — the **MECHANICAL SOURCE OF TRUTH.** Every formula, tier, meridian, aptitude, cap, unlock cadence, and passive rule comes from there. When this packet's prose and the overhaul doc disagree on a number, **the overhaul doc wins** and you must flag it.

This packet is the bridge: it tears the artifact down region-by-region, specifies the mechanics in implementable form, and sequences the work into gated waves. It does **not** replace either source — keep all three open.

**Repository grounding — IMPORTANT:** This packet was authored against the artifact and the design docs, **not** against a live checkout of the game repo. Therefore **every concrete repo path and line number in this packet is a HYPOTHESIS to be confirmed in Wave 0 recon**, written as `‹recon: …›`. Do **not** edit any file whose real path/line-anchor you have not confirmed in recon. Hypotheses are based on the known project structure (`src/styles/paperInkTokens.scss`, `src/ui/ink/`, `src/ui/paper/`, `src/systems/ui/status/statusObservatoryTypes.ts`, the Activity/Combat/Reward/Prestige stores, the realm/gate/trial runtime). If recon finds a different layout, **recon wins** — update the file manifest and proceed.

---

## 0·B — HOW TO USE THIS PACKET

1. Read Part 0 (this) fully. Internalise the parity contract and the prime directives.
2. Read Part 1 (artifact teardown) and Part 2 (mechanics spec) with the artifact and overhaul doc open beside them.
3. Execute **Wave 0 (Plan Mode, no edits)** — produce the recon report (§3) that maps every `‹recon:…›` hypothesis to a real path + line anchor, and surfaces the decisions in Part 4.
4. **Stop.** Present the recon report and the decision answers. Wait for human confirmation.
5. Execute Waves 1→13 in order. Each wave: re-read its section, do the edits with per-edit approval, run the verification gate, capture the Playwright screenshots named in Appendix F, write the evidence block (Appendix G), commit. Do not start the next wave until the current wave's gate is green and the screenshots are accepted.
6. Never claim a wave "done" without naming the command output and the screenshot path that prove it.

**The golden verification gate (every wave that touches `src/`):**
```
npm run typecheck && npm run check:icons && npm run validate:content && npm run test:contracts && npm run build
```
Plus the wave's Playwright screenshot(s). A wave is green only when all five commands exit 0 **and** the screenshots match the artifact for that region (Appendix H checklist).

---

## 0·C — TABLE OF CONTENTS

- **PART 0** — Parity contract, prime directives, protected assets, what breaks, jsdom caveat, authority order
- **PART 1** — The artifact, torn down (pixel SoT): stage, tokens, panel material, shared helpers, every region, the figure + meridian channel, scenery, motion/VFX, reduced-motion, `<defs>`, control-bar mapping
- **PART 2** — The mechanics, specified (mechanical SoT): the four tiers, the 21 meridians, spirit roots, caps & cadence, the rate formula, mastery, comprehension, overflow, passive combat, derived stats, prestige floor, fatigue
- **PART 3** — Wave 0: Plan-Mode recon (no edits) + recon report format + the NO-EDITS gate
- **PART 4** — Decisions to surface before editing (D1–D14) with strong recommendations
- **PART 5** — The waves (W1–W13): tokens, data model, training engine + test rewrite, derived layer, passive combat, surface contract, the Court UI 1:1, Observatory/constellation re-bind, VFX/motion, accessibility, prestige floor, balancing, cutover
- **APPENDICES** — A: 21-meridian data tables · B: derived-stat formulas · C: 506-test rewrite checklist · D: token map · E: file manifest · F: screenshot matrix · G: evidence templates · H: per-region parity checklist · I: rollback · J: commit plan · K: React component tree

---

# PART 0 — PARITY CONTRACT & PRIME DIRECTIVES

## 0.1 — What "1:1 parity" means here

**1:1 parity = the shipped React Training Hall is visually indistinguishable from `tempering-court.html` at 2048×1152, while every label, number, and state is real (engine-driven), not the artifact's placeholder copy.**

Parity **is**:
- Identical **layout**: the same grid rows/columns, the same panel sizes and gaps, the same region placement, down to the pixel. (Stage `2048×1152`; rows `116px / 1fr / 196px / 46px`; main columns `440 / 1fr / 430`; right column rows `1.45fr / 1fr`; bottom columns `720 / 540 / 1fr`; all gaps `13px` except stage gap `12px`, pad `15px`. Exact values in §1.1, §1.5.)
- Identical **material**: the parchment gradient, the `::before` vignette+foxing radials, the `feTurbulence` grain, the gold double-frame (`border-image` + mask-xor), the inner hairline, the four corner brackets, the jade cloth banner with diamond caps, the cinnabar vertical tag, the faint kai watermark. (§1.3.)
- Identical **typography**: the serif stack `Georgia,"Songti SC","Noto Serif SC",serif`, the kai stack `"Kaiti SC","STKaiti","KaiTi","Songti SC",serif`, the same weights/sizes/letter-spacing per element. (§1.2, §1.5.)
- Identical **figure + meridian channel**: the seated cultivator, per-path dais/aura/scenery, the 7-node vertical channel (dantian→crown) with sealed/unlocked/active/bottleneck/capped node states. (§1.6.)
- Identical **VFX & motion**: motes, incense smoke, breathing dantian, qi-flow on the active channel segment, spin rings, the Practice-Tempo ring sweep, heat shimmer, plus the CSS custom-prop driving (`--th-fill-p`, `--th-qi-dur`, `--th-breath-dur`, `--th-heat`). (§1.8.)
- Identical **reduced-motion** fallback (stable marks, no motion-only meaning). (§1.9.)

Parity is **NOT**:
- The artifact's placeholder **text/numbers**. Ship real values from the engine: real meridian names for the chosen path, real ratings/caps, real rate multiplier, real fatigue, real mastery, real comprehension, real derived-stat previews, real offline summary.
- The artifact's **dev control bar** (the bottom `#ctrl` strip with Path/Realm/Tempering/Status/Intensity/Fatigue/reduced-motion/offline-return). That bar is a **test harness** for demonstrating states; it is **NOT shipped**. Its controls map onto real game state (§1.11): path = the cultivator's chosen path; realm = real realm; "Tempering" select = the player's meridian selection action; status = derived from ActivityStore/CombatStore; intensity = the real intensity control (already exists); fatigue = real fatigue; reduced-motion = the OS/setting; offline-return = the real return-from-offline modal trigger.

If you ever find yourself about to ship the dev bar, **stop** — that is a parity failure.

## 0.2 — Prime directives (non-negotiable)

1. **Preserve-first, enhance-first, new-art-last.** The current S8 build is truth, not scaffolding. Do not delete an old layer/component/test-anchor until its replacement is visible, wired, stable, and screenshot-accepted on that exact screen (the "no cutover without completion" rule). Removal happens only in W13, gated.
2. **Tokens-only palette.** No raw hex in shipped TSX/SCSS **component** code. Every color is a token from `paperInkTokens.scss` (`‹recon: src/styles/paperInkTokens.scss›`). The only permitted raw hex is **inside SVG sprite `<defs>`** (gradients/filters) where it is sprite data, not UI color — and even there, prefer `currentColor`/token-fed CSS vars where the artifact already does. The artifact uses both CSS vars and raw hex in SVG; your job in W1/W7 is to route the CSS-surface colors through tokens and keep only genuine sprite-internal hex. (Token map: Appendix D.)
3. **No blue/gray for state.** State is jade (safe/active) / gold-amber (caution/near-cap) / cinnabar (at-risk/bottleneck/blocked). Element accents (Wood/Fire/Earth/Metal/Water) are scenic, not state. The Heaven path's night palette uses indigo *scenically* (sky/stars) — that is allowed as scenery, never as a state signal.
4. **No emoji as icons.** Use the artifact's lucide-react / inline-SVG / CSS-medallion / wax-seal vocabulary. The Chinese glyphs in wax seals and watermarks are **typeset characters**, not emoji — those are correct and required.
5. **No color-only, no motion-only, no hover-only meaning.** Every state reads with **shape + color + label** and survives reduced-motion and color-blindness. (E.g. a capped meridian shows the 滿 glyph + gold ring + "capped → mastery" label, not just a color.)
6. **No layout shift.** Panels never resize/reflow on state change; content swaps inside fixed boxes. The stage is a fixed 2048×1152 design space scaled by a single `transform: scale()` (§1.1). State changes must not move a single panel edge.
7. **UI is render-only; never mutate gameplay in JSX.** The Court renders a typed surface (the extended `TrainingHallSurfaceV1`, §2 + W6). Visual components read it via Zustand selectors and **never recompute gameplay**. All truth lives in the source-of-truth owners (§0.3).
8. **TypeScript strict, no `any`.** Every new type is explicit. No `// @ts-ignore`. No `any`, no unchecked casts.
9. **DO NOT TOUCH TECHNIQUES.** The techniques/abilities system is out of scope. Do not edit technique data, technique UI, technique combat hooks, or technique tests. If a derived-stat or meridian change appears to require a techniques change, **stop and flag it** rather than editing techniques. (Meridians *feed* derived stats which techniques *read*; you change the meridian→derived layer, never the technique layer.)
10. **One commit per wave.** Each wave is one atomic commit with the message in Appendix J. No mixing waves.
11. **Never stub content to pass a check.** Do not fake content JSON, do not weaken a validator, do not skip a test to make the gate green. If `validate:content` fails, fix the content, not the validator.

## 0.3 — Protected assets (must survive every wave)

These exist in the current build and must remain intact (re-bound, not rewritten) unless a wave explicitly revises them:

- **VFX test anchors:** `data-th="training-hall-vfx-motes"` (the mote host) and `data-th="training-hall-vfx-mote"` (each mote). The artifact sets these at runtime in `mountMotes`. Preserve both, and the Training Hall page root testid (`‹recon: training-hall-page or similar›`).
- **The Spirit Root Astrolabe SVG geometry** in the Status Observatory. It is a faithful reference-quality port; W8 **re-binds its data to the new meridian model, it does not redraw the geometry.** Touching the path/arc math is forbidden.
- **`forceLegacy` fallback** and the `StatusObservatorySurfaceV1` render-only contract — preserved across all waves.
- **The render-only surface contracts** `TrainingHallSurfaceV1` and `StatusObservatorySurfaceV1` (`‹recon: src/systems/ui/status/statusObservatoryTypes.ts and the training-hall equivalent›`). W6 **extends `TrainingHallSurfaceV1` additively** (new optional fields) behind a flag, with a back-compat shim — it never breaks the existing shape.
- **Preserved mechanics constants** (do not change values; the overhaul keeps them): intensity multipliers `Quiet 0.70× / Steady 1.00× / Harsh 1.35× / Limit 1.75×`; fatigue-per-minute `0.04 / 0.14 / 0.35 / 0.75`; max-tick clamp `2.25`; fatigue dampening `max(0.4, min(1, 1 − max(0, F−40)·0.009))`; offline cap `12h` with fatigue auto-downgrade at `≥80`; the **no-resource-cost** rule for training (test-enforced). Realm caps extend from `[40,60,80,100,125,150]` to `[40,60,80,100,125,150,170]` (R7 added) — this is the *one* sanctioned constant change, made in W2/W3 with the dependent tests rewritten.
- **Source-of-truth owners** — never duplicate their logic in the Court UI: `ActivityStore` (foreground gate), `CombatStore` (all combat → drives `blocked_by_combat` + passive-training triggers), `RewardService.grantRewards` (all rewards), `PrestigeResetService` (reset → Form Memory floor), the progression/gate/trial/city realm runtime (realm truth), runtime content packs (data truth).

## 0.4 — What this rework BREAKS (and therefore must rewrite)

The Three Treasures engine is a **breaking** stat-model change. The following existing test categories assert the *old* model and **must be rewritten** in W3 (enumerated in Appendix C). This is expected and sanctioned by the overhaul doc:

1. **Tri-stat XP split** — old training split XP across primary/secondary/foundation. New model trains **one meridian**. Tests asserting the 3-way split break.
2. **Fixed 18-stat roster** — old stat roster was a fixed 18. New model is tiered (6 + 7 + 7-per-path + derived). Tests asserting the 18-roster break.
3. **Primary/secondary/foundation surface fields** — `TrainingHallSurfaceV1` old fields break; W6 replaces them additively.
4. **Realm-cap array length** — `[…,150]` (6) → `[…,150,170]` (7). Tests asserting 6 caps break.
5. **Stat-identity assertions** — any test asserting specific old stat names/ids in training output breaks.

**Crucial:** Rewriting these tests is **not** "weakening tests to pass" — it is updating the spec lock to the new, intended model. Every rewritten test must assert the *new* model just as strictly. The **506 contract tests** must end W3 green against the new model, with the rewritten tests reviewed (`engineering:code-review`).

## 0.5 — jsdom ≠ parity (the single most important caveat)

**Contract tests run in jsdom, which has no layout engine.** `getBoundingClientRect` returns zeros; nothing has height, nothing clips, nothing overlaps. **506/506 contract tests passing tells you NOTHING about visual correctness.** Height, clipping, overlap, z-order, font rendering, gradient, and animation failures are **completely invisible to jsdom.**

Therefore: **the only visual gate is Playwright screenshots at 2048×1152, compared against the artifact** (Appendix F matrix, Appendix H checklist). Every UI wave is "done" only when its screenshots match. Never substitute a green contract suite for a screenshot. (This is exactly how the Observatory passed 506/506 while rendering broken — do not repeat that.)

## 0.6 — Authority order (when directives tension)

`gameplay truth > layout truth > scenic ownership > polish`.

- A prettier render that implies **wrong mechanics** is **wrong** — fix the mechanics read first.
- A layout that breaks the **fixed-stage parity** to fit content is wrong — content adapts inside the box.
- Scenery yields to layout; polish yields to scenery. Never let a polish flourish cause layout shift or a wrong-state read.

---

# PART 1 — THE ARTIFACT, TORN DOWN (pixel source of truth)

> Port target: convert the artifact's HTML/CSS/SVG into React components under `‹recon: src/features/trainingHall/ or src/ui/...›`, routing CSS-surface colors through tokens, removing the dev bar, and feeding real data. Keep the artifact open; numbers below are exact.

## 1.1 — Fixed stage + scale system

The entire Court is a **fixed 2048×1152 design-space stage**, scaled to the viewport by a single transform. **Never** use responsive reflow inside the stage; only the outer scale changes.

```
.th-viewport { width:100vw; height:100vh; display:grid; place-items:center; overflow:hidden; }
.stage {
  position:relative; width:2048px; height:1152px; transform-origin:top center;
  display:grid; gap:12px; padding:15px;
  grid-template-rows: 116px 1fr 196px 46px;   /* lintel / main / bottom / nav */
  background: radial-gradient(60% 50% at 50% 0%, #3a2c1a, transparent 70%),
              linear-gradient(160deg, #2a2013, #1c150d 60%, #140e08);
}
.stage::after {   /* the thin gold keyline framing the whole stage */
  content:""; position:absolute; inset:6px; z-index:60; pointer-events:none; border-radius:3px;
  border:1px solid rgba(178,131,45,.55); outline:1px solid rgba(120,86,38,.32); outline-offset:3px;
}
```

**Scale hook (port to a `ResizeObserver` in React, not a window resize listener):**
```
scale = Math.min(window.innerWidth/2048, window.innerHeight/1152);
stage.style.transform = `scale(${scale})`;
viewport.style.height = (1152*scale)+'px';
```
In React: a `useLayoutEffect` with a `ResizeObserver` on the viewport that sets a CSS var `--stage-scale` consumed by `.stage { transform: scale(var(--stage-scale)); }`. Recompute on mount + resize. This is the **fixed-stage architecture mandate** — confirm in recon whether the Observatory already ships such a hook to reuse (it should; see the Observatory's ResizeObserver scale hook).

**Row map (top→bottom):** `116px` Lintel · `1fr` Main (≈728px after gaps/pad) · `196px` Bottom · `46px` Nav. Gaps `12px`, padding `15px`. Do not change these.

## 1.2 — Token palette (exact values; map to `paperInkTokens.scss`)

The artifact `:root` defines these. Map each to a repo token (Appendix D). **Three tokens are genuinely new** to add to `paperInkTokens.scss`: `--paper-jade-deep` (#0f6f5a), `--paper-gold-bright` (#b2832d), `--paper-stamp-bright` (#a94835). All others should already exist — confirm in recon and reuse; do not duplicate.

| Artifact var | Value | Role | Repo token (confirm in recon) |
|---|---|---|---|
| `--paper` | `#f3ead7` | parchment base | `--paper-parchment` |
| `--paper-warm` | `#efe3c9` | warm parchment | `--paper-warm` |
| `--paper-deep` | `#e7d9ba` | deep parchment | `--paper-deep` |
| `--paper-shade` | `#d9c79e` | meter troughs | `--paper-shade` |
| `--ink` | `#1f1a17` | primary ink | `--paper-ink` |
| `--ink-70/45/25/12` | rgba(31,26,23,.70/.45/.25/.12) | ink tints | token ramp |
| `--jade` | `#4e6b5e` | jade (stable) | `--paper-jade` |
| `--jade-deep` | `#0f6f5a` | deep jade (safe/active) | **`--paper-jade-deep` (NEW)** |
| `--jade-ink` | `#2f4a40` | banner cloth | `--paper-jade-ink` |
| `--gold` | `#a2712a` | gold-leaf frame | `--paper-gold` |
| `--gold-bright` | `#b2832d` | bright gold | **`--paper-gold-bright` (NEW)** |
| `--gold-pale` | `#d9bd80` | banner text | `--paper-gold-pale` |
| `--gold-deep` | `#84591b` | deep gold | `--paper-gold-deep` |
| `--bronze` | `#7a5b26` | bronze accent | `--paper-bronze` |
| `--cinnabar` | `#8b3028` | cinnabar (danger) | `--paper-cinnabar` |
| `--cinnabar-bright` | `#a94835` | bright cinnabar | **`--paper-stamp-bright` (NEW)** |
| `--cinn-deep` | `#6e241e` | deep cinnabar | `--paper-cinnabar-deep` |
| `--el-wood/fire/earth/metal/water` | `#2d7844 / #a44731 / #8d642d / #69717c / #2a668d` | five-element scenic accents | `--el-*` |
| `--serif` | `Georgia,"Songti SC","Noto Serif SC",serif` | body serif | `--font-serif` |
| `--kai` | `"Kaiti SC","STKaiti","KaiTi","Songti SC",serif` | brush/kai | `--font-kai` |

> Conversion rule (W1/W7): in **CSS/SCSS and inline `style=` props**, replace every literal hex with `var(--token)`. In **SVG `<defs>` gradient stops and sprite strokes**, hex is sprite data and may remain, but where the artifact already uses a CSS var inside SVG (e.g. `stroke="var(--jade-deep)"`) keep the var. Run `check:icons` and a grep for `#[0-9a-f]{6}` in `.tsx/.scss` after W7 — the only hits permitted are inside `<defs>`/sprite files (Appendix D lists them).

## 1.3 — Panel material (the 10 stacked layers — reproduce EXACTLY)

Every framed panel (Lintel, Regimens, Room, Path Meridians, Constitution, Intensity, Forge Heat, This Practice) is the **same material**: a `.panel` with these layers, in this z-order. Build **one** React `<Panel>` component with slots (`banner`, `tag?`, `watermark?`, `children`) and reuse it everywhere — do not re-author per panel.

| z | layer | what it is | CSS essentials |
|---|---|---|---|
| 0 | `.panel` base | parchment gradient + drop shadow + inner glow | `background:linear-gradient(168deg,var(--paper-warm),var(--paper) 42%,var(--paper-deep)); box-shadow:0 6px 20px rgba(0,0,0,.45), inset 0 0 60px rgba(120,90,46,.06); border-radius:4px; overflow:hidden` |
| 0 | `.panel::before` | vignette + 3 foxing spots + center bloom | five `radial-gradient`s (corners 8%/94%, center bloom 50%, three small foxing radials, outer vignette) — copy verbatim from artifact lines under `.panel::before` |
| 1 | `.grain` | paper grain | `<svg><rect filter="url(#grainF)"/></svg>`, `opacity:.5; mix-blend-mode:multiply` |
| 2 | `.gcol` watermark | faint giant kai glyph | `writing-mode:vertical-rl; font:700 42px var(--kai); letter-spacing:16px; color:rgba(31,26,23,.055)` |
| 3 | `.content` | the real content, padded | `padding:18px; position:relative; z-index:3; height:100%` |
| 7 | `.gframe` | **gold double-frame** | `border:2.5px solid transparent; background:linear-gradient(135deg,#e7cd92,#a2712a 45%,#6e4c16) border-box;` + **mask-xor trick**: `-webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude` |
| 7 | `.gframe2` | inner hairline | `inset:5px; border:1px solid rgba(162,113,42,.45)` |
| 8 | `.gc.tl/tr/bl/br` | 4 corner brackets | `15×15px`, two borders each, `2px` gold |
| 9 | `.banner` | **jade cloth title** | `top:-1px; centered; padding:4px 22px; font:700 12px var(--serif); letter-spacing:.15em; color:var(--gold-pale); background:linear-gradient(180deg,var(--jade-ink),#20352d 55%,#182a23); border:1px solid var(--gold-deep)` + `::before/::after` **diamond caps** (8×8 rotated 45° gold gradient at left/right). `.banner.cinn` swaps to cinnabar gradient. `.banner b{color:#fff}` |
| 10 | `.tag` | cinnabar vertical chop (Lintel only) | `left:13px; top:13px; 46×80px; cinnabar gradient; .glyphs writing-mode:vertical-rl; font:700 18px var(--kai); color:#f4dccb` |

The mask-xor on `.gframe` is what makes the gold a *frame* (border only) rather than a filled box — it must be preserved exactly or the panel fills gold. Test this layer first in W1 in isolation.

## 1.4 — Shared SVG / helpers (port as pure functions or tiny components)

These are used across regions. Port each as a pure function returning an SVG string **or** a small React component. Signatures (from the artifact):

- **`waxSeal(chars, size, rot, jade)`** → an irregular wax blob `<svg>` with vertical kai characters. `jade=true` uses `url(#jadeRad)` fill + `#1c3128` stroke + light text; else `url(#cinnDisc)` fill + `#54190f` stroke + `#f4dccb` text. Two-ring (outer blob + inner scaled outline). Used for: Lintel realm seal (`size 34`), Room status seal (`size 60–64`), regimen "煉" active seal (`22`), sealed "封" seals (`20–26`), channel sealed nodes (`22`), Path-Meridian sealed rows (`20`), Return "歸" seal (`40`). **The wax-blob path is generated** (22 points, sine-perturbed radius) — port the generator, do not hand-draw.
- **`medallion(glyph, col)`** → 26px round gold medallion with a centered kai glyph. Used for intensity detents.
- **`cornerURI(col)`** → a data-URI SVG of a corner flourish (cloud-scroll). Used as `room-corner` images (top-left/right of the Room), tinted per path (`T.corner`).
- **`flameSVG(h, lit)`** → a flame shape sized by intensity height `h`, `lit` toggles ember fill + inner white. Used in intensity detents.
- **Chips:** `.chip` (pill) with variants `.jade/.gold/.cinn/.ink`. **Root chips** `.rootchip` with variants `.root-heavenly/-true/-earthly/-mortal/-chaos` (each a colored pill: purple/jade/gold/ink/cinnabar). These encode **aptitude grade by shape+color+text**, never color alone.
- **The shared `<svg width=0 height=0>` `<defs>`** — gradients & filters listed in §1.10. Mount **once** at the Court root (not per panel).

## 1.5 — Region-by-region layout (exact DOM, placement, bindings)

> Each region is a `<Panel>` (§1.3) unless noted. "Binds" = which surface field (§2/W6) feeds it. IDs below are the artifact's DOM ids; in React they become component boundaries, not literal ids (except the preserved testids).

### 1.5.1 — LINTEL (row 1, full width, height 116px)

`<Panel banner="REGIMENS"?>` — **no**, the Lintel's banner is absent; it carries the cinnabar **`.tag`** ("锤炼堂") at left and a `.gcol` watermark "堂" at right (`right:64px`). Two `.lintel-roller` scroll-rod caps flank it.

Content grid `.lintel-grid` = `grid-template-columns: 86px 1fr auto; align-items:center; gap:18px; padding:0 20px 0 0`:
- **col 1** (86px): empty spacer (sits over the `.tag`).
- **col 2** (1fr): stacked —
  - `.sub` — `"TRAINING HALL · {PATHNAME} PATH"` (uppercase, letter-spaced micro-label). Binds: path name (MARTIAL/EARTH/HEAVEN).
  - `.lintel-title` — `"The Tempering Court"` + inline `waxSeal(sealGlyph,34,-6,sealJade)`. Binds: per-path seal glyph (`武/地/天`), jade-seal flag (Heaven = jade).
  - `.lintel-sub` — the path subtitle (italic serif). Binds: `path.subtitle`.
  - `.realm-pips` — **7** `.rp` pips (one per realm), `.on` for `i<realm`, `.cur.on` for `i===realm-1`, then a `.micro` realm name. Binds: `realm`, `realmName`.
  - `.cbar-wrap` — `修为 Cultivation Base` label + `.cbar` (230px trough) with `.fill` at `cultPct%` (jade gradient) + `"{pct}% → breakthrough"`. Binds: `cultPct` (progress within current realm toward breakthrough).
- **col 3** (auto, `.lintel-right`, right-aligned column): stacked chips —
  - `.rchip` realm name · `.rchip` `"Meridian Cap {cap}"` · `.rchip` `"{n}/7 meridians"` · `.chip.jade` `"▸ {activeMeridian.name}"` · `.micro` `"Next: {nextMeridian.name} · {nextRealmName}"` (or `"All meridians revealed"` at R7). Binds: `realmName`, `cap` (current realm's meridian cap), unlocked count, `active.name`, `nextUnlock`.

### 1.5.2 — REGIMENS SHELF (main row, col 1, width 440px)

`<Panel banner="REGIMENS" watermark="法">`. Content = `.shelf-scroll` (`overflow-y:auto; gap:11px`).

For **each unlocked meridian** (one regimen card `.plaque`, the active one gets `.sel`):
```
.plaque[.sel]  data-mi={index}  role=button  aria-pressed={isActive}
  ├ (if active) .psel  = waxSeal('煉',22,0,true)   [top-left]
  ├ (if active) .ptemper = "TEMPERING"               [top-right, jade pill]
  ├ .pname   = {exercise name}                        e.g. "Footwork laps"
  ├ .proom   = "{room} · trains <b>{meridian}</b> {字}"
  ├ .pmeta   = .rootchip{grade} + .pbar[.cap]{fill=capPct%} + .val "{rating}/{cap}"
  ├ .ladder  = 10 .notch (.on if i≤rank, .cur if i===rank); .notch contains .trait ◆ at traitRank
  └ .micro   = "Mastery {rank}/10 · trait ◆ at {tr} — {trait}"  [+ " · learning {comp}%" if comp<1]
```
**Interaction:** clicking a `.plaque` sets the **active meridian** = that index (the real player action "select meridian to temper"). Wire to the surface action (W6/W7), not local state.

Then a `.divider` `"sealed meridians · unlocked by breakthrough"`, and for **each sealed meridian** a `.slip`:
```
.slip  aria-disabled  aria-label="{name}, sealed, opens at {realmName}"
  ├ .seal-lock = waxSeal('封',26,-8)
  ├ .sname     = "{name} {字}"
  ├ .micro     = "opens at {realmName}"
  └ .micro     = "promise: {pathEffect}"
```
Binds: `meridians[]` (each with `unlocked`, `exercise`, `room`, `name`, `zi`, `rootGrade`, `rating`, `cap`, `capPct`, `capState`, `mastery{rank,next}`, `traitRank`, `trait`, `comp`, `unlockRealm`, `pathEffect`, `isActive`).

### 1.5.3 — THE ROOM (main row, col 2, width 1fr ≈ 1122px) — the hero

`<Panel banner="THE ROOM · {activeRoom}" watermark={pathWatermark}>`. This panel has **no `.content` padding wrapper**; instead it stacks absolutely-positioned full-bleed layers + overlays. Z-order (back→front):

| z | element | content / binds |
|---|---|---|
| — | `.room-atmos` | full-bleed gradient = `T.atmos` (per-path sky/forge glow). |
| — | `.room-scene` | `buildScene(d)` — the per-path SVG backdrop (§1.7). |
| — | `.room-fig` | `buildFigure(d)` — the cultivator + meridian channel (§1.6). |
| — | `.fx-motes` **#th-motes** | **PRESERVE testid** `data-th="training-hall-vfx-motes"`; children are motes `data-th="training-hall-vfx-mote"` (§1.8). |
| — | `.room-smoke` | `buildSmoke(d)` — incense/forge smoke (§1.7). |
| — | `.room-scrim` | state tint: combat → `rgba(110,36,30,.12)`, gathering → `rgba(162,113,42,.08)`, else transparent. |
| — | `.room-corner.tl/.tr` (`<img>`) | `cornerURI(T.corner)` flourishes, top corners. |
| 6 | `.alerts` **(top-left, `left:24 top:14`, max-width 520)** | up to 3 `.alert.{tone}` rows: kai glyph + text + `.x` dismiss. Binds: `alerts[]` (tone ∈ jade/gold/cinn/ink). |
| 6 | `.room-seal` **(top-right, `right:22 top:30`)** | status wax seal + `.chip` label. Per status: active `炼`/jade, idle `待`/gold, combat `戰`/cinn, gathering `占`/gold, no-path → `.chip.ink "No Path"`. Binds: `status`, `intensity`. |
| 6 | `.lens` **(bottom-left, `left:24 bottom:84`, width 330)** | **PRACTICE TEMPO** card (the rate breakdown). `.lensbar` title; `.head` = `{mult}× / 2.25×` + a 56px **ring gauge** (`arc()` sweep, jade<1.8 / gold<2.2 / bright-gold) at `ringPct=mult/2.25`; then **one `.row` per factor** (`{name} ({note})` + `{v}×` + dir arrow `↑/↓/–` with `.dir-up/.dir-down/.dir-bad/.dir-flat`). Binds: `mult`, `factors[]` (the full rate breakdown, §2.5). |
| 6 | `.codex` **(bottom-right, `right:22 bottom:84`, width 340)** | **THIS MERIDIAN** card. `.cbar2` title; `.ctitle` = `{name} {字}`; `.crow "In combat"` = `.eff` chips (tone atk/util/'' from derived effects); `.crow "Path"` = pathEffect; (if comp<1) `.crow "Comprehend"` = `.compbar{comp%}` + `{comp}%`; `.passive-note` = `"Also honed in combat by <b>{trigger}</b> · ≈15% of training rate"`. Binds: `active` meridian (eff[], pathEffect, comp, trigger). Hidden when no-path. |
| 6 | `.forges` **(bottom strip, `left:24 right:24 bottom:24`, height 42)** | single active line: `"Tempering ▸ {name} {rating}/{cap} [capped→mastery?] · feeds {firstDerivedEffect}"`. Binds: `active`. (No-path → "Choose a path at Life Start…".) |

The Room's banner text updates with the active meridian's **room** name (`THE ROOM · {room}`).

### 1.5.4 — PATH MERIDIANS (right column, top, ≈1.45fr)

`<Panel banner="PATH MERIDIANS" watermark="脉">`. Content `.fcol` (`#mer-list`):
- `.fsummary` = `"Path Meridians"` + `.val "{n}/7 unsealed"`.
- For **each meridian** in unlock order (all 7):
  - **unlocked** → `.merrow[.active]`:
    ```
    .merrow[.active]
      ├ svg .fbead (20px) circle fill: capped→goldRad / bottleneck→cinnDisc / else jadeRad; .weakp if bottleneck & !rm
      ├ .mname  = "{name} {字}"
      ├ .rootchip{grade}  = grade label minus " Root"
      ├ .mmeter[.cap] {fill=capPct%}
      ├ .mr     = "{rating}/{cap}"
      └ .chip   = ▸(active, jade) / !(bottleneck, gold) / 滿(capped, gold)
    ```
  - **sealed** → `.merlocked`: `waxSeal('封',20,-6)` + `.mname "{name} {字}"` + `.sealtag "{unlockRealmName}"`.
- Binds: `meridians[]`, `active`, `bottleneck`, `unlockedList.length`.

### 1.5.5 — CONSTITUTION (right column, bottom, ≈1fr)

`<Panel banner="CONSTITUTION">`. Content `.fcol` (`#const-list`):
- `.tier-head.jade "Cultivation Axes · 修为"` then `.cgrid` (2-col) of **7** `.ccell` (Tier 1 axes): each = `{字}` + `.cn {name}` + `.cv {value}`. Binds: `axes[]` (Cultivation Base, Qi Pool, Qi Purity, Meridian Openness, Spiritual Sense, Soul Strength, Dao Comprehension).
- `.tier-head "Mortal Foundation · 体"` then `.cgrid` of **6** `.ccell` (Tier 0): Physique, Vitality, Agility, Perception, Willpower, Luck — **Luck** renders a grade `.cg` (e.g. "慧 · Auspicious"), the rest a number. Binds: `baseStats[]`.
- `.micro` footnote: shared tiers grow via the cultivation loop & pills; the Court tempers path meridians, one at a time.

### 1.5.6 — INTENSITY / BELLOWS (bottom row, col 1, width 720px)

`<Panel banner="INTENSITY">`. Content `.bellows` = `grid-template-columns:repeat(4,1fr); align-items:end`. **4** `.detent` (one per intensity), `.sel` on the chosen one:
```
.detent[.sel]  data-int={id}  role=button  aria-pressed  aria-label="{label}, {xp} experience, {fpm} fatigue per minute"
  ├ medallion({glyph}, sel?ink:gold)            glyphs: 靜/穩/烈/極
  ├ label "{Quiet|Steady|Harsh|Limit}"
  ├ .flamewrap = flameSVG(h, lit)               lit = sel & active & !rm; height grows per intensity
  └ .num "{xp} xp · {fpm}/min"                  0.70×/1.00×/1.35×/1.75× and 0.04/0.14/0.35/0.75
```
**Interaction:** click → set real intensity (the existing intensity control). Binds: `INTENSITIES`, current `intensity`, `status` (lit only when actively tempering).

### 1.5.7 — FORGE HEAT (bottom row, col 2, width 540px)

`<Panel banner="FORGE HEAT">`. Content `#forge-c`:
- zone labels row: `fresh / tiring / strained / overworked` (last cinnabar).
- `.forgebar` (the trough): `.ffill{width=F%}` + `.tick` at 35% & 60% + `.line80` at 80% with `<b>downgrade</b>` label + (if `F≥80 & !rm`) a shimmering cinnabar overflow fill `left:80% width:(F-80)%` animated `heatShimK`.
- scale ticks `0 / 35 / 60 / 80 / 100`.
- footer: `.chip.{jade|gold|cinn}` tier name + `.val "{F} / 100"` + `.micro "output ×{damp}"` + (overworked) `.micro "⤓ practice eases"`.
- Binds: `f` (fatigue 0–100), `tier`, `damp` (the dampening multiplier).

### 1.5.8 — THIS PRACTICE (bottom row, col 3, width 1fr ≈ 732px)

`<Panel banner="THIS PRACTICE">`. Content `#trade-c`. **Single active meridian** focus:
- header `.micro "tempering <b>{name}</b>, at {intensity}:"`.
- `.tline` `{name} {字}` → `"≈ +{base} xp/min"` (base = 2.4 × mult; the artifact's display rate).
- `.tline` `regimen mastery` → `"≈ +{base·0.33}/min"`.
- `.tline` `forge heat` (gold) → `"+{fpm}/min"`.
- `.pp-sec "also in combat · passive"`.
- `.tline` (jade) `{trigger}` → `"≈ +{base·0.15}/min"`.
- then **either** (capped) `.tline "at realm cap → overflow → mastery"` **or** `to next rating ({rating}→{rating+1})` + `.tbar{fill=(rating%5)/5}` + `"~{min} min"`.
- Blocked/idle/no-path → the paused/dash variants.
- Binds: `active`, `mult`, `intens.fpm`, `status`.

### 1.5.9 — NAV (row 4, height 46px)

`.navrow` = `grid-template-columns:1fr auto`:
- left `.nav-left` → `.btn "◂ Return to Cloudreach · Adventure"` (returns to city/adventure; wire to real navigation).
- right `.nav-right` (`#nav-actions`):
  - (if disabled & reason) `.reason "{disabledReason}"`.
  - `.btn.jade.big[.is-disabled] "{Begin Tempering | Tempering}"` — primary start; enabled only when `status==='idle'`.
  - `.btn[.is-disabled] "Cease"` — enabled only when actively tempering.
- **Interaction:** start → begin training the active meridian (ActivityStore gate); cease → stop. Binds: `startEnabled`, `startLabel`, `disabledReason`, `status`.

### 1.5.10 — RETURN-FROM-OFFLINE MODAL (overlay)

`.return-wrap` (scrim + dialog), shown when an offline summary exists. **`.return` dialog has `role="dialog" aria-modal="true"`** — and W10 adds a **focus trap + focus restore**.
```
.return  role=dialog aria-modal=true
  ├ waxSeal('歸',40,-6,true)   [top-left]
  ├ h3 "WHILE YOU WERE AWAY"
  ├ .lead "The hall tempered <b>{meridian}</b> for {duration}."
  ├ .rrow {meridian} → "{gained} {ratings-chip}"
  ├ .rrow "Regimen mastery" → "{mastery}"
  ├ .rrow (jade) "Combat · passive" → "{passiveGain}"
  ├ .rrow (gold) "Forge heat" → "{fatigue} → {tier}"
  ├ (if downgrades>0) .micro "⤓ Your Limit eased {n} times as the forge ran hot."
  └ .btn.jade "Resume"   [closes; restores focus]
```
Binds: `offlineSummary` (duration, meridian, gained, ratings, mastery, passiveGain, fatigue, tier, downgrades). The artifact's offline summary is **single-meridian** (only the active meridian trains offline) — match that.

## 1.6 — The figure + 7-node meridian channel (exact geometry)

The Room's `.room-fig` is an SVG `viewBox="0 0 1212 768"`. It composes, in order: **dais → aura → back-glow → figure body → meridian channel → dantian core**. The figure body (seated cultivator) is **path-agnostic** and reused; the dais/aura/back/scenery are per-path.

**Figure body (reused verbatim — do not redraw):** lotus legs, robe body, fold lines, collar-V, rim light (`T.rim`), mudra hands + glow, neck, head, topknot. All filled `robe` (per-path translucent parchment) + `robeStroke rgba(120,96,52,.65)`. Centerline x=606. Head ~y150, dantian ~y470.

**The 7-node meridian channel (the signature visual — THE constellation of the path):**
- Node Y positions (dantian→crown), index 0→6: `ys = [452, 400, 348, 296, 244, 192, 138]`, all at `x=606`.
- **Base channel:** faint full line `x=606, y 470→138, stroke rgba(120,96,52,.18), width 6`.
- **Charged segment:** if not no-path, bright `T.meridP` (per-path gradient) line `470→ys[realm-1]` (up to the highest *unlocked* node), `width 6, filter glowJ, opacity .85`.
- **Qi-flow:** if actively tempering & !rm, a white dashed `#fff6da width 2.4 .qiflow` line `470→ys[activeIndex]` (animates up the **active** segment).
- **Per node i:**
  - **sealed** (`i ≥ realm`) → `waxSeal('封',22,-5)` translated to `(606-11, ys[i]-11)`, `opacity .92`. (So sealed acupoints ascend the spine.)
  - **unlocked** → a bead circle: fill = capped→`goldRad` / bottleneck→`cinnDisc` / active→`T.core` / else `jadeRad`; radius `13` if active else `9`; stroke per state; active gets `filter glowJ + .mp` pulse, a `22px` breathing halo behind it, bottleneck gets `.weakp`. Capped nodes overlay `滿`.
- **Active label:** a short connector line `x 606+16→606+46` + two text lines to the right of the active node: `{name}` (13px bold) and `{rating}/{cap} · {rootGrade}` (12px, jade if open / gold if not); capped adds `"overflow → mastery"`.
- **Dantian core** (always, on top): `circle cx606 cy470 r44 fill=T.core .breatheA` + `r20` ink ring + `r28` rim ring `.glowP`.

This channel is **driven by realm (how many nodes are unlocked), activeIndex (which glows + flows), and per-node capState/bottleneck.** It is the Training-Hall analogue of the Observatory's stat-meridian constellation — keep them conceptually aligned (W8).

**Dim/blocked:** the whole figure SVG gets `filter:grayscale(.4); opacity:{dim}` where dim = combat .48 / gathering .7 / no-path .45 / else 1.

## 1.7 — Per-path scenery + atmosphere (3 distinct rooms)

`buildScene(d)` returns a per-path SVG backdrop; `T.atmos` is the per-path full-bleed gradient; `T.corner` tints the corner flourishes; `buildSmoke(d)` adds path-appropriate smoke. Reproduce all three verbatim from the artifact. Summary so the port is recognizable:

- **MARTIAL (武, "Qi-in-motion"):** dueling-arena room — vertical cinnabar war-banners ("武道", "勇") flanking, a weapon rack (spears/blades) at right, a war-drum, spinning gold/cinnabar **orbit rings** behind the figure (`back` = two counter-rotating dashed circles), warm steel-gray sky + cinnabar floor glow. `T.core=url(#qiCore)`, `T.atmos` = cool top + warm cinnabar bottom. Smoke = faint pale wisps at arena edges. Watermark `气`.
- **EARTH (地, "Jing essence"):** forge room — a stone furnace/dais with glowing embers, ember motes, a heavy trapezoid stone platform, hot orange forge-glow from below. `T.core=url(#emberCore)`, `T.atmos` strong orange bottom. Smoke = thick dark furnace smoke columns rising (`smokeRiseK`). Watermark `精`.
- **HEAVEN (天, "Shen spirit"):** night pavilion — indigo starfield, a moon (`moonG`), hanging lanterns (`lanternG`), drifting mist (`mistG`), a star-halo dais, soft constellation lines. `T.core=url(#qiCore)`, `T.atmos` deep indigo top fading to jade-tint bottom — **this indigo is scenery, not state.** Smoke = a single thin pale-blue incense thread swaying. Watermark `神`.

`T` (theme) per path also carries: `meridP` (channel gradient id), `rim`/`rimW` (figure rim light), `aura`/`auraOp`, `moteCols`/`moteDur`/`moteW` (mote palette/speed/size), `corner`. Port the whole `THEME` map verbatim.

## 1.8 — Motion / VFX system + CSS custom props + keyframes

**Driven CSS custom props** set on the Room element each render (port to a `style` object or CSS vars on the Room component):
- `--th-fill-p` = activeMeridian rating/cap (0–1) — drives fill-linked visuals; the artifact also nudges it in a 250ms demo loop (do **not** ship the demo loop; in-game this updates from real progress ticks).
- `--th-qi-dur` = `qiDur(mult)` = `(3.0 − clamp(mult,0.5,2.25)·0.8)s` — qi-flow speed (faster at higher tempo).
- `--th-breath-dur` = `(6.8 − min(1,mult/2.25)·2.4)s` — dantian breathing speed.
- `--th-heat` = `f/100` — heat intensity.

**Animations / classes (all gated by reduced-motion, §1.9):**
- `.breatheA` — dantian + active-node halo breathe (uses `--th-breath-dur`).
- `.qiflow` — dashed qi traveling up the active channel segment (uses `--th-qi-dur`).
- `.mp` — active node pulse. `.weakp` — bottleneck node weak-pulse (cinnabar).
- `.glowP` — soft rim glow pulse. `.spinG` — orbit-ring rotation (martial). `.swayG`/`.driftG` — smoke sway/drift.
- `.flame` — intensity flame flicker. heat shimmer `heatShimK` (forge overflow ≥80). `smokeRiseK` — smoke rising.
- **Practice-Tempo ring** — a static `arc()` sweep proportional to `mult/2.25` (not animated; it's a gauge).
- **Motes** (`mountMotes`): per status, mount N motes (active 24 / idle 12 / blocked 6 / no-path 0) into `#th-motes`; each is a `.mote` `data-th="training-hall-vfx-mote"` positioned near the figure base, colored from `T.moteCols`, sized `T.moteW`, animation duration `(5.4+rand)·T.moteDur`. **Preserve both testids.** Heaven motes get `.twk` (twinkle).

**Performance note:** mote count and the demo loop must come from a **narrow vitals subscription**, not whole-store subscriptions (store-purity). In-game, motes re-mount only when `status`/`path` change, not every tick.

## 1.9 — Reduced-motion behavior (must read identically without motion)

When reduced-motion is active (`body.rm` OR `prefers-reduced-motion: reduce`):
- All keyframe animations are disabled (the artifact toggles `body.rm` and the CSS `@media (prefers-reduced-motion:reduce)` block kills animations).
- **Motes are not mounted** (count→0).
- The qi-flow line is still **drawn** (static) so the active channel still reads; the dantian/halo are static; the Tempo ring is static (it was never animated).
- Every state that motion conveyed must still read via shape+color+label: active node = bigger + glow-stroke + label; bottleneck = cinnabar disc + "!" chip; capped = 滿 + gold ring + label. Verify the reduced-motion screenshot (Appendix F #10) is fully legible.

## 1.10 — The shared `<defs>` (mount once at Court root)

Port the artifact's `<svg width=0 height=0><defs>…</defs></svg>` verbatim. Contents (ids referenced throughout):
- **Filters:** `grainF` (feTurbulence paper grain), `soft` (gaussian soft glow), `glowJ` (jade/active glow), `brushRough` (brush edge).
- **Core/aura:** `emberCore`, `qiCore` (dantian cores), `qiAura` (figure aura), `starHalo` (heaven dais halo).
- **Meridian gradients:** `meridP_martial`, `meridP_earth`, `meridP_heaven` (per-path channel), `meridS_c` (secondary, legacy — keep if referenced).
- **Node/seal radials:** `jadeRad`, `goldRad` (lit/capped beads), `cinnDisc` (bottleneck/cinnabar seal fill).
- **Scenery:** `forgeGlow`, `furnaceFire`, `steelG`, `goldG`, `goldBrushG`, `plank`, `lanternG`, `moonG`, `mistG`, `bannerCloth`.
These are **sprite data** — raw hex inside them is permitted (Appendix D lists this file as the hex-allowed zone). Mount once; never per-panel.

## 1.11 — Control bar → real-state mapping (the dev bar is NOT shipped)

The artifact's bottom `#ctrl` strip is a **harness** to demo states. Do not ship it. Map each control to real game state/actions:

| Dev control | Real source / action (wire to this) |
|---|---|
| Path (martial/earth/heaven) | The cultivator's path, chosen at Life Start — read-only in the Court. |
| Realm (1–7) | Real realm from the progression runtime (read-only). |
| **Tempering (active meridian select)** | **A real player action** — selecting which unlocked meridian to temper. This is the one "control" that becomes a genuine UI affordance (the regimen `.plaque` click in §1.5.2). Persist the selection. |
| Status (active/idle/blocked…) | **Derived**, never set by the Court: `blocked_by_combat` from `CombatStore`; `blocked_by_activity` from `ActivityStore` (another foreground activity holds the hall); `no_path` if no path chosen; `active`/`idle` from whether training is running. |
| Intensity (Quiet/…/Limit) | The existing real intensity control (already in the game) — the Bellows panel **is** that control, restyled. |
| Fatigue slider | Real fatigue value (read-only display). |
| reduced-motion | OS/app setting (read-only). |
| offline return | The real return-from-offline flow fires the modal when an offline summary exists. |

**Acceptance for §1.11:** the shipped Court has **no** dev bar; intensity + meridian selection are the only interactive controls; everything else reflects real state. (A QA-only dev overlay may exist behind a debug flag, but it is never in the default/production tree.)

---

# PART 2 — THE MECHANICS, SPECIFIED (mechanical source of truth)

> All of this comes from `STAT_SYSTEM_OVERHAUL.md`. This part is the implementable distillation; the **canonical data tables are Appendix A** (21 meridians) and **Appendix B** (derived formulas). Coefficients marked `‹tune W12›` are starting values to balance later — the *structure* is fixed, the *numbers* are tunable.

## 2.1 — The four tiers

| Tier | Name | Count | Trained how | Read by combat? | Surfaced where |
|---|---|---|---|---|---|
| **0** | Mortal Foundation | 6 (shared) | the main cultivation loop & pills (NOT the Court) | indirectly (feeds Tier 3) | Constitution panel |
| **1** | Cultivation Axes | 7 (shared) | the main cultivation loop (NOT the Court) | indirectly | Constitution panel |
| **2** | Path Meridians | **7 per path** (unique) | **the Court** — one at a time | indirectly (feeds Tier 3) | Path Meridians panel + figure channel + regimens |
| **3** | Derived stats | computed | never trained | **YES — combat reads ONLY these** | codex preview + (existing combat UI) |

- **Tier 0 — Mortal Foundation:** Physique (体), Vitality (元), Agility (敏), Perception (悟 — master learn-rate; feeds the Court rate via `perceptionMult`), Willpower (志), Luck (运 — fixed talent, creation-only, shown as a grade).
- **Tier 1 — Cultivation Axes:** Cultivation Base (修为), Qi Pool (灵力), Qi Purity (气纯), Meridian Openness (经脉), Spiritual Sense (神识), Soul Strength (魂), Dao Comprehension (道).
- **Tier 2 — Path Meridians:** 7 per path, **one revealed per breakthrough** (signature at R1 Life Start, capstone Dao at R7). The Court trains exactly these.
- **Tier 3 — Derived:** Max HP, Phys/Qi/Soul Atk & Def, Flat DR, Qi Pool/Regen, Speed/Initiative, Atk Speed, Accuracy, Evasion, Crit%/CritDmg, Armor Pen, Control, Tribulation Resist, **Suppression** (realm-gap), Stagger/CC resist. Form: `(Σ source·k + base) × realmScalar × (1 + Σ pathMult) × gear`. **Combat reads only Tier 3.**

**Store boundary:** Tiers 0/1 are owned by the existing cultivation systems — the Court **reads** them (Constitution panel) and **never writes** them. Tier 2 is what the Court writes (via the training engine, W3). Tier 3 is computed by the derived-stat layer (W4) and **read** by combat (techniques untouched).

## 2.2 — The 21 path meridians (structure; full data = Appendix A)

Each path has 7 meridians in unlock order. Each meridian record:
```
{
  id, path,                       // 'martial'|'earth'|'heaven'
  name, zi,                       // English + 字 (kai glyph)
  exercise, room,                 // regimen drill name + room name
  unlockRealm,                    // 1..7 (signature=1, capstone=7)
  trigger,                        // combat passive trigger phrase (§2.9)
  derived: [ {channel, sign} ],   // which Tier-3 stats it feeds, w/ ↑/↑↑ weight (§2.10)
  pathEffect,                     // the unique utility/path effect string
  rootKey,                        // aptitude grade key (§2.3) — rolled at Life Start
}
```
The three signatures (R1, granted at Life Start) and capstones (R7, the path Dao):
- **Martial:** Weapon Intent (兵意, R1) … Martial Dao · Asura (修罗道, R7).
- **Earth:** Body Temper (体锻, R1) … Earth Dao · Unmoving Sovereign (后土道, R7).
- **Heaven:** Spirit Sense (神识, R1) … Heaven Dao · Mandate of the Firmament (天道, R7).

Full ordered lists with exercises, rooms, triggers, derived targets, path effects, and signature combat effects (Sword Heart "crits ignore %DR", Iron Skin "damage threshold", Void Gaze "armor-pen via weakness", Heavenly Mandate "suppression domain", etc.) are in **Appendix A** — that table is the literal data the W2 content files must encode.

## 2.3 — Spirit roots / aptitude (per meridian, rolled at Life Start)

Each meridian has an **aptitude grade** (spirit root) that scales its **cap** and **rate**. Rolled at Life Start, **re-rolled only via reincarnation** (prestige). Grades (the `.rootchip` colors in §1.4):

| Grade (key) | capMult | rateMult | chip color |
|---|---|---|---|
| Heavenly (`heavenly`) | 1.60 | 1.80 | purple |
| True (`true`) | 1.30 | 1.40 | jade |
| Earthly (`earthly`) | 1.10 | 1.10 | gold |
| Mortal (`mortal`) | 0.90 | 0.85 | ink |
| Chaos (`chaos`) | 1.45 | 1.60 | cinnabar (volatile — high but swingy; flavor only unless W12 adds variance) |

- **Effective meridian cap** = `round(realmCap × root.capMult)` where `realmCap ∈ [40,60,80,100,125,150,170]` for R1..R7 (§2.4).
- **rateMult** multiplies the training rate (§2.5).
- Persist the per-meridian roll in save state (a 21-entry map for the cultivator's chosen path — only the path's 7 matter, but store the roll so it's stable). Reincarnation re-rolls.

## 2.4 — Realm caps + unlock cadence

- **Realm cap array (R1..R7):** `[40, 60, 80, 100, 125, 150, 170]`. (Adds R7=170 to the old 6-length array — the one sanctioned constant change; rewrite the cap-length tests, Appendix C.)
- **Unlock cadence:** at realm `R` (1..7), meridians with `unlockRealm ≤ R` are **unlocked**; the rest are **sealed**. So you have exactly `R` unlocked meridians and `7−R` sealed. A breakthrough to realm `R` **unseals** the meridian whose `unlockRealm === R`.
- All unlocked meridians share the **current realm's** cap as their ceiling (× their root capMult). When you break through, the ceiling rises for all of them.

## 2.5 — The training rate formula (the Practice-Tempo breakdown)

Training advances **exactly one meridian** (the active one). Per minute:
```
rate = baseRate
     × intensityMult        // Quiet .70 / Steady 1.00 / Harsh 1.35 / Limit 1.75
     × fatigueDamp          // max(0.4, min(1, 1 − max(0, F−40)·0.009))
     × perceptionMult       // 1 + (Perception − 20)·0.006        ‹tune W12›
     × aptitudeRate         // root.rateMult (§2.3)
     × regimenMastery       // 1 + masteryRank·0.012              ‹tune W12›
     × comprehensionMult    // 0..1 ramp on a freshly-unlocked exercise (§2.7)
     × capFalloff           // max(0.35, 1 − max(0,(capPct−0.85)/0.15)·0.62)   (§2.8)
     × pathAffinity         // 1.20 fixed resonance                ‹tune W12›
     × offlineMult          // 1.00 online; offline uses the offline pipeline (≤12h, no combat)
     × formMemoryMult       // 1.00 unless a prestige Form-Memory floor applies (§2.11)
rate = min(rate, 2.25 × baseRate)   // the max-tick clamp (PRESERVED)
```
The **Practice-Tempo lens** (§1.5.3) shows **each factor as a row** with its value and an up/down/flat arrow, plus the clamped product as `{mult}× / 2.25×`. The lens factor list **is** this formula — keep them 1:1 so the UI explains the math. (Display `mult` = product/clamp expressed as a multiple of baseRate.)

**Crucial preservation:** the clamp `2.25`, the intensity multipliers, the fatigue dampening curve, and the no-resource-cost rule are unchanged from the current engine. Only the *target* (one meridian, not three stats) and the *extra factors* (aptitude, mastery, comprehension, cap-falloff) are new.

## 2.6 — Per-exercise mastery

Each meridian's exercise has its own **mastery** track (realm-uncapped — it keeps growing past realm caps):
- `mastery.rank` 0..10 shown as a 10-notch `.ladder`; `traitRank` marks the notch (◆) where a **trait** unlocks (e.g. "Counters cost 8% less stamina").
- Mastery rank feeds `regimenMastery` in the rate (§2.5) and unlocks the trait at `traitRank`.
- Mastery advances from time-on-exercise (and **overflow** at cap, §2.8). Persist per exercise.
- Trait effects are small, flavorful, mostly QoL/efficiency — they **do not** touch techniques. (e.g. fatigue accrues slower, gap-close +, DoT taken −.) Implement as modifiers in the meridian/training layer or as derived-stat tweaks — never in the technique system.

## 2.7 — Comprehension warm-up (freshly-unlocked exercises)

When a breakthrough unseals a new meridian, its exercise starts at **reduced comprehension** and ramps to full as the player practices, gated by **Perception**:
- `comprehension ∈ [comprehensionFloor, 1]`. Starting floor `‹tune W12›` ≈ `0.5`. It climbs with time-on-exercise; climb rate scales with Perception.
- `comprehensionMult` in the rate (§2.5) = `comprehension` (so a fresh exercise trains slower until grasped).
- UI: the codex shows a `.compbar` + `"{pct}%"` and the alert `"Still comprehending {name} — {pct}% learned; rate climbs as you grasp the form."`; the regimen card shows `"learning {pct}%"`.
- Once `comprehension === 1`, drop the UI ramp (the artifact only shows it when `<1`).
- Persist per exercise. (A re-sealed/re-unlocked meridian — not normally possible without prestige — would reset; spec re-attunement in D-RESEAL.)

## 2.8 — Overflow → mastery (at the realm cap)

When a meridian's rating hits its **effective cap** (`capState==='capped'`, `capPct ≥ 1`):
- Further training **overflows into mastery** instead of rating (the rating is hard-capped at the realm ceiling until the next breakthrough raises it).
- `capFalloff` (§2.5) already throttles rate as you approach cap (from `0.92×` "near_cap" down to floor `0.35` at cap) — so the last stretch is slow, then overflow routes to mastery.
- UI everywhere: the 滿 glyph (channel node, meridian row, regimen), the alert `"{name} reached its realm cap — overflow now feeds mastery."`, the forges line `"capped → mastery"`, and This-Practice `"at realm cap → overflow → mastery"`.
- `capState` thresholds (from the engine): `open` `<0.92`, `near_cap` `0.92–<1`, `capped` `≥1`.

## 2.9 — Passive combat training (online-only)

Each meridian is **also** honed in combat by a themed **trigger**, feeding the *same meridian* at a fraction of the Court rate:
- `passiveRate ≈ 0.15 × (the meridian's Court rate at current intensity)` `‹tune W12›`. Online-only (no offline combat). **Per-fight capped** so it supplements, never replaces, deliberate training.
- The trigger fires only for the meridian whose theme matches the combat event (e.g. Weapon Intent ← "dealing weapon-skill damage"; Flowing Step ← "dodging / repositioning"; Body Temper ← "taking & dealing physical blows"; Dao Heart ← "composure under pressure"; Void Gaze ← "landing soul / curse effects"). **Full trigger list = Appendix A.**
- Source: hook into `CombatStore` events (read-only consumption; the Court does not drive combat). The passive grant goes through the **same training-advance path** as the Court (so caps/overflow/mastery apply identically) — implement as the training engine exposing an `advanceMeridian(meridianId, amount, source:'court'|'combat')` that both the Court tick and the combat hook call. **Do not** add combat-training logic inside techniques.
- UI: codex `.passive-note` (trigger + ≈15%); This-Practice `also in combat · passive` line; the offline/return modal shows accumulated combat-passive separately.

## 2.10 — Tier-3 derived stats (the combat-facing layer; full table = Appendix B)

Combat reads **only Tier 3**. Tier 3 is recomputed from Tiers 0/1/2 + gear whenever an input changes (memoized). General form per derived stat:
```
derived = (Σ_overSources(sourceValue × k) + base) × realmScalar × (1 + Σ pathMult) × gearMult
```
- **Sources** are specific Tier-0/1/2 stats. Example mappings (full set in Appendix B, coefficients `‹tune W12›`):
  - **Max HP** ← Vitality, Physique, **Body Temper** (Earth), Marrow Essence.
  - **Physical Attack** ← Physique, **Weapon Intent** (Martial), Body Temper (Earth body-attack).
  - **Physical Defense** ← **Bone Forging**/**Iron Skin** (Earth), Physique.
  - **Crit %** ← **Killing Intent** (Martial), Mind Eye (Heaven find-weakness), Perception.
  - **Crit Dmg / Armor Pen** ← **Sword Heart** (Martial; crits ignore %DR), Void Gaze (Heaven; pen via weakness).
  - **Speed / Initiative / Atk Speed** ← Agility, **Flowing Step** / **Battle Rhythm** (Martial).
  - **Accuracy / Evasion** ← **Spirit Sense** / **Mind Eye** (Heaven), Agility.
  - **Soul Atk / Soul Def** ← **Void Gaze** / **Soul Clarity** (Heaven), Soul Strength, Spiritual Sense.
  - **Tribulation Resist** ← **Dao Heart** (Heaven), Willpower, Dao Comprehension.
  - **Control Power** ← **Heavenly Mandate** (Heaven), Soul Strength.
  - **Flat DR / Reflect / Threshold** ← **Iron Skin** / **Mountain Stance** (Earth).
  - **Suppression** ← realm-gap (your realm vs target) + **Killing Intent** / **Heavenly Mandate**.
  - **HP Regen / Qi capacity / poison resist** ← **Marrow Essence** (Earth).
  - **Stagger/CC resist / anti-displacement** ← **Root Depth** / **Mountain Stance** (Earth), **Unbroken Momentum** (Martial).
- **Signature path effects** are conditional modifiers on these (Sword Heart: crit damage ignores X% of target DR; Iron Skin: incoming hits below a threshold deal 0; Heavenly Mandate: an aura that lowers enemies' stats in range; Earth Dao/Heaven Dao/Asura: global scalars + the ultimate). Implement as flags/modifiers consumed by the **existing combat resolver** — **techniques untouched**; you add inputs they already read or new derived fields, never edit technique code.
- The **codex "In combat" chips** (§1.5.3) are a *preview* of which derived stats the active meridian feeds — they must be generated from the same `derived[]` mapping so UI and engine never drift.

## 2.11 — Prestige Form Memory floor

On reincarnation (`PrestigeResetService`):
- Meridian ratings reset, **but** a **Form Memory floor** is granted per meridian = `floor((Σ lifetime rating invested in that meridian)^e) × m`, `e ≈ 0.5–0.8`, `m` small `‹tune W12›`. So re-leveling is faster each life (the idle-prestige "permanent floor").
- Spirit roots are **re-rolled** at reincarnation (§2.3) — this is the only re-roll.
- `formMemoryMult` in the rate (§2.5) stays `1.00` during a life; the floor is applied as a **starting rating**, not a rate multiplier (the artifact's lens shows `form memory 1.00× (no prestige floor yet)` — match that wording; the floor manifests as non-zero starting ratings after a prestige).
- Persist lifetime totals per meridian across resets.

## 2.12 — Fatigue / intensities / forge heat (PRESERVED — do not change values)

- **Intensities:** Quiet `0.70× / 0.04 fpm`, Steady `1.00× / 0.14`, Harsh `1.35× / 0.35`, Limit `1.75× / 0.75`. (`fpm` = fatigue per minute.)
- **Forge-heat tiers (= fatigue):** fresh `<35`, tiring `35–<60`, strained `60–<80`, overworked `≥80`.
- **Dampening:** `damp = max(0.4, min(1, 1 − max(0, F−40)·0.009))` — output multiplier shown as `×{damp}`.
- **Auto-downgrade:** at `F ≥ 80`, intensity auto-eases (the "Limit eased N times" in the return modal). Offline cap `12h`.
- **No resource cost** for training (test-enforced; never add one).
- These are the existing engine's constants; the Court **re-skins** them (Bellows + Forge Heat panels) and **reads** them — it does not redefine them.

---

# PART 3 — WAVE 0: PLAN-MODE RECON (no edits)

**Mode: Plan Mode. ZERO edits. Output: the recon report below + the decision answers (Part 4). Then STOP and wait for human confirmation.**

This wave exists because every `‹recon:…›` path in this packet is a hypothesis. You must map each to a real path + line anchor before any edit. Invoke `engineering:debug` if a search comes up empty; do not guess.

## 3.1 — What to locate (map each; report path + line anchors + current shape)

1. **Training Hall page/feature root** — the component(s) rendering the current Training Hall, its route, and its **root testid**. (Hypothesis: a `TrainingHall*`/`trainingHall/` feature dir.) Record the current region/layout components so you know what W7 replaces.
2. **The training/stat store(s)** — where stats live and where training advances them. Identify: the current stat roster (the old 18), the tri-stat XP split logic, intensity handling, fatigue, offline accrual, the max-tick clamp, the no-cost rule. (Hypothesis: a Zustand `statStore`/`cultivationStore` + a training service.)
3. **`TrainingHallSurfaceV1`** — the render-only surface contract the page reads. Record its exact fields (esp. the primary/secondary/foundation fields that break). Find its builder/selector. (Hypothesis: near `src/systems/ui/...` beside the Observatory types.)
4. **`StatusObservatorySurfaceV1` + the Status Observatory** — the constellation/instruments, **and the Spirit Root Astrolabe SVG** (protected geometry). Record where the stat-meridian constellation reads its data (this is what W8 re-binds). (Hypothesis: `src/systems/ui/status/statusObservatoryTypes.ts` + an Observatory feature dir.)
5. **The 506 contract tests** — the suite(s), how they're run (`npm run test:contracts`), and which files assert: the tri-stat split, the 18-roster, the surface fields, the 6-length cap array, stat identities. (These are the Appendix-C rewrite targets.)
6. **The motion/VFX system** — how the current Training Hall mounts motes (the `training-hall-vfx-motes/-mote` testids), the reduced-motion mechanism, and any existing CSS-var motion driving. Confirm the testids' current home.
7. **Token source** — `paperInkTokens.scss`: confirm which of the artifact's tokens already exist (expect nearly all) and that only `--paper-jade-deep`, `--paper-gold-bright`, `--paper-stamp-bright` are missing. Record the file path + the ink/paper/jade/gold/cinnabar token names actually used in the repo (so the token map, Appendix D, is exact).
8. **Source-of-truth owners** — `ActivityStore` (foreground gate → `blocked_by_activity`), `CombatStore` (→ `blocked_by_combat` + passive triggers), `RewardService.grantRewards`, `PrestigeResetService` (→ Form Memory floor), the realm/progression runtime (→ realm, breakthrough, unlock), runtime content packs (→ where meridian data should live). Record each module's path + the function/event you'll consume.
9. **Techniques system boundary** — locate it precisely so you can **avoid** it; record where derived stats are *read by* combat so W4 plugs in without touching technique code.
10. **The fixed-stage scale hook** — does the Observatory already ship a `ResizeObserver` scale hook for a 2048×1152 (or 1672×941) design stage? If so, record it to reuse in §1.1.
11. **Flag system** — how feature flags work (e.g. `STATUS_OBSERVATORY_PUBLIC_DEFAULT_ENABLED`); you'll add a `TEMPERING_COURT_*` flag for the gated cutover (W13).
12. **Build/verify scripts** — confirm `typecheck`, `check:icons`, `validate:content`, `test:contracts`, `build` exist and their exact names; confirm Playwright is wired (or note how to run a screenshot harness at 2048×1152).

## 3.2 — Recon report format (produce this verbatim structure)

```
## RECON REPORT — Tempering Court

### Path map (hypothesis → real)
| # | Asset | Hypothesis | Real path | Line anchor(s) | Notes |
|---|-------|-----------|-----------|----------------|-------|
| 1 | Training Hall root | ... | src/... | L.. | current regions: ... |
| ... |

### Current shapes (paste the real signatures)
- TrainingHallSurfaceV1 = { ...actual fields... }   (breaking fields flagged)
- StatusObservatorySurfaceV1 = { ... }
- stat roster (old 18) = [ ... ]
- realm cap array = [...]  (length N)
- training advance fn = <signature>
- mote mount = <where + testids confirmed?>
- Astrolabe geometry file = <path>  (DO NOT EDIT confirmed)

### Test inventory (Appendix-C targets)
| Suite/file | Asserts | Breaks? | Rewrite plan |
| ... |

### Source-of-truth owners (consume, never duplicate)
- ActivityStore: <path> — gate fn/event: ...
- CombatStore: <path> — events for passive triggers: ...
- RewardService.grantRewards: <path>
- PrestigeResetService: <path>
- progression/realm runtime: <path> — realm + breakthrough API
- content packs: <path> — where meridian data should live

### Token reality
- paperInkTokens.scss: <path>. Present: [...]. Missing (to add): --paper-jade-deep, --paper-gold-bright, --paper-stamp-bright (confirm). Repo names for ink/paper/jade/gold/cinnabar: ...

### Scale hook / flags / scripts
- Existing ResizeObserver stage hook? <yes/no + path>
- Flag mechanism: <how> → new flag name: TEMPERING_COURT_PUBLIC_DEFAULT_ENABLED
- Verify scripts confirmed: typecheck/check:icons/validate:content/test:contracts/build = <exact>
- Playwright at 2048×1152: <how to run>

### Decision answers (Part 4)
D1: ... (recommendation accepted? chosen value)
...
D14: ...

### Open risks / surprises
- ...
```

## 3.3 — The NO-EDITS gate

Wave 0 ends with the report + decision answers presented to the human. **No file is edited in Wave 0.** Do not begin W1 until the human confirms the path map and the decisions. If recon reveals a structural surprise that invalidates a later wave, **flag it and propose a revised wave plan** rather than proceeding.

---

# PART 4 — DECISIONS TO SURFACE (answer in recon, before editing)

Each decision has a **strong recommendation**. Present your chosen answer (defaulting to the recommendation unless recon contradicts it) in the recon report. Do not silently decide — surface them.

- **D1 — Meridian data home.** Where do the 21 meridian records + roots live? **Rec:** a runtime **content pack** (data-truth owner), typed, validated by `validate:content`; not hardcoded in TSX. Mirror how techniques/realms are packed.
- **D2 — Active-meridian selection persistence.** Per-cultivator persisted field (the chosen meridian to temper). **Rec:** add `activeMeridianId` to the training/cultivation save slice; default = newest unlocked.
- **D3 — Surface extension vs replacement.** **Rec:** extend `TrainingHallSurfaceV1` **additively** (new optional fields: `meridians[]`, `activeMeridianId`, `axes[]`, `baseStats[]`, `factors[]`, `mult`, `nextUnlock`, `cultPct`, `derivedPreview`, `offlineSummary`) behind the flag, keep old fields until W13, ship a back-compat shim. Do NOT break the shape.
- **D4 — Style triangle / element affinity.** The overhaul mentions an advantage cycle (Body▸Qi▸Spirit). **Rec:** **DEFER** to a later packet (not in the artifact). Do not implement now; do not imply it in UI. (Suppression *is* implemented as a derived stat; the triangle is separate.)
- **D5 — Chaos-root variance.** **Rec:** ship Chaos as flavor (fixed high cap/rate per §2.3) in v1; defer real variance/volatility to W12 balancing if desired.
- **D6 — Passive-combat coefficient.** **Rec:** `0.15×` Court rate, per-fight capped. Tune in W12. Expose as a single balance constant.
- **D7 — Comprehension floor & ramp.** **Rec:** floor `0.5`, ramp scaled by Perception, full after a modest practice window. Tune W12. Single balance constants.
- **D8 — Astrolabe node mapping (W8).** The Observatory Spirit Root Astrolabe currently visualizes roots/stats. **Rec:** re-bind its existing nodes to the **per-meridian aptitude grades** (7 path meridians) **without redrawing geometry** — map node slots → the path's 7 meridians in unlock order; sealed ones render in a sealed style. Confirm node count vs 7; if mismatch, map the available slots and flag.
- **D9 — Constellation/Observatory stat read (W8).** The Observatory's stat-meridian constellation read the old roster. **Rec:** re-bind to Tier-2 path meridians (+ show Tier-0/1 in the Observatory's stat areas), preserving geometry/anchors. Decommission old "Dao Mandate/Omen/Proof/Source" public labels per the established vocabulary policy (internal engine may remain).
- **D10 — Dev bar disposition.** **Rec:** delete from the shipped tree; optionally re-add behind a `debug` flag as a QA overlay (never default). (§1.11.)
- **D11 — Realm-cap constant change.** **Rec:** extend to `[40,60,80,100,125,150,170]`; rewrite the cap-length tests (Appendix C) in the same wave (W2/W3).
- **D12 — Test rewrite vs add.** **Rec:** **rewrite** the broken assertions to the new model (not delete, not skip); add new tests for one-meridian training, unlock cadence, caps/overflow, comprehension, passive, derived. Keep the suite at/above 506, all green, reviewed.
- **D13 — Offline single-meridian.** **Rec:** offline trains **only** the active meridian (+ accrues combat-passive = 0 offline since no offline combat); the return modal is single-meridian (matches artifact).
- **D14 — Reseal/re-attunement.** **Rec:** not possible without prestige in v1; on prestige, ratings→Form-Memory floor, comprehension resets, roots re-roll. No mid-life re-attunement UI in v1.

---

# PART 5 — THE WAVES (W1–W13)

> Per-wave template: **Objective · Class · Touchpoints (recon-confirmed) · Retains · Steps · Non-goals · Verify · Acceptance · Parity loop · Fallback · Commit.** Packet classes: `docs-only | infra-only | additive screen enhancement | cleanup-after-cutover-review` (default **additive**). One commit per wave. Run the golden gate (§0.B) every wave that touches `src/`.

## W1 — Tokens & panel material

- **Objective:** add the 3 missing tokens; build the reusable `<Panel>` material (all 10 layers, §1.3) + shared helpers (§1.4) + the shared `<defs>` (§1.10), as isolated, screenshot-tested primitives. No region yet.
- **Class:** additive (new primitives under `‹recon: src/ui/paper/ or src/features/trainingHall/ui/›`).
- **Touchpoints:** `paperInkTokens.scss` (add `--paper-jade-deep:#0f6f5a; --paper-gold-bright:#b2832d; --paper-stamp-bright:#a94835;`); new `Panel.tsx` + `panel.scss`; new `inkSeals.tsx` (waxSeal/medallion/cornerURI/flameSVG) + `chips.scss` (`.chip*`, `.rootchip*`); new `CourtDefs.tsx` (the `<defs>` sprite).
- **Retains:** all existing tokens (reuse, don't duplicate); existing ink/paper primitives.
- **Steps:** (1) add tokens. (2) Port `.panel/::before/.grain/.gframe(mask-xor)/.gframe2/.gc/.banner(+diamond caps,.cinn)/.tag/.gcol` exactly; route every CSS color through tokens. (3) Port helpers as pure fns/components; the wax-blob path **generated** (22-pt sine radius). (4) Mount `<defs>` once. (5) Build a throwaway harness page rendering one `<Panel>` with a banner, a tag, a watermark, a wax seal, all chip variants — screenshot it.
- **Non-goals:** any region content; the figure; data wiring.
- **Verify:** golden gate + `check:icons` clean + grep `#[0-9a-f]{6}` in new `.tsx/.scss` returns only `<defs>`/sprite hits.
- **Acceptance:** the harness `<Panel>` is pixel-identical to an artifact panel's frame: gold double-frame is a *frame* (mask-xor works), inner hairline present, 4 corner brackets, jade banner with diamond caps, vignette+foxing+grain visible, watermark faint. Chips & root chips match colors.
- **Parity loop:** screenshot harness → compare to any artifact panel header → fix mask/gradient/spacing → repeat ≥2×.
- **Fallback:** if `mask-composite` support is shaky in the runtime, the artifact's exact CSS is the reference — match it; do not substitute a box-shadow frame (that fails parity).
- **Commit:** `feat(court): panel material + ink seals + defs + 3 tokens (W1)`

## W2 — Data model & types (21 meridians, roots, caps, cadence, mastery, comprehension)

- **Objective:** encode the mechanical model as typed data + a content pack, with no behavior yet.
- **Class:** additive + content.
- **Touchpoints:** new `meridians` content pack (D1) with the **Appendix A** tables (21 records × {id,path,name,zi,exercise,room,unlockRealm,trigger,derived[],pathEffect,rootKey}); new types `Meridian`, `MeridianRoot`, `SpiritRootGrade`, `MeridianView`, `RealmCaps`; the realm-cap array `[40,60,80,100,125,150,170]` (extend the existing constant); the roots table (§2.3); `validate:content` schema for the pack.
- **Retains:** the old stat roster/types (untouched this wave; replaced in W3/W6).
- **Steps:** (1) author the content pack from Appendix A — **verbatim**; (2) add the schema + wire `validate:content`; (3) add the cap array (extend; mark the 6→7 change); (4) add the roots table + the per-cultivator root-roll save field (D2/D3 stub, no roll logic yet) ; (5) add `MeridianView` (the computed shape the surface/UI consumes: `unlocked,cap,rating,capPct,capState,isActive,isBottleneck,unlockRealm,root,...`).
- **Non-goals:** training advance, derived stats, UI.
- **Verify:** golden gate; `validate:content` passes with the new pack; typecheck clean.
- **Acceptance:** the pack loads & validates; a unit test enumerates 7 meridians/path with correct unlockRealms (signature=1…capstone=7) and the cap array length 7.
- **Fallback:** if the content-pack pipeline can't take this shape, fall back to a typed module under content/ — but keep it data, not TSX, and validated.
- **Commit:** `feat(stats): three-treasures meridian data pack + roots + caps (W2)`

## W3 — Training engine rework + REWRITE the broken tests

- **Objective:** make training advance **one meridian** with the full rate formula; rewrite the tests the new model breaks (Appendix C). **This is the breaking core.**
- **Class:** additive engine + sanctioned test rewrite (NOT cleanup — the old surface stays until W6/W13).
- **Touchpoints:** the training service/store (recon #2); a new `advanceMeridian(meridianId, amount, source)` (the single advance path used by Court tick **and** combat passive, §2.9); the rate formula (§2.5) as a pure, unit-tested fn `computeMeridianRate(view, ctx)`; cap/overflow→mastery (§2.8); comprehension ramp (§2.7); per-exercise mastery (§2.6); aptitude application (§2.3); offline accrual (single meridian, §2.12/D13). Rewrite Appendix-C test files.
- **Retains:** intensity multipliers, fatigue dampening, the 2.25 clamp, the no-cost rule, offline 12h, auto-downgrade — **reuse the existing implementations**, just retarget from 3-stat to 1-meridian.
- **Steps:** (1) implement `computeMeridianRate` exactly per §2.5 (each factor a named term so the lens can mirror it); unit-test each factor + the clamp. (2) Implement `advanceMeridian` (rating up to cap; overflow→mastery; comprehension/mastery progression; both sources). (3) Retarget the Court training tick to advance `activeMeridianId`. (4) Wire offline accrual to single-meridian. (5) **Rewrite** the broken assertions to the new model (Appendix C) and **add** new tests: one-meridian-only advance, unlock-gating, cap/overflow, comprehension ramp, aptitude scaling, clamp, no-cost preserved, fatigue dampening preserved. (6) `engineering:code-review` the rewritten tests.
- **Non-goals:** derived stats (W4), passive combat hook (W5 — but expose the `source:'combat'` param now), UI (W7), surface change (W6).
- **Verify:** golden gate; **`test:contracts` green at ≥506 against the new model**; new unit tests green.
- **Acceptance:** training a meridian raises only that meridian; capped meridians overflow to mastery; rate matches `computeMeridianRate`; preserved constants verified by preserved-style tests; the suite is green and the rewritten tests assert the new model strictly.
- **Parity loop:** n/a (engine) — but the lens factor list (W7) must equal `computeMeridianRate`'s terms; note the term names here for W7.
- **Fallback:** if retargeting the tick risks the live build, keep the old tick path behind the flag and run the new path only when the flag is on (the surface/UI flips in W13).
- **Commit:** `feat(training): one-meridian rate engine + overflow/mastery/comprehension + test rewrite (W3)`

## W4 — Derived-stat layer (Tier 3)

- **Objective:** compute Tier-3 derived stats from Tiers 0/1/2 + gear (Appendix B), memoized, read by the **existing** combat resolver — **techniques untouched**.
- **Class:** additive.
- **Touchpoints:** new `computeDerivedStats(tiers, gear)` (Appendix B); a memoized selector feeding wherever combat currently reads stats (recon #9); the `derived[]` mapping shared with the codex preview (§2.10).
- **Retains:** the existing combat resolver and **all** technique code (read-only plug-in).
- **Steps:** (1) implement Appendix B formulas (coefficients `‹tune W12›`, structure fixed). (2) Memoize on tier/gear inputs. (3) Route combat's stat reads to the derived layer (additive: add the new fields combat needs; do not edit technique logic). (4) Export `meridianDerivedTargets(meridianId)` so the codex chips and the engine share one source. (5) Unit-test a few derived values + the signature effects (Sword Heart %DR-ignore flag, Iron Skin threshold, Heavenly Mandate aura field) as data, not technique edits.
- **Non-goals:** balancing the numbers (W12); technique edits (never).
- **Verify:** golden gate; derived unit tests; **no diff in technique files** (grep the technique dir for changes — must be empty).
- **Acceptance:** combat reads Tier-3; changing a meridian rating changes the right derived stat; codex chips == `meridianDerivedTargets`; technique files unchanged.
- **Fallback:** if combat's stat read is deeply coupled, add an adapter that maps derived→the shape combat expects, still without touching techniques.
- **Commit:** `feat(combat): tier-3 derived stat layer from meridians (W4)`

## W5 — Passive combat training hook

- **Objective:** combat events feed the matching meridian via `advanceMeridian(..., 'combat')` at ≈15%, online-only, per-fight capped (§2.9).
- **Class:** additive.
- **Touchpoints:** a `CombatStore` event subscriber (recon #8) that maps combat events → meridian triggers (Appendix A trigger column) → `advanceMeridian`; a per-fight cap accumulator; the balance constant (D6).
- **Retains:** CombatStore (read-only consumption); techniques (untouched).
- **Steps:** (1) map each combat event type → the meridian whose `trigger` matches. (2) On event, grant `0.15 × courtRate` to that meridian via the shared advance path (so caps/overflow/mastery apply). (3) Cap per fight. (4) Online-only (no offline). (5) Unit-test: a weapon-skill hit advances Weapon Intent (martial) by the capped passive amount and respects cap/overflow.
- **Non-goals:** offline combat (none); UI (the codex/this-practice already describe it in W7).
- **Verify:** golden gate; passive unit tests; technique dir unchanged.
- **Acceptance:** fighting nudges the themed meridian; per-fight cap holds; deliberate Court training still dominates.
- **Fallback:** if event granularity is coarse, grant on fight-end summary instead of per-hit (still capped), and note it.
- **Commit:** `feat(training): passive combat meridian honing (W5)`

## W6 — Surface contract extension + back-compat shim

- **Objective:** extend `TrainingHallSurfaceV1` additively (D3) with everything the Court UI needs, behind the flag, with a shim so the old UI still works until W13.
- **Class:** additive.
- **Touchpoints:** `TrainingHallSurfaceV1` (recon #3) — add optional fields: `path`, `realm`, `realmName`, `cap`, `cultPct`, `meridians: MeridianView[]`, `activeMeridianId`, `active: MeridianView`, `nextUnlock`, `axes[]`, `baseStats[]`, `factors: RateFactor[]`, `mult`, `alerts[]`, `status`, `intensity`, `startEnabled`, `disabledReason`, `offlineSummary`, `derivedPreview`. The surface **builder/selector** that computes these from the stores (render-only; no recompute in UI). The flag.
- **Retains:** all old surface fields + the old builder path (shim) until W13.
- **Steps:** (1) add the optional fields + their types (`MeridianView`, `RateFactor`, etc.). (2) Implement the builder: derive `meridians[]` (unlock-gating, caps, capState, bottleneck=lowest capPct, isActive), `factors[]` from `computeMeridianRate`'s terms, `axes/baseStats` from Tiers 0/1, `derivedPreview` from `meridianDerivedTargets`, `alerts/status/...` from the stores. (3) Selectors are **narrow** (no whole-store subscriptions). (4) Shim: when flag off, the old fields still populate. (5) Unit-test the builder maps store state → surface correctly for several realms/states.
- **Non-goals:** rendering (W7).
- **Verify:** golden gate; surface-builder unit tests; old surface still valid (shim test).
- **Acceptance:** the surface exposes a render-only view sufficient to drive every region in Part 1 with **zero** gameplay logic in the consumer.
- **Fallback:** if the old surface can't coexist, version it (`TrainingHallSurfaceV2`) and have the page pick by flag.
- **Commit:** `feat(surface): TrainingHallSurfaceV1 additive extension + shim (W6)`

## W7 — The Tempering Court UI, 1:1 (the big wave)

- **Objective:** build the full Court UI from the artifact, region by region, reading the W6 surface, behind the flag — pixel-identical to `tempering-court.html`, real data, no dev bar.
- **Class:** additive screen enhancement (the new Court mounts behind the flag; the old Training Hall stays until W13).
- **Touchpoints:** new Court feature tree (Appendix K component map): `TemperingCourt` (stage + scale hook) → `Lintel`, `RegimensShelf` (+`RegimenCard`, `SealedSlip`), `Room` (+`Scene`, `Figure`+`MeridianChannel`, `Motes`, `Smoke`, `Alerts`, `StatusSeal`, `PracticeTempo`, `MeridianCodex`, `Forges`), `PathMeridiansPanel` (+`MeridianRow`/`SealedMeridianRow`), `ConstitutionPanel`, `IntensityBellows` (+`Detent`), `ForgeHeat`, `ThisPractice`, `Nav`, `ReturnModal`. All built on W1's `<Panel>`/helpers/`<defs>`.
- **Retains:** the old Training Hall page (flag-off path) + **the `training-hall-vfx-motes/-mote` testids** (carry them onto the new `Motes`).
- **Steps (region order = parity-loop order):**
  1. **Stage + scale** (§1.1): the `ResizeObserver` hook, the grid rows, the `::after` keyline. Screenshot the empty stage skeleton.
  2. **Lintel** (§1.5.1): bind realm pips, cult bar, chips, active/next. Loop.
  3. **Regimens shelf** (§1.5.2): `RegimenCard` per unlocked meridian (active=`.sel`+`TEMPERING`+`煉`), `SealedSlip` per sealed; wire the **click → select active meridian** (D2 action). Loop.
  4. **Room shell + scene + atmos + corners + scrim** (§1.5.3/§1.7). Loop per path (martial/earth/heaven).
  5. **Figure + meridian channel** (§1.6): port figure body verbatim; build the 7-node channel from `meridians[]` (sealed/unlocked/active/bottleneck/capped) + dantian. Loop across realms 1/4/7 to verify drip-unlock + sealed seals + active label.
  6. **Room overlays:** Alerts, StatusSeal, **PracticeTempo** (lens — factor rows == `computeMeridianRate` terms, ring gauge), **MeridianCodex** (eff chips from `derivedPreview`, comprehension bar, passive note), Forges. Loop.
  7. **PathMeridiansPanel** (§1.5.4) + **ConstitutionPanel** (§1.5.5). Loop.
  8. **IntensityBellows** (§1.5.6, wire to real intensity), **ForgeHeat** (§1.5.7), **ThisPractice** (§1.5.8). Loop.
  9. **Nav** (§1.5.9, wire start/cease to ActivityStore) + **ReturnModal** (§1.5.10). Loop.
  10. Remove any temptation to add the dev bar (§1.11). A debug overlay, if built, is flag-gated and off by default.
- **Non-goals:** changing the old page; motion polish (W9 finalizes VFX, but mount motes here with testids); a11y deep pass (W10); cutover (W13).
- **Verify:** golden gate; **the full Appendix-F screenshot matrix** captured for the new Court; `check:icons` clean; hex grep clean (only `<defs>`).
- **Acceptance (per region, Appendix H):** each region pixel-matches the artifact at 2048×1152 across the matrix states; **no layout shift** when toggling state (panel edges static); reduced-motion legible; **no dev bar**; testids present. The lens factor rows equal the engine terms (UI↔engine no drift).
- **Parity loop (MANDATORY, per region):** read the artifact region → implement → Playwright screenshot at 2048×1152 → read your screenshot → diff against artifact → fix geometry/color/font/placement → repeat **≥2× per region, ≥3–5× for the Room/figure/channel** (the flagship). Do not advance regions with an unaccepted diff.
- **Fallback:** if a region can't hit parity, keep the old region visible (flag) and iterate; never ship a half-matched region as default.
- **Commit:** `feat(court): Tempering Court UI 1:1 behind flag (W7)`

## W8 — Observatory / constellation / Astrolabe re-bind (preserve geometry)

- **Objective:** update the Status Observatory to the new model — the stat-meridian constellation and the **Spirit Root Astrolabe** now read **path meridians + tiers**, with **geometry preserved** (D8/D9).
- **Class:** additive screen enhancement (re-bind data; do not redraw).
- **Touchpoints:** the Observatory constellation reader + `StatusObservatorySurfaceV1` (recon #4); the **Astrolabe SVG geometry file is READ-ONLY** — only its data bindings change. Decommission old public "Dao Mandate/Omen/Proof/Source" labels per vocabulary policy.
- **Retains:** **all Astrolabe path/arc math** (protected); all Observatory test anchors; `forceLegacy`.
- **Steps:** (1) extend `StatusObservatorySurfaceV1` additively with the meridian/tier views (reuse W6 types). (2) Re-bind the **stat-meridian constellation** to the 7 Tier-2 path meridians (unlocked lit / sealed sealed-style / active+bottleneck/capped marks — mirror the Court channel's grammar so the two screens agree). (3) Re-bind the **Astrolabe** nodes to the per-meridian **aptitude grades** (root grade per meridian) **without touching geometry**; sealed meridians render sealed. (4) Surface Tier-0/1 in the Observatory's stat areas (Cultivation Axes + Mortal Foundation), replacing the old roster reads. (5) Swap decommissioned public labels to the concrete xianxia vocabulary (Cultivation Base, Bottleneck, Gate Readiness, etc.). (6) Keep `forceLegacy` working.
- **Non-goals:** redrawing the Astrolabe (forbidden); changing Observatory layout geometry; touching techniques.
- **Verify:** golden gate; **Observatory contract tests green**; Astrolabe geometry file shows **no diff** (grep); screenshot the Observatory in healthy/blocked/postFailure/prestige/contentCap states (the Observatory's own matrix) and confirm the constellation/Astrolabe now reflect meridians/roots.
- **Acceptance:** the Observatory reads the new model; the constellation & Astrolabe match the Court's meridian grammar; geometry untouched; old public labels gone from default UI; `forceLegacy` intact.
- **Parity loop:** screenshot Observatory states → confirm meridian/root data renders in the preserved geometry → fix bindings only → repeat.
- **Fallback:** if a node-count mismatch (Astrolabe slots ≠ 7), map available slots to meridians in unlock order and **flag** the remainder; never stretch/redraw geometry to fit.
- **Commit:** `feat(observatory): re-bind constellation + astrolabe to meridian model (W8)`

## W9 — VFX / motion parity

- **Objective:** finalize all motion to match the artifact, driven by the CSS custom props, narrow subscriptions, reduced-motion safe (§1.8/§1.9).
- **Class:** additive.
- **Touchpoints:** the Court motion layer; the `--th-fill-p/--th-qi-dur/--th-breath-dur/--th-heat` setters (from a **narrow vitals subscription**, not whole-store); mote mount (testids); keyframes (`breatheA/qiflow/mp/weakp/glowP/spinG/swayG/driftG/flame/heatShimK/smokeRiseK`).
- **Retains:** testids; reduced-motion mechanism.
- **Steps:** (1) wire the 4 CSS vars to real values (fill from progress, durations from mult, heat from fatigue) via a narrow selector that updates on tick without re-rendering the tree. (2) Port every keyframe exactly. (3) Mote count by status; re-mount only on status/path change. (4) Verify reduced-motion kills animation, drops motes, keeps static reads. (5) `frontend-design` review of motion feel vs artifact.
- **Non-goals:** new motion not in the artifact.
- **Verify:** golden gate; screenshot active vs reduced-motion; confirm no perf regression (no whole-store subscriptions; memoization in place).
- **Acceptance:** qi-flow speeds with tempo, dantian breathes, motes drift, forge shimmer ≥80, Tempo ring static — all matching the artifact; reduced-motion identical-legible.
- **Commit:** `feat(court): motion + vfx parity with vitals-driven vars (W9)`

## W10 — Accessibility

- **Objective:** complete a11y — roles/aria, focus management, reduced-motion, color-blind safety.
- **Class:** additive.
- **Touchpoints:** the Court tree; the ReturnModal (focus trap + restore); the regimen/detent buttons (roles/aria-pressed/labels); an `aria-live` announcer for state changes (started/ceased, capped, breakthrough-unlocked, blocked).
- **Steps:** (1) ensure every interactive (regimen card, detent, start/cease, nav, modal resume, alert dismiss) has role + accessible name + keyboard operation + visible focus. (2) **ReturnModal**: `role=dialog aria-modal=true` + focus trap + restore focus to the trigger on close. (3) `aria-live="polite"` region announcing meaningful state transitions. (4) Re-verify reduced-motion + color-blind (every state reads via shape+label, not color alone — audit the channel/chips/forge). (5) Run `design:accessibility-review`; fix findings.
- **Verify:** golden gate; accessibility-review report attached; keyboard walkthrough screenshot/notes.
- **Acceptance:** WCAG-reasonable: keyboard-complete, focus-trapped modal with restore, live announcements, no color-only/motion-only meaning, reduced-motion legible.
- **Commit:** `feat(court): accessibility — focus trap, aria-live, color-blind audit (W10)`

## W11 — Prestige Form Memory floor

- **Objective:** implement the Form-Memory floor + root re-roll on reincarnation (§2.11).
- **Class:** additive.
- **Touchpoints:** `PrestigeResetService` (recon); lifetime-per-meridian totals in save; the floor formula `floor((Σlifetime)^e)×m`; the root re-roll.
- **Retains:** existing prestige flow.
- **Steps:** (1) accumulate lifetime rating per meridian across resets. (2) On reset: ratings→0, then apply floor as starting rating per meridian; comprehension resets; **re-roll roots**. (3) The lens `form memory` row stays `1.00×` (floor is starting rating, not a rate mult) — match artifact wording. (4) Unit-test: after a prestige with prior investment, meridians start above 0; roots changed.
- **Verify:** golden gate; prestige unit tests.
- **Acceptance:** re-leveling is faster post-prestige via non-zero starting ratings; roots re-roll; no rate-mult double-count.
- **Commit:** `feat(prestige): meridian form-memory floor + root reroll (W11)`

## W12 — Balancing pass (real coefficients)

- **Objective:** replace every `‹tune W12›` constant with playtested values; keep structure fixed.
- **Class:** additive (constants/config only).
- **Touchpoints:** the balance constants: `perceptionMult` slope, `regimenMastery` slope, `pathAffinity`, `capFalloff` shape, comprehension floor/ramp, passive `0.15×` + per-fight cap, derived coefficients (Appendix B), Form-Memory `e`/`m`, Chaos variance (if D5 opts in). Centralize them in one balance module if not already.
- **Steps:** (1) centralize constants. (2) Tune against target pacing (one-variable-at-a-time idle feel; always a next unlock; ~60/40 idle/active). (3) Re-run the full suite + screenshot matrix (numbers change, layout must not). (4) Document the chosen values.
- **Verify:** golden gate; matrix re-shot (parity holds; only numbers differ).
- **Acceptance:** numbers feel right and are documented; no structural/layout change.
- **Commit:** `balance(training): tune three-treasures coefficients (W12)`

## W13 — Flag-gated cutover + dead-code removal + final regression

- **Objective:** flip the Court on by default, remove the old Training Hall + old surface fields **only now**, and run the full regression.
- **Class:** **cleanup-after-cutover-review** (the only wave permitted to delete).
- **Touchpoints:** the flag (`TEMPERING_COURT_PUBLIC_DEFAULT_ENABLED=true`); removal of the old Training Hall page/regions + the old `primary/secondary/foundation` surface fields + the shim + any dead old-roster code; the old Dao-Mandate public components (if fully replaced).
- **Steps:** (1) flip the flag; smoke every state. (2) Confirm the new Court is the default and the Observatory matches. (3) **Now** delete the old layers — each deletion justified by "replacement visible+wired+stable+screenshot-accepted." (4) Remove the shim. (5) Full regression: golden gate + the **entire** screenshot matrix (Court + Observatory) + a fresh-run manual pass. (6) `engineering:code-review` the deletions.
- **Non-goals:** any new feature; touching techniques.
- **Verify:** golden gate; full matrix; manual fresh-run; grep confirms no dangling refs to removed symbols.
- **Acceptance:** Court is default; old code gone with no dangling references; all tests green; matrix accepted; testids intact; techniques untouched throughout (final grep).
- **Fallback:** if anything regresses, flip the flag back (the old path still exists until this wave's deletions) and fix before deleting.
- **Commit:** `feat(court): cutover to Tempering Court + remove legacy training hall (W13)`

---

# APPENDICES

## APPENDIX A — The 21 meridians (canonical data spec for W2)

> This is the literal data the W2 content pack encodes. **Static fields** per meridian: `name, zi, exercise, room, unlockRealm (=R), trigger, derived[], pathEffect, trait, traitRank`. The **spirit root** is NOT static here — it is **rolled per cultivator at Life Start** (§2.3) and stored in save; the "ex-root" column is only the artifact's example roll for reference. `derived` weights: `↑` = contributes, `↑↑` = primary driver; tone `atk/def/util/—` maps to the codex chip class.

### A.1 — MARTIAL PATH (武 · offense · speed · killing) — signature R1, capstone R7
| R | Meridian | Exercise · Room | Combat trigger (passive ≈15%) | Feeds (Tier-3) | Path effect | Trait ◆@ | ex-root |
|---|---|---|---|---|---|---|---|
| 1 | Weapon Intent 兵意 | Shadow-Ring form drills · Shadow Ring | dealing weapon-skill damage | Physical Attack ↑↑(atk); Weapon technique power(util) | Empowers weapon arts | Counters cost 8% less stamina ◆7 | True |
| 2 | Flowing Step 流步 | Footwork laps · The Ring | dodging / repositioning | Speed ↑; Evasion ↑; Initiative(util) | Travel speed; escape chance | +10% gap-close ◆7 | Earthly |
| 3 | Battle Rhythm 战律 | Drum-rhythm sparring · Drum Court | landing consecutive hits | Attack Speed ↑; Combo scaling(atk); Qi/stamina efficiency(util) | Combo windows widen | +10% rhythm window ◆7 | True |
| 4 | Killing Intent 杀意 | Killing-intent meditation · The Post | opening strikes / executing weak foes | Crit Chance ↑↑(atk); First-strike dmg(atk); Suppression(util) | Intimidation; flee chance on weaker foes | Execute threshold +5% ◆7 | Heavenly |
| 5 | Sword Heart 剑心 | Sword-heart sitting · Quiet Edge | counters / parries | Crit Damage ↑↑(atk); Armor penetration(atk) | **Crits ignore a % of defense** | Counter dmg +15% ◆7 | True |
| 6 | Unbroken Momentum 不破势 | Thousand-Cuts endurance · War Yard | sustained offense (no idle turns) | Snowball dmg/action(atk); Stagger immunity | **Each attacking turn stacks damage** | Stacks last longer ◆7 | Earthly |
| 7 | Martial Dao · Asura 修罗道 | War-banner Dao comprehension · Asura Altar | high-realm kills | Global offense scalar(atk); Ultimate technique(util) | Path tribulation becomes a duel | Asura form ◆7 | Chaos |

### A.2 — EARTH PATH (地 · body · defense · endurance) — signature R1, capstone R7
| R | Meridian | Exercise · Room | Combat trigger (passive ≈15%) | Feeds (Tier-3) | Path effect | Trait ◆@ | ex-root |
|---|---|---|---|---|---|---|---|
| 1 | Body Temper 体锻 | Marrow-Furnace tempering · Marrow Furnace | taking & dealing physical blows | Max HP ↑↑(def); Body-cultivation attack(atk); Physical Defense(def) | Body-cultivation attack scaling | +12% body XP while strained ◆7 | True |
| 2 | Bone Forging 锻骨 | Stone-press stand · Stone Terrace | blocking / being hit | Physical Defense ↑↑(def); Knockback resist(def) | Weapon-block; structure | Fatigue accrues 6% slower ◆7 | Earthly |
| 3 | Marrow Essence 髓元 | Marrow-cleansing furnace · Cleansing Pit | enduring damage-over-time | HP Regen ↑↑(def); Vitality & qi capacity; Poison/illness resist(util) | Body stores qi; longevity | DoT taken −10% ◆7 | True |
| 4 | Root Depth 根深 | Deep-root meditation · Root Hollow | holding ground (not moving) | Anti-CC / stability ↑↑(def); Grounded qi-gather(util) | **Cannot be displaced while rooted** | Root regen + ◆7 | Heavenly |
| 5 | Iron Skin 金身 | Blade-rain tempering · Blade Rain | absorbing hits | Flat Damage Reduction(def); Reflect(def) | **Hits below a threshold deal 0** | Threshold + ◆7 | True |
| 6 | Mountain Stance 山岳 | Bear-the-Mountain stand · Mountain Dais | tanking big hits / taunting | Massive Defense(def); Convert Def→counter(atk) | Anchor allies; reflect a % of Def | Taunt radius + ◆7 | Earthly |
| 7 | Earth Dao · Sovereign 后土道 | Earth-Dao comprehension · Sovereign Seat | surviving lethal blows | Global def/HP scalar(def); Ultimate technique(util) | Body becomes a treasure | Sovereign form ◆7 | Chaos |

### A.3 — HEAVEN PATH (天 · perception · soul · control) — signature R1, capstone R7
| R | Meridian | Exercise · Room | Combat trigger (passive ≈15%) | Feeds (Tier-3) | Path effect | Trait ◆@ | ex-root |
|---|---|---|---|---|---|---|---|
| 1 | Spirit Sense 神识 | Star-Listening · Star-Listening Pavilion | landing precise / ranged hits | Accuracy ↑↑; Detection(util); Soul-attack base(atk) | See hidden; range | +10% insight from breakthroughs ◆7 | True |
| 2 | Mind Eye 心眼 | Empty-Mind sitting · Quiet Hall | dodging / perceiving | Evasion ↑↑; Crit/find weakness(atk) | Reveal weaknesses; anti-ambush | Foresight window + ◆7 | Earthly |
| 3 | Soul Clarity 魂明 | Soul-cleansing · Clarity Spring | resisting soul / mental attacks | Soul Defense ↑↑(def); Qi control & stability(util) | Cleanse debuffs; steady cast | Soul dmg taken −8% ◆7 | True |
| 4 | Dao Heart 道心 | Heart-of-Dao meditation · Heart Altar | composure under pressure | Tribulation Resist ↑↑(def); Qi efficiency(util); Immune fear/charm(util) | Unshakeable; cheaper techniques | Tribulation resist + ◆7 | Heavenly |
| 5 | Void Gaze 虚瞳 | Void-gazing · Void Window | landing soul / curse effects | Soul Attack ↑↑(atk); Armor-pen via weakness(atk); Debuff power(util) | See through stealth / illusion | Curse potency + ◆7 | True |
| 6 | Heavenly Mandate 天命 | Mandate meditation · Mandate Terrace | controlling / suppressing foes | Control Power ↑↑(util); Suppression aura(atk) | **Domain weakens enemies in range** | Domain radius + ◆7 | Earthly |
| 7 | Heaven Dao · Firmament 天道 | Heaven-Dao comprehension · Firmament Seat | high-realm soul kills | Global control/soul scalar(util); Ultimate technique(util) | Law-based devastation | Firmament form ◆7 | Chaos |

**Shared tiers (for the Constitution panel — read-only, owned by cultivation systems):**
- Tier 1 Cultivation Axes (7): Cultivation Base 修为 · Qi Pool 灵力 · Qi Purity 气纯 · Meridian Openness 经脉 · Spiritual Sense 神识 · Soul Strength 魂 · Dao Comprehension 道.
- Tier 0 Mortal Foundation (6): Physique 体 · Vitality 元 · Agility 敏 · Perception 悟 · Willpower 志 · Luck 运 (fixed talent, shown as a grade e.g. "慧 · Auspicious").

## APPENDIX B — Tier-3 derived-stat formulas (structure fixed; coefficients `‹tune W12›`)

General: `derived = (Σ sources(value×k) + base) × realmScalar × (1 + Σ pathMult) × gearMult`. Sources by derived stat (k's tuned in W12):

| Derived stat | Primary sources (Tier 2 bold) | Notes |
|---|---|---|
| Max HP | Vitality, Physique, **Body Temper**, **Marrow Essence** | Earth path scales hard |
| HP Regen | **Marrow Essence**, Vitality | DoT-resist trait reduces incoming DoT |
| Physical Attack | Physique, **Weapon Intent**, **Body Temper**(body-attack) | |
| Physical Defense | **Bone Forging**, **Iron Skin**, Physique | |
| Flat DR / Reflect / Threshold | **Iron Skin**, **Mountain Stance** | Iron Skin: hits < threshold → 0 |
| Qi Pool / Qi Regen / Qi capacity | Qi Pool(T1), **Marrow Essence**, Qi Purity | |
| Speed / Initiative | Agility, **Flowing Step** | |
| Attack Speed | **Battle Rhythm**, Agility | combo scaling |
| Accuracy | **Spirit Sense**, Perception | |
| Evasion | **Mind Eye**, **Flowing Step**, Agility | |
| Crit % | **Killing Intent**, **Mind Eye**(find weakness), Perception | |
| Crit Damage / Armor Pen | **Sword Heart**(ignore %DR), **Void Gaze**(pen via weakness) | |
| Soul Attack | **Void Gaze**, Soul Strength, Spiritual Sense | |
| Soul Defense | **Soul Clarity**, Soul Strength | |
| Tribulation Resist | **Dao Heart**, Willpower, Dao Comprehension | |
| Control Power | **Heavenly Mandate**, Soul Strength | domain aura |
| Suppression | realm-gap(your realm − target) + **Killing Intent** + **Heavenly Mandate** | |
| Stagger/CC resist · anti-displacement | **Root Depth**, **Mountain Stance**, **Unbroken Momentum** | |

**Signature conditional effects (implement as data/flags the existing resolver reads — NEVER edit techniques):**
- Sword Heart: crit damage ignores X% of target DR.
- Iron Skin: incoming hits below `threshold` deal 0.
- Mountain Stance: reflect Y% of Defense; taunt.
- Unbroken Momentum: each consecutive attacking turn adds a stacking damage bonus; stagger immunity.
- Heavenly Mandate: aura lowering enemies' stats within range (a derived "suppression field" value).
- Root Depth: immune to displacement while "rooted".
- Capstones (Asura/Sovereign/Firmament): global path scalar + an ultimate flag.

---

## APPENDIX C — The contract-test rewrite checklist (W3 gate)

> **Premise.** 506 contract tests currently pass. The Three Treasures rework deliberately changes the *mechanical shape* of training, so a subset of these tests **must fail and be rewritten** — they assert the old tri-stat model. This is sanctioned breakage, not regression. **Every other test must stay green.** Do not delete tests to make the suite pass; **rewrite** them so coverage does not drop. The headline number may move (e.g. 506 → ~520) as new invariants are added; it must never *drop*.
>
> **Why jsdom can't help here.** These are *mechanics & data-shape* tests (numbers, array lengths, object keys), not layout tests — jsdom runs them fine. The *visual* parity of the Court is **not** covered by any of these; that is Appendix F's job. Keep the two gates mentally separate: contracts prove the engine is correct; Playwright proves the Court looks right.

### C.0 — Triage procedure (do this first, in Plan Mode)

1. Run `npm run test:contracts` against the **current** tree and capture the full green baseline (count + per-file breakdown) into the recon report. This is the "before" snapshot.
2. After W2 (data model) and the first half of W3 (engine), run again. Sort failures into the five categories below. **Any failure that does not map to one of these five categories is an unplanned regression — stop and investigate; do not rewrite it away.**
3. For each planned failure, rewrite the assertion to the new model, preserving the test's *intent* (what behaviour it was protecting). Add the new-coverage tests in C.6 in the same wave.
4. Re-run until green. The "after" snapshot (count + breakdown) goes in the W3 evidence report (Appendix G).

### C.1 — Category 1: tri-stat XP split → single-meridian advance

**What these tests assert (old):** that one tick of training distributes XP across a *primary / secondary / foundation* triple in fixed ratios (commonly `1.0 / 0.45 / 0.12` or similar), and that all three stat values move on every tick.

**Why they break:** training now advances **exactly one** meridian — the active one. There is no secondary/foundation split inside the Court. (The artifact's THIS PRACTICE panel shows a *single* meridian line plus mastery/heat/passive — never a tri-stat ledger.)

**Rewrite to:**
- One tick → `advanceMeridian(activeMeridianId, amount, 'court')` mutates **only** that meridian's rating.
- Assert the other (unlocked) meridians are **unchanged** by a Court tick.
- Assert `amount` equals `computeMeridianRate(...)` for that meridian (the rate formula in §2.5), clamped at `2.25 × base`.
- Keep any test that asserted "training costs no resources" — that invariant is **unchanged** (see C.7).

**Anchor to preserve:** if the old tests referenced a `distributeXp`/`applyTriStat` helper by name, keep a same-named shim only if other non-test code still calls it; otherwise delete the helper and its tests together and replace with `advanceMeridian` tests. Record the decision in the report.

### C.2 — Category 2: fixed-18-stat roster → tiered model (6 + 7 + 7-per-path)

**What these tests assert (old):** that the stat registry contains exactly 18 entries, or iterate a hardcoded list of 18 stat ids, or assert `Object.keys(stats).length === 18`.

**Why they break:** the model is now four tiers — **Tier 0** Mortal Foundation (6 shared), **Tier 1** Cultivation Axes (7 shared), **Tier 2** Path Meridians (7 **per active path**, drip-revealed), **Tier 3** Derived (combat-only, computed). The shared count alone is 13; with one path's 7 meridians that is 20 "owned" stats, and Tier 3 is a separate computed surface.

**Rewrite to:**
- Assert Tier 0 has 6 ids and Tier 1 has 7 ids (shared, stable from Qi Condensation).
- Assert each path defines **exactly 7** meridians (`PATHS[p].meridians.length === 7` for `p ∈ {martial, earth, heaven}`).
- Assert Tier 3 derived stats are produced by the resolver and are **not** writable by training (see C.6 derived test).
- Replace the magic number `18` everywhere it appears in tests with the structural assertions above. **Grep the whole test tree for the literal `18`** and audit each hit (some may be unrelated, e.g. a cap value — do not blindly replace).

### C.3 — Category 3: surface fields `primary/secondary/foundation` → `activeMeridian` + `meridians[]` + tiers

**What these tests assert (old):** the render-only surface contract `TrainingHallSurfaceV1` exposes `primary`, `secondary`, `foundation` objects (each `{name, rating, cap, capPct, capState, isBottleneck}`), and the UI reads those three.

**Why they break:** the Court now renders **one active meridian** plus a **list** of path meridians plus the two shared tiers. The surface must expose that shape (see Appendix K data contract).

**Rewrite to** assert the **new** surface shape (additive V1 extension or V2 — per decision D3). At minimum the surface must expose, all **render-only / precomputed** (never recomputed in the component):
- `activeMeridian: { id, zi, name, exercise, room, trigger, rating, cap, capPct, capState, root, mastery:{rank,nextMilestone}, traitRank, trait, comp, eff:[{tone,label}], path, isBottleneck }`
- `meridians: MeridianView[]` — all 7 for the active path, each with `{ id, zi, name, unlocked, unlockRealm, rating, cap, capPct, capState, isActive, isBottleneck, root, … }`
- `tiers: { axes: StatView[7], foundation: StatView[6] }` (Tier 1 + Tier 0), each `{ id, zi, name, value | grade }` (Luck carries a fixed `grade`, not a numeric `value`).
- `realm: { index1to7, name, cap, unlockedCount, nextUnlock|null, cultPct }`
- `rate: { mult, clampMax:2.25, factors: Factor[] }` where each `Factor = { key, value, dir:'up'|'down'|'flat'|'bad', note? }` and the **factor list/order matches the Practice Tempo lens** (§2.5).
- `heat: { value, tier, damp }`, `intensity: { id, label, mult, fpm }`, `status`, `alerts: Alert[]`, `offlineSummary | null`.

**Anchor to preserve:** the `forceLegacy` fallback path and the *render-only* guarantee (the surface is assembled in the store/selector; the component never recomputes gameplay). Keep the test that asserts "surface is pure / deterministic given state" — update only its field names.

### C.4 — Category 4: 6-length realm-cap array → 7

**What these tests assert (old):** `CAPS.length === 6`, or index `CAPS[5]` as the last realm, or assert the cap ladder equals `[40,60,80,100,125,150]`.

**Why they break:** R7 (Immortal Ascension) is the one sanctioned constant addition. New ladder: `[40, 60, 80, 100, 125, 150, 170]` (length 7).

**Rewrite to:**
- `CAPS.length === 7`; `CAPS[6] === 170`; full-array equality to the 7-tuple.
- Any test iterating realms `0..5` becomes `0..6`.
- Per-meridian cap is `round(CAPS[realmIndex] × root.capMult)` — assert this composition (a Heavenly-root meridian at R7 caps higher than a Mortal-root one). **This is the only constant the rework changes**; call it out explicitly in the report so reviewers can verify intent.

### C.5 — Category 5: stat-identity assertions → meridian ids

**What these tests assert (old):** specific stat names/ids from the 18-roster (e.g. an id like `body` or `qi` mapped to a fixed display string), or that a given path's "primary stat" is a named stat.

**Why they break:** identities are now meridian ids. Each path's **signature** meridian is its R1 unlock; its **capstone** is the R7 Dao. (Martial: `weaponIntent` → `martialDao`; Earth: `boneForging` → `earthDao` *(per Appendix A naming)*; Heaven: `spiritSense` → `heavenDao`.)

**Rewrite to:**
- Assert each path's `meridians[0]` is its signature and `meridians[6]` is its capstone Dao.
- Assert display strings come from the content pack (Appendix A), not hardcoded in tests — tests should import the pack and assert structure (ids present, ordering, `unlockRealm === index+1`), not literal English copy (copy is allowed to change; **ids are the stable contract**).
- Keep any localization/字 (hanzi) presence test — update to the new `zi` fields.

### C.6 — NEW coverage to add in W3 (do not skip — this is the point of the rework)

| # | New test | Asserts | Notes |
|---|---|---|---|
| N1 | one-meridian advance | a Court tick moves only `activeMeridian`; siblings unchanged | mirrors C.1 |
| N2 | unlock cadence | `meridians[i].unlocked === (i < realmIndex1to7)`; `unlockRealm === i+1` | drip-unlock invariant |
| N3 | signature & capstone | `meridians[0]` is signature, `meridians[6]` is Dao, for all 3 paths | identity |
| N4 | cap composition | `cap === round(CAPS[realmIdx] × root.capMult)`; Heavenly > Mortal at same realm | C.4 |
| N5 | cap clamp | rating never exceeds cap; setting rating > cap is clamped | boundary |
| N6 | overflow → mastery | once `capState==='capped'`, further advance routes the overflow into per-exercise mastery, **not** rating | the artifact's "overflow → mastery" |
| N7 | comprehension warm-up | freshly-unlocked meridian has `comp` at the floor (~0.5), ramps toward 1 with Perception; rate multiplied by `comp` while `comp<1` | §2.7 |
| N8 | aptitude rate mult | `rate` scales by `root.rateMult` (Heavenly fastest, Mortal slowest) | §2.5 spirit-root factor |
| N9 | rate-formula identity | `computeMeridianRate` equals the product of the documented factors, clamped at 2.25×base; **each factor present in the returned `factors[]` matches the lens** | §2.5 ↔ lens parity |
| N10 | passive combat | a combat trigger calls `advanceMeridian(id, ~0.15×courtRate, 'combat')`; **online-only**, **per-fight-capped**, routed through the **same** `advanceMeridian` | §2.9 |
| N11 | derived read-only | Tier-3 stats are recomputed from Tiers 0–2; writing to a derived stat is impossible / ignored; **techniques untouched** | §2.10, Appendix B |
| N12 | fatigue damp preserved | `damp === max(0.4, min(1, 1 − max(0, F−40)×0.009))`; forge-heat tiers at 35/60/80 unchanged | §2.12 — regression guard |
| N13 | intensity table preserved | Quiet/Steady/Harsh/Limit mults & fpm unchanged (0.70/1.00/1.35/1.75 ; 0.04/0.14/0.35/0.75) | §2.12 — regression guard |
| N14 | offline downgrade | offline run auto-downgrades intensity at heat ≥ 80; 12h cap; summary reports a **single** meridian | §2.12, return modal |
| N15 | prestige form-memory floor | post-prestige a meridian starts at `floor((Σ lifetime)^e) × m`, `e∈[0.5,0.8]`; never below 0; never above cap | §2.11 |
| N16 | no-resource-cost (UNCHANGED) | a Court tick consumes **no** currencies/items; still test-enforced | C.7 |

### C.7 — Invariants that must stay green untouched

- **No-resource-cost rule.** Training spends nothing. This test does **not** change shape; if it goes red, you broke it — fix the engine, not the test.
- **Max-tick clamp 2.25.** Still the ceiling on the rate multiplier.
- **Offline 12h cap + auto-downgrade ≥80.** Preserved.
- **Techniques.** Any technique-resolution test must remain **byte-identical green**. If a technique test changes at all, you touched techniques — revert. Derived stats feed the *existing* resolver as new inputs; the resolver code does not change.

### C.8 — Rules of engagement for the rewrite

1. **Rewrite, never delete-to-green.** Coverage count must not drop.
2. **One concept per test.** If an old test bundled "18 stats AND tri-split", split it into N2-style structural + N1-style behavioural tests.
3. **Import the content pack; don't hardcode copy.** Ids are contract; English/字 copy is not.
4. **Map old→new in the report.** A short table: *old test name/file → new test(s) → category*. Reviewers use this to confirm nothing was silently dropped.
5. **Run the full suite, not just the touched files.** Catches collateral.


---

## APPENDIX D — Token map (artifact `:root` → `paperInkTokens.scss`)

> **Law:** zero raw hex in shipped `.tsx`/`.scss`. Every colour in the Court component tree resolves to a CSS custom property from `paperInkTokens.scss`. The **only** place literal hex is allowed is inside the shared SVG `<defs>` block (gradients/filters) and inside sprite assets — see the hex-allowed zone at the end of this appendix.
>
> **Method (W1).** The repo already contains nearly this entire palette with **byte-identical values** (confirm in recon). Build the map below, confirm each existing token's value matches the artifact, and **add the three missing tokens**. Then the Court's SCSS references tokens only; the artifact's inline `:root` block is **not** copied into the app — it is replaced by token references.

### D.1 — Paper / ink

| Artifact var | Value | Repo token (`--paper-*` namespace) | Status |
|---|---|---|---|
| `--paper` | `#f3ead7` | `--paper-base` | confirm exists |
| `--paper-warm` | `#efe3c9` | `--paper-warm` | confirm |
| `--paper-deep` | `#e7d9ba` | `--paper-deep` | confirm |
| `--paper-shade` | `#d9c79e` | `--paper-shade` | confirm |
| `--ink` | `#1f1a17` | `--paper-ink` | confirm |
| `--ink-70` | `rgba(31,26,23,.70)` | `--paper-ink-70` | confirm |
| `--ink-45` | `rgba(31,26,23,.45)` | `--paper-ink-45` | confirm |
| `--ink-25` | `rgba(31,26,23,.25)` | `--paper-ink-25` | confirm |
| `--ink-12` | `rgba(31,26,23,.12)` | `--paper-ink-12` | confirm |

### D.2 — Jade (safe / active / open)

| Artifact var | Value | Repo token | Status |
|---|---|---|---|
| `--jade` | `#4e6b5e` | `--paper-jade` | confirm |
| `--jade-deep` | `#0f6f5a` | `--paper-jade-deep` | **ADD** ① |
| `--jade-ink` | `#2f4a40` | `--paper-jade-ink` | confirm |

### D.3 — Gold (caution / near-cap)

| Artifact var | Value | Repo token | Status |
|---|---|---|---|
| `--gold` | `#a2712a` | `--paper-gold` | confirm |
| `--gold-bright` | `#b2832d` | `--paper-gold-bright` | **ADD** ② |
| `--gold-pale` | `#d9bd80` | `--paper-gold-pale` | confirm |
| `--gold-deep` | `#84591b` | `--paper-gold-deep` | confirm |
| `--bronze` | `#7a5b26` | `--paper-bronze` | confirm |

### D.4 — Cinnabar (danger / bottleneck / blocked)

| Artifact var | Value | Repo token | Status |
|---|---|---|---|
| `--cinnabar` | `#8b3028` | `--paper-stamp` | confirm |
| `--cinnabar-bright` | `#a94835` | `--paper-stamp-bright` | **ADD** ③ |
| `--cinn-deep` | `#6e241e` | `--paper-stamp-deep` | confirm |

### D.5 — Element accents (Tier-affinity palette — only if D5/element layer is enabled; otherwise add-but-unused is fine)

| Artifact var | Value | Repo token | Status |
|---|---|---|---|
| `--el-wood` | `#2d7844` | `--paper-el-wood` | add if missing |
| `--el-fire` | `#a44731` | `--paper-el-fire` | add if missing |
| `--el-earth` | `#8d642d` | `--paper-el-earth` | add if missing |
| `--el-metal` | `#69717c` | `--paper-el-metal` | add if missing |
| `--el-water` | `#2a668d` | `--paper-el-water` | add if missing |

> Note: `--el-metal` (#69717c) and `--el-water` (#2a668d) are slate/blue **element-identity** swatches, **not** UI-state colours. They are permitted **only** as elemental affinity accents (e.g. a small element glyph), never to encode safe/caution/danger state. State stays jade/gold/cinnabar. If the element layer is deferred (D4), you may still add the tokens but must not reference them in state logic.

### D.6 — Type

| Artifact var | Value | Repo token | Status |
|---|---|---|---|
| `--serif` | `Georgia, "Songti SC", "Noto Serif SC", serif` | `--paper-serif` | confirm — this is the Court body face |
| `--kai` | `"Kaiti SC", "STKaiti", "KaiTi", "Songti SC", serif` | `--paper-kai` | confirm — this is the seal/字 brush face |

> **Font parity is part of 1·to·1.** The Court's two faces are the serif (titles, body, numerals) and the kai/brush (wax-seal glyphs, 字 labels, watermarks). Both must resolve to the repo tokens above. If the repo's serif/kai tokens differ from the artifact's stacks, **align the repo tokens to the artifact stacks** (the artifact is the pixel SoT) — but confirm the brush face renders the hanzi glyphs on target platforms before locking (fallback to `"Songti SC"` is already in the stack).

### D.7 — The three tokens to ADD (exact SCSS to write in W1)

```scss
// paperInkTokens.scss — additions for The Tempering Court (Three Treasures)
:root {
  --paper-jade-deep:   #0f6f5a; // ① open-state meridian / "Begin Tempering" jade — deepest jade
  --paper-gold-bright: #b2832d; // ② near-cap / mastery accent — brightest gold-leaf
  --paper-stamp-bright:#a94835; // ③ active danger seal / bottleneck flare — brightest cinnabar
}
```

These three are the **only** genuinely-absent tokens (the rest already exist with matching values — verify, don't assume). Add nothing else to the global token file for the Court; per-component one-offs are forbidden by the tokens-only law.

### D.8 — Hex-allowed zone (the single exception)

Literal hex is permitted **only** inside the shared SVG `<defs>` block and sprite assets, because SVG gradient stops and filter primitives cannot reference CSS custom properties reliably across the render targets. The artifact's `<defs>` (Part 1.10) defines: `grainF, glowJ, qiAura, emberCore, qiCore, jadeRad, goldRad, cinnDisc, meridP_martial, meridP_earth, meridP_heaven, starHalo, soft` plus the per-path scenery gradients (`bannerCloth, plank, steelG, furnaceFire, forgeGlow, lanternG, moonG, mistG, goldG, goldBrushG, brushRough, meridS_c`). Port these **verbatim** — same ids, same stops, same hex. Outside `<defs>`/sprites, **any** literal hex in `.tsx`/`.scss` is a lint failure (`check:icons`/style-lint must enforce this; if it does not yet cover the Court paths, extend it in W1).


---

## APPENDIX E — File manifest (per wave)

> All paths are **hypotheses** prefixed `‹recon:…›` until W0 confirms them against the real tree. Project memory suggests the roots below; confirm or correct each in the recon report, then treat this table as the build's source of truth. **Additive/preserve-first:** prefer new files + extension points over rewrites; never delete a file before W13 cutover.

### E.1 — Legend
`NEW` = create · `EDIT` = modify existing · `EXT` = additive extension (new export/field, old path intact) · `TEST` = test file · `DEL@W13` = remove only at cutover.

### E.2 — Manifest

| Wave | Path (‹recon›) | Action | Purpose |
|---|---|---|---|
| W1 | `‹recon:src/styles/paperInkTokens.scss›` | EDIT | add the 3 tokens (Appendix D.7); confirm the rest |
| W1 | `‹recon:src/ui/paper/Panel.tsx›` + `.scss` | EXT | the 10-layer panel material (parchment, vignette, grain, gold double-frame, corner brackets, jade banner, cinnabar tag, watermark) as a reusable primitive |
| W1 | `‹recon:src/ui/paper/defs/CourtDefs.tsx›` | NEW | the shared SVG `<defs>` (Part 1.10) — hex-allowed zone |
| W1 | `‹recon:src/ui/paper/seals.ts›` | NEW/EXT | `waxSeal`, `medallion`, `cornerURI`, `flameSVG`, `arc`, `PT` helpers (Part 1.4) |
| W1 | `‹recon:src/ui/paper/__tests__/panel.contract.test.ts›` | TEST | panel renders all layers; tokens-only (no literal hex) |
| W2 | `‹recon:src/content/paths/martial.ts›` | NEW | 7 Martial meridians (Appendix A) |
| W2 | `‹recon:src/content/paths/earth.ts›` | NEW | 7 Earth meridians (Appendix A) |
| W2 | `‹recon:src/content/paths/heaven.ts›` | NEW | 7 Heaven meridians (Appendix A) |
| W2 | `‹recon:src/content/paths/index.ts›` | NEW | `PATHS` map + `MeridianDef` type + `ROOTS` map + `CAPS=[40,60,80,100,125,150,170]` |
| W2 | `‹recon:src/systems/stats/tiers.ts›` | NEW | Tier 0/1 shared registries (6 + 7) |
| W2 | `‹recon:src/content/__tests__/pack.contract.test.ts›` | TEST | N2/N3 structure (7 per path, signature/capstone, `unlockRealm===i+1`) |
| W3 | `‹recon:src/systems/training/computeMeridianRate.ts›` | NEW | the rate formula (§2.5), returns `{mult, factors[]}` |
| W3 | `‹recon:src/systems/training/advanceMeridian.ts›` | NEW | the **single** mutation entry — `(id, amount, source)`; cap clamp; overflow→mastery |
| W3 | `‹recon:src/systems/training/trainingTick.ts›` | EDIT | one tick → advance active meridian only (was tri-split) |
| W3 | `‹recon:src/systems/training/comprehension.ts›` | NEW | warm-up floor + ramp (§2.7) |
| W3 | `‹recon:src/systems/training/mastery.ts›` | EXT | 10-notch, realm-uncapped, trait@rank; overflow sink |
| W3 | `‹recon:src/stores/activityStore.ts›` | EDIT | hold `activePath`, `activeMeridianId`, per-meridian ratings; selectors |
| W3 | `‹recon:test/contracts/*training*.test.ts›` | TEST | **rewrite** C.1–C.5; **add** C.6 N1–N16 |
| W4 | `‹recon:src/systems/combat/derivedStats.ts›` | NEW | Tier-3 resolver reading Tiers 0–2 (Appendix B). **Techniques untouched** |
| W4 | `‹recon:src/systems/combat/derived.contract.test.ts›` | TEST | N11 read-only; per-stat source coverage |
| W5 | `‹recon:src/systems/combat/onCombatTrigger.ts›` | EXT | hook → `advanceMeridian(id, ~0.15×rate, 'combat')`, online-only, per-fight cap (§2.9) |
| W5 | `‹recon:src/systems/combat/passiveTrain.contract.test.ts›` | TEST | N10 |
| W6 | `‹recon:src/systems/ui/trainingHall/trainingHallSurface.ts›` | EXT | assemble the new surface shape (Appendix K data contract); render-only |
| W6 | `‹recon:src/systems/ui/trainingHall/types.ts›` | EXT | `TrainingHallSurfaceV1`(+fields) or `V2`; `MeridianView`, `Factor`, `Alert`, `StatView` |
| W6 | `‹recon:…/surface.contract.test.ts›` | TEST | **rewrite** C.3; purity/determinism |
| W7 | `‹recon:src/ui/court/TemperingCourt.tsx›` + `.scss` | NEW | the Court shell + grid (Part 1.1) |
| W7 | `‹recon:src/ui/court/regions/*.tsx›` | NEW | Lintel, RegimensShelf, Room (+overlays), PathMeridiansPanel, ConstitutionPanel, IntensityBellows, ForgeHeat, ThisPractice, Nav, ReturnModal (Appendix K) |
| W7 | `‹recon:src/ui/court/figure/Figure.tsx›` + `MeridianChannel.tsx` | NEW | figure + 7-node channel (Part 1.6) — **PROTECTED geometry** |
| W7 | `‹recon:src/ui/court/scenery/*.tsx›` | NEW | per-path scenery (Part 1.7) |
| W8 | `‹recon:src/systems/ui/status/statusObservatoryTypes.ts›` | EXT | re-bind constellation/Astrolabe to Tier-2 meridians (Appendix Observatory below) |
| W8 | `‹recon:src/ui/observatory/*` | EDIT | re-bind data; **Astrolabe SVG geometry PROTECTED — re-point data only** |
| W8 | `‹recon:…/observatory.contract.test.ts›` | TEST | constellation reads Tier-2; geometry node count unchanged |
| W9 | `‹recon:src/ui/court/motion/*` | NEW/EXT | the 4 CSS custom props + keyframes (Part 1.8); vitals-driven |
| W10 | `‹recon:src/ui/court/a11y/*` | EXT | focus-trap (ReturnModal + drawers), aria-live announcer, roving tab order, reduced-motion + colour-blind re-verify (Part 1.9) |
| W11 | `‹recon:src/systems/prestige/formMemory.ts›` | EXT | Form-Memory floor (§2.11) |
| W11 | `‹recon:…/formMemory.contract.test.ts›` | TEST | N15 |
| W12 | `‹recon:src/content/paths/*` + balance consts | EDIT | replace placeholder coefficients with tuned reals (§2.5, Appendix B) |
| W13 | `‹recon:src/featureFlags.ts›` | EDIT | flag default → new Court; keep old behind flag |
| W13 | old TrainingHall component + tri-stat helpers | DEL@W13 | remove **only after** all states screenshot-accepted |

### E.3 — Files that must NOT appear in any diff
- Any technique definition/resolver file. (If git shows one changed, revert — see §0.3.)
- The Spirit Root Astrolabe **geometry** source (only its *data binding* may change — W8).
- Engine constants other than the sanctioned `CAPS` 6→7 extension.


---

## APPENDIX F — Playwright screenshot matrix (the visual gate)

> **Why this exists.** jsdom has no layout engine — 506 green contracts prove the engine, **zero** of them prove the Court looks right. The **only** parity gate is pixel comparison of the rendered React Court against the artifact reference renders. This matrix is mandatory for W7 acceptance and re-run at W8/W9/W10.

### F.1 — Harness setup (match the reference exactly)
- **Viewport `2048 × 1152`**, `deviceScaleFactor: 1`. (The artifact stage is authored at 2048×1152 and scaled via the ResizeObserver hook; capture at native design size so geometry is 1:1.)
- **Animations disabled** for stills: `await page.emulateMedia({ reducedMotion: 'reduce' })` *for the deterministic stills*, **and** a separate non-reduced pass for the motion states (S10 reduced-motion is itself a state — capture it under reduced; capture the heat-shimmer/qi-flow states under non-reduced but with a fixed RNG seed / paused timeline so frames are stable).
- **Deterministic data.** Drive the Court from a **fixture store state**, not live RNG. Seed roots, ratings, realm, fatigue, intensity, status explicitly per shot (the artifact's dev bar is the reference for *which knobs*; in the app these are fixture fields, never shipped UI — see §1.11 / D10).
- **Fonts loaded.** `await page.evaluate(() => document.fonts.ready)` before every shot, or the serif/kai faces FOUT will fail the diff.
- **Mask the noise.** The `feTurbulence` grain and mote RNG are non-deterministic; either seed them or apply a Playwright **mask** over `.grain`/`.fx-motes` in the diff so they don't cause false negatives. Geometry, type, colour, and layout must match; per-frame turbulence need not.

### F.2 — The state matrix (13 Court shots — mirrors the reference renders)

For each row, set the fixture to the listed state, wait for fonts + a paint, screenshot, and run the per-shot assertions. The **reference** column is the artifact render to diff against.

| # | Shot id | Fixture state (store) | Reference | Must-verify (beyond pixel diff) |
|---|---|---|---|---|
| S1 | `01_martial_R2` | path=martial, realm=2, active=idx1, status=active, F=54, intensity=steady | `shots2/01_martial_R2.png` | 2 unlocked + 5 sealed; active carries TEMPERING seal; single forges line; lens shows 10 factors |
| S2 | `02_earth_R3` | path=earth, realm=3, active=idx2 | `shots2/02_earth_R3.png` | Earth scenery (forge); 3 unlocked; ember core on figure |
| S3 | `03_heaven_R4` | path=heaven, realm=4, active=idx3 | `shots2/03_heaven_R4.png` | Heaven night/star scenery; 4 unlocked; **comprehension ramp** visible on newest meridian; codex shows comp bar |
| S4 | `04_martial_R1_signature` | path=martial, realm=1, active=idx0 | `shots2/04_martial_R1_signature.png` | **1 unlocked + 6 sealed** everywhere (shelf, right panel, channel); `Next:` shows R2 unlock |
| S5 | `05_heaven_R6` | path=heaven, realm=6, active=idx5 | `shots2/05_heaven_R6.png` | 6 unlocked, 1 sealed (capstone) |
| S6 | `06_earth_R7_all` | path=earth, realm=7, active=idx0 | `shots2/06_earth_R7_all.png` | **all 7 unlocked**, none sealed; lintel "All meridians revealed"; cap=170×root |
| S7 | `07_idle` | path=martial, realm=3, active=idx1, status=idle | `shots2/07_idle.png` | "Begin Tempering" enabled; "Ready to Temper" seal; no qi-flow |
| S8 | `08_blocked_combat` | status=blocked_by_combat | `shots2/08_blocked_combat.png` | red scrim; "Court Closed · Combat" seal; THIS PRACTICE paused; start disabled w/ reason |
| S9 | `09_overworked` | status=active, F=88, intensity=limit | `shots2/09_overworked.png` | heat ≥80 shimmer; "⤓ practice eases"; forge-heat downgrade line; damp ≈0.4 |
| S10 | `10_reduced_motion` | reduced-motion ON, F=64 | `shots2/10_reduced_motion.png` | **static** (no anims); "stable marks" alert; everything legible; lens ring static |
| S11 | `11_capped` | realm=4, active=idx0, meridian rating==cap | `shots2/11_capped.png` | 滿 on node + panel; "overflow → mastery" in label/forges/practice; cap-falloff crushes mult (~1.06×) |
| S12 | `12_return` | offlineSummary present (single meridian) | `shots2/12_return.png` | modal: tempered **one** meridian; combat-passive line; "Limit eased N times"; 歸 seal; focus trapped |
| S13 | `13_no_path` | status=no_path | `shots2/13_no_path.png` | "No Path" seal; codex hidden; "Choose a path at Life Start"; no crash |

### F.3 — Observatory / constellation shots (W8)

| # | Shot id | Fixture | Must-verify |
|---|---|---|---|
| O1 | `obs_martial_R4` | path=martial, realm=4 | constellation nodes = **Tier-2 meridians** (not old 18 stats); sealed meridians shown sealed; Astrolabe **geometry identical** to pre-rework (node count/positions unchanged), data re-pointed |
| O2 | `obs_heaven_R7` | path=heaven, realm=7 | all 7 meridians lit; capstone present; vitals ribbon reads derived stats |
| O3 | `obs_reduced_motion` | reduced-motion ON | static; legible; colour-blind-safe (state via shape+label, not colour alone) |

### F.4 — The parity loop (per region, ≥2× each; ≥3–5× for Room + figure)

```
read reference PNG  →  implement/adjust region  →  Playwright screenshot at 2048×1152
   →  read own screenshot  →  diff (geometry/type/colour/placement)  →  fix  →  repeat
```
- **Minimum two loops per region.** The Room and the figure+channel are the flagship; budget **three to five** loops each.
- A region is **accepted** only when its reference and app renders are pixel-indistinguishable except inside masked grain/mote zones.
- Capture the accepted pair (reference + app) into the evidence report (Appendix G). Do **not** mark W7 complete until **all 13** Court states + **all 3** Observatory states are accepted.

### F.5 — Diff tooling
- Use Playwright's `toHaveScreenshot()` with a small `maxDiffPixelRatio` (start ~0.01) **outside** masked zones, or an external pixel-diff (e.g. `pixelmatch`) with the grain/mote masks applied. Store baselines under `‹recon:tests/visual/court/__screenshots__/›`. Tune the threshold so seeded grain doesn't trip it but a 1px layout shift does.


---

## APPENDIX G — Evidence-report templates (one per wave)

> Every wave ends with a filled report committed alongside the code (or pasted into the PR). No report → wave not done. The report is how a reviewer (or a future you) verifies the wave without re-deriving it. Keep it terse and factual: commands, outputs, screenshots, deltas.

### G.1 — Standard wave report (W1–W6, W9–W12)

```
## Wave <N> — <title> — EVIDENCE

### Scope delivered
- <bullet: what changed, files touched (link Appendix E rows)>

### Recon deltas (if any path/line differed from the packet's ‹recon:…› guess)
- packet said: <path>  →  actual: <path>   (reason)

### Commands & output
$ npm run typecheck
<tail of output — must be clean>
$ npm run check:icons        # tokens-only / no literal hex
<clean>
$ npm run validate:content   # if content touched
<clean>
$ npm run test:contracts
<count before: NNN green> → <count after: MMM green>   (delta: +K / rewritten: R)
<if any test rewritten, link the old→new map (Appendix C.8)>
$ npm run build
<clean>

### Invariants re-checked
- [ ] no-resource-cost test green (unchanged shape)
- [ ] techniques untouched (git diff shows zero technique files)
- [ ] tokens-only (no literal hex outside <defs>/sprites)
- [ ] LF line endings; no `any`

### Non-goals respected
- <bullet: what this wave deliberately did NOT do>

### Commit
<one commit; message per Appendix J>
```

### G.2 — Visual wave report (W7, W8 — adds the screenshot gate)

```
## Wave <N> — <title> — VISUAL EVIDENCE

### Everything in G.1, PLUS:

### Parity matrix (Appendix F)
| Shot | Reference | App render | Loops | Accepted? | Notes |
|------|-----------|-----------|-------|-----------|-------|
| S1 martial_R2 | shots2/01… | <path> | 2 | ✅ | |
| … all 13 Court + (W8) 3 Observatory … |
Accepted = pixel-indistinguishable outside masked grain/mote zones.

### Region parity checklist (Appendix H)
- [ ] Lintel  - [ ] Regimens  - [ ] Room shell  - [ ] Figure+channel (PROTECTED geometry)
- [ ] Room overlays (alerts/seal/lens/codex/forges)  - [ ] Path Meridians  - [ ] Constitution
- [ ] Intensity  - [ ] Forge Heat  - [ ] This Practice  - [ ] Nav  - [ ] Return modal
(each: geometry ✓ type ✓ token-colour ✓ placement ✓ state-variants ✓)

### Protected-asset attestation
- [ ] Astrolabe geometry unchanged (node count/positions identical; data re-pointed only)
- [ ] VFX testids preserved: training-hall-vfx-motes / training-hall-vfx-mote present at runtime
- [ ] Spirit Root Astrolabe SVG not redrawn

### Known deltas / deferred
- <bullet: any intentional non-pixel difference (e.g. masked grain) + justification>
```

### G.3 — Definition of done (applies to every wave)
1. Golden gate green: `typecheck && check:icons && validate:content && test:contracts && build`.
2. (Visual waves) all matrix shots accepted; region checklist complete.
3. Report filled and committed.
4. One commit, message per Appendix J.
5. Non-goals respected; protected assets attested.


---

## APPENDIX H — Per-region pixel parity checklist

> Use this during W7 parity loops. Each region lists its **container geometry**, its **child elements** with the exact **font / size / colour-token**, and the **state variants** that must be verified. "Token" = the `--paper-*` custom property (Appendix D); literal hex appears only inside `<defs>`. The artifact (`tempering-court.html` / its reference renders) is the pixel SoT — when this checklist and the artifact disagree, the artifact wins, and this checklist is corrected.

### H.0 — Stage & grid (the skeleton — verify first)
- Stage authored at **2048 × 1152**; rendered via a fixed-size inner stage scaled by `transform: scale(min(vw/2048, vh/1152))`, viewport height set to `1152 × scale`. ResizeObserver drives it (Part 1.1).
- Stage grid: `grid-template-rows: 116px 1fr 196px 46px; gap: 12px; padding: 15px;`.
- Row 2 (main): `grid-template-columns: 440px 1fr 430px; gap: 13px; min-height: 0;`.
- Row 3 (bottom): `grid-template-columns: 720px 540px 1fr; gap: 13px; min-height: 0;`.
- Right column (3rd cell of row 2): `grid-template-rows: minmax(0,1.45fr) minmax(0,1fr); gap: 13px;`.
- **Verify:** at 2048×1152 every panel edge lands on these tracks; no scrollbars on the stage; the four rows sum correctly under the 12px gaps + 15px pad.

### H.1 — Panel material (every `.panel` — verify once, reuse everywhere)
The 10 stacked layers, bottom→top: (1) parchment fill `linear-gradient(168deg, --paper-warm, --paper-deep)`; (2) `::before` vignette + foxing radials; (3) `.grain` `feTurbulence` (masked in diffs); (4) `.content` `padding:18px`, `z-index:3`; (5) `.gframe` gold double-frame via `border-image` `linear-gradient(135deg, #e7cd92, #a2712a 45%, #6e4c16)` + `mask-composite: xor`; (6) `.gframe2` inner hairline; (7) `.gc` four corner brackets; (8) `.banner` jade cloth label with diamond end-caps (`.cinn` variant = cinnabar); (9) `.tag` cinnabar vertical chop; (10) `.gcol` faint kai watermark.
- **Verify:** frame corners mitre cleanly; banner sits centered on the top edge with diamond caps; watermark is faint and behind content; **no literal hex** in the component (frame hex lives in the gradient tokens / `<defs>`).

### H.2 — Lintel (row 1)
- Grid `86px 1fr auto`, gap 18px, right-pad 20px, vertically centered.
- **Left cell:** empty spacer (86px) reserving the tag column.
- **Center cell:**
  - `.sub` — `700 12px serif`, letter-spacing `.15em`, `--gold-pale`/eyebrow ink — "TRAINING HALL · <PATH> PATH".
  - `.lintel-title` — `700 19px serif`, ls `.04em`, flex gap 12px — "The Tempering Court" + inline **wax seal** (path seal glyph, size 34, rot −6, jade iff Heaven). Seal uses kai face.
  - `.lintel-sub` — path subtitle, italic serif, ink-70.
  - `.realm-pips` — flex gap 4px, margin-top 6px: **7** pips (`.rp`), `on` for `i < realm`, `cur on` for `i === realm−1`; trailing `.micro` realm name.
  - **Cultivation-Base bar** (`.cbar-wrap`): `修为 Cultivation Base` micro-label + `.cbar` fill at `cultPct` + `<pct>% → breakthrough` micro. Fill colour jade.
- **Right cell** (`.lintel-right`, column, align-end, gap 5px): `.rchip` realm name · `.rchip` "Meridian Cap <cap>" · `.rchip` "<unlocked>/7 meridians" · `.chip jade` "▸ <active meridian>" · `.micro` "Next: <next meridian> · <next realm>" **or** "All meridians revealed" at R7.
- **State variants:** R1 (1/7) vs R4 (4/7) vs R7 (all revealed); active-meridian chip changes with selection; no_path → pips empty/idle copy.

### H.3 — Regimens shelf (row 2, col 1 — 440px)
- `.shelf-scroll`: full height, `overflow-y:auto`, right-pad 6px, column, gap 11px. Faint `法` watermark behind.
- **One `.plaque` per UNLOCKED meridian** (the exercise):
  - radius 3, pad `10px 12px`, bg `linear-gradient(168deg, --paper-warm, --paper-deep)`.
  - Active plaque: `.sel` styling + `.psel` corner wax seal (`煉`, 22, jade) + `.ptemper` "TEMPERING" tag.
  - `.pname` exercise name (serif, bold).
  - `.proom` `600 11px serif` ink-70 — "<room> · trains **<meridian>** <字>".
  - `.pmeta` — root chip (`.rootchip` tinted by root) + `.pbar` fill at `capPct` (`.cap` modifier when not open) + `.val` "<rating>/<cap>".
  - `.ladder` — **10** notches (`.notch`), `on` ≤ mastery rank, `cur` at rank; the `◆` trait marker (`.trait`) at `traitRank`.
  - `.micro` — "Mastery <r>/10 · trait ◆ at <tr> — <trait>" + (if `comp<1`) "· learning <pct>%" in comprehension-purple.
- `.divider` "sealed meridians · unlocked by breakthrough".
- **One `.slip` per SEALED meridian:** left-pad 40px, diagonal-hatch bg, `.seal-lock` wax seal (`封`, 26, −8) at left; `.sname` name + 字; "opens at <realm>"; "promise: <path effect>".
- **Interaction:** click a `.plaque` → set active meridian (drives the whole Court). Keyboard reachable (`tabindex`, `role=button`, `aria-pressed`).
- **State variants:** active selection moves the `煉`/TEMPERING; R1 shows 1 plaque + 6 slips; capped plaque shows 滿 in its meta.

### H.4 — Room shell + figure + channel (row 2, col 2 — 1fr) **[FLAGSHIP — 3–5 loops]**
- Banner "THE ROOM · **<active exercise room>**"; faint path watermark (`气/精/神`).
- **Z-stack** (Part 1.5.3 order): `room-atmos` (per-path gradient) → `room-scene` (`buildScene`, per-path) → `room-fig` (figure) → `fx-motes` (`#th-motes`, **testids** `training-hall-vfx-motes`/`-mote`) → `room-smoke` → `room-scrim` (status tint) → corner brackets (`rc-tl`/`rc-tr`, `cornerURI`) → overlays.
- **Figure** (`buildFigure`, SVG viewBox `0 0 1212 768`): per-path dais, aura, back glow, robe/legs/folds/collar/rim/hands/neck/head/topknot. Dim+grayscale when blocked/no_path.
- **Meridian channel** (`buildMeridianChannel`) — **PROTECTED geometry**:
  - 7 nodes on centerline **x = 606** at **y = [452, 400, 348, 296, 244, 192, 138]** (dantian→crown).
  - Faint full line `470→138` (`rgba(120,96,52,.18)`, w6); bright charged line `470→y[realm−1]` (per-path `meridP_*`, w6, `glowJ`); qi-flow `#fff6da` on the active segment when active & not reduced-motion.
  - Unlocked node: bead r9 (jade radial); **active** r13 (path core + `glowJ` + 22px breathing halo); **bottleneck** cinnabar disc + weak-pulse; **capped** gold radial + `滿`.
  - Sealed node: `封` wax seal (22).
  - Active node side-label: meridian name (paint-order stroke for legibility) + "<rating>/<cap> · <root>" + (if capped) "overflow → mastery".
  - **Dantian** at (606, 470): core r44 (breathing), ring r20, rim ring r28.
- **Verify (flagship):** node Y positions exact; active glow + label; sealed `封` count = `7 − realm`; dantian rings; per-path core gradient (`emberCore` Earth, `qiCore` Martial/Heaven); reduced-motion freezes all of the above.

### H.5 — Room overlays (on top of the figure)
- **Alerts** (`.alerts`, top-left, left 24 / top 14, **≤3**): `.alert` rows tinted `jade/gold/cinn/ink` with kai glyph + text + dismiss `✕`. Tone follows event (breakthrough-unseal = ink/jade; comprehension = gold; cap = gold; combat-block = cinn).
- **Status seal** (`.room-seal`, top-right, right 22 / top 30): big wax seal by status — active `炼`(jade), idle `待`(gold), blocked-combat `戰`(cinn), blocked-activity `占`(gold), no_path → "No Path" chip; with a `.chip` status label.
- **Practice-Tempo lens** (`.lens`, bottom-left, left 24 / bottom 84, **w330**): `.lensbar` "PRACTICE TEMPO"; `.head` shows `<mult>× / 2.25×` (active) / `≈ <mult>×` (idle) / "paused" + a ring gauge (`arc`, fill `mult/2.25`, colour jade→gold by mult). Then **the factor rows** (`.row`): one per rate factor, name (+ optional note) and `<value>× ↑/↓/–`. **The list & order match §2.5 exactly:** regimen mastery, intensity, perception, spirit root, fatigue, comprehension, cap falloff, path affinity, offline, form memory.
- **Codex card** (`.room-codex` "THIS MERIDIAN", bottom-right, right 22 / bottom 84, **w340**): title "<meridian> <字>"; `In combat` row = derived-effect chips (`.eff` tinted atk/util); `Path` row = path effect; `Comprehend` row = bar at `comp` (only when `comp<1`); `passive-note` "Also honed in combat by **<trigger>** · ≈15% of training rate". **Hidden entirely when no_path.**
- **Forges strip** (`.forges`, bottom, left/right 24, bottom 24, h42): a **single** line — "Tempering ▸ **<active meridian>** <rating>/<cap> [capped → mastery] · feeds **<first derived effect>**". (No tri-stat list — exactly one meridian.)
- **State variants:** every status changes seal + scrim; capped adds the gold "capped → mastery" chip in forges; blocked greys the figure and pauses the lens; alerts cap at 3.

### H.6 — Path Meridians panel (row 2, col 3, top — minmax 1.45fr)
- Banner "PATH MERIDIANS"; `.fcol` scroll; `脉` watermark.
- `.fsummary` "Path Meridians <unlocked>/7 unsealed".
- **7 rows**, in unlock order:
  - **Unlocked** (`.merrow`, `.active` when current): a small bead SVG (jade / cinnabar-if-bottleneck / gold-if-capped, weak-pulse if bottleneck) + `.mname` name + 字 + `.rootchip` (root label sans " Root") + `.mmeter` fill at `capPct` (`.cap` modifier) + `.mr` "<rating>/<cap>" + a trailing `.chip`: `▸` active / `!` bottleneck / `滿` capped.
  - **Sealed** (`.merlocked`): `封` seal + name + 字 + `.sealtag` realm name.
- **Verify:** exactly 7 rows; sealed count tracks realm; active row highlighted; bottleneck flare is cinnabar (not blue/gray).

### H.7 — Constitution panel (row 2, col 3, bottom — minmax 1fr)
- Banner "CONSTITUTION"; `.fcol` scroll.
- `.tier-head jade` "Cultivation Axes · 修为" → `.cgrid` (2 cols, gap `3px 12px`) of **7** axes cells (`.ccell`: 字 in gold-deep + `.cn` name + `.cv` value).
- `.tier-head` "Mortal Foundation · 体" → `.cgrid` of **6** foundation cells; **Luck** renders a `.cg` **grade** (e.g. "Auspicious"), not a number.
- Closing `.micro`: shared-tiers note ("present from Qi Condensation … the Court tempers path meridians; one at a time").
- **Verify:** 7 + 6 cells; Luck shows grade; values scale with realm; tokens-only.

### H.8 — Intensity bellows (row 3, col 1 — 720px)
- `.bellows` grid `repeat(4,1fr)`, align-end, gap 6px.
- **4 detents** (`.detent`, `.sel` for current): `medallion(glyph)` (靜/穩/烈/極) + label + flame SVG (`flameSVG`, lit when selected & active & not reduced-motion) + `.num` "<xp>× · <fpm>/min".
- Values **preserved**: Quiet 0.70×/0.04 · Steady 1.00×/0.14 · Harsh 1.35×/0.35 · Limit 1.75×/0.75.
- **Interaction:** click selects intensity. **Verify:** selected detent flame lit; numbers exact; keyboard reachable.

### H.9 — Forge Heat (row 3, col 2 — 540px)
- Zone labels fresh/tiring/strained/overworked.
- `.forgebar`: `.ffill` width = `F`; ticks at 35% & 60%; `.line80` "downgrade" at 80%; heat-shimmer overlay above 80% (animated, suppressed under reduced-motion).
- Scale ticks 0/35/60/80/100.
- Row: `.chip` tier (jade fresh / gold tiring·strained / cinn overworked) + `.val` "<F>/100" + `.micro` "output ×<damp>" + (overworked) "⤓ practice eases".
- **Verify:** tier thresholds 35/60/80; damp text equals `max(0.4, min(1, 1−max(0,F−40)×0.009))`; ≥80 shimmer only when not reduced-motion.

### H.10 — This Practice (row 3, col 3 — 1fr)
- `.micro` "tempering **<meridian>**, at <intensity>:".
- `.tline` rows: **<meridian> <字>** "≈ +<base> xp/min" (base = 2.4×mult) · "regimen mastery ≈ +<base×0.33>/min" · "forge heat +<fpm>/min".
- `.pp-sec` "also in combat · passive" → `.tline` "<trigger> ≈ +<base×0.15>/min" (jade).
- If **capped**: "at realm cap → overflow → mastery" (gold). Else: "to next rating (<r>→<r+1>)" + `.tbar` progress + "~<mins> min".
- **Verify:** **single** meridian (no primary/secondary/foundation triple); passive line present; capped routes to overflow copy; numbers derive from `mult`.

### H.11 — Nav (row 4 — 46px)
- `.navrow` `1fr auto`: return button (left) + actions (right): `.btn jade big` start ("Begin Tempering", **idle-only**, disabled otherwise with `.reason`) + `.btn` "Cease" (**active-only**).
- **Verify:** start enabled exactly when idle & path chosen; cease enabled exactly when active; disabled reason text matches status.

### H.12 — Return modal (overlay)
- `.return-wrap`/`.return-scrim` + `.return` card, `role=dialog` `aria-modal` (**focus-trap + restore in W10**).
- `歸` wax seal (40, jade); `<h3>` "WHILE YOU WERE AWAY"; `.lead` "The hall tempered **<meridian>** for <duration>."
- `.rrow`s: meridian "<gained> [<ratings> chip]"; "Regimen mastery <+mastery>"; "Combat · passive <+passive>" (jade); "Forge heat <F> → <tier>" (gold); (if downgrades) "⤓ Your Limit eased <N> times…".
- `.btn jade` "Resume" (closes; scrim closes too).
- **Verify:** reports a **single** tempered meridian + combat-passive; focus is trapped while open and restored to the trigger on close; Esc closes.


---

## APPENDIX I — Rollback & flag-gated cutover

> The whole rework lands behind a feature flag. The **old** Training Hall and tri-stat engine stay fully wired until W13, so at any point before cutover you can flip back with zero data loss and zero rebuild. Dead code is removed **only** after every state is screenshot-accepted.

### I.1 — The flag
- `‹recon:src/featureFlags.ts›` gains `temperingCourt: boolean` (default **off** through W12, flipped **on** in W13).
- Off → render the existing Training Hall + run the existing tri-stat training path (unchanged).
- On → render `TemperingCourt` + run `advanceMeridian`/`computeMeridianRate`.
- The flag gates **both** UI **and** engine so they never mix (a half-migrated state — new UI on old engine — must be impossible).

### I.2 — Data coexistence
- The new per-meridian ratings + Tier 0/1 stores are **additive**; they do not overwrite the old stat store until cutover.
- Migration of save data (old 18-stat → tiered) runs **behind the flag** with a reversible mapping recorded in W2/W3; keep the old fields readable until W13 so flip-back restores cleanly.
- **Techniques** read derived stats either way (the resolver's inputs change, not its code), so combat behaves under both flag states.

### I.3 — Rollback procedure (any time before W13)
1. Set `temperingCourt = false`.
2. Rebuild; the app renders the old hall and runs the old engine.
3. No schema migration to undo (new fields are additive and ignored when the flag is off).
4. File a note in the wave report explaining why, with the failing shot/diff attached.

### I.4 — Cutover (W13) — point of no return checklist
- [ ] All 13 Court + 3 Observatory states screenshot-accepted (Appendix F).
- [ ] Full golden gate green; contract count ≥ pre-rework (rewrites mapped, Appendix C.8).
- [ ] Techniques diff empty across the entire series.
- [ ] Astrolabe geometry attested unchanged.
- [ ] Flip flag default → on; **only then** delete: old TrainingHall component, tri-stat helpers, dead surface fields (Appendix E `DEL@W13`).
- [ ] Keep one revert commit handy for 1–2 releases before deleting the flag itself.

---

## APPENDIX J — Commit plan (one commit per wave)

> One focused commit per wave, imperative mood, scoped prefix, body lists the Appendix-E files and the evidence summary. Collated here for convenience; each is also embedded in its wave (Part 5).

| Wave | Commit message |
|---|---|
| W1 | `feat(court): panel material, court defs, seal helpers, +3 paper tokens` |
| W2 | `feat(content): Three Treasures data model — 21 meridians, roots, 7-realm caps` |
| W3 | `feat(training): single-meridian advance + rate formula; rewrite tri-stat contracts` |
| W4 | `feat(combat): Tier-3 derived-stat resolver (techniques untouched)` |
| W5 | `feat(combat): passive meridian training via shared advanceMeridian (online, capped)` |
| W6 | `feat(ui-surface): TrainingHall surface → meridian/tier shape (render-only)` |
| W7 | `feat(court): The Tempering Court UI at 1:1 parity (all 13 states)` |
| W8 | `feat(observatory): re-bind constellation + Astrolabe to Tier-2 (geometry preserved)` |
| W9 | `feat(court): vitals-driven motion + VFX (reduced-motion safe)` |
| W10 | `feat(court): a11y — focus-trap, aria-live, roving tab, colour-blind re-verify` |
| W11 | `feat(prestige): Form-Memory floor for meridians` |
| W12 | `balance(court): tune meridian rate coefficients & derived weights` |
| W13 | `feat(court): flag-gated cutover; remove legacy Training Hall` |

**Commit hygiene:** never bundle two waves; never commit red; never commit a UI wave without its accepted screenshots referenced in the body; keep `DEL@W13` deletions out of every commit except W13.


---

## APPENDIX K — React component tree (W7 build blueprint)

> The Court is **render-only**: every component receives already-computed view data from the `TrainingHallSurface` selector (W6) and renders it. **No component recomputes gameplay** — no rate math, no cap logic, no RNG in render. Props are the surface slices from Appendix C.3 / the data contract in K.3. All components consume the W1 `Panel`, `seals`, and `CourtDefs` primitives; all colours are tokens; the only `<svg defs>` is `CourtDefs`.

### K.1 — Tree

```
<TemperingCourt>                      // stage shell: fixed 2048×1152, ResizeObserver scale; renders <CourtDefs/> once
├─ <CourtDefs/>                       // shared <svg><defs> (hex-allowed zone) — mounted once, referenced by url(#…)
├─ <Lintel surface={s.realm, s.activeMeridian, s.path}/>           // row1
│    ├─ <RealmPips count={7} realmIndex={…}/>
│    └─ <CultivationBaseBar pct={s.realm.cultPct}/>
├─ <RegimensShelf
│      meridians={s.meridians}        // unlocked → plaques, sealed → slips
│      onSelect={setActiveMeridian}/> // the ONLY interaction that re-drives the Court
│    ├─ <RegimenPlaque … masteryLadder traitRank comp rootChip/>   // ×unlocked
│    └─ <SealedSlip … unlockRealm pathEffect/>                      // ×sealed
├─ <Room surface={s} >                // row2 col2 — flagship
│    ├─ <RoomAtmos gradient={path}/>
│    ├─ <Scenery path={s.path}/>      // martial/earth/heaven scene
│    ├─ <Figure surface={s}>          // viewBox 0 0 1212 768
│    │    └─ <MeridianChannel         // PROTECTED geometry: x=606, ys=[452,400,348,296,244,192,138]
│    │         meridians={s.meridians} activeIndex realm reducedMotion/>
│    ├─ <Motes status={s.status} path={s.path}/>   // sets data-th testids at runtime
│    ├─ <RoomSmoke/> <RoomScrim status/>
│    ├─ <RoomAlerts alerts={s.alerts.slice(0,3)}/>
│    ├─ <StatusSeal status={s.status} intensity={s.intensity}/>
│    ├─ <PracticeTempoLens rate={s.rate}/>          // ring + factor rows (order per §2.5)
│    ├─ <MeridianCodex meridian={s.activeMeridian}/>// hidden when no_path
│    └─ <ForgesStrip meridian={s.activeMeridian}/>  // single line
├─ <div rightcol>                     // row2 col3 — minmax(1.45fr) / minmax(1fr)
│    ├─ <PathMeridiansPanel meridians={s.meridians}/>
│    └─ <ConstitutionPanel tiers={s.tiers}/>        // Cultivation Axes (7) + Mortal Foundation (6)
├─ <IntensityBellows                  // row3 col1
│      intensities={INTENSITIES} selected={s.intensity}
│      active={s.status==='active'} reducedMotion onSelect={setIntensity}/>
├─ <ForgeHeat heat={s.heat} reducedMotion/>          // row3 col2
├─ <ThisPractice meridian={s.activeMeridian} rate={s.rate} intensity={s.intensity}/> // row3 col3
├─ <Nav status={s.status} onStart={…} onCease={…} onReturn={…}/>  // row4
└─ <ReturnModal summary={s.offlineSummary} onResume={…}/>          // overlay, role=dialog (focus-trap W10)
```

### K.2 — Shared primitives (W1)
- `<Panel banner tag watermark variant>` — the 10-layer material (H.1). Every region is a `Panel`.
- `seals.ts` — `waxSeal(chars,size,rot,jade)`, `medallion(glyph)`, `cornerURI(col)`, `flameSVG(h,lit)`, `arc`, `PT`. Pure SVG-string/component helpers.
- `<CourtDefs/>` — the single `<defs>` (Part 1.10). All gradients/filters referenced by `url(#id)`.
- Helpers (pure): `capStateOf(pct)`, `tierOf(F)`, `dampOf(F)`, `qiDur(mult)`, `pipN`, `fmt`. **These live in a shared util and are imported by the surface selector, not recomputed in components.**

### K.3 — Data contract (props the surface must supply — single source for K + Appendix C.3)

```ts
interface MeridianView {
  id: string; zi: string; name: string;
  exercise: string; room: string; trigger: string;
  unlocked: boolean; unlockRealm: number;        // 1..7
  rating: number; cap: number; capPct: number;
  capState: 'open'|'near_cap'|'capped';
  isActive: boolean; isBottleneck: boolean;
  root: { key: string; lbl: string; cls: string; capMult: number; rateMult: number };
  mastery: { rank: number; nextMilestone: number };
  traitRank: number; trait: string;
  comp: number;                                   // comprehension 0..1
  eff: { tone: 'atk'|'util'|''; label: string }[];// derived-stat effects
  path: string;                                   // path-effect copy
  index: number;                                  // 0..6
}
interface Factor { key: string; value: number; dir: 'up'|'down'|'flat'|'bad'; note?: string }
interface StatView { id: string; zi: string; name: string; value?: number; grade?: string } // Luck → grade
interface Alert { tone: 'jade'|'gold'|'cinn'|'ink'; glyph: string; text: string }
interface TrainingHallSurface {            // V1+ / V2 — render-only, precomputed
  path: 'martial'|'earth'|'heaven'|null;
  status: 'active'|'idle'|'blocked_by_combat'|'blocked_by_activity'|'no_path';
  realm: { index1to7: number; name: string; cap: number; unlockedCount: number;
           nextUnlock: { name: string; realm: string } | null; cultPct: number };
  activeMeridian: MeridianView;            // the one being tempered
  meridians: MeridianView[];              // all 7 for the active path
  tiers: { axes: StatView[]; foundation: StatView[] };   // Tier 1 (7) + Tier 0 (6)
  rate: { mult: number; clampMax: 2.25; factors: Factor[] }; // factors order == lens == §2.5
  heat: { value: number; tier: 'fresh'|'tiring'|'strained'|'overworked'; damp: number };
  intensity: { id: string; label: string; mult: number; fpm: number };
  alerts: Alert[];
  offlineSummary: { minutes: string; meridian: string; gained: string; ratings: string;
                    mastery: string; passive: string; fatigue: number;
                    tier: string; downgrades: number } | null;
}
```

### K.4 — Render-purity rules (lint/review enforce)
1. No arithmetic on gameplay values in render (`rating`, `cap`, `mult`, `damp` arrive precomputed). Components may format (`toFixed`) but not derive.
2. No RNG, `Date.now`, or store writes in render. Motes' randomness is presentational only and seeded/ignored in tests.
3. No literal hex (tokens only); the lone `<defs>` is `CourtDefs`.
4. Geometry constants (channel `ys`, `x=606`, dantian radii, panel grid tracks) are **frozen** — they are the parity contract; do not parameterize them away.
5. Every interactive element is keyboard-reachable with correct ARIA (selection = `aria-pressed`; modal = `role=dialog`+`aria-modal`).


---

## APPENDIX L — Living State Observatory: constellation & Astrolabe re-bind (W8)

> The status screen must speak the new language. Today the **stat meridian constellation** and the **Spirit Root Astrolabe** are wired to the old 18-stat model; after the rework they must read the four-tier Three Treasures model. **This is a data re-binding, not a redraw.** The Astrolabe SVG geometry is a protected, reference-quality port — its node count, positions, rings, and paths **do not change**; only the data that lights/labels them changes.

### L.1 — What changes vs. what is frozen
- **FROZEN (do not touch the drawing):** Spirit Root Astrolabe SVG geometry (rings, spokes, node coordinates, the brush linework), the Observatory panel material, the vitals-seal-ribbon shape, and any `data-testid` anchors on the status surface.
- **RE-BOUND (data only):**
  - **Constellation nodes → Tier-2 Path Meridians.** The constellation now plots the **7 path meridians** of the active path: unlocked ones lit (jade / gold-if-capped / cinnabar-if-bottleneck), **sealed ones shown sealed** (`封`-style), the **signature** at the root and the **capstone Dao** at the apex. The node-to-screen mapping reuses the existing constellation geometry; you re-point which datum drives each node, not where nodes sit.
  - **Astrolabe rings → spirit-root grades.** The Astrolabe's rings/sectors now read the cultivator's **rolled spirit root** (Heavenly/True/Earthly/Mortal/Chaos) and per-meridian root affinity (the same `root` object the Court uses). Re-point the ring fills/labels to root data; keep the geometry.
  - **Supporting structure → Tier 0/1.** The shared **Mortal Foundation (6)** and **Cultivation Axes (7)** render as the constellation's supporting/background tier (matching the Constitution panel's split), not as peer nodes to the meridians.
  - **Vitals seal ribbon → Tier-3 derived.** The ribbon reads the **derived** combat stats (Appendix B) — Max HP, defenses, attack, speed, crit, soul, tribulation resist, suppression, etc. — computed by the W4 resolver. It reads derived outputs only; it never recomputes them.

### L.2 — State parity the Observatory must reflect (same model as the Court)
- **Drip-unlock:** sealed meridians appear sealed; unlocked count tracks realm; signature present from R1, capstone at R7.
- **Cap / overflow:** capped meridians show the capped mark (`滿`/gold) and that overflow feeds mastery.
- **Comprehension:** a freshly-unlocked meridian still warming up reads as "comprehending" (matching the Court codex), not as fully realized.
- **Roots:** each meridian's root affinity is visible (chip/sector), consistent with the Court's root chips.
- **One active meridian:** if the Observatory indicates what's currently being tempered, it points to the single active meridian (consistent with the Court).
- **Reduced-motion & colour-blind:** all state encoded by **shape + label**, not colour alone; animations gated by reduced-motion. Re-verify both here (W10 also covers it).

### L.3 — Surface re-bind (types)
- Extend `‹recon:src/systems/ui/status/statusObservatoryTypes.ts›` so the Observatory surface exposes the **same** `MeridianView[]`, `tiers`, and derived-stat readout used by the Court (reuse the Appendix K.3 types — do not invent a parallel shape). One source of truth for "what a meridian looks like" across Court and Observatory.
- The Observatory surface is **render-only** like the Court's; the selector assembles it, the components render it.

### L.4 — Acceptance (W8)
- Constellation plots **7 meridians** with correct unlocked/sealed/active/bottleneck/capped states for the active path, at realms 1/4/7 (shots O1–O2).
- Astrolabe **geometry byte-identical** to pre-rework (attest node count + positions unchanged); only data re-pointed.
- Vitals ribbon reads derived stats from the W4 resolver (techniques untouched).
- Reduced-motion + colour-blind re-verified (shot O3).
- Contract test: constellation reads Tier-2 ids; Astrolabe geometry node-count assertion unchanged; derived ribbon reads resolver output.

---

## FINAL SHIP GATE (read before declaring the rework done)

1. **Pixel parity** — all 13 Court states + 3 Observatory states screenshot-accepted against the artifact references (Appendix F); every region passes its checklist (Appendix H).
2. **Mechanics** — single-meridian advance, drip-unlock cadence, caps→overflow→mastery, comprehension warm-up, aptitude/roots, per-exercise mastery, passive combat via shared `advanceMeridian`, derived-stat resolver, prestige Form-Memory — all covered by rewritten + new contracts (Appendix C), suite count ≥ pre-rework.
3. **Untouched** — techniques diff empty across the whole series; Astrolabe geometry attested; only the sanctioned `CAPS` 6→7 constant changed.
4. **Laws** — tokens-only (3 new tokens added; no literal hex outside `<defs>`/sprites); no colour-only/motion-only/hover-only meaning; reduced-motion safe; no layout shift; LF endings; no `any`; render-only surfaces; `forceLegacy` intact.
5. **VFX testids** — `training-hall-vfx-motes` / `training-hall-vfx-mote` present at runtime.
6. **Cutover** — flag flipped on **only** after 1–5; legacy removed **only** at W13; revert commit retained.

> Build order, minimal: **W1** primitives → **W2** data → **W3** engine (+ rewrite contracts) → **W4** derived → **W5** passive → **W6** surface → **W7** Court UI (parity loops) → **W8** Observatory re-bind → **W9** motion → **W10** a11y → **W11** Form-Memory → **W12** balance → **W13** cutover. Each wave: Plan-Mode recon → per-edit approval → golden gate → (visual waves) screenshot gate → one commit → evidence report.

*End of packet.*
