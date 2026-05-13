# Pavilion Information Upgrade Handoff — v1.1 Actionable Guidance

## What changed

The Pavilion copy has been upgraded from short definitions into player-facing guidance. The new content model makes every record answer practical questions:

- What is this?
- Why does it matter now?
- What do I do next?
- What screen or activity owns the solution?
- What numbers should I watch?
- What is the fallback if the best route is sealed, too expensive, or failing?
- What common mistake does this prevent?

This patch keeps the existing Pavilion architecture, but adds richer record fields and teaches the surface builder to render them as explicit sections.

## Located files that house Pavilion information

### Runtime-loaded player guidance
- `public/cultivation_idle_content_bible_v1_config/pavilion_records.json`
  - This is the live manifest loaded by `loadPavilionManifest()`.
  - It now contains 302 enhanced authored records.

### Documentation / content manifest copy
- `docs/Pavilion/Pavilion_of_Ten_Thousand_Records_Content_Manifest.json`
  - Mirror copy of the enhanced runtime manifest.

### Documentation bible
- `docs/Pavilion/Pavilion_of_Ten_Thousand_Records_Content_Bible.md`
  - Existing content bible; should be treated as the editorial overview.

### Runtime-generated record copy
- `src/features/pavilion/buildGeneratedPavilionRecords.ts`
  - Generates records for items, techniques, trials, cities, ruins, enemies, recipes, blueprints, runes, talismans, bounties, expeditions, prestige upgrades, manual pools, apothecaries, and outskirts.
  - This file now gives generated records guidance sections instead of short generic statements.

### Manifest typing and normalization
- `src/features/pavilion/pavilionContentTypes.ts`
  - Adds optional manifest fields such as `quick_rule`, `action_steps`, `readiness_checks`, `best_sources`, `fallback_sources`, `numbers_to_watch`, and `diagnosis`.

### Record surface typing
- `src/features/pavilion/pavilionTypes.ts`
  - Adds normalized camel-case fields for the richer guidance payload.

### Record rendering
- `src/features/pavilion/buildPavilionSurface.ts`
  - Renders new guidance sections: Player Question, Quick Rule, When To Read, What To Do Next, Readiness Checks, Numbers To Watch, Failure Diagnosis, Elder Note, and Prior-Life Note.

### Default fixture entry
- `src/features/pavilion/pavilionPresentation.ts`
  - Makes the fixture Foundation Gate record much more useful and consistent with the new content model.

## New manifest fields

Each authored record may now include:

```json
{
  "player_question": "What should I do with this record?",
  "quick_rule": "The shortest actionable rule.",
  "when_to_read": "When this record becomes useful.",
  "action_steps": ["Concrete next steps"],
  "readiness_checks": ["Checks that tell the player whether this is handled"],
  "best_sources": ["Primary source or route"],
  "fallback_sources": ["Fallback if the primary route is blocked"],
  "numbers_to_watch": ["Specific values to inspect"],
  "diagnosis": ["How this record explains a failure or confusion"],
  "elder": "In-world guidance note.",
  "prior": "Prior-life / reincarnation-facing note."
}
```

The old fields remain in place, so this is additive rather than destructive.

## Editorial standard applied

Every record was expanded to follow this order of usefulness:

1. Actionable meaning before lore.
2. Source/use clarity before flavor.
3. Route buttons before abstract advice.
4. Readiness checks before repeated attempts.
5. Fallback paths before frustration.
6. Current milestone relevance before generic encyclopedia text.

## Resulting copy density

The previous manifest had mostly one-sentence fields. In the enhanced manifest:

- `plain` averages roughly 350+ characters instead of roughly 95.
- `why` averages roughly 250+ characters instead of roughly 78.
- Every authored record now has action steps, readiness checks, best sources, fallback sources, numbers to watch, and diagnosis rows.
- The runtime-generated records now receive guidance sections too, so generated item/technique/trial/city/recipe records no longer read like debug metadata.

## High-impact examples

### Foundation Gate
Now explains:

- final Qi Condensation + Qi cap eligibility
- medicine/loadout/weapon-floor prep
- Gate Foundation Pill as clear or safety-net reward
- breakthrough handoff back to Cultivation
- why repeat attempts are bad unless a diagnosed blocker changes

### Manual Pavilion
Now explains:

- browse manual → buy chosen manual → study → learn technique → equip
- why manual purchase should solve slot/role gaps
- why rarity alone is not enough
- how to route to Techniques after learning

### Medicine Pouch
Now explains:

- inventory pills do not help unless pouch slots and triggers are configured
- why gate failures can be pouch-setup failures rather than item-ownership failures

### Reincarnation / What Resets / What Persists
Now explains:

- the reset contract
- permanent vs per-life vs hybrid state
- why accidental persistence is not a trustworthy meta system

## Validation performed here

- JSON syntax validated for both manifest copies.
- `tsc --noEmit --pretty false` passed in the extracted repo using the available global TypeScript compiler.
- Full `npm run validate:content` could not be completed in this environment because `node_modules` was not present and `decimal.js` could not be resolved. Run that after installing dependencies in the project repo.

## Recommended follow-up

After this patch lands, run:

```bash
npm install
npm run validate:content
npm run typecheck
npm run check:icons
npm run build
```

Then open the Pavilion and inspect these records first:

1. `gate_trials_and_thresholds.foundation_gate`
2. `world_activities_and_buildings.manual_pavilion`
3. `manuals_techniques_and_buildcraft.manual`
4. `manuals_techniques_and_buildcraft.technique`
5. `combat_readiness_and_failure_diagnosis.medicine_pouch`
6. `world_activities_and_buildings.apothecary`
7. `world_activities_and_buildings.forge`
8. `world_activities_and_buildings.ruins`
9. `reincarnation_and_prior_lives.when_to_reincarnate`
10. `reincarnation_and_prior_lives.what_resets`
