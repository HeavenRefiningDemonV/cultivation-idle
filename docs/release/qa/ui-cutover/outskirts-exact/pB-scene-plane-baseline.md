# Packet B — Scenic scene-plane conversion baseline (2026-04-22)

## Scope
Packet B only: scenic center ownership rewrite and encounter-driven integrated scene plane.
No Packet C/D/E visual tuning was performed.

## What changed
- Center scenic region no longer renders a framed scenic card model.
- Scenic rendering now uses scene-plane layers (`base`, optional `encounter`, atmosphere/mist/edge-fade).
- Encounter ID now drives scene variant selection and encounter layer binding.
- Review and live modes both render through the same scene-plane structure.

## Evidence anchors
- Scene slot owner test id: `outskirts-exact-center-scenic-slot`
- Scene plane test id: `outskirts-exact-scene-plane`
- Base layer test id: `outskirts-exact-scene-layer-base`
- Optional encounter layer test id: `outskirts-exact-scene-layer-encounter`

## Runtime limits in this runner
- Browser screenshot capture tooling is unavailable in this environment, so this packet relies on source truth + contract tests + build output.
