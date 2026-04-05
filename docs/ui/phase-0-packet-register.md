# Phase 0 Packet Register

This register is sequencing truth, not proof of implementation. Packet completion still requires packet-specific QA and acceptance evidence. Destructive cleanup remains blocked by default until later cutover approval.

| Packet ID | Title | Depends on | Intended output | Owner | Status | Evidence / notes |
| --- | --- | --- | --- | --- | --- | --- |
| P0-00 | Source lock and merge-law publication | — | Publish the non-destructive operating rule set. | TBD | done | Governed by `docs/ui/phase-0-source-lock.md` and this register. |
| P0-01 | Destructive-migration audit | P0-00 | Identify files / deltas that currently weaken screens. | TBD | done | See `docs/ui/phase-0-destructive-migration-audit.md` and `docs/ui/phase-0-destructive-migration-ledger.json`. |
| P0-02 | Screenshot baseline and review folder | P0-00 | Create before-state evidence for all recovery targets. | TBD | in progress | Baseline docs/manifest/folder created; all mandatory screenshot slots currently blocked in this runtime (see `docs/ui/phase-0-screenshot-baseline.md`). |
| P0-03 | Shared-chrome regression rollback | P0-01 | Quarantine duplicated headers / temporary shell owners. | TBD | in progress | Header-channel quarantine landed for World/Techniques/Prestige; screenshot witness capture blocked in runtime (see `docs/ui/phase-0-shared-chrome-regression-rollback.md`). |
| P0-04 | Path / Life Start recovery | P0-01, P0-02, P0-03 | Restore first-contact scenic ownership. | TBD | in progress | Runtime hardening landed; report/evidence folder added; screenshot capture remains manual-pending (`docs/ui/phase-0-p0-04-path-life-start-recovery.md`). |
| P0-05 | Cultivation recovery | P0-01, P0-02, P0-03 | Restore sacred center without doing later-phase hero completion work. | TBD | in progress | Local ownership hardening landed; report/evidence folder added; screenshot evidence remains manual-pending (`docs/ui/phase-0-p0-05-cultivation-recovery.md`). |
| P0-06 | Status recovery | P0-01, P0-02, P0-03 | Restore stable diagnostic surface. | TBD | not started | Recovery order tier 3. |
| P0-07 | World recovery | P0-01, P0-02, P0-03 | Restore city/map ownership and routing readability. | TBD | not started | Recovery order tier 4. |
| P0-08 | Manual Pavilion recovery | P0-01, P0-02, P0-03 | Restore shelf/spine ownership and stability. | TBD | not started | Recovery order tier 5. |
| P0-09 | Techniques recovery | P0-01, P0-02, P0-03 | Restore Inner Palace / altar ownership and slot stability. | TBD | not started | Recovery order tier 6. |
| P0-10 | Apothecary recovery | P0-01, P0-02, P0-03 | Restore preparation-room identity and pouch clarity. | TBD | not started | Recovery order tier 7. |
| P0-11 | Forge recovery | P0-01, P0-02, P0-03 | Restore workshop ownership and side/detail stability. | TBD | not started | Recovery order tier 8. |
| P0-12 | Bounties & Expeditions recovery | P0-01, P0-02, P0-03 | Restore paper-board / route-slip support identity. | TBD | not started | Recovery order tier 9. |
| P0-13 | Prestige recovery | P0-01, P0-02, P0-03 | Restore decree-like reincarnation surface. | TBD | not started | Recovery order tier 10. |
| P0-14 | Universal cutover-gate publication | P0-04..P0-13 | Turn recovery lessons into one locked checklist. | TBD | not started | Must not unlock broad cleanup. |
| P0-15 | Phase 0 exit audit and handoff | P0-14 | Prove the branch is visually safe for Phase 1. | TBD | not started | Exit proof packet after gate publication. |
