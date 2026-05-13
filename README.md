# Cultivation Idle — Pavilion Information Upgrade

This is a drop-in patch bundle for the Pavilion / Records guidance problem.

## What it does

- Replaces the shallow `pavilion_records.json` with v1.1 actionable guidance.
- Adds new player guidance fields: quick rule, when to read, action steps, readiness checks, best sources, fallback sources, numbers to watch, and diagnosis.
- Updates Pavilion normalization/types/rendering so the new fields appear in the record scroll.
- Updates generated runtime records so items, techniques, cities, trials, ruins, recipes, blueprints, bounties, expeditions, prestige upgrades, etc. no longer read like debug labels.
- Adds docs explaining the new content model and the files that house Pavilion information.

## Apply

From the root of your actual repo:

```bash
/path/to/this/bundle/apply_pavilion_info_upgrade.sh .
npm install
npm run validate:content
npm run typecheck
npm run check:icons
npm run build
```

## Files changed

See `PATCH_MANIFEST.json` and `docs/Pavilion/Pavilion_Info_Upgrade_Handoff.md`.
