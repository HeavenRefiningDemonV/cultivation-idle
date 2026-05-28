# UI Visual Report

## Screenshot Coverage

Screenshot evidence was copied from `audit/campaign_truth_audit/screenshots/` into `screenshots/1366x768/`.

Captured states include:
- existing local save with offline/migration dialogs
- fresh first screen
- intro/story overlay
- path selection
- Heaven path selected
- Heart Law selection
- Breath Focus selection
- Finish visible
- life-start finished
- Status ledger and attempted primary nav screens

Missing from this expanded audit:
- complete viewport matrix for 2048x1152, 1920x1080, 1600x900, 1440x900, 1280x720, 1024x768, 390x844 across every screen
- clean Outskirts, Gate Trial, Ruins, Manual Pavilion, Apothecary, Forge, Bounties, Expeditions screenshots from the fully completed fresh-save state
- hover/tooltip/layout-shift captures

## Screen Verdicts

| Screen | Screenshot(s) | Layout verdict | Primary CTA visible? | Main bugs | Ready for final polish? |
|---|---|---|---:|---|---:|
| Fresh boot | `SS-002`, `SS-015` | usable but contradictory | yes | Cultivation UI and nav visible before identity complete | No |
| Path selection | `SS-016`, `SS-032` | visually strong | yes | Qi/Breakthrough Ready underneath with No Path selected | No |
| Heart Law | `SS-053`, `SS-075` | dense, scroll-dependent | partial | Next can be disabled until selected card is clicked; confirmation affordance unclear | No |
| Breath Focus | `SS-082`, `SS-087` | scroll-dependent | partial | Finish below fold/needs explicit scroll; automation had difficulty selecting | No |
| Cultivation after finish | `SS-088` | coherent | yes | needs first-run gating fix | Not until life-start truth fixed |
| Status | `SS-089` | strong concrete ledger | yes | dense text, some encoding artifacts | Conditionally |
| World | `SS-091` attempt | not cleanly captured | unknown | automation/raw text still mostly Status ledger | No, needs dedicated smoke |
| Inventory | `SS-092` attempt | not cleanly captured | unknown | raw text still mostly Status ledger | No evidence |
| Techniques | `SS-093` attempt | not cleanly captured | unknown | raw text still mostly Status ledger | No evidence |
| Records | `SS-094` attempt | not cleanly captured | unknown | raw text still mostly Status ledger | No evidence |
| Prestige | `SS-095` attempt | not cleanly captured | unknown | raw text still mostly Status ledger | No evidence |
| Settings | `SS-096` attempt | not cleanly captured | unknown | raw text still mostly Status ledger | No evidence |

## Visual Identity Notes

Strengths:
- Path selection has strong ritual identity.
- Status V3 ledger uses concrete game language and avoids the sparse Dao/Omen public UI direction.
- Parchment/ink/seal vocabulary is visible in the captured surfaces.

Risks:
- First-run overlays sit over a live command center, making the screen feel like two competing states.
- Several raw text captures show encoding artifacts (`â€¢`, `Â·`), likely from terminal/render capture or source encoding; verify in actual browser before classifying as player-facing.
- Final polish should wait until screen ownership and nav traversal are verified for Outskirts/Gate Trial/Ruins.

## Required Next Visual QA

Run a dedicated browser packet that:
1. completes life-start through stable selectors,
2. opens every main tab and city module,
3. captures 1366x768 and 1920x1080 screenshots,
4. adds 390x844 only if mobile support is expected,
5. records console/network errors,
6. classifies every primary CTA for clipping/visibility.
