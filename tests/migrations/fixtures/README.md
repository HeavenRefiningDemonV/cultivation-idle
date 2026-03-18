# Migration Fixtures

- `current-save.json`: save fixture already on the current save version.
- `legacy-unversioned-save.json`: save fixture with no version field to exercise legacy-unversioned migration handling.
- `legacy-path-only.json`: selectedPath missing, lifePath present.
- `legacy-path-conflict.json`: selectedPath and lifePath disagree.
- `legacy-gate-item-ids.json`: legacy gate item IDs present in inventory containers.
- `legacy-future-slice.json`: progress beyond the semester content cap.
- `legacy-hidden-prestige.json`: deferred prestige purchases present.
- `legacy-trial-mismatch.json`: realm advancement contradicts gate/trial proof state.
- `legacy-partial-reset-residue.json`: obvious clean-life residue across per-life systems.
- `legacy-offline-split.json`: multiple offline timestamp fields disagree.
