# MP5 Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an evidence-backed MP5 release signoff for Cultivation Idle without changing story, menu polish, gameplay ownership, or xianxia visual direction.

**Architecture:** Treat `artifacts/mp5/**` and `docs/release/**` as the primary output surfaces. Change source, scripts, dependencies, or CI only when a release blocker is proven by current command output.

**Tech Stack:** React, TypeScript, Vite, Zustand, npm scripts, Playwright evidence where Browser tooling is unavailable.

---

### Task 1: Preflight And Previous Packet Gate

**Files:**
- Create: `artifacts/mp5/preflight/previous-packet-verification.json`
- Create: `artifacts/mp5/preflight/previous-packet-verification.md`
- Create: `artifacts/mp5/preflight/git-context-before.md`
- Create: `artifacts/mp5/preflight/package-scripts.md`
- Create: `artifacts/mp5/preflight/plugin-availability.json`

- [x] Read `AGENTS.md`.
- [x] Inspect `package.json` scripts.
- [x] Record branch, commit, dirty status, and diff stat.
- [x] Inspect MP4 final and after artifacts.
- [x] Rerun MP4 minimum verification commands.
- [x] Write previous-packet verification artifacts before implementation edits.

### Task 2: Release Gate And Fresh-Run Evidence

**Files:**
- Create: `artifacts/mp5/release-gate/*`
- Create: `artifacts/mp5/commands/*`
- Modify only if required: `scripts/release/**`

- [ ] Run the current release gate and capture before output.
- [ ] Diagnose any timeout or failed subcheck without lowering severity.
- [ ] Inspect fresh-run manual coverage ingestion and classify the remaining warning.
- [ ] Edit release scripts only if a current blocker proves a deterministic script bug.
- [ ] Rerun affected commands and write final release-gate status.

### Task 3: Security, Build, CI, And Observability

**Files:**
- Create: `artifacts/mp5/security/*`
- Create: `artifacts/mp5/build/*`
- Create: `artifacts/mp5/observability/*`
- Create or modify only if safe: `.github/workflows/**`
- Modify only if required: `package.json`, `package-lock.json`, build config, Sentry config

- [ ] Run `npm audit --audit-level=moderate` before.
- [ ] Apply only safe dependency or lockfile remediations.
- [ ] Rerun audit and baseline validation.
- [ ] Capture build warnings and classify asset, Browserslist, and chunk warnings.
- [ ] Configure CodeQL/artifact upload if the repo lacks workflows and the change is low risk.
- [ ] Document Sentry unavailable/setup status unless credentials and tooling are present.
- [ ] Run a light secrets/security scan and document results.

### Task 4: UI Evidence And Final Signoff

**Files:**
- Create: `artifacts/mp5/browser/*`
- Create: `artifacts/mp5/final/*`
- Modify: `docs/release/current_readiness.md`
- Modify: `docs/release/known_issues.md`
- Modify: `docs/release/go_no_go_checklist.md`
- Create: `docs/release/mp5_release_hardening_final_report.md`

- [ ] Run Playwright/browser smoke after hardening changes.
- [ ] Capture screenshots, DOM summaries, console summary, and network summary.
- [ ] Run final command suite and write `command-results.json`.
- [ ] Write waiver ledgers with owner, evidence, mitigation, and expiry.
- [ ] Write final GO/NO_GO report using the exact MP5 decision language.
