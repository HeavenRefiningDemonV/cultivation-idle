# MP0 Artifact Manifest

Generated: 2026-05-28
Branch: Latest
Commit: 969de0ab4602a37ba3edf6ed6233419328f21924

| Artifact | Path | Produced by | Purpose |
|---|---|---|---|
| Git context | `artifacts/mp0/baseline/git-context.md` | preflight | Branch, commit, and dirty-state baseline |
| Command log | `artifacts/mp0/command-log.md` | MP0 report | Command matrix summary |
| Typecheck baseline | `artifacts/mp0/logs/typecheck.before.log` | `npm run typecheck` | TypeScript baseline |
| Typecheck final | `artifacts/mp0/logs/typecheck.final.log` | `npm run typecheck` | Final TypeScript proof |
| Icon check baseline | `artifacts/mp0/logs/check-icons.before.log` | `npm run check:icons` | Icon/emoji guardrail baseline |
| Icon check final | `artifacts/mp0/logs/check-icons.final.log` | `npm run check:icons` | Final icon/emoji proof |
| Content validation baseline | `artifacts/mp0/logs/validate-content.before.log` | `npm run validate:content` | Runtime content validation |
| Content validation final | `artifacts/mp0/logs/validate-content.final.log` | `npm run validate:content` | Final content validation proof |
| Build baseline | `artifacts/mp0/logs/build.before.log` | `npm run build` | Build status and warnings |
| Build final | `artifacts/mp0/logs/build.final.log` | `npm run build` | Final build proof |
| Contract pre-fix | `artifacts/mp0/logs/test-contracts.before.log` | `npm run test:contracts` | Reproduces TS5033 fixture-output failure |
| Contract post-fix | `artifacts/mp0/logs/test-contracts.after-2b.log` | `npm run test:contracts` | Shows fixture-output and Pavilion root blockers removed; real contract failures remain |
| Contract final repeat | `artifacts/mp0/logs/test-contracts.final-repeat.log` | `npm run test:contracts` | Repeat reached non-fixture failures and timed out in existing broad contract debt |
| Trial lifecycle pre-fix | `artifacts/mp0/logs/trial-lifecycle.before.log` | direct Node test | Reproduces PavilionContent root-shape failure |
| Trial lifecycle post-fix | `artifacts/mp0/logs/trial-lifecycle.after-2.log` | direct Node test | Confirms lifecycle fixture command passes twice |
| Release gate run 1 | `artifacts/mp0/release/release-gate.after-1.json` | `npm run release:gate:json` | First final release gate JSON |
| Release gate run 2 | `artifacts/mp0/release/release-gate.after-2.json` | `npm run release:gate:json` | Repeat release gate JSON |
| MP0 release summary | `artifacts/mp0/release/release-gate.mp0-summary.json` | MP0 extraction | Branch/commit/status wrapper for final gate evidence |
| npm audit baseline | `artifacts/mp0/logs/npm-audit.before.json` | `npm audit --audit-level=moderate --json` | MP5 security/dependency baseline |
| Readiness doc | `docs/release/current_readiness.md` | MP0 docs | Current release decision and blockers |
| MP0 report | `docs/release/mp0_baseline_report.md` | MP0 docs | Packet evidence report |
