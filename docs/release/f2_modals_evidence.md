# F2-MODALS — The shared modals (evidence)

**Packet:** D17 manifest #03 · Phase 0 cross-cutting · Codex §III.W (inspector) + §III.X (ritual shell).
**Sub-packets landed:** S0 · S1 · S2 · S3 · S4 · S5 · S6 (all). **Class:** additive screen enhancement (S0 infra-only). **Removes nothing; mutates nothing.**

F2 stands up the two shared modal frames as **render-only, typed, intent-emitting** surfaces: the
Item/Technique-Detail **Inspector** (NEW) and the **Ritual Ceremony Shell** (a preserve-first LIFT
of `RitualModalFrame`). Frames, not content — proven from typed fixtures across the full state matrix.

## 1 · Changed files

**New (S0 — contracts/fixtures/harness):**
- `src/systems/ui/modals/{itemDetailTypes,ritualFrameTypes,itemDetailFixtures,ritualFrameFixtures,index}.ts`
- `src/ui/modals/__harness__/modalStageMain.tsx` · `modal-stage.html` (dev-only, beside `court-stage.html`)

**New (S2 — ritual shell · S3+S4 — inspector):**
- `src/ui/shell/RitualCeremonyShell.{tsx,scss}` (wraps `RitualModalFrame`)
- `src/ui/modals/ItemDetailInspector.{tsx,scss}` · `src/ui/modals/index.ts`

**New (S6 — contracts):**
- `tests/contracts/{itemDetailInspectorContract,ritualCeremonyShellContract,modalSurfaceFixturesContract,modalStoreWiringContract}.test.ts`

**Modified (additive, preserve-first):**
- `src/ui/shell/RitualModalFrame.tsx` (+ optional `rite`/`riteState` props + frozen registries; default state byte-identical) · `RitualModalFrame.scss` (+ `--state-prestige`/`--state-postFailure`; `--state-default` is a no-op) · `src/ui/shell/index.ts` (+ re-exports)
- `src/stores/uiStore.ts` (S5: open/close pairs + intent payloads + INITIAL_UI_STATE fields + overlay-block) · `src/systems/ui/notificationPolicy.ts` (S5: overlay-block guard)
- `tests/contracts/ritualModalFrameContract.test.ts` (+4 blocks, S1) · `tests/contracts/nonStatusNoDaoPublicUiTargetContract.test.ts` (S6: registered the new modal roots)

