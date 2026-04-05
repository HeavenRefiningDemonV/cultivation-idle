# UI Cutover Merge Checklist

## Purpose
This is the merge-evidence checklist for UI packets that request cleanup or claim cutover readiness.

## When this checklist is required
Required for packets that:
- request removal of old conflicting layers;
- claim cleanup readiness;
- propose deleting duplicate old/new framing.

Not required for:
- docs-only packets;
- infra-only packets;
- additive-only packets with no cleanup request.

## Required packet metadata
- packet id
- target screen id
- human label
- family
- touched layers
- retained old layer(s)
- screenshot folder path
- signoff sheet block reference

## Required merge evidence
- packet-goal paragraph
- preserve/enhance/defer summary
- “what old layer still remains and why” note
- screenshot pack
- QA result note
- explicit destructive-cleanup statement

## Required destructive-cleanup statement
Use exactly one:

- `No destructive cleanup occurred in this packet.`
- `Destructive cleanup occurred only after the exact target screen passed the legal cutover gate; the satisfied criteria are listed below.`

If cleanup occurred, list satisfied criterion ids and signoff record path.

## Merge blockers
- cleanup request without screenshot pack
- cleanup request without signoff sheet block
- cleanup request without preserve/enhance/defer summary
- cleanup request without “old layer still remains and why” note
- cleanup request without explicit cleanup statement
- cleanup request on infra-only or docs-only packet
- cleanup request that cites no exact target screen

## Cross-links
- `docs/ui/phase-0-p0-14-universal-cutover-gate.md`
- `docs/ui/section-a-cutover-gate.md`
- `docs/ui/section-a-screenshot-approval-workflow.md`
- `docs/release/ui_screen_signoff_sheet.md`
- `docs/release/ui_cutover_red_flags.md`
