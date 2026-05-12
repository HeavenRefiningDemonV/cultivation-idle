# Status Dashboard Truth, Layout, and Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Status a live diagnostic command center, close the bottom-nav layout gap, and promote the Status bottom navigation treatment globally.

**Architecture:** Add one `StatusDashboardSurfaceV1` read model that adapts existing Run Compass, troubleshooting, activity, combat, bounty, expedition, and queue state. `StatusScreen` renders that single surface. The bottom nav gets one canonical `bottomNavDock--inkPlaque` variant used for every tab.

**Tech Stack:** React, TypeScript, Zustand, SCSS, Node test runner, Vite.

---

### Task 1: Surface Contract

**Files:**
- Add: `tests/contracts/statusDashboardSurface.test.ts`
- Create: `src/systems/ui/status/statusDashboardSurface.ts`
- Create: `src/ui/status/useStatusDashboardSurface.ts`

- [x] Write a failing contract test for no filler rows, current work, typed requirements, dynamic milestone nodes, and global nav class.
- [x] Run the contract test and confirm it fails because `statusDashboardSurface` does not exist.
- [ ] Implement `StatusDashboardSurfaceV1` as a read-only surface builder.
- [ ] Add a hook that subscribes to relevant Zustand slices and rebuilds the surface.
- [ ] Run the contract test and confirm it passes.

### Task 2: Status Rendering

**Files:**
- Modify: `src/components/screens/StatusScreen.tsx`
- Modify: `src/ui/status/statusDashboardModel.ts`

- [ ] Replace mixed JSX store assembly with `useStatusDashboardSurface`.
- [ ] Render milestone nodes from `surface.milestone.nodes`.
- [ ] Render requirement icons/actions from each requirement row.
- [ ] Add the current work region.
- [ ] Remove visible filler and generic reason labels.

### Task 3: Responsive Layout

**Files:**
- Modify: `src/components/screens/StatusScreen.scss`

- [ ] Make root/canvas fill `gameLayoutContent`.
- [ ] Replace capped grid height with flexible full-height grid tracks.
- [ ] Use `clamp()`/`minmax()` for density.
- [ ] Preserve controlled scroll only for constrained viewports.

### Task 4: Unified Navigation

**Files:**
- Modify: `src/components/BottomTabBar.tsx`
- Modify: `src/ui/shell/BottomNavDock.scss`

- [ ] Add canonical `bottomNavDock--inkPlaque`.
- [ ] Alias existing Status nav styles to the canonical class.
- [ ] Make `BottomTabBar` always use the canonical class.
- [ ] Preserve `aria-current="page"` semantics.

### Task 5: Verification

**Commands:**
- `npm run ensure:vendor-links; node .\node_modules\typescript\bin\tsc --project tsconfig.tests.json; $env:NODE_OPTIONS='--loader=./scripts/relativeJsLoader.mjs'; node --test tmp-tests/tests/contracts/statusDashboardSurface.test.js`
- `npm run typecheck`
- `npm run check:icons`
- `npm run build`
- Playwright screenshots at 1366x768, 1920x1080, 2048x1152, and 2560x1440.
