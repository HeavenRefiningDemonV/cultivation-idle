# Forge Menu — Step 0B Guardrails + Redesign Plan Skeleton

> **Scope**: Planning only. No UI refactors, no behavior changes, no logic changes in this step.

## Guardrails (non-negotiable)

### A) Hard constraints
- **No changes to forging math / RNG / output tables** in Step 0 or Pass 1. (Forge outcome logic + temper RNG stay intact.)【F:src/systems/crafting/forgeOutcome.ts†L1-L220】【F:src/services/forgeService.ts†L52-L120】
- **No changes to save format / persisted state keys** (e.g., `craftSessionState`).【F:src/stores/craftSessionStore.ts†L34-L69】【F:src/utils/saveload.ts†L168-L182】
- **No changes to inventory spend logic** (stay in `professionStore.startForgeJob` + `RewardService.spendCurrency`).【F:src/stores/professionStore.ts†L531-L578】
- **No new heavy UI libraries** (stick to existing React + SCSS + Headless UI patterns already in repo).【F:package.json†L12-L30】
- **Performance first**: avoid per-frame rerenders and layout thrash; keep animation layers light and CSS-first.

### B) UX constraints (forge identity + focus)
- **Progressive disclosure**: avoid “everything at once”; each decision should be staged.
- **Crafting is the hero event**: sparks/embers moment gets focus; UI quiets around it.
- **Blueprint browsing is a separate mode** from forging-in-progress.
- **Short labels + iconography**; no paragraphs or wide information dumps.

### C) Accessibility constraints
- **Buttons remain `<button>`** (no div-clicks).
- **Keyboard navigation** remains: tab order logical, Shift+Tab works.
- **Focus rings** remain visible on panels/spines.
- **Tooltips cannot be required** to operate core flows.
- **`prefers-reduced-motion`** honored for major animations (follow existing patterns in SCSS).【F:src/ui/forge/ForgeHeatPullOutQTE.scss†L110-L123】

---

## Redesign plan skeleton (next passes)

### Current problems (from prompt note #6)
- Too much stuff shown at once (clutter).
- Not enough blacksmith / workshop identity.
- Crafting doesn’t feel like an event.
- Steps aren’t visually staged; feels like a spreadsheet UI.

### Target structure (final layout concept)

#### MODE A — Browse Blueprints (lightweight)
- Left **blueprint rack / scroll book** list (icon + short label).
- Compact **category chips** (not huge filter stacks).
- **Quick preview card** (small, iconography-forward). 
- Selecting a blueprint transitions to forging focus.

#### MODE B — Forging Focus (hero moment)
- Main area becomes a **workshop bench**:
  - material slots
  - craft gauge
  - success/quality meter
  - single obvious **Forge** action
- Result moment: **sparks + glow + stamp/seal** animation.
- After crafting: **result panel** with “Equip / Store / Salvage” actions.

### Stage geometry rules
- **Safe zones** over background art:
  - Left rail = blueprint rack
  - Center altar/bench = forging focus
  - Right strip (optional) = short outcome/queue
- **Scrolling**: one internal scroll container; no page scroll.
- **Responsive**: collapse left rail to top rail on narrow widths; keep forge focus centered.

### Visual language rules
- **Parchment panels** with ink-wash edges.
- **Brass/gold accents** for primary actions (Forge button, success glow).
- **Subtle smoke/ember ambient VFX** (very light, CSS-first).
- **Rare outcomes** use a “breathing” aura similar to Manual Pavilion rare spines.【F:src/components/screens/ManualPavilionPanel.scss†L492-L531】

### Data mapping rules (avoid hardcoded spaghetti)
- Blueprint → icon mapping by type/category.
- Material slot icons mapped by item category.
- Outcome rarity indicators mapped from item def / blueprint.
- All mapping lives in **one module** and is reused by list + forge focus + result modal.

---

## Pass breakdown checklist
- **Pass 1**: Layout restructure + remove clutter + stage geometry (no logic changes).
- **Pass 2**: Blueprint rack renderer + icon metadata system.
- **Pass 3**: Forging focus mode + progress/result presentation.
- **Pass 4**: Craft feedback + confirmation UI + edge-case hardening.
- **Pass 5**: Theming + VFX + final polish.

## QA checklist
- Selecting blueprint still works.
- Craft consumes correct resources.
- Output is granted correctly via `RewardService.grantRewards`.
- Crafting state recovers after closing/reopening.
- No scroll overlap or panel clipping.
- Reduced-motion mode doesn’t break UI.

