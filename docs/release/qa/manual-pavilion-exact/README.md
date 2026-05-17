# Manual Pavilion Exact P0 QA

The Manual Pavilion exact screen is implemented as a screen-owned World building menu with fixture and live modes. Automated capture scripts are intentionally deferred for this first pass because the existing release capture harnesses are surface-specific and require a dedicated Manual Pavilion fixture route runner. The focused contract and action tests cover the surface contract, modal routing, pure-screen guardrails, six-spine selection, and action controller dispatch.

## Manual QA Steps

1. Run `npm run dev`.
2. Navigate to World, select Pinewind Hamlet, and open Manual Pavilion.
3. Confirm the exact page fills the world modal body and the old context-strip header is absent.
4. Confirm the bottom app navigation is not rendered inside the exact surface.
5. Confirm top ribbon, build-gap banner, left ledger, six spines, scroll inspector, and bottom economy strip are visible at 2048x1152.
6. Select every spine and confirm the inspector updates without changing spine width or shelf geometry.
7. Click Refresh Stock in ready and cooldown states where possible.
8. Buy an affordable manual and confirm the store-owned sold state updates.
9. Buy a duplicate if available and confirm fragment conversion messaging.
10. Open Manual Satchel from the bottom strip.
11. Click View in Techniques and confirm the World building menu closes and Techniques receives focus.
12. Reopen Manual Pavilion and click Return to World.

## Evidence Paths

- Before screenshot captured during implementation: `output/manual-pavilion-before/manual-pavilion-before.png`
- Final screenshots should be stored here when a dedicated release capture script is added.
