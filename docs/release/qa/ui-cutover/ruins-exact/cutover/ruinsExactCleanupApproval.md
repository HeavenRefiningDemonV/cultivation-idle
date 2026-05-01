# Ruins Exact cleanup approval gate (Packet 13)

- Surface: `ruins`
- Packet: `13`
- Authority file: `ruinsExactCleanupApproval.json`
- Current status: **BLOCKED**

## Rule
Cleanup/destructive removal is allowed **only** when `status = APPROVED_FOR_EXACT_CLEANUP` in the JSON authority file.

## While BLOCKED
- Keep old combat-path files quarantined (non-player-facing) and do not force-delete them.
- Do not remove the preflight guardrail in `phase-6-combat-preflight/02-ruins/README.md`.

## What approval means
Approval means all required evidence is present and passes audit for the current player-facing exact route:

`WorldBuildingModal -> RuinsBuildingPanel -> RuinsScreenOwner -> RuinsExactMockupScreen`

Approval does **not** permit gameplay, rewards, pity, store semantics, or content JSON changes.