**Reused unchanged (imported, not forked):** `InkModalFrame`, `InkPanel`, `_inkGoldFrame` (the legendary frame), `useDialogFocusTrap`, `useRitualMotion`, the F0 rarity/affix tokens. **`FxQualityProvider` is at `src/ui/fx/`** (the packet's §3.4 `src/fx/` was a stale snapshot path — reconciled, not guessed).

## 2 · The two modals (render-only, intent-emitting)

- **Inspector** — a foxed-parchment treasure record on `InkModalFrame` + `useDialogFocusTrap`. The single enforcement point of the item language: **tier mark + rarity frame grade + element edge-glyph + affixes in real text**, plus set/bond, compare-vs-equipped (▲/▼ + sign + value), lore/provenance, and an action rail that forwards intents (`onAction(route)`; Sell raises a local confirm). The five rarity frame grades escalate by **weight** (plain ink rule → legendary `ink-gold-frame` + carved corners), each labeled (never hue-alone).
- **Ritual Ceremony Shell** — wraps `RitualModalFrame` (portal/trap/motion/backdrop reused). Lintel (rite chop + name + skip-to-result) → rite stage (per-rite plate + stakes) → outcome reveal (success jade / not-yet **sober neutral**, never cinnabar) → **never-regress readout in every rite** → exit. State-keyed backdrop: slate-teal default / warm-bronze prestige / cinnabar-EDGE postFailure.

**No mutation:** neither component imports a gameplay store or holds `getState()`/`set()` (contract-asserted). The store (S5) brokers open/close + an intent payload only — content lives with the owning surface, which arrives in each later Movement.

## 3 · Verification — the five-command battery

| Gate | Result |
|---|---|
| `npm run typecheck` | ✅ pass |
| `npm run check:icons` | ✅ "No emoji icon usage found" (tier mark + element/rite glyphs are numerals / CJK chars / CSS — no emoji) |
| `npm run validate:content` | ✅ "Content validation passed." |
| `npm run test:contracts` | ✅ **538 / 538** (was 534; +4 F2 contract files, and `ritualModalFrameContract` +4 blocks — the floor only rose) |
| `npm run build` | ✅ built ~6.5s |

Plus the harness smoke (S0): **18/18 fixtures render without throwing**.

## 4 · Screenshot manifest (2048×1152, dSF2) — `docs/release/qa/f2-modals/`

**Inspector** (`/inspector/`): `item-common`, `item-uncommon`, `item-rare`, `item-epic`, `item-legendary` (full body + compare + set), `item-equippable-compare`, `item-in-set-bonded`, `technique-seat-reroll`, `inspector-empty`, `inspector-locked`, plus interaction captures `item-legendary--sell-confirm` and `item-epic--upgrade-available`, plus **reduced-motion** and **grayscale** of legendary. Zero page errors.

**Ritual shell** (`/ritual/`): all 8 states (`breakthrough/tribulation × success/not-yet`, `echo-decree`, `life-summary`, `root-upgrade`, `ritual-skipped`), plus **reduced-motion** and **grayscale** of `tribulation-not-yet`. Zero page errors.

**Accessibility proofs:** the grayscale captures confirm rarity reads by **frame weight + label**, the element by **glyph + label**, the compare by **▲/▼ shape + value**, and success-vs-not-yet by **label** — no meaning is color-only. The reduced-motion captures show both modals legible already-settled.

## 5 · Continuity / governance

- **Preserve-first:** every existing `RitualModalFrame` prop/registry/class retained; the default ritual state is unchanged (a deliberate SCSS no-op). All legacy modals (`TechniqueDetailModal`, `PrestigeRitualModal`, the court `ReturnModal`, …) are **untouched** — no cutover, no cleanup.
- **No raw hex / no blue-gray:** both modal SCSS files are token-only (`color-mix`/`var()`); the not-yet reveal is parchment-muted, cinnabar reserved for the postFailure edge + true-negative compare rows.
- **Public vocabulary:** `src/ui/modals`, `src/ui/shell/RitualCeremonyShell.tsx`, and `src/systems/ui/modals` are registered in `PUBLIC_NON_STATUS_ROOTS`; the guard passes (no Omen/Proof/Mandate/Source).
- **No layout shift:** the inspector reserves the set/compare band; the ritual stage holds its height.
- **Deferred (named):** content wiring + caller wiring (each surface's Movement), legacy-modal retirement (a later gated cleanup), and the `heartDevil` rite (DR-17a, Movement VII). Art request: `deferred` — F2 ships no raster art.

## 6 · F2.UI — artifact-fidelity port (modal-stage.html) · Inspector slice

A follow-up packet ports the proven `modal-stage.html` design artifact onto the wired F2 surfaces at
full visual fidelity, **extending the existing components in place** (not new paths). **Slice 1 (the
Inspector) is done; the Ritual shell's 5 SVG rite scenes are the next slice.**

- **Additive surface fields** (all optional — the guarding contracts stay green, the floor only rises):
  `identity.nameCjk / rarityBand / lean`, `affix.channel / rollPosition`, `setBond.bond.max`,
  `surface.signature / casting / scalesOff / reroll`. The 10 inspector seeds + visualStates are unchanged.
- **New marks:** `src/ui/modals/recordMarks.tsx` — `WaxSeal` + `LockSeal`, token-only inline SVG with
  `useId()` gradient ids, decorative/aria-hidden. The tier plate / rarity chop / edge-glyph stay CSS.
- **The record now renders** the 寶錄/法錄 record-tag chop, the gold/jade tier-mark **plate**, the
  **carved corner brackets** (Epic+/Legendary only — the gold double-rule lineage), the **legendary
  signature** panel, affix **roll bars** (a gold pip at the rolled position), **set pips** + the **兵魂
  weapon-bond ladder**, the **命运 honest-odds reroll** panel (technique), casting + scales-off chips,
  and the lock-seal **gate slip**. Every colour maps to a `paperInkTokens` var — **no raw hex**.
- **Deferred real-surface wiring** is tracked in `src/systems/ui/modals/index.ts` as
  `MODAL_SURFACE_WIRING_TODO` (only `lifeSummarySurface` + `breakthroughRitualSurface` exist live;
  tribulation/root/echo + a real item-detail surface land with their mechanics).
- **Verified:** typecheck ✓ · check:icons ✓ · test:contracts **538/538** ✓; the 14 inspector captures
  re-shot at 2048×1152 dSF2 (zero page errors). Grayscale proves the **rarity-frame ladder reads by
  frame weight/ornament, not hue**; common is plainly plain, legendary plainly ornate.

### 6b · Ritual Ceremony shell — the 5 SVG rite scenes (slice 2)

The shell's placeholder plate is replaced by **five hand-built SVG rite scenes** ported from the artifact,
routed by `surface.rite` over the state-keyed void backdrop:

- **New foundation:** `src/ui/ritual/RitualSceneDefs.tsx` (the rite-only `<defs>` sprite, namespaced
  `rs*`, every stop tokenised), `figure.tsx` (the cultivator silhouette), `ritualScene.scss` (layout +
  motion + the reduced-motion/`--still` freeze + the default/prestige/danger void skins), `index.ts`.
- **The 5 scenes** (`src/ui/ritual/scenes/Scene*.tsx`): breakthrough (stone gate + threshold light +
  the 九转 nine-stage ladder), tribulation (gathering storm + bolt + peak + the true-danger stakes glow),
  reincarnation (the 六道 wheel — 天人修畜鬼狱 — + 輪迴 hub + deed-motes), root-refine (twin before→after
  grade-wheels 凡地玄天 + 洗髓 crucible), echo (the cinnabar 天命之诏 decree + 敕 seal + karmic ring).
- **Surface additive fields:** `RitualSceneData` (breakthroughStage / rootFrom·ToGrade), `outcome.pityPercent`
  (the sober-bronze pity bar), `RitualLifeSummary` (deeds / AP / path re-choice for the reincarnation reveal).
- **The laws hold (adversarially verified by 5 independent reviewers):** every rotating ring carries the
  `transform-box: view-box` per-centre ring-fix (no drift); the never-regress readout is in **every** rite;
  the shell is render-only (intents only, no store, no RNG); **no raw hex** anywhere in `src/ui/ritual/**`.
  The review caught one real issue — `breakthrough-not-yet` was seeded `riteState: 'postFailure'` (a cinnabar
  frame edge on a non-danger not-yet) — now corrected to `'default'`, so **cinnabar signals genuine danger
  only** (the tribulation register). 4 unused defs trimmed.
- **Built via orchestration:** the 5 scenes were ported in parallel (one agent per scene) against a fixed
  defs/figure/token contract, then integrated and adversarially verified — exhaustive, with the cinnabar
  fix folded back in.
- **Verified:** typecheck ✓ · check:icons ✓ · test:contracts **538/538** ✓; all 8 ritual states + reduced-motion
  + grayscale re-shot at 2048×1152 dSF2 (zero page errors). Grayscale keeps the tribulation legible by
  composition (peak + bolt + scrim), not hue; reduced-motion freezes the bolt to a legible still.

**Deferred (unchanged):** real-surface wiring (`MODAL_SURFACE_WIRING_TODO`) — only `lifeSummarySurface` +
`breakthroughRitualSurface` exist live; tribulation/root/echo + a real item-detail surface land with their
mechanics. The scenes + record render fixture-driven today; the `*SurfaceV1` shapes are the binding contract.

### 6c · F2.UI — the exact-match REBUILD (drop the shared chrome, port the artifact's box)

Review feedback was that the shared `InkModalFrame`/`RitualModalFrame` chrome made the box, buttons, and
scrim diverge from the mockup. Both modals were **rebuilt to render the `modal-stage.html` `.record` / `.rite`
boxes, buttons, and scrim verbatim** (tokenised), inside a bespoke shell — matching the artifact 1:1.

- **New:** `src/ui/modals/ModalShell.tsx` (body portal + the artifact `.f2Scrim` scrim + `useDialogFocusTrap`
  + Esc + body-scroll lock + scrim-click-close), `src/ui/modals/modalMarks.tsx` (the 9 mini-icons + edge-glyph
  + rarity seal + tier plate), `src/ui/modals/f2Modal.scss` (the shared scrim · `.btn` · `.chip` · gold `.gframe`).
- **Rewrote** `ItemDetailInspector.{tsx,scss}` (the `.record` + the r-mortal→r-immortal frame grades + carved
  corners) and `RitualCeremonyShell.{tsx,scss}` (the `.rite` + lintel chop + reveal-main + stakes + jade exit).
- **Built via orchestration:** the 3 big SCSS sheets were ported in parallel by a workflow (shared / record /
  rite — scoped under `.f2Scrim`, every colour a token, zero raw hex), then I wrote the surface-bound markup;
  a 3-lens adversarial verify (fidelity / a11y+render-only / token+layout) returned **all PASS**.
- **Dropping the shared frame is allowed:** `ritualModalConsumerGuard` only governs the 4 legacy modals, not
  the ceremony shell. My own S6 contracts were updated to the new structure (RitualModalFrame→ModalShell;
  `affix ${kind}` / `className="av"` / `.cd.up`/`.cd.down`) with every behavioral assertion preserved.
- **Render-only / a11y intact:** no store, no RNG; `role="dialog"` + aria + focus-trap + Esc + scroll-lock;
  reduced-motion freezes the scenes via both the media query and the FxQuality `.f2Scrim--still` path.
- **Verified:** typecheck ✓ · check:icons ✓ · validate:content ✓ · test:contracts **538/538** ✓ · build ✓.
  The artifact-vs-impl comparison sheets (`docs/release/qa/f2-modals/compare/`) show the box, gold frame,
  carved corners, lintel chops, buttons, reveal, stakes, and all 5 scenes matching the mockup; the only
  remaining delta is the artifact harness drawing a dimmed caller game-screen behind the scrim (in-game the
  modal overlays the real screen). Surface data stays surface-bound (no artifact placeholder literals).
