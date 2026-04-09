# Section C Baseline Screenshot Index (P3-12A refresh)

This index tracks screenshot evidence truth for the nine canonical Section C surfaces. It does **not** grant cleanup authority.

## Run context (P3-12A)
- Audit command: `npm run release:section-c-evidence-audit:json`
- Audit result: **FAIL** (required evidence PNG files missing across all nine targets)
- Capture automation attempt: **FAILED** in this environment (Playwright/Chromium unavailable)
- Capture baseline remains: **manual screenshots + human reviewer signoff**

## Surface tracker
| surface id | capture status | reachability truth | truth-slot rule | required evidence present? | cleanup status |
| --- | --- | --- | --- | --- | --- |
| `life-start-path` | pending | live | `03-truth-states.png` = N/A | no | deferred |
| `life-start-heart-law` | pending | live | `03-truth-states.png` required | no | deferred |
| `life-start-breath-focus` | pending | forced-only harness hold (transient in live flow) | `03-truth-states.png` = N/A | no | deferred |
| `dao-heart-law` | pending | live | `03-truth-states.png` required | no | deferred |
| `dao-heart-study` | pending | live | `03-truth-states.png` optional; explicit N/A when omitted | no | deferred |
| `change-heart-law` | pending | state-gated/harnessed | `03-truth-states.png` required | no | deferred |
| `prestige-ritual` | pending | live | `03-truth-states.png` required | no | deferred |
| `current-chapter-exhausted` | pending | state-gated/harnessed | `03-truth-states.png` = N/A | no | deferred |
| `life-summary` | pending | state-gated/harnessed (`current` mode only) | `03-truth-states.png` required | no | deferred |

## Evidence debt summary
- Missing required PNG slots: all required files for all nine surfaces.
- No optional narrow captures are present.
- No surface can pass G1 in the signoff sheet yet.

## Historical traceability
- Keep prior C.12 closeout notes as historical evidence-limited context.
- P3-12A is an evidence audit/refresh packet and does not retroactively claim screenshot proof.
