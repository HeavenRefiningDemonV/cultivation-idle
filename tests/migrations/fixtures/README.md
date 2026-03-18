# Migration Fixtures

- `current-save.json`: save fixture already on the current save version and using canonical `selectedPath`, canonical `gate_*` inventory truth only, and packet-1.4 trial lifecycle fields.
- `legacy-unversioned-save.json`: save fixture with no version field to exercise legacy-unversioned migration handling.
- `legacy-path-only.json`: canonical `selectedPath` missing, legacy `lifePath` present.
- `legacy-path-conflict.json`: canonical `selectedPath` and legacy `lifePath` disagree.
- `legacy-gate-item-ids.json`: legacy gate item IDs present in inventory containers as migration input; apply-mode migration must remap them into canonical `gate_*` IDs.
- `legacy-future-slice.json`: progress beyond the semester content cap.
- `legacy-hidden-prestige.json`: deferred prestige purchases present.
- `legacy-trial-mismatch.json`: intentional packet-1.4 legacy contradiction where realm advancement already crossed the first gate without matching clear/proof state; apply-mode migration should normalize it to `bypassed`.
- `legacy-partial-reset-residue.json`: obvious clean-life residue across per-life systems.
- `legacy-offline-split.json`: multiple offline timestamp fields disagree.
