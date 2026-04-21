# Outskirts P0 review anchor sheet (exact target fixture)

This sheet locks the approved realistic target fixture and explicitly separates visible anchors from internal placeholders.

## Screenshot-authoritative visible anchors
- Header/plaque/subtitle:
  - `Outskirts` / `Outskirts` / `Gold and common materials`
- Tactical strip:
  - HP `2,860 / 3,120`
  - Danger `Low · Lv. 11`
  - Loadout `Set 2`
  - AI Profile `Balanced`
  - Healing `12 / 20`
  - Bounty `Wolf Pelt 7/15`
  - Expedition `2 Idle`
- Setup card:
  - `Your Setup`
  - Loadout Set `2`
  - AI Profile `Balanced`
  - Attack Focus `Balanced`
  - ATK `318`, ACC `92%`, CRIT `18%`
  - HP `3,120`, EVA `84%`, RES `76%`
  - Medicine Pouch `12 / 20`
- Encounter identity:
  - selected id `snarling-wolf`
  - `Snarling Wolf`, `Lv. 11`, safety `Safe`
- Encounter strip order/state/levels:
  - Quiet Glade Lv. 8 (completed)
  - Rockjaw Boar Lv. 9 (completed)
  - Snarling Wolf Lv. 11 (current)
  - Venomcoil Lv. 13 (future)
  - Shade Stalker Lv. 15 (future)
  - Mire Serpent Lv. 17 (future)
- Rewards card:
  - `Expected Rewards`
  - Gold `1,250 – 1,480`
  - Common materials: Wolf Pelt, Beast Bone, Green Herb, Spirit Stone
  - Tracked bounty item `Wolf Pelt`
  - Helper `Defeat wolves in the Outskirts`
  - Progress `7 / 15`
  - Efficiency `~45s / run`, `1,800 – 2,000 / hour`
  - Auto-Repeat `On`
- Bottom:
  - CTA `Start Hunt`
  - `Grind Summary`
  - Scope `This Area`
  - Runs `128`
  - Gold / hr `1,900`
  - Main Drop `Wolf Pelt`

## Deterministic but not directly visible/internal placeholders
- Equipment names are deterministic placeholders (`Steel Sword`, `Field Robe`, etc.) and are not screenshot-legible authority.
- `scenicArtKey` / `scenicBackgroundKey` are deterministic placeholder keys for fixture serialization only.
- `killsSinceBoss`/`killsToBoss` are deterministic internal counters and do not override screenshot authority.

## Intentionally not over-guessed
- Macro top ribbon node gameplay semantics.
- Exact equipment item identities from production inventory.
- Internal scenic asset IDs and runtime provenance.
