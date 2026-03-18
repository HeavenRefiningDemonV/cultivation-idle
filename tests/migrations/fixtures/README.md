# Migration Fixtures

- `current-save.json`: save fixture already on the current save version and using canonical `selectedPath` plus canonical `gate_*` inventory truth only.
- `legacy-unversioned-save.json`: save fixture with no version field to exercise legacy-unversioned migration handling.
- `legacy-path-only.json`: canonical `selectedPath` missing, legacy `lifePath` present.
- `legacy-path-conflict.json`: canonical `selectedPath` and legacy `lifePath` disagree.
- `legacy-gate-item-ids.json`: legacy gate item IDs present in inventory containers as migration input; apply-mode migration must remap them into canonical `gate_*` IDs.
- `legacy-future-slice.json`: progress beyond the semester content cap.
- `legacy-hidden-prestige.json`: deferred prestige purchases present.
- `legacy-trial-mismatch.json`: realm advancement contradicts gate/trial proof state.
- `legacy-partial-reset-residue.json`: obvious clean-life residue across per-life systems.
- `legacy-offline-split.json`: multiple offline timestamp fields disagree.
