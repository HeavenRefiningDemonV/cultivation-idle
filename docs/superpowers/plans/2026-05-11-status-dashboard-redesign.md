# Status Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Status tab in place so it matches the approved parchment dashboard mockup while preserving existing Status, Run Compass, and troubleshooting functionality.

**Architecture:** Keep game truth in existing read models and stores. Add one small pure helper module for display-only dashboard calculations, then replace the Status screen composition and SCSS with the approved dense three-column layout.

**Tech Stack:** React, TypeScript, Vite, Zustand selectors, lucide-react icons, existing content/readiness/economy stores.

---

### Task 1: Dashboard Display Helpers

**Files:**
- Create: `src/ui/status/statusDashboardModel.ts`
- Test: `tests/contracts/statusDashboardModel.test.ts`

- [ ] Write a failing contract test for combat metric derivation, action row state, and issue tone classification.
- [ ] Run the focused test and confirm it fails because the helper module does not exist yet.
- [ ] Implement `buildStatusCombatMetrics`, `getRunCompassActionState`, and `classifyDashboardIssueTone`.
- [ ] Run the focused test and confirm it passes.

### Task 2: Status Screen Rebuild

**Files:**
- Modify: `src/components/screens/StatusScreen.tsx`
- Modify: `src/components/screens/StatusScreen.scss`

- [ ] Replace the old chamber layout with a dashboard shell: top banner, combat strip, three-column grid, and bottom-safe spacing.
- [ ] Map existing `buildStatusTroubleshootingSurface` and `useRunCompassSurface` data into Milestone, Readiness, Mission Requirements, Best Next Actions, Safety Net, Identity & Attributes, Status Overview, and Preparation Summary panels.
- [ ] Keep all action buttons wired through `performRunCompassAction`; do not add new reward or combat logic.
- [ ] Use low-radius paper cards, muted ink text, jade CTAs, warning bands, and responsive stacking.

### Task 3: Verification

**Files:**
- Verify all changed files.

- [ ] Run the focused status dashboard model test.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Start or reuse a local Vite server and capture a Status screenshot at desktop size.
- [ ] Inspect the screenshot for mockup parity: dense parchment layout, no overlapping text, visible action routes, bottom nav clear of content.
