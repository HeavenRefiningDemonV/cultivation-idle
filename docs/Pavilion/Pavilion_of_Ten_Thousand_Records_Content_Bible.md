# Pavilion of Ten Thousand Records — Complete Content Bible

**Document type:** exact-entry content bible, UI copy inventory, and data-generation handoff.  
**Project:** Cultivation Idle.  
**Feature:** Pavilion of Ten Thousand Records / Records / Jade Slip Archive.  
**Version:** v1.0 content draft.  
**Date:** 2026-05-09.  

## How to Use This Document
This file contains the player-facing copy model for the Pavilion: global labels, tab names, filter labels, state labels, standard right-rail labels, all hand-authored guide/mechanic/glossary entries, and the generated-entry templates that must cover every content object in the live game.

The distinction between hand-authored and generated records is deliberate. System guides, glossary terms, first-life help, gate guidance, reincarnation explanation, and doctrine explanation are written by hand. Items, recipes, techniques, manuals, enemies, trials, ruins, cities, Heart Laws, runes, talismans, bounties, and prestige upgrades should be generated from content/runtime data so the Pavilion cannot drift away from the actual game.

Critical rule: final requirement values, item IDs, costs, drop rates, recipe inputs, technique numbers, unlock conditions, city reachability, prestige effect status, and active/inactive content state must be resolved from live content and runtime state at implementation time. This document supplies the exact copy structure and default wording, not stale hardcoded gameplay truth.

## Research Anchors
- Factorio's Factoriopedia is the key source/use design reference: it shows ingredients, recipes using the item, and unlock technology in one internal encyclopedia.
- Warframe's quest guide is the current-progress reference: account-linked progress helps players know where to go next.
- Hades' Codex is the in-world voice reference: an authored record that grows deeper as subjects are encountered.
- Melvor Idle is the large-system idle reference: many skills and a large bank/inventory need strong source/sink clarity.
- Magic Research 2 is the reincarnation/restart reference: restarts should be faster, stronger, and legible.
- Xianxia glossary references support the use of Qi, Dantian, meridians, breathing, cultivation base, jade slips, pills, and talismans as theme-accurate language.

## Global UI Copy Inventory

### Main Screen Labels
- **full_title:** Pavilion of Ten Thousand Records
- **short_nav:** Records
- **subtitle:** Jade Slip Archive
- **search_placeholder:** Search the Records
- **top_context_template:** {realm} · {path} · {heartLaw} · {city} · {currentMilestone}
- **archive_completion:** Records Discovered: {recorded} / {total}
- **studied_count:** Studied: {count}
- **mastered_count:** Mastered: {count}
- **breadcrumb_template:** {category} > {subcategory} > {entry}

### Left-Shelf Category Tabs
1. First Steps
2. Current Life
3. Cultivation
4. Gate Trials
5. Cities
6. Activities
7. Combat
8. Manuals
9. Crafting
10. Items
11. Bestiary
12. Bounties
13. Reincarnation
14. Systems
15. Xianxia Glossary

### Filter Chips
Needed Now, Needed Soon, Recorded, Studied, Mastered, Sealed, Rumored, Path: Heaven, Path: Earth, Path: Martial, City, Source, Used For, Rarity, Activity, Missing, Safe to Sell, Do Not Sell

### Standard Entry Section Labels
Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Recommended Prep, Common Mistakes, Best Source, Fallback Source, Related Records, Prior-Life Note, Elder Note, Route Buttons

### Threads of Karma Labels
Threads of Karma, Best Source, Used For, Related Records, Current Milestone, Prior-Life Note, Route, Unlocks, Consumed By, Found In, Known From, Suggested Next

### Record State Labels and Tooltips
- **Sealed:** This record is locked by realm, city, story, or spoiler policy.
- **Rumored:** The archive has heard of this record, but details are incomplete.
- **Recorded:** The player has encountered, unlocked, owned, seen, or been shown this record.
- **Studied:** The player has used this record meaningfully: crafted, equipped, cleared, defeated, configured, or studied it.
- **Mastered:** The player has completed a major mastery condition for this record.
- **Recommended Now:** This record is directly relevant to the current milestone or blocker.
- **Warning:** This record contains a shortage, blocker, or risk that needs attention.
- **Future:** This content exists in design/content but is not currently reachable in the live route.

### Buttons and Actions
Open Full Record, Close Slip, Pin Slip, Unpin Slip, Follow Thread, Back to Shelf, Route to Cultivation, Route to World, Route to Gate Trial, Route to Apothecary, Route to Forge, Route to Manual Pavilion, Route to Techniques, Route to Ruins, Route to Bounty Board, Route to Expeditions, Compare, Mark Read, Show Sealed Records, Hide Sealed Records, Ask the Records, View Prior Lives

### Empty, Loading, and Warning Copy
- **no_search_results:** No record found. Loosen the seal, clear filters, or search by source, use, city, path, or milestone.
- **sealed_record:** This jade slip remains sealed. Return after the proper realm, city, or discovery condition is met.
- **missing_relation:** The archive has not recorded this source yet. This should be checked against content data.
- **loading:** Consulting the Records...
- **future_content:** This record is known to the archive but is not currently reachable in this life.

## Standard Entry Anatomy
Every full record should render in this order unless the entry type explicitly overrides it for readability: Title, Category, Record State, Tags, Jade Slip copy, Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Recommended Prep, Common Mistakes, Elder Note if active, Prior-Life Note if relevant, Route Buttons, and Threads of Karma.

Every compact Jade Slip should render only: Title, one-line meaning, current relevance, best source or route, used-for, 2-4 related chips, and Open Full Record.

## Entry Index by Category

### Disciple’s First Steps (13 hand-authored records)
- `disciple_s_first_steps.new_life` — New Life
- `disciple_s_first_steps.first_hour` — First Hour
- `disciple_s_first_steps.what_is_cultivation` — What Is Cultivation?
- `disciple_s_first_steps.what_is_qi` — What Is Qi?
- `disciple_s_first_steps.what_is_a_realm` — What Is a Realm?
- `disciple_s_first_steps.what_is_a_substage` — What Is a Substage?
- `disciple_s_first_steps.what_is_a_gate` — What Is a Gate?
- `disciple_s_first_steps.why_choose_a_path` — Why Choose a Path?
- `disciple_s_first_steps.what_is_a_heart_law` — What Is a Heart Law?
- `disciple_s_first_steps.why_did_i_lose` — Why Did I Lose?
- `disciple_s_first_steps.what_should_i_do_when_progress_slows` — What Should I Do When Progress Slows?
- `disciple_s_first_steps.when_to_reincarnate` — When to Reincarnate
- `disciple_s_first_steps.reading_the_pavilion` — Reading the Pavilion

### Current Life and Doctrine (13 hand-authored records)
- `current_life_and_doctrine.life_profile` — Life Profile
- `current_life_and_doctrine.heaven_path` — Heaven Path
- `current_life_and_doctrine.earth_path` — Earth Path
- `current_life_and_doctrine.martial_path` — Martial Path
- `current_life_and_doctrine.spirit_root` — Spirit Root
- `current_life_and_doctrine.heart_law` — Heart Law
- `current_life_and_doctrine.breath_focus` — Breath Focus
- `current_life_and_doctrine.body_focus` — Body Focus
- `current_life_and_doctrine.spirit_focus` — Spirit Focus
- `current_life_and_doctrine.balanced_focus` — Balanced Focus
- `current_life_and_doctrine.path_resonance` — Path Resonance
- `current_life_and_doctrine.doctrine_mismatch` — Doctrine Mismatch
- `current_life_and_doctrine.active_doctrine` — Active Doctrine

### Cultivation, Realms, and Breakthroughs (26 hand-authored records)
- `cultivation_realms_and_breakthroughs.qi` — Qi
- `cultivation_realms_and_breakthroughs.dantian` — Dantian
- `cultivation_realms_and_breakthroughs.meridians` — Meridians
- `cultivation_realms_and_breakthroughs.cultivation_base` — Cultivation Base
- `cultivation_realms_and_breakthroughs.realm` — Realm
- `cultivation_realms_and_breakthroughs.major_realm` — Major Realm
- `cultivation_realms_and_breakthroughs.substage` — Substage
- `cultivation_realms_and_breakthroughs.final_substage` — Final Substage
- `cultivation_realms_and_breakthroughs.qi_cap` — Qi Cap
- `cultivation_realms_and_breakthroughs.breakthrough` — Breakthrough
- `cultivation_realms_and_breakthroughs.minor_breakthrough` — Minor Breakthrough
- `cultivation_realms_and_breakthroughs.major_breakthrough` — Major Breakthrough
- `cultivation_realms_and_breakthroughs.foundation_establishment` — Foundation Establishment
- `cultivation_realms_and_breakthroughs.core_formation` — Core Formation
- `cultivation_realms_and_breakthroughs.nascent_soul` — Nascent Soul
- `cultivation_realms_and_breakthroughs.soul_formation` — Soul Formation
- `cultivation_realms_and_breakthroughs.spirit_severing` — Spirit Severing
- `cultivation_realms_and_breakthroughs.stability` — Stability
- `cultivation_realms_and_breakthroughs.comprehension` — Comprehension
- `cultivation_realms_and_breakthroughs.insight` — Insight
- `cultivation_realms_and_breakthroughs.dao_heart` — Dao Heart
- `cultivation_realms_and_breakthroughs.verse_state` — Verse State
- `cultivation_realms_and_breakthroughs.lotus_state` — Lotus State
- `cultivation_realms_and_breakthroughs.soft_wall` — Soft Wall
- `cultivation_realms_and_breakthroughs.breakthrough_readiness` — Breakthrough Readiness
- `cultivation_realms_and_breakthroughs.current_realm_edge` — Current Realm Edge

### Gate Trials and Thresholds (23 hand-authored records)
- `gate_trials_and_thresholds.gate_trial` — Gate Trial
- `gate_trials_and_thresholds.foundation_gate` — Foundation Gate
- `gate_trials_and_thresholds.golden_core_gate` — Golden Core Gate
- `gate_trials_and_thresholds.nascent_soul_gate` — Nascent Soul Gate
- `gate_trials_and_thresholds.soul_formation_gate` — Soul Formation Gate
- `gate_trials_and_thresholds.spirit_severing_gate` — Spirit Severing Gate
- `gate_trials_and_thresholds.gate_catalyst` — Gate Catalyst
- `gate_trials_and_thresholds.gate_foundation_pill` — Gate Foundation Pill
- `gate_trials_and_thresholds.gate_core_catalyst` — Gate Core Catalyst
- `gate_trials_and_thresholds.gate_core_stabilizer` — Gate Core Stabilizer
- `gate_trials_and_thresholds.gate_soul_condensate` — Gate Soul Condensate
- `gate_trials_and_thresholds.gate_severing_seal` — Gate Severing Seal
- `gate_trials_and_thresholds.readiness_score` — Readiness Score
- `gate_trials_and_thresholds.minimum_checklist` — Minimum Checklist
- `gate_trials_and_thresholds.recommended_prep` — Recommended Prep
- `gate_trials_and_thresholds.safety_net` — Safety Net
- `gate_trials_and_thresholds.fail_safe` — Fail-Safe
- `gate_trials_and_thresholds.trial_clear` — Trial Clear
- `gate_trials_and_thresholds.trial_defeat` — Trial Defeat
- `gate_trials_and_thresholds.breakthrough_handoff` — Breakthrough Handoff
- `gate_trials_and_thresholds.top_fixes` — Top Fixes
- `gate_trials_and_thresholds.eligible_failures` — Eligible Failures
- `gate_trials_and_thresholds.gate_guardian` — Gate Guardian

### Cities and the Mortal World (12 hand-authored records)
- `cities_and_the_mortal_world.current_city` — Current City
- `cities_and_the_mortal_world.city_unlocks` — City Unlocks
- `cities_and_the_mortal_world.city_modules` — City Modules
- `cities_and_the_mortal_world.current_content_cap` — Current Content Cap
- `cities_and_the_mortal_world.pinewind_hamlet` — Pinewind Hamlet
- `cities_and_the_mortal_world.stonecrag_town` — Stonecrag Town
- `cities_and_the_mortal_world.spirit_cavern_city` — Spirit Cavern City
- `cities_and_the_mortal_world.lotusford` — Lotusford
- `cities_and_the_mortal_world.ironpeak_bastion` — Ironpeak Bastion
- `cities_and_the_mortal_world.city_handoff` — City Handoff
- `cities_and_the_mortal_world.city_completion` — City Completion
- `cities_and_the_mortal_world.sealed_city_records` — Sealed City Records

### World Activities and Buildings (15 hand-authored records)
- `world_activities_and_buildings.meditation_hall` — Meditation Hall
- `world_activities_and_buildings.outskirts` — Outskirts
- `world_activities_and_buildings.ruins` — Ruins
- `world_activities_and_buildings.manual_pavilion` — Manual Pavilion
- `world_activities_and_buildings.apothecary` — Apothecary
- `world_activities_and_buildings.forge` — Forge
- `world_activities_and_buildings.bounty_board` — Bounty Board
- `world_activities_and_buildings.expedition_board` — Expedition Board
- `world_activities_and_buildings.alchemy` — Alchemy
- `world_activities_and_buildings.runes` — Runes
- `world_activities_and_buildings.talisman_studio` — Talisman Studio
- `world_activities_and_buildings.shops` — Shops
- `world_activities_and_buildings.world_inspector` — World Inspector
- `world_activities_and_buildings.activity_role_tags` — Activity Role Tags
- `world_activities_and_buildings.one_foreground_activity_rule` — One Foreground Activity Rule

### Combat, Readiness, and Failure Diagnosis (31 hand-authored records)
- `combat_readiness_and_failure_diagnosis.auto_combat` — Auto Combat
- `combat_readiness_and_failure_diagnosis.combat_context` — Combat Context
- `combat_readiness_and_failure_diagnosis.enemy_level` — Enemy Level
- `combat_readiness_and_failure_diagnosis.common_enemy` — Common Enemy
- `combat_readiness_and_failure_diagnosis.elite_enemy` — Elite Enemy
- `combat_readiness_and_failure_diagnosis.boss` — Boss
- `combat_readiness_and_failure_diagnosis.damage` — Damage
- `combat_readiness_and_failure_diagnosis.attack` — Attack
- `combat_readiness_and_failure_diagnosis.defense` — Defense
- `combat_readiness_and_failure_diagnosis.accuracy` — Accuracy
- `combat_readiness_and_failure_diagnosis.crit` — Crit
- `combat_readiness_and_failure_diagnosis.dodge` — Dodge
- `combat_readiness_and_failure_diagnosis.hp` — HP
- `combat_readiness_and_failure_diagnosis.healing` — Healing
- `combat_readiness_and_failure_diagnosis.medicine_pouch` — Medicine Pouch
- `combat_readiness_and_failure_diagnosis.loadout` — Loadout
- `combat_readiness_and_failure_diagnosis.ai_profile` — AI Profile
- `combat_readiness_and_failure_diagnosis.balanced_ai` — Balanced AI
- `combat_readiness_and_failure_diagnosis.survivor_ai` — Survivor AI
- `combat_readiness_and_failure_diagnosis.burst_ai` — Burst AI
- `combat_readiness_and_failure_diagnosis.farmer_ai` — Farmer AI
- `combat_readiness_and_failure_diagnosis.failure_diagnosis` — Failure Diagnosis
- `combat_readiness_and_failure_diagnosis.underleveled` — Underleveled
- `combat_readiness_and_failure_diagnosis.undergeared` — Undergeared
- `combat_readiness_and_failure_diagnosis.underprepared` — Underprepared
- `combat_readiness_and_failure_diagnosis.underbuilt` — Underbuilt
- `combat_readiness_and_failure_diagnosis.wrong_ai_profile` — Wrong AI Profile
- `combat_readiness_and_failure_diagnosis.sustain_failure` — Sustain Failure
- `combat_readiness_and_failure_diagnosis.damage_failure` — Damage Failure
- `combat_readiness_and_failure_diagnosis.combat_log` — Combat Log
- `combat_readiness_and_failure_diagnosis.boss_mechanics` — Boss Mechanics

### Manuals, Techniques, and Buildcraft (27 hand-authored records)
- `manuals_techniques_and_buildcraft.manual` — Manual
- `manuals_techniques_and_buildcraft.study` — Study
- `manuals_techniques_and_buildcraft.manual_grade` — Manual Grade
- `manuals_techniques_and_buildcraft.manual_offer` — Manual Offer
- `manuals_techniques_and_buildcraft.duplicate_conversion` — Duplicate Conversion
- `manuals_techniques_and_buildcraft.manual_scraps` — Manual Scraps
- `manuals_techniques_and_buildcraft.technique` — Technique
- `manuals_techniques_and_buildcraft.technique_rarity` — Technique Rarity
- `manuals_techniques_and_buildcraft.technique_fragments` — Technique Fragments
- `manuals_techniques_and_buildcraft.active_slot` — Active Slot
- `manuals_techniques_and_buildcraft.passive_slot` — Passive Slot
- `manuals_techniques_and_buildcraft.ultimate_slot` — Ultimate Slot
- `manuals_techniques_and_buildcraft.loadout` — Loadout
- `manuals_techniques_and_buildcraft.loadout_template` — Loadout Template
- `manuals_techniques_and_buildcraft.mastery_xp` — Mastery XP
- `manuals_techniques_and_buildcraft.mastery_milestones` — Mastery Milestones
- `manuals_techniques_and_buildcraft.rank_upgrade` — Rank Upgrade
- `manuals_techniques_and_buildcraft.trait` — Trait
- `manuals_techniques_and_buildcraft.rune_socket` — Rune Socket
- `manuals_techniques_and_buildcraft.path_aligned_builds` — Path-Aligned Builds
- `manuals_techniques_and_buildcraft.starter_templates` — Starter Templates
- `manuals_techniques_and_buildcraft.scripture_flow` — Scripture Flow
- `manuals_techniques_and_buildcraft.insight_burst` — Insight Burst
- `manuals_techniques_and_buildcraft.iron_bastion` — Iron Bastion
- `manuals_techniques_and_buildcraft.tempered_counter` — Tempered Counter
- `manuals_techniques_and_buildcraft.pressure_duelist` — Pressure Duelist
- `manuals_techniques_and_buildcraft.sweeping_reaper` — Sweeping Reaper

### Crafting and Preparation (25 hand-authored records)
- `crafting_and_preparation.pill` — Pill
- `crafting_and_preparation.elixir` — Elixir
- `crafting_and_preparation.herb` — Herb
- `crafting_and_preparation.ore` — Ore
- `crafting_and_preparation.recipe` — Recipe
- `crafting_and_preparation.blueprint` — Blueprint
- `crafting_and_preparation.apothecary_recipe` — Apothecary Recipe
- `crafting_and_preparation.forge_blueprint` — Forge Blueprint
- `crafting_and_preparation.refine` — Refine
- `crafting_and_preparation.temper` — Temper
- `crafting_and_preparation.weapon_floor` — Weapon Floor
- `crafting_and_preparation.armor_floor` — Armor Floor
- `crafting_and_preparation.healing_floor` — Healing Floor
- `crafting_and_preparation.craft_queue` — Craft Queue
- `crafting_and_preparation.material_provenance` — Material Provenance
- `crafting_and_preparation.spirit_dew` — Spirit Dew
- `crafting_and_preparation.quenching_oil` — Quenching Oil
- `crafting_and_preparation.artifact_shards` — Artifact Shards
- `crafting_and_preparation.rune` — Rune
- `crafting_and_preparation.talisman` — Talisman
- `crafting_and_preparation.talisman_recipe` — Talisman Recipe
- `crafting_and_preparation.alchemy_queue` — Alchemy Queue
- `crafting_and_preparation.forge_queue` — Forge Queue
- `crafting_and_preparation.craft_speed` — Craft Speed
- `crafting_and_preparation.missing_materials` — Missing Materials

### Items, Resources, and Economy (19 hand-authored records)
- `items_resources_and_economy.gold` — Gold
- `items_resources_and_economy.merit` — Merit
- `items_resources_and_economy.spirit_stones` — Spirit Stones
- `items_resources_and_economy.common_materials` — Common Materials
- `items_resources_and_economy.rare_materials` — Rare Materials
- `items_resources_and_economy.gate_items` — Gate Items
- `items_resources_and_economy.consumables` — Consumables
- `items_resources_and_economy.weapons` — Weapons
- `items_resources_and_economy.armor` — Armor
- `items_resources_and_economy.accessories` — Accessories
- `items_resources_and_economy.safe_to_sell` — Safe To Sell
- `items_resources_and_economy.needed_soon` — Needed Soon
- `items_resources_and_economy.do_not_sell` — Do Not Sell
- `items_resources_and_economy.best_source` — Best Source
- `items_resources_and_economy.fallback_source` — Fallback Source
- `items_resources_and_economy.source_use_ledger` — Source/Use Ledger
- `items_resources_and_economy.inventory_relevance` — Inventory Relevance
- `items_resources_and_economy.sell_value` — Sell Value
- `items_resources_and_economy.purchase_cost` — Purchase Cost

### Bestiary and Encounters (13 hand-authored records)
- `bestiary_and_encounters.bestiary` — Bestiary
- `bestiary_and_encounters.enemy_record` — Enemy Record
- `bestiary_and_encounters.boss_record` — Boss Record
- `bestiary_and_encounters.trial_guardian` — Trial Guardian
- `bestiary_and_encounters.ruins_encounter` — Ruins Encounter
- `bestiary_and_encounters.drop_table` — Drop Table
- `bestiary_and_encounters.threat_trait` — Threat Trait
- `bestiary_and_encounters.counter_prep` — Counter Prep
- `bestiary_and_encounters.first_seen` — First Seen
- `bestiary_and_encounters.defeated` — Defeated
- `bestiary_and_encounters.mastered_encounter` — Mastered Encounter
- `bestiary_and_encounters.boss_weakness` — Boss Weakness
- `bestiary_and_encounters.enemy_drop_provenance` — Enemy Drop Provenance

### Bounties, Expeditions, and Offline Cultivation (15 hand-authored records)
- `bounties_expeditions_and_offline_cultivation.bounty` — Bounty
- `bounties_expeditions_and_offline_cultivation.tracked_bounty` — Tracked Bounty
- `bounties_expeditions_and_offline_cultivation.merit_reward` — Merit Reward
- `bounties_expeditions_and_offline_cultivation.bounty_difficulty` — Bounty Difficulty
- `bounties_expeditions_and_offline_cultivation.bounty_reroll` — Bounty Reroll
- `bounties_expeditions_and_offline_cultivation.bounty_completion` — Bounty Completion
- `bounties_expeditions_and_offline_cultivation.expedition_route` — Expedition Route
- `bounties_expeditions_and_offline_cultivation.expected_yield` — Expected Yield
- `bounties_expeditions_and_offline_cultivation.expedition_slots` — Expedition Slots
- `bounties_expeditions_and_offline_cultivation.expedition_duration` — Expedition Duration
- `bounties_expeditions_and_offline_cultivation.expedition_idle` — Expedition Idle
- `bounties_expeditions_and_offline_cultivation.offline_cultivation` — Offline Cultivation
- `bounties_expeditions_and_offline_cultivation.offline_cap` — Offline Cap
- `bounties_expeditions_and_offline_cultivation.offline_efficiency` — Offline Efficiency
- `bounties_expeditions_and_offline_cultivation.background_queue` — Background Queue

### Reincarnation and Prior Lives (18 hand-authored records)
- `reincarnation_and_prior_lives.reincarnation` — Reincarnation
- `reincarnation_and_prior_lives.prestige_ap` — Prestige AP
- `reincarnation_and_prior_lives.lifetime_ap` — Lifetime AP
- `reincarnation_and_prior_lives.prestige_upgrade` — Prestige Upgrade
- `reincarnation_and_prior_lives.prestige_tree` — Prestige Tree
- `reincarnation_and_prior_lives.what_resets` — What Resets
- `reincarnation_and_prior_lives.what_persists` — What Persists
- `reincarnation_and_prior_lives.hybrid_retention` — Hybrid Retention
- `reincarnation_and_prior_lives.prior_life_ledger` — Prior Life Ledger
- `reincarnation_and_prior_lives.run_summary` — Run Summary
- `reincarnation_and_prior_lives.prestige_advisor` — Prestige Advisor
- `reincarnation_and_prior_lives.reclaim_speed` — Reclaim Speed
- `reincarnation_and_prior_lives.content_cap_prestige` — Content Cap Prestige
- `reincarnation_and_prior_lives.second_life` — Second Life
- `reincarnation_and_prior_lives.meta_upgrade` — Meta Upgrade
- `reincarnation_and_prior_lives.mastery_retention` — Mastery Retention
- `reincarnation_and_prior_lives.permanent_unlock` — Permanent Unlock
- `reincarnation_and_prior_lives.new_life_contract` — New Life Contract

### Systems, UI, and Controls (23 hand-authored records)
- `systems_ui_and_controls.search` — Search
- `systems_ui_and_controls.filters` — Filters
- `systems_ui_and_controls.pins` — Pins
- `systems_ui_and_controls.related_records` — Related Records
- `systems_ui_and_controls.threads_of_karma` — Threads of Karma
- `systems_ui_and_controls.jade_slip` — Jade Slip
- `systems_ui_and_controls.elder_note` — Elder Note
- `systems_ui_and_controls.breadcrumbs` — Breadcrumbs
- `systems_ui_and_controls.recent_records` — Recent Records
- `systems_ui_and_controls.archive_discovery` — Archive Discovery
- `systems_ui_and_controls.record_state` — Record State
- `systems_ui_and_controls.sealed` — Sealed
- `systems_ui_and_controls.rumored` — Rumored
- `systems_ui_and_controls.recorded` — Recorded
- `systems_ui_and_controls.studied` — Studied
- `systems_ui_and_controls.mastered` — Mastered
- `systems_ui_and_controls.reduced_motion` — Reduced Motion
- `systems_ui_and_controls.low_fx` — Low FX
- `systems_ui_and_controls.keyboard_navigation` — Keyboard Navigation
- `systems_ui_and_controls.tooltips` — Tooltips
- `systems_ui_and_controls.route_button` — Route Button
- `systems_ui_and_controls.compare_view` — Compare View
- `systems_ui_and_controls.missing_relation` — Missing Relation

### Xianxia Glossary (29 hand-authored records)
- `xianxia_glossary.qi` — Qi
- `xianxia_glossary.dantian` — Dantian
- `xianxia_glossary.meridian` — Meridian
- `xianxia_glossary.dao_heart` — Dao Heart
- `xianxia_glossary.heart_law` — Heart Law
- `xianxia_glossary.spirit_root` — Spirit Root
- `xianxia_glossary.cultivation_base` — Cultivation Base
- `xianxia_glossary.foundation_establishment` — Foundation Establishment
- `xianxia_glossary.tribulation` — Tribulation
- `xianxia_glossary.pill_refining` — Pill Refining
- `xianxia_glossary.talisman` — Talisman
- `xianxia_glossary.jade_slip` — Jade Slip
- `xianxia_glossary.sect` — Sect
- `xianxia_glossary.inner_disciple` — Inner Disciple
- `xianxia_glossary.elder` — Elder
- `xianxia_glossary.manual` — Manual
- `xianxia_glossary.dao` — Dao
- `xianxia_glossary.karma` — Karma
- `xianxia_glossary.reincarnation` — Reincarnation
- `xianxia_glossary.spirit_stone` — Spirit Stone
- `xianxia_glossary.demon_beast` — Demon Beast
- `xianxia_glossary.core` — Core
- `xianxia_glossary.nascent_soul` — Nascent Soul
- `xianxia_glossary.immortal_ascension` — Immortal Ascension
- `xianxia_glossary.tu_na_breathing` — Tu Na Breathing
- `xianxia_glossary.qi_circulation` — Qi Circulation
- `xianxia_glossary.inner_alchemy` — Inner Alchemy
- `xianxia_glossary.dantian_vessel` — Dantian Vessel
- `xianxia_glossary.martial_intent` — Martial Intent

# Full Hand-Authored Records

## Disciple’s First Steps
### 1. New Life

**Entry ID:** `disciple_s_first_steps.new_life`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** onboarding, life-start  

**Jade Slip copy:** A life begins by choosing the doctrine that will shape cultivation, preparation, combat, and eventual reincarnation.

**Sect Note:** A cultivator does not merely start a run; they accept a life.

**Plain Meaning:** A life begins by choosing the doctrine that will shape cultivation, preparation, combat, and eventual reincarnation.

**Why It Matters:** This entry teaches the player that path, Heart Law, Spirit Root, and early focus are not flavor labels. They define the rhythm of the current life.

**How to Get / Where to Act:** Open at first save, from the life-start flow, or from Records > First Steps.

**Used For:** Orientation for the first hour and for every reincarnation.

**Common Mistakes:**
- Treating the path choice as cosmetic.
- Ignoring Heart Law and focus after selecting them.
- Expecting the game to be only a single cultivation bar.

**Route Buttons:** Open Life Profile, Open Current Milestone

**Related Records:** Life Profile, Path Resonance, Heart Law, Reincarnation, First Hour

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 2. First Hour

**Entry ID:** `disciple_s_first_steps.first_hour`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** onboarding, first-life  

**Jade Slip copy:** The first hour should teach the closed loop: cultivate Qi, inspect blockers, use the world to prepare, then challenge the first gate.

**Sect Note:** The first steps decide whether the road feels like fog or a path.

**Plain Meaning:** The first hour should teach the closed loop: cultivate Qi, inspect blockers, use the world to prepare, then challenge the first gate.

**Why It Matters:** This is the player-facing replacement for intrusive onboarding. It gives a calm sequence without forcing popups.

**How to Get / Where to Act:** Open from First Steps, the first Elder Note, or the Current Milestone panel.

**Used For:** Early-game guidance and reincarnation orientation.

**Common Mistakes:**
- Farming randomly without checking the next milestone.
- Challenging the gate without medicine or loadout checks.
- Buying manuals without knowing what slot or role they fill.

**Route Buttons:** Route to Cultivation, Route to World

**Related Records:** Cultivation, Outskirts, Manual Pavilion, Apothecary, Forge, Foundation Gate

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 3. What Is Cultivation?

**Entry ID:** `disciple_s_first_steps.what_is_cultivation`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** core, onboarding  

**Jade Slip copy:** Cultivation is the main inner-growth loop: gather and refine Qi, increase your cultivation base, and prepare the body and doctrine for breakthrough.

**Sect Note:** Cultivation is not waiting. It is the slow ordering of the body, breath, and will.

**Plain Meaning:** Cultivation is the main inner-growth loop: gather and refine Qi, increase your cultivation base, and prepare the body and doctrine for breakthrough.

**Why It Matters:** It establishes the central fantasy and tells the player that progress also comes from support systems.

**How to Get / Where to Act:** Cultivate from the Cultivation screen. Use focus, Heart Law, and preparation systems to support progress.

**Used For:** Realm advancement, breakthrough access, gate preparation, and reincarnation value.

**Common Mistakes:**
- Thinking cultivation alone solves every wall.
- Ignoring preparation because the Qi bar is full.

**Route Buttons:** Route to Cultivation

**Related Records:** Qi, Dantian, Realm, Breakthrough, Heart Law, Soft Wall

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 4. What Is Qi?

**Entry ID:** `disciple_s_first_steps.what_is_qi`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** qi, core  

**Jade Slip copy:** Qi is the primary inner progress resource. It fills through cultivation and is spent or checked when attempting breakthroughs.

**Sect Note:** Qi is breath given direction.

**Plain Meaning:** Qi is the primary inner progress resource. It fills through cultivation and is spent or checked when attempting breakthroughs.

**Why It Matters:** Players need to distinguish Qi from combat resources, currencies, and crafting materials.

**How to Get / Where to Act:** Generated through cultivation, influenced by realm, substage, focus, path, Heart Law, Spirit Root, and prestige effects.

**Used For:** Substage progress, breakthrough readiness, and milestone checks.

**Common Mistakes:**
- Assuming Qi cap completion means every gate requirement is done.
- Confusing Qi with currency or Spirit Stones.

**Route Buttons:** Route to Cultivation

**Related Records:** Dantian, Qi Cap, Breakthrough, Cultivation Base

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 5. What Is a Realm?

**Entry ID:** `disciple_s_first_steps.what_is_a_realm`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** realm, core  

**Jade Slip copy:** A realm is a major cultivation tier such as Qi Condensation, Foundation Establishment, Core Formation, Nascent Soul, Soul Formation, or Spirit Severing.

**Sect Note:** A realm is not a level. It is the shape of what the body can contain.

**Plain Meaning:** A realm is a major cultivation tier such as Qi Condensation, Foundation Establishment, Core Formation, Nascent Soul, Soul Formation, or Spirit Severing.

**Why It Matters:** Realm names define content reach, city unlocks, technique slot growth, and gate progression.

**How to Get / Where to Act:** Advance by completing substages, satisfying breakthrough requirements, and clearing or bypassing gates when needed.

**Used For:** Progression, city unlocking, content gating, slot unlocking, and prestige value.

**Common Mistakes:**
- Treating every substage as a major realm.
- Expecting later city records to be live before the realm unlock exists.

**Route Buttons:** Route to Cultivation

**Related Records:** Substage, Breakthrough, City Unlocks, Gate Trial

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 6. What Is a Substage?

**Entry ID:** `disciple_s_first_steps.what_is_a_substage`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** realm, substage  

**Jade Slip copy:** A substage is a visible step inside a realm. Substages pace growth before a major breakthrough.

**Sect Note:** The mountain is climbed by ledges, not by a single leap.

**Plain Meaning:** A substage is a visible step inside a realm. Substages pace growth before a major breakthrough.

**Why It Matters:** Substages let the player understand why a breakthrough is not available yet even if progress feels close.

**How to Get / Where to Act:** Cultivate Qi until each substage threshold is met.

**Used For:** Breakthrough readiness, gate eligibility, and milestone tracking.

**Common Mistakes:**
- Missing the final-substage requirement for gates.
- Confusing substage completion with realm transition.

**Route Buttons:** Route to Cultivation

**Related Records:** Realm, Final Substage, Breakthrough, Gate Eligibility

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 7. What Is a Gate?

**Entry ID:** `disciple_s_first_steps.what_is_a_gate`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, onboarding  

**Jade Slip copy:** A gate is a milestone threshold that tests whether cultivation, build, medicine, and preparation are sufficient for a major realm transition.

**Sect Note:** A gate does not ask if you waited. It asks if you are ready.

**Plain Meaning:** A gate is a milestone threshold that tests whether cultivation, build, medicine, and preparation are sufficient for a major realm transition.

**Why It Matters:** This frames Gate Trials as readiness checks, not farms.

**How to Get / Where to Act:** Open from the World city package when the current realm and progression state make the trial relevant.

**Used For:** Major breakthrough handoff and gate item acquisition.

**Common Mistakes:**
- Treating gates as normal grind areas.
- Expecting the gate item to be the entry ticket instead of the reward unless content explicitly says otherwise.

**Route Buttons:** Route to Gate Trial

**Related Records:** Gate Trial, Foundation Gate, Readiness Score, Safety Net

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 8. Why Choose a Path?

**Entry ID:** `disciple_s_first_steps.why_choose_a_path`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** path, life  

**Jade Slip copy:** A path defines the life’s core playstyle: Heaven leans cultivation and spirit, Earth leans body and endurance, Martial leans combat pressure.

**Sect Note:** A path is a vow about how power will be pursued.

**Plain Meaning:** A path defines the life’s core playstyle: Heaven leans cultivation and spirit, Earth leans body and endurance, Martial leans combat pressure.

**Why It Matters:** Path identity affects recommendations, manual priorities, Heart Law fit, and build expectations.

**How to Get / Where to Act:** Chosen at life start and should remain the authoritative path for that life.

**Used For:** Run identity, build guidance, Heart Law resonance, and path-aligned technique recommendations.

**Common Mistakes:**
- Choosing a path and then ignoring its build rhythm.
- Treating path mismatch as fatal; it should be suboptimal, not run-ending.

**Route Buttons:** Open Life Profile

**Related Records:** Heaven Path, Earth Path, Martial Path, Path Resonance, Life Profile

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 9. What Is a Heart Law?

**Entry ID:** `disciple_s_first_steps.what_is_a_heart_law`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** heart-law, doctrine  

**Jade Slip copy:** A Heart Law is the inner doctrine that modifies cultivation rhythm, comprehension, stability, and sometimes cross-system support.

**Sect Note:** A technique moves the hand. A Heart Law moves the self.

**Plain Meaning:** A Heart Law is the inner doctrine that modifies cultivation rhythm, comprehension, stability, and sometimes cross-system support.

**Why It Matters:** Players need to understand that Heart Laws are foundational and persistent within the life, not disposable spells.

**How to Get / Where to Act:** Chosen or unlocked through progression, then studied through cultivation and doctrine systems.

**Used For:** Cultivation modifiers, stability, comprehension, insight events, and path resonance.

**Common Mistakes:**
- Reading Heart Law as only a passive stat card.
- Ignoring resonance and breath mode.
- Assuming all Heart Law effects are purely cultivation-only if the live content intentionally includes softer cross-domain synergy.

**Route Buttons:** Route to Heart Law

**Related Records:** Heart Law Chapters, Breath Focus, Comprehension, Path Resonance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 10. Why Did I Lose?

**Entry ID:** `disciple_s_first_steps.why_did_i_lose`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** Defeat should be diagnosed as undercultivated, undergeared, underprepared, underbuilt, wrong AI profile, sustain failure, or damage failure.

**Sect Note:** A lost duel is only wasted if the lesson is not recorded.

**Plain Meaning:** Defeat should be diagnosed as undercultivated, undergeared, underprepared, underbuilt, wrong AI profile, sustain failure, or damage failure.

**Why It Matters:** This turns combat loss into actionable routing instead of frustration.

**How to Get / Where to Act:** Opened from post-combat defeat, Gate Trial, Combat records, or Ask the Records.

**Used For:** Post-loss guidance, top fixes, and routing to Forge, Apothecary, Techniques, or Cultivation.

**Common Mistakes:**
- Retrying the same fight without changing the failed floor.
- Treating every defeat as needing more Qi when the real issue may be medicine or loadout.

**Route Buttons:** Open Failure Diagnosis, Route to Top Fix

**Related Records:** Failure Diagnosis, Medicine Pouch, Weapon Floor, Loadout, AI Profile

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 11. What Should I Do When Progress Slows?

**Entry ID:** `disciple_s_first_steps.what_should_i_do_when_progress_slows`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** guidance, soft-wall  

**Jade Slip copy:** When progress slows, check whether the blocker is Qi, stage, gate readiness, gear floor, medicine, build power, city reachability, or prestige timing.

**Sect Note:** A wall is either a gate, a lesson, or the end of a life.

**Plain Meaning:** When progress slows, check whether the blocker is Qi, stage, gate readiness, gear floor, medicine, build power, city reachability, or prestige timing.

**Why It Matters:** This is the player’s main anti-confusion entry.

**How to Get / Where to Act:** Open from Current Milestone, Cultivation, Status, or Ask the Records.

**Used For:** Soft-wall guidance and mid-run recovery.

**Common Mistakes:**
- Assuming slow progress means the game has no next step.
- Reincarnating before checking obvious fix routes.
- Pushing forever at the content cap without reading cap guidance.

**Route Buttons:** Ask the Records

**Related Records:** Soft Wall, Current Milestone, Best Source, Prestige Advisor, Current Content Cap

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 12. When to Reincarnate

**Entry ID:** `disciple_s_first_steps.when_to_reincarnate`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, onboarding  

**Jade Slip copy:** Reincarnate when the current life’s marginal progress is weaker than the permanent or hybrid gains that the next life will inherit.

**Sect Note:** A life ends. The Dao does not.

**Plain Meaning:** Reincarnate when the current life’s marginal progress is weaker than the permanent or hybrid gains that the next life will inherit.

**Why It Matters:** This establishes prestige as a rational, legible outer-loop decision rather than a punishment.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, current content cap, or the prior-life ledger.

**Used For:** Prestige timing, run summaries, AP decisions, and second-life expectations.

**Common Mistakes:**
- Seeing reincarnation as failure.
- Prestiging without understanding what resets and what remains.
- Trusting prestige nodes that are not live without a clear runtime status label.

**Route Buttons:** Route to Prestige

**Related Records:** Reincarnation, Prestige Advisor, What Resets, What Persists, Prior Life Ledger

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 13. Reading the Pavilion

**Entry ID:** `disciple_s_first_steps.reading_the_pavilion`  

**Category:** Disciple’s First Steps  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, pavilion  

**Jade Slip copy:** The Pavilion records explanations, relationships, current blockers, prior-life history, and source/use chains in one place.

**Sect Note:** A jade slip is useful only when it leads the disciple back to action.

**Plain Meaning:** The Pavilion records explanations, relationships, current blockers, prior-life history, and source/use chains in one place.

**Why It Matters:** This teaches how to use the feature itself.

**How to Get / Where to Act:** Use categories, search, filters, Threads of Karma, Jade Slips, and Elder Notes.

**Used For:** Player information literacy and onboarding to the codex.

**Common Mistakes:**
- Reading only flavor and ignoring route buttons.
- Using search only by exact names instead of sources, uses, and aliases.

**Route Buttons:** Search the Records

**Related Records:** Search, Filters, Threads of Karma, Jade Slip, Elder Note

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Current Life and Doctrine
### 14. Life Profile

**Entry ID:** `current_life_and_doctrine.life_profile`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** runtime, life  

**Jade Slip copy:** The Life Profile summarizes path, Heart Law, Spirit Root, breath/focus mode, current realm, current city, and current milestone.

**Sect Note:** A cultivator must know the shape of the life they are living.

**Plain Meaning:** The Life Profile summarizes path, Heart Law, Spirit Root, breath/focus mode, current realm, current city, and current milestone.

**Why It Matters:** It makes path, Heart Law, and Spirit Root read as one identity rather than disconnected labels.

**How to Get / Where to Act:** Generated from runtime state and shown in the top ribbon, Status, and Current Life category.

**Used For:** Current-run diagnosis, recommendations, and prior-life comparison.

**Common Mistakes:**
- Hiding active path and Heart Law in separate screens.
- Letting stale state show multiple path truths.

**Route Buttons:** Open Status, Ask the Records

**Related Records:** Heaven Path, Heart Law, Spirit Root, Current Milestone

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 15. Heaven Path

**Entry ID:** `current_life_and_doctrine.heaven_path`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** path, heaven  

**Jade Slip copy:** Heaven Path favors spirit, cultivation rhythm, and decisive doctrine expression. It should feel clear, bright, and efficient but less physically forgiving.

**Sect Note:** Heaven seeks alignment before force.

**Plain Meaning:** Heaven Path favors spirit, cultivation rhythm, and decisive doctrine expression. It should feel clear, bright, and efficient but less physically forgiving.

**Why It Matters:** It gives the player a cultivation/offense-forward identity with higher sensitivity to preparation.

**How to Get / Where to Act:** Chosen at life start; recommendations should favor spirit cultivation, aligned manuals, burst or scripture-oriented builds, and safe gate preparation.

**Used For:** Path recommendations, manual filtering, Heart Law resonance, and build archetype classification.

**Common Mistakes:**
- Assuming Heaven can ignore medicine or gear because cultivation is strong.
- Treating it as the only correct path.

**Route Buttons:** Filter Path: Heaven, Route to Manual Pavilion

**Related Records:** Scripture Flow, Insight Burst, Heart Law, Spirit Root

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 16. Earth Path

**Entry ID:** `current_life_and_doctrine.earth_path`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** path, earth  

**Jade Slip copy:** Earth Path favors body, defense, and survival floors. It should feel patient, grounded, and resilient.

**Sect Note:** Earth survives the strike and learns its weight.

**Plain Meaning:** Earth Path favors body, defense, and survival floors. It should feel patient, grounded, and resilient.

**Why It Matters:** It gives the player a defensive doctrine that values gear, medicine, and sustained fights.

**How to Get / Where to Act:** Chosen at life start; recommendations should favor durability, armor floor, Survivor AI, and body-support Heart Laws.

**Used For:** Path recommendations, gate prep, gear floors, and defensive build templates.

**Common Mistakes:**
- Over-investing in defense until damage becomes too low.
- Ignoring technique rank because survival feels safe.

**Route Buttons:** Filter Path: Earth, Route to Forge

**Related Records:** Iron Bastion, Tempered Counter, Body Focus, Armor Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 17. Martial Path

**Entry ID:** `current_life_and_doctrine.martial_path`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** path, martial  

**Jade Slip copy:** Martial Path favors active combat pressure, attack, crit, and decisive technique expression.

**Sect Note:** Martial walks through the gate with a blade already moving.

**Plain Meaning:** Martial Path favors active combat pressure, attack, crit, and decisive technique expression.

**Why It Matters:** It gives the player the sharpest combat rhythm and the strongest need to manage burst, accuracy, and technique timing.

**How to Get / Where to Act:** Chosen at life start; recommendations should favor weapon floor, offensive manuals, Burst or Balanced AI, and core strike mastery.

**Used For:** Path recommendations, build archetypes, technique priorities, and combat diagnosis.

**Common Mistakes:**
- Mistaking high attack for readiness if accuracy, healing, or defense is weak.
- Ignoring sustain in long gate fights.

**Route Buttons:** Filter Path: Martial, Route to Techniques

**Related Records:** Pressure Duelist, Sweeping Reaper, Weapon Floor, Burst AI

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 18. Spirit Root

**Entry ID:** `current_life_and_doctrine.spirit_root`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** spirit-root, doctrine  

**Jade Slip copy:** Spirit Root is the life’s innate affinity floor: it affects resonance, cultivation feel, and sometimes how strongly a doctrine blooms.

**Sect Note:** The root is not the tree, but the tree answers it.

**Plain Meaning:** Spirit Root is the life’s innate affinity floor: it affects resonance, cultivation feel, and sometimes how strongly a doctrine blooms.

**Why It Matters:** It helps explain why some Heart Laws or paths feel more natural in a life.

**How to Get / Where to Act:** Rolled, chosen, inherited, or modified by progression depending on implementation; displayed in Life Profile.

**Used For:** Heart Law resonance, future prestige floor effects, and doctrinal explanation.

**Common Mistakes:**
- Treating Spirit Root as a standalone win condition.
- Hiding it after life start.

**Route Buttons:** Open Life Profile

**Related Records:** Heart Law, Path Resonance, Prestige Upgrade, Life Profile

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 19. Heart Law

**Entry ID:** `current_life_and_doctrine.heart_law`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** heart-law, doctrine  

**Jade Slip copy:** The active Heart Law is the life’s inner scripture. It shapes cultivation, comprehension, stability, and the feel of doctrine.

**Sect Note:** A Heart Law is the handwriting of the Dao inside the body.

**Plain Meaning:** The active Heart Law is the life’s inner scripture. It shapes cultivation, comprehension, stability, and the feel of doctrine.

**Why It Matters:** It is a foundation for both mechanical guidance and xianxia flavor.

**How to Get / Where to Act:** Chosen at life start or unlocked through progression; studied through cultivation and chapter advancement.

**Used For:** Cultivation bonuses, insight timing, chapter growth, and recommendation context.

**Common Mistakes:**
- Treating it as an item rather than doctrine.
- Not checking chapter and comprehension states.

**Route Buttons:** Route to Heart Law

**Related Records:** Heart Law Chapters, Comprehension, Insight, Breath Focus

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 20. Breath Focus

**Entry ID:** `current_life_and_doctrine.breath_focus`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** focus, cultivation  

**Jade Slip copy:** Breath Focus prioritizes cultivation rhythm and inner refinement. It is the safest way to read a life as cultivation-first.

**Sect Note:** Breath gathers what force scatters.

**Plain Meaning:** Breath Focus prioritizes cultivation rhythm and inner refinement. It is the safest way to read a life as cultivation-first.

**Why It Matters:** Players need to understand focus modes as intentional tradeoffs.

**How to Get / Where to Act:** Select from Cultivation or Life Profile if available.

**Used For:** Qi generation, comprehension pacing, and inner-state recommendations.

**Common Mistakes:**
- Leaving focus unchanged when the current blocker has changed.
- Using Breath Focus when the real blocker is combat survival.

**Route Buttons:** Route to Cultivation

**Related Records:** Qi, Comprehension, Heart Law, Cultivation

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 21. Body Focus

**Entry ID:** `current_life_and_doctrine.body_focus`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** focus, survival  

**Jade Slip copy:** Body Focus prioritizes survival and physical preparation. It is most relevant when danger, HP, defense, or gate sustain is weak.

**Sect Note:** The vessel must not crack before the Qi can settle.

**Plain Meaning:** Body Focus prioritizes survival and physical preparation. It is most relevant when danger, HP, defense, or gate sustain is weak.

**Why It Matters:** It teaches players that body investment is a valid route to gate readiness.

**How to Get / Where to Act:** Select from Cultivation or Life Profile if available.

**Used For:** Survival floor, Earth-leaning builds, defensive recovery, and gate prep.

**Common Mistakes:**
- Using Body Focus forever after the survival problem is solved.
- Assuming body focus replaces medicine or gear.

**Route Buttons:** Route to Cultivation

**Related Records:** Earth Path, Defense, HP, Medicine Pouch

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 22. Spirit Focus

**Entry ID:** `current_life_and_doctrine.spirit_focus`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** focus, spirit  

**Jade Slip copy:** Spirit Focus prioritizes inner clarity, comprehension, and spiritual leverage. It is strongest when doctrine growth is the bottleneck.

**Sect Note:** Spirit sharpens the law before the hand moves.

**Plain Meaning:** Spirit Focus prioritizes inner clarity, comprehension, and spiritual leverage. It is strongest when doctrine growth is the bottleneck.

**Why It Matters:** It gives non-combat growth an actionable route.

**How to Get / Where to Act:** Select from Cultivation or Life Profile if available.

**Used For:** Heart Law comprehension, insight preparation, and Heaven-leaning doctrine.

**Common Mistakes:**
- Using Spirit Focus when immediate gate survival is the blocker.
- Ignoring loadout and medicine while chasing insight.

**Route Buttons:** Route to Cultivation

**Related Records:** Heaven Path, Comprehension, Insight, Dao Heart

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 23. Balanced Focus

**Entry ID:** `current_life_and_doctrine.balanced_focus`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** focus, balanced  

**Jade Slip copy:** Balanced Focus spreads attention across cultivation, body, and spirit. It is useful when no single bottleneck dominates.

**Sect Note:** Balanced breath keeps the road open.

**Plain Meaning:** Balanced Focus spreads attention across cultivation, body, and spirit. It is useful when no single bottleneck dominates.

**Why It Matters:** It gives players a default that avoids overcommitting early.

**How to Get / Where to Act:** Select from Cultivation or Life Profile if available.

**Used For:** Early-life stability, general growth, and broad preparation.

**Common Mistakes:**
- Using Balanced Focus as a way to avoid diagnosing a clear blocker.
- Expecting it to outperform specialized focus against a specific wall.

**Route Buttons:** Route to Cultivation

**Related Records:** Breath Focus, Body Focus, Spirit Focus, Current Milestone

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 24. Path Resonance

**Entry ID:** `current_life_and_doctrine.path_resonance`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** resonance, build  

**Jade Slip copy:** Path Resonance is how well the active path, Heart Law, Spirit Root, techniques, and build direction support each other.

**Sect Note:** When root, law, and hand agree, effort no longer leaks away.

**Plain Meaning:** Path Resonance is how well the active path, Heart Law, Spirit Root, techniques, and build direction support each other.

**Why It Matters:** This turns build coherence into an understandable concept.

**How to Get / Where to Act:** Displayed in Life Profile, Techniques, Heart Law, and Manual Pavilion recommendations.

**Used For:** Manual recommendations, build templates, Heart Law notes, and milestone readiness.

**Common Mistakes:**
- Treating resonance as a hard rule that forbids experimentation.
- Punishing mismatch too harshly instead of guiding correction.

**Route Buttons:** Open Life Profile, Route to Techniques

**Related Records:** Doctrine Mismatch, Life Profile, Manual Pavilion, Loadout Template

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 25. Doctrine Mismatch

**Entry ID:** `current_life_and_doctrine.doctrine_mismatch`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** resonance, warning  

**Jade Slip copy:** Doctrine Mismatch marks a path, Heart Law, technique, or focus that works but does not strongly support the life’s active direction.

**Sect Note:** A mismatched doctrine is not sin; it is leakage.

**Plain Meaning:** Doctrine Mismatch marks a path, Heart Law, technique, or focus that works but does not strongly support the life’s active direction.

**Why It Matters:** It gives players a language for suboptimal choices without bricking runs.

**How to Get / Where to Act:** Shown in recommendations, build summaries, and Heart Law notes.

**Used For:** Build correction, manual selection, and path guidance.

**Common Mistakes:**
- Calling every mismatch a failure.
- Hiding mismatch until a player loses.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Path Resonance, Manual Pavilion, Technique, Starter Templates

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 26. Active Doctrine

**Entry ID:** `current_life_and_doctrine.active_doctrine`  

**Category:** Current Life and Doctrine  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** runtime, doctrine  

**Jade Slip copy:** Active Doctrine is the combined identity of path, Heart Law, Spirit Root, focus, loadout, and current build archetype.

**Sect Note:** The archive records not only what was chosen, but what the life has become.

**Plain Meaning:** Active Doctrine is the combined identity of path, Heart Law, Spirit Root, focus, loadout, and current build archetype.

**Why It Matters:** It gives the Pavilion a stable way to summarize the current life.

**How to Get / Where to Act:** Generated from runtime state and shown in Current Life, Status, and prior-life summaries.

**Used For:** Elder Notes, recommended records, build classification, and run summaries.

**Common Mistakes:**
- Showing path without build direction.
- Showing build direction without the chosen doctrine.

**Route Buttons:** Open Status

**Related Records:** Life Profile, Path Resonance, Loadout Template, Prior Life Ledger

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Cultivation, Realms, and Breakthroughs
### 27. Qi

**Entry ID:** `cultivation_realms_and_breakthroughs.qi`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The inner energy gathered through cultivation and used for realm progress and breakthrough readiness.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The inner energy gathered through cultivation and used for realm progress and breakthrough readiness.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Dantian, Qi Cap, Breakthrough

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 28. Dantian

**Entry ID:** `cultivation_realms_and_breakthroughs.dantian`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The inner vessel that stores and stabilizes refined Qi; mechanically, it explains capacity, stability, and breakthrough foundation.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The inner vessel that stores and stabilizes refined Qi; mechanically, it explains capacity, stability, and breakthrough foundation.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Qi, Meridians, Stability

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 29. Meridians

**Entry ID:** `cultivation_realms_and_breakthroughs.meridians`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The inner channels through which Qi circulates; mechanically, they explain circulation, focus, and body-spirit preparation.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The inner channels through which Qi circulates; mechanically, they explain circulation, focus, and body-spirit preparation.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Qi, Dantian, Breath Focus

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 30. Cultivation Base

**Entry ID:** `cultivation_realms_and_breakthroughs.cultivation_base`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The accumulated strength of the current realm and substage, represented by Qi progress, realm state, and supporting inner stats.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The accumulated strength of the current realm and substage, represented by Qi progress, realm state, and supporting inner stats.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Qi, Realm, Substage

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 31. Realm

**Entry ID:** `cultivation_realms_and_breakthroughs.realm`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A major cultivation tier that gates cities, slots, trials, and broader progression.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A major cultivation tier that gates cities, slots, trials, and broader progression.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Substage, Breakthrough, City Unlocks

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 32. Major Realm

**Entry ID:** `cultivation_realms_and_breakthroughs.major_realm`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A named tier such as Qi Condensation or Foundation Establishment; major realm changes usually require a gate or major breakthrough.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A named tier such as Qi Condensation or Foundation Establishment; major realm changes usually require a gate or major breakthrough.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Realm, Gate Trial, Breakthrough

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 33. Substage

**Entry ID:** `cultivation_realms_and_breakthroughs.substage`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A step within a realm that provides pacing and visible progress before a major threshold.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A step within a realm that provides pacing and visible progress before a major threshold.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Realm, Final Substage, Breakthrough

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 34. Final Substage

**Entry ID:** `cultivation_realms_and_breakthroughs.final_substage`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The last substage of a realm; often required before a gate or major breakthrough can be attempted.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The last substage of a realm; often required before a gate or major breakthrough can be attempted.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Substage, Gate Eligibility, Minimum Checklist

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 35. Qi Cap

**Entry ID:** `cultivation_realms_and_breakthroughs.qi_cap`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The current maximum or target amount of Qi required for a substage or breakthrough.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The current maximum or target amount of Qi required for a substage or breakthrough.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Qi, Breakthrough Readiness, Minimum Checklist

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 36. Breakthrough

**Entry ID:** `cultivation_realms_and_breakthroughs.breakthrough`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The act of crossing from one stage or realm state into the next after requirements are satisfied.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The act of crossing from one stage or realm state into the next after requirements are satisfied.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Qi Cap, Gate Catalyst, Realm

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 37. Minor Breakthrough

**Entry ID:** `cultivation_realms_and_breakthroughs.minor_breakthrough`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A smaller transition between substages or internal milestones inside a realm.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A smaller transition between substages or internal milestones inside a realm.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Substage, Cultivation Base, Qi

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 38. Major Breakthrough

**Entry ID:** `cultivation_realms_and_breakthroughs.major_breakthrough`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A realm-changing transition, usually tied to gate trials, catalysts, and city progression.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A realm-changing transition, usually tied to gate trials, catalysts, and city progression.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Gate Trial, Gate Catalyst, City Unlocks

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 39. Foundation Establishment

**Entry ID:** `cultivation_realms_and_breakthroughs.foundation_establishment`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The first major realm after Qi Condensation, treated as the first serious proof that the body can anchor cultivated power.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The first major realm after Qi Condensation, treated as the first serious proof that the body can anchor cultivated power.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Foundation Gate, Gate Foundation Pill, Stonecrag Town

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 40. Core Formation

**Entry ID:** `cultivation_realms_and_breakthroughs.core_formation`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A later realm where power condenses into a more stable core; its entries should unlock when the player approaches the relevant gate.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A later realm where power condenses into a more stable core; its entries should unlock when the player approaches the relevant gate.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Golden Core Gate, Gate Core Catalyst, City Unlocks

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 41. Nascent Soul

**Entry ID:** `cultivation_realms_and_breakthroughs.nascent_soul`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A higher realm where spiritual identity begins to separate from mortal limits; sealed until relevant.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A higher realm where spiritual identity begins to separate from mortal limits; sealed until relevant.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Nascent Soul Gate, Gate Core Stabilizer

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 42. Soul Formation

**Entry ID:** `cultivation_realms_and_breakthroughs.soul_formation`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A later realm focused on soul consolidation and higher doctrine; sealed until relevant.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A later realm focused on soul consolidation and higher doctrine; sealed until relevant.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Soul Formation Gate, Gate Soul Condensate

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 43. Spirit Severing

**Entry ID:** `cultivation_realms_and_breakthroughs.spirit_severing`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A late practical-slice realm tied to severing mortal limitations; sealed until relevant.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A late practical-slice realm tied to severing mortal limitations; sealed until relevant.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Spirit Severing Gate, Gate Severing Seal

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 44. Stability

**Entry ID:** `cultivation_realms_and_breakthroughs.stability`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A measure of how safely the current inner state can hold growth, insight, and breakthrough pressure.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A measure of how safely the current inner state can hold growth, insight, and breakthrough pressure.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Heart Law, Dantian, Breakthrough Readiness

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 45. Comprehension

**Entry ID:** `cultivation_realms_and_breakthroughs.comprehension`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** Heart Law understanding and doctrinal progress; it helps a life turn scripture into practical growth.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** Heart Law understanding and doctrinal progress; it helps a life turn scripture into practical growth.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Heart Law, Insight, Dao Heart

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 46. Insight

**Entry ID:** `cultivation_realms_and_breakthroughs.insight`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A moment of accelerated understanding or reward triggered by cultivation, doctrine, or time-based study.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A moment of accelerated understanding or reward triggered by cultivation, doctrine, or time-based study.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Comprehension, Heart Law, Verse State

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 47. Dao Heart

**Entry ID:** `cultivation_realms_and_breakthroughs.dao_heart`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The inner resolve and doctrinal center of the cultivator; mechanically, it supports stability and high-level cultivation flavor.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The inner resolve and doctrinal center of the cultivator; mechanically, it supports stability and high-level cultivation flavor.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Heart Law, Stability, Verse State

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 48. Verse State

**Entry ID:** `cultivation_realms_and_breakthroughs.verse_state`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The poetic inner-state layer that visualizes Heart Law progress, insight readiness, and Dao Heart condition.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The poetic inner-state layer that visualizes Heart Law progress, insight readiness, and Dao Heart condition.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Dao Heart, Lotus State, Comprehension

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 49. Lotus State

**Entry ID:** `cultivation_realms_and_breakthroughs.lotus_state`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A visual cultivation-state marker that shows inner clarity, risk, or bloom without forcing the player to parse raw numbers.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A visual cultivation-state marker that shows inner clarity, risk, or bloom without forcing the player to parse raw numbers.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Verse State, Dao Heart, Stability

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 50. Soft Wall

**Entry ID:** `cultivation_realms_and_breakthroughs.soft_wall`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A slowdown point where the player should diagnose current blockers or consider reincarnation rather than waiting blindly.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A slowdown point where the player should diagnose current blockers or consider reincarnation rather than waiting blindly.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Prestige Advisor, Current Milestone, What Should I Do When Progress Slows?

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 51. Breakthrough Readiness

**Entry ID:** `cultivation_realms_and_breakthroughs.breakthrough_readiness`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** A checklist-style view of what is required and recommended before crossing a major threshold.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** A checklist-style view of what is required and recommended before crossing a major threshold.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Minimum Checklist, Recommended Prep, Gate Trial

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 52. Current Realm Edge

**Entry ID:** `cultivation_realms_and_breakthroughs.current_realm_edge`  

**Category:** Cultivation, Realms, and Breakthroughs  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** cultivation, realm  

**Jade Slip copy:** The point where the current realm is near completion and the next gate or breakthrough begins to matter.

**Sect Note:** The inner road has names because each threshold changes what the body can contain.

**Plain Meaning:** The point where the current realm is near completion and the next gate or breakthrough begins to matter.

**Why It Matters:** This record turns cultivation terminology into a practical decision surface.

**How to Get / Where to Act:** Open from Cultivation, Status, Gate Trial requirements, or search.

**Used For:** Cultivation guidance, milestone checks, and source/use linking.

**Common Mistakes:**
- Reading the term as flavor only.
- Ignoring related requirements when the term appears in a gate or breakthrough checklist.

**Route Buttons:** Route to Cultivation

**Related Records:** Gate Eligibility, Current Milestone, Soft Wall

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Gate Trials and Thresholds
### 53. Gate Trial

**Entry ID:** `gate_trials_and_thresholds.gate_trial`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** A milestone combat/readiness trial that checks whether the life can cross a major realm threshold.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** A milestone combat/readiness trial that checks whether the life can cross a major realm threshold.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Foundation Gate, Readiness Score, Safety Net

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 54. Foundation Gate

**Entry ID:** `gate_trials_and_thresholds.foundation_gate`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The first major gate, clearing the path from Qi Condensation toward Foundation Establishment.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The first major gate, clearing the path from Qi Condensation toward Foundation Establishment.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Gate Trial, Gate Foundation Pill, Foundation Establishment

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 55. Golden Core Gate

**Entry ID:** `gate_trials_and_thresholds.golden_core_gate`  

**Category:** Gate Trials and Thresholds  

**Default state:** Sealed / Rumored until relevant realm approaches  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The gate that should regulate transition toward Core Formation; sealed or rumored until the player approaches the relevant realm.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The gate that should regulate transition toward Core Formation; sealed or rumored until the player approaches the relevant realm.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Gate Core Catalyst, Core Formation, Readiness Score

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 56. Nascent Soul Gate

**Entry ID:** `gate_trials_and_thresholds.nascent_soul_gate`  

**Category:** Gate Trials and Thresholds  

**Default state:** Sealed / Rumored until relevant realm approaches  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The gate that should regulate transition toward Nascent Soul; sealed until the relevant city and realm approach.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The gate that should regulate transition toward Nascent Soul; sealed until the relevant city and realm approach.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Gate Core Stabilizer, Nascent Soul, Safety Net

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 57. Soul Formation Gate

**Entry ID:** `gate_trials_and_thresholds.soul_formation_gate`  

**Category:** Gate Trials and Thresholds  

**Default state:** Sealed / Rumored until relevant realm approaches  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The gate that should regulate transition toward Soul Formation; sealed until relevant.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The gate that should regulate transition toward Soul Formation; sealed until relevant.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Gate Soul Condensate, Soul Formation, Recommended Prep

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 58. Spirit Severing Gate

**Entry ID:** `gate_trials_and_thresholds.spirit_severing_gate`  

**Category:** Gate Trials and Thresholds  

**Default state:** Sealed / Rumored until relevant realm approaches  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The gate that should regulate transition toward Spirit Severing; sealed until relevant.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The gate that should regulate transition toward Spirit Severing; sealed until relevant.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Gate Severing Seal, Spirit Severing, Current Content Cap

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 59. Gate Catalyst

**Entry ID:** `gate_trials_and_thresholds.gate_catalyst`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The broad class of gate rewards consumed or checked by major breakthrough handoff.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The broad class of gate rewards consumed or checked by major breakthrough handoff.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Gate Items, Breakthrough, Trial Clear

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 60. Gate Foundation Pill

**Entry ID:** `gate_trials_and_thresholds.gate_foundation_pill`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The gate reward used for the Foundation breakthrough handoff.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The gate reward used for the Foundation breakthrough handoff.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Foundation Gate, Foundation Establishment, Breakthrough Handoff

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 61. Gate Core Catalyst

**Entry ID:** `gate_trials_and_thresholds.gate_core_catalyst`  

**Category:** Gate Trials and Thresholds  

**Default state:** Sealed / Rumored until relevant realm approaches  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The gate reward used for the Core Formation transition.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The gate reward used for the Core Formation transition.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Golden Core Gate, Core Formation, Breakthrough Handoff

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 62. Gate Core Stabilizer

**Entry ID:** `gate_trials_and_thresholds.gate_core_stabilizer`  

**Category:** Gate Trials and Thresholds  

**Default state:** Sealed / Rumored until relevant realm approaches  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The gate reward used for the Nascent Soul transition.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The gate reward used for the Nascent Soul transition.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Nascent Soul Gate, Nascent Soul, Breakthrough Handoff

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 63. Gate Soul Condensate

**Entry ID:** `gate_trials_and_thresholds.gate_soul_condensate`  

**Category:** Gate Trials and Thresholds  

**Default state:** Sealed / Rumored until relevant realm approaches  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The gate reward used for the Soul Formation transition.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The gate reward used for the Soul Formation transition.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Soul Formation Gate, Soul Formation, Breakthrough Handoff

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 64. Gate Severing Seal

**Entry ID:** `gate_trials_and_thresholds.gate_severing_seal`  

**Category:** Gate Trials and Thresholds  

**Default state:** Sealed / Rumored until relevant realm approaches  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The gate reward used for the Spirit Severing transition.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The gate reward used for the Spirit Severing transition.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Spirit Severing Gate, Spirit Severing, Breakthrough Handoff

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 65. Readiness Score

**Entry ID:** `gate_trials_and_thresholds.readiness_score`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** A summary score showing whether gate preparation is locked, risky, viable, ready, cleared, or bypassed.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** A summary score showing whether gate preparation is locked, risky, viable, ready, cleared, or bypassed.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Minimum Checklist, Recommended Prep, Top Fixes

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 66. Minimum Checklist

**Entry ID:** `gate_trials_and_thresholds.minimum_checklist`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The hard requirements needed before an attempt can be considered valid.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The hard requirements needed before an attempt can be considered valid.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Final Substage, Qi Cap, Gate Eligibility

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 67. Recommended Prep

**Entry ID:** `gate_trials_and_thresholds.recommended_prep`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The soft floors that improve the chance of success: medicine, weapon floor, technique strength, loadout completion, support run.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The soft floors that improve the chance of success: medicine, weapon floor, technique strength, loadout completion, support run.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Medicine Pouch, Weapon Floor, Technique, Ruins

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 68. Safety Net

**Entry ID:** `gate_trials_and_thresholds.safety_net`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** A visible fallback purchase or bypass path that prevents repeated failure from becoming a dead run.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** A visible fallback purchase or bypass path that prevents repeated failure from becoming a dead run.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Fail-Safe, Merit, Eligible Failures

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 69. Fail-Safe

**Entry ID:** `gate_trials_and_thresholds.fail_safe`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The runtime rule that determines when Safety Net can be used and what it costs.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The runtime rule that determines when Safety Net can be used and what it costs.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Safety Net, Eligible Failures, Gate Catalyst

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 70. Trial Clear

**Entry ID:** `gate_trials_and_thresholds.trial_clear`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The successful completion state of a Gate Trial; should grant the gate reward exactly once and update city/trial state.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The successful completion state of a Gate Trial; should grant the gate reward exactly once and update city/trial state.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Gate Reward, Breakthrough Handoff, Gate Guardian

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 71. Trial Defeat

**Entry ID:** `gate_trials_and_thresholds.trial_defeat`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** A failed attempt that should produce diagnosis, eligible failure progress, and top fixes rather than vague frustration.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** A failed attempt that should produce diagnosis, eligible failure progress, and top fixes rather than vague frustration.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Failure Diagnosis, Top Fixes, Safety Net

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 72. Breakthrough Handoff

**Entry ID:** `gate_trials_and_thresholds.breakthrough_handoff`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The post-clear or bypass state that routes the player back to Cultivation to perform the realm transition.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The post-clear or bypass state that routes the player back to Cultivation to perform the realm transition.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Breakthrough, Cultivation, Gate Catalyst

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 73. Top Fixes

**Entry ID:** `gate_trials_and_thresholds.top_fixes`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** A short list of the best current repairs before retrying a gate.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** A short list of the best current repairs before retrying a gate.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Forge, Apothecary, Techniques, Ruins

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 74. Eligible Failures

**Entry ID:** `gate_trials_and_thresholds.eligible_failures`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The count of valid gate defeats that move the player toward fail-safe access.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The count of valid gate defeats that move the player toward fail-safe access.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Safety Net, Fail-Safe, Trial Defeat

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 75. Gate Guardian

**Entry ID:** `gate_trials_and_thresholds.gate_guardian`  

**Category:** Gate Trials and Thresholds  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** gate, milestone  

**Jade Slip copy:** The boss or threshold entity that represents the gate trial.

**Sect Note:** The gate records the difference between waiting and being ready.

**Plain Meaning:** The boss or threshold entity that represents the gate trial.

**Why It Matters:** Gate entries must make eligibility, reward, fail-safe, and breakthrough handoff impossible to misunderstand.

**How to Get / Where to Act:** Open from World > Gate Trial, breakthrough checklist, current milestone, or item record.

**Used For:** Gate readiness, reward visibility, defeat diagnosis, and realm transition routing.

**Common Mistakes:**
- Using obsolete gate item language.
- Hiding the fallback path.
- Treating gate rewards as repeat farms.

**Route Buttons:** Route to Gate Trial, Route to Cultivation

**Related Records:** Boss, Gate Trial, Bestiary

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Cities and the Mortal World
### 76. Current City

**Entry ID:** `cities_and_the_mortal_world.current_city`  

**Category:** Cities and the Mortal World  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** The active city package that determines available modules, local content, gates, ruins, rewards, and manual pools.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** The active city package that determines available modules, local content, gates, ruins, rewards, and manual pools.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** City Modules, Current Milestone, World Activities

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 77. City Unlocks

**Entry ID:** `cities_and_the_mortal_world.city_unlocks`  

**Category:** Cities and the Mortal World  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** The rules that open new cities as the player reaches the proper major realm or progression state.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** The rules that open new cities as the player reaches the proper major realm or progression state.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** Breakthrough, Current City, City Handoff

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 78. City Modules

**Entry ID:** `cities_and_the_mortal_world.city_modules`  

**Category:** Cities and the Mortal World  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** The buildings and services exposed inside a city package: Outskirts, Gate Trial, Ruins, Manual Pavilion, Apothecary, Forge, Bounties, Expeditions, and crafting stations as live.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** The buildings and services exposed inside a city package: Outskirts, Gate Trial, Ruins, Manual Pavilion, Apothecary, Forge, Bounties, Expeditions, and crafting stations as live.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** World Activities, Current City, City Completion

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 79. Current Content Cap

**Entry ID:** `cities_and_the_mortal_world.current_content_cap`  

**Category:** Cities and the Mortal World  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** The honest message that the player has reached the current authored or live endpoint.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** The honest message that the player has reached the current authored or live endpoint.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** Prestige Advisor, Soft Wall, Reincarnation

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 80. Pinewind Hamlet

**Entry ID:** `cities_and_the_mortal_world.pinewind_hamlet`  

**Category:** Cities and the Mortal World  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** The first city package and first live template for cultivation, preparation, manuals, and the Foundation Gate.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** The first city package and first live template for cultivation, preparation, manuals, and the Foundation Gate.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** Outskirts, Foundation Gate, Manual Pavilion

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 81. Stonecrag Town

**Entry ID:** `cities_and_the_mortal_world.stonecrag_town`  

**Category:** Cities and the Mortal World  

**Default state:** Sealed / Rumored until runtime unlock proves reachability  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** The next city record after Foundation, expected to emphasize stronger gear floors, harsher combat, and deeper preparation.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** The next city record after Foundation, expected to emphasize stronger gear floors, harsher combat, and deeper preparation.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** City Unlocks, Forge, Golden Core Gate

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 82. Spirit Cavern City

**Entry ID:** `cities_and_the_mortal_world.spirit_cavern_city`  

**Category:** Cities and the Mortal World  

**Default state:** Sealed / Rumored until runtime unlock proves reachability  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** A later city record associated with deeper spirit materials, cavern routes, and higher gate preparation.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** A later city record associated with deeper spirit materials, cavern routes, and higher gate preparation.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** Ruins, Nascent Soul Gate, Spirit Stones

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 83. Lotusford

**Entry ID:** `cities_and_the_mortal_world.lotusford`  

**Category:** Cities and the Mortal World  

**Default state:** Sealed / Rumored until runtime unlock proves reachability  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** A later city record associated with lotus/medicine/spirit cultivation themes and advanced support loops.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** A later city record associated with lotus/medicine/spirit cultivation themes and advanced support loops.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** Apothecary, Soul Formation Gate, Dao Heart

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 84. Ironpeak Bastion

**Entry ID:** `cities_and_the_mortal_world.ironpeak_bastion`  

**Category:** Cities and the Mortal World  

**Default state:** Sealed / Rumored until runtime unlock proves reachability  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** A later city record associated with heavy forge identity, high defense floors, and late practical-slice gates.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** A later city record associated with heavy forge identity, high defense floors, and late practical-slice gates.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** Forge, Spirit Severing Gate, Weapon Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 85. City Handoff

**Entry ID:** `cities_and_the_mortal_world.city_handoff`  

**Category:** Cities and the Mortal World  

**Default state:** Sealed / Rumored until runtime unlock proves reachability  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** The moment a new realm or progression state opens the next city and shifts the local content package.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** The moment a new realm or progression state opens the next city and shifts the local content package.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** City Unlocks, Breakthrough, Current City

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 86. City Completion

**Entry ID:** `cities_and_the_mortal_world.city_completion`  

**Category:** Cities and the Mortal World  

**Default state:** Sealed / Rumored until runtime unlock proves reachability  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** A record state showing that the important modules, gate, ruin, enemies, and recipes of a city have been encountered or mastered.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** A record state showing that the important modules, gate, ruin, enemies, and recipes of a city have been encountered or mastered.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** Mastered, Bestiary, Prior Life Ledger

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 87. Sealed City Records

**Entry ID:** `cities_and_the_mortal_world.sealed_city_records`  

**Category:** Cities and the Mortal World  

**Default state:** Sealed / Rumored until runtime unlock proves reachability  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** city, world  

**Jade Slip copy:** Future city records that exist to show world scale but should not pretend to be reachable before runtime truth allows it.

**Sect Note:** A city is not scenery. It is the local shape of the climb.

**Plain Meaning:** Future city records that exist to show world scale but should not pretend to be reachable before runtime truth allows it.

**Why It Matters:** City entries make the campaign feel like staged cultivation geography rather than disconnected tabs.

**How to Get / Where to Act:** Open from World, city selector, current milestone, or search.

**Used For:** Module routing, city-to-city handoff, content-cap clarity, and future records.

**Common Mistakes:**
- Showing future cities as live when runtime does not unlock them.
- Forgetting that a city should teach a tier of play.

**Route Buttons:** Route to World

**Related Records:** Sealed, Current Content Cap, City Unlocks

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## World Activities and Buildings
### 88. Meditation Hall

**Entry ID:** `world_activities_and_buildings.meditation_hall`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The city-facing place for cultivation support, realm reflection, and inner practice if surfaced in the live city package.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The city-facing place for cultivation support, realm reflection, and inner practice if surfaced in the live city package.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Cultivation, Qi, Heart Law

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 89. Outskirts

**Entry ID:** `world_activities_and_buildings.outskirts`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The broad baseline combat loop for gold, common materials, basic drops, safe build tests, and early enemy records.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The broad baseline combat loop for gold, common materials, basic drops, safe build tests, and early enemy records.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Gold, Common Materials, Bestiary

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 90. Ruins

**Entry ID:** `world_activities_and_buildings.ruins`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The deterministic support run for targeted relief, drought protection, materials, fragments, and pre-gate prep.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The deterministic support run for targeted relief, drought protection, materials, fragments, and pre-gate prep.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Material Provenance, Recommended Prep, Gate Trial

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 91. Manual Pavilion

**Entry ID:** `world_activities_and_buildings.manual_pavilion`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The knowledge-acquisition room where manuals are offered, studied, compared, and converted into technique direction.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The knowledge-acquisition room where manuals are offered, studied, compared, and converted into technique direction.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Manual, Study, Technique

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 92. Apothecary

**Entry ID:** `world_activities_and_buildings.apothecary`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The preparation room for pills, medicine pouch stocking, healing floors, and breakthrough support.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The preparation room for pills, medicine pouch stocking, healing floors, and breakthrough support.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Pill, Medicine Pouch, Healing Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 93. Forge

**Entry ID:** `world_activities_and_buildings.forge`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The permanent-floor room for weapons, armor, refine, temper, blueprints, and visible gate power floors.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The permanent-floor room for weapons, armor, refine, temper, blueprints, and visible gate power floors.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Weapon Floor, Armor Floor, Blueprint

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 94. Bounty Board

**Entry ID:** `world_activities_and_buildings.bounty_board`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The directed-task board that routes the player toward useful actions and Merit rewards.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The directed-task board that routes the player toward useful actions and Merit rewards.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Bounty, Merit, Tracked Bounty

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 95. Expedition Board

**Entry ID:** `world_activities_and_buildings.expedition_board`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The background-route board that sends idle support runs for materials, gold, herbs, ore, and other shortages.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The background-route board that sends idle support runs for materials, gold, herbs, ore, and other shortages.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Expedition Route, Expected Yield, Offline Efficiency

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 96. Alchemy

**Entry ID:** `world_activities_and_buildings.alchemy`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The crafting branch that turns herbs and reagents into pills, elixirs, and cultivation/combat support depending on live scope.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The crafting branch that turns herbs and reagents into pills, elixirs, and cultivation/combat support depending on live scope.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Recipe, Pill, Herb

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 97. Runes

**Entry ID:** `world_activities_and_buildings.runes`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The socketed modifier system that should add targeted technique, gear, or build support without overwhelming the player.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The socketed modifier system that should add targeted technique, gear, or build support without overwhelming the player.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Rune Socket, Technique, Forge

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 98. Talisman Studio

**Entry ID:** `world_activities_and_buildings.talisman_studio`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The situational utility craft system for consumable or equipped spiritual support effects.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The situational utility craft system for consumable or equipped spiritual support effects.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Talisman, Talisman Recipe, Craft Queue

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 99. Shops

**Entry ID:** `world_activities_and_buildings.shops`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The city commerce surface for buying support items, materials, manuals, or fallback resources when economy design allows.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The city commerce surface for buying support items, materials, manuals, or fallback resources when economy design allows.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Gold, Merit, Purchase Cost

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 100. World Inspector

**Entry ID:** `world_activities_and_buildings.world_inspector`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The right-side or contextual panel that explains what a selected city module solves right now.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The right-side or contextual panel that explains what a selected city module solves right now.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Activity Role Tags, Best Source, Current Milestone

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 101. Activity Role Tags

**Entry ID:** `world_activities_and_buildings.activity_role_tags`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** Short labels such as Gold Source, Prep Room, Gear Floor, Build Fix, Support Route, or Gate Check.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** Short labels such as Gold Source, Prep Room, Gear Floor, Build Fix, Support Route, or Gate Check.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** World Inspector, Best Source, Recommended Now

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 102. One Foreground Activity Rule

**Entry ID:** `world_activities_and_buildings.one_foreground_activity_rule`  

**Category:** World Activities and Buildings  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** activity, world  

**Jade Slip copy:** The rule that only one major foreground action should be active at a time, while background systems support it.

**Sect Note:** Every building should answer one question: what problem does this solve?

**Plain Meaning:** The rule that only one major foreground action should be active at a time, while background systems support it.

**Why It Matters:** Activity entries turn the world from a menu collection into a network of solutions.

**How to Get / Where to Act:** Open from World module labels, role tags, Current Milestone, or source links.

**Used For:** Routing from blocker to system, source/use clarity, and city identity.

**Common Mistakes:**
- Making every building feel equally relevant at all times.
- Hiding what a building does not solve.
- Letting background systems become chores.

**Route Buttons:** Route to World

**Related Records:** Combat Context, Expeditions, Craft Queue

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Combat, Readiness, and Failure Diagnosis
### 103. Auto Combat

**Entry ID:** `combat_readiness_and_failure_diagnosis.auto_combat`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** Combat runs automatically; player expression lives in preparation, loadouts, AI profiles, techniques, gear, and medicine.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** Combat runs automatically; player expression lives in preparation, loadouts, AI profiles, techniques, gear, and medicine.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Loadout, AI Profile, Technique

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 104. Combat Context

**Entry ID:** `combat_readiness_and_failure_diagnosis.combat_context`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** The combat type: Outskirts, Gate Trial, Ruins, boss, bounty-related, or future context.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** The combat type: Outskirts, Gate Trial, Ruins, boss, bounty-related, or future context.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Outskirts, Gate Trial, Ruins

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 105. Enemy Level

**Entry ID:** `combat_readiness_and_failure_diagnosis.enemy_level`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A rough danger indicator used with stats, mechanics, and readiness rather than a standalone verdict.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A rough danger indicator used with stats, mechanics, and readiness rather than a standalone verdict.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Boss, Readiness Score, Failure Diagnosis

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 106. Common Enemy

**Entry ID:** `combat_readiness_and_failure_diagnosis.common_enemy`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A normal enemy record, usually useful for drops, farming expectations, and baseline danger.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A normal enemy record, usually useful for drops, farming expectations, and baseline danger.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Bestiary, Drop Table, Outskirts

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 107. Elite Enemy

**Entry ID:** `combat_readiness_and_failure_diagnosis.elite_enemy`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A stronger enemy record with special threats or higher-value drops.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A stronger enemy record with special threats or higher-value drops.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Boss, Threat Trait, Counter Prep

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 108. Boss

**Entry ID:** `combat_readiness_and_failure_diagnosis.boss`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A major encounter with higher readiness demands and better diagnosis value.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A major encounter with higher readiness demands and better diagnosis value.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Gate Guardian, Boss Mechanics, Failure Diagnosis

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 109. Damage

**Entry ID:** `combat_readiness_and_failure_diagnosis.damage`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** The amount of harm dealt or taken in combat; affected by attack, defense, techniques, traits, and context.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** The amount of harm dealt or taken in combat; affected by attack, defense, techniques, traits, and context.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Attack, Defense, Technique

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 110. Attack

**Entry ID:** `combat_readiness_and_failure_diagnosis.attack`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** The offensive stat that helps determine base damage and damage pressure.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** The offensive stat that helps determine base damage and damage pressure.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Damage, Weapon Floor, Martial Path

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 111. Defense

**Entry ID:** `combat_readiness_and_failure_diagnosis.defense`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** The protective stat that reduces incoming threat and improves survival floor.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** The protective stat that reduces incoming threat and improves survival floor.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Damage, Armor Floor, Earth Path

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 112. Accuracy

**Entry ID:** `combat_readiness_and_failure_diagnosis.accuracy`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** The chance or reliability of landing attacks or techniques; especially important for high-pressure builds.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** The chance or reliability of landing attacks or techniques; especially important for high-pressure builds.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Crit, Damage Failure, Martial Path

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 113. Crit

**Entry ID:** `combat_readiness_and_failure_diagnosis.crit`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** Critical-hit potential or spike damage; strong when paired with reliable accuracy and offensive techniques.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** Critical-hit potential or spike damage; strong when paired with reliable accuracy and offensive techniques.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Accuracy, Burst AI, Pressure Duelist

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 114. Dodge

**Entry ID:** `combat_readiness_and_failure_diagnosis.dodge`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** Avoidance or evasion; useful but not a substitute for HP, defense, or healing floor.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** Avoidance or evasion; useful but not a substitute for HP, defense, or healing floor.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Defense, Sustain Failure, Survivor AI

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 115. HP

**Entry ID:** `combat_readiness_and_failure_diagnosis.hp`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** Health pool in combat. Low HP can create survival failure even when damage output is acceptable.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** Health pool in combat. Low HP can create survival failure even when damage output is acceptable.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Healing, Defense, Medicine Pouch

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 116. Healing

**Entry ID:** `combat_readiness_and_failure_diagnosis.healing`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** Recovery during combat through pills, pouch triggers, techniques, or future support.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** Recovery during combat through pills, pouch triggers, techniques, or future support.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Medicine Pouch, Pill, Healing Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 117. Medicine Pouch

**Entry ID:** `combat_readiness_and_failure_diagnosis.medicine_pouch`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** The configured combat support inventory that automatically uses medicine under defined triggers.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** The configured combat support inventory that automatically uses medicine under defined triggers.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Apothecary, Healing, Gate Trial

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 118. Loadout

**Entry ID:** `combat_readiness_and_failure_diagnosis.loadout`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** The active set of techniques and AI behavior used in combat.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** The active set of techniques and AI behavior used in combat.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Technique, Active Slot, AI Profile

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 119. AI Profile

**Entry ID:** `combat_readiness_and_failure_diagnosis.ai_profile`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** The casting behavior profile that decides how the build expresses itself in combat.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** The casting behavior profile that decides how the build expresses itself in combat.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Balanced AI, Survivor AI, Burst AI, Farmer AI

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 120. Balanced AI

**Entry ID:** `combat_readiness_and_failure_diagnosis.balanced_ai`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A general-purpose combat profile for stable encounters and uncertain fights.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A general-purpose combat profile for stable encounters and uncertain fights.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** AI Profile, Loadout, Gate Trial

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 121. Survivor AI

**Entry ID:** `combat_readiness_and_failure_diagnosis.survivor_ai`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A defensive profile that prioritizes survival tools, sustain, and safer timing.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A defensive profile that prioritizes survival tools, sustain, and safer timing.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Medicine Pouch, Sustain Failure, Earth Path

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 122. Burst AI

**Entry ID:** `combat_readiness_and_failure_diagnosis.burst_ai`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** An offensive profile that prioritizes decisive damage windows and high-pressure techniques.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** An offensive profile that prioritizes decisive damage windows and high-pressure techniques.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Martial Path, Damage Failure, Crit

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 123. Farmer AI

**Entry ID:** `combat_readiness_and_failure_diagnosis.farmer_ai`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** An efficiency profile for repeatable farm loops where survival is already safe.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** An efficiency profile for repeatable farm loops where survival is already safe.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Outskirts, Expected Yield, Bounty

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 124. Failure Diagnosis

**Entry ID:** `combat_readiness_and_failure_diagnosis.failure_diagnosis`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** The post-fight explanation classifying why the run lost and where to go next.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** The post-fight explanation classifying why the run lost and where to go next.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Why Did I Lose?, Top Fixes, Readiness Score

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 125. Underleveled

**Entry ID:** `combat_readiness_and_failure_diagnosis.underleveled`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A defeat diagnosis where realm, substage, or Qi progress is too low for the content.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A defeat diagnosis where realm, substage, or Qi progress is too low for the content.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Cultivation, Substage, Breakthrough Readiness

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 126. Undergeared

**Entry ID:** `combat_readiness_and_failure_diagnosis.undergeared`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A defeat diagnosis where weapon, armor, refine, temper, or gear floor is below expected level.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A defeat diagnosis where weapon, armor, refine, temper, or gear floor is below expected level.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Forge, Weapon Floor, Armor Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 127. Underprepared

**Entry ID:** `combat_readiness_and_failure_diagnosis.underprepared`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A defeat diagnosis where medicine, pouch setup, buffs, or support consumables are insufficient.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A defeat diagnosis where medicine, pouch setup, buffs, or support consumables are insufficient.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Apothecary, Medicine Pouch, Pill

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 128. Underbuilt

**Entry ID:** `combat_readiness_and_failure_diagnosis.underbuilt`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A defeat diagnosis where technique slots, mastery, rank, path fit, or loadout structure is weak.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A defeat diagnosis where technique slots, mastery, rank, path fit, or loadout structure is weak.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Techniques, Manual Pavilion, Loadout Template

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 129. Wrong AI Profile

**Entry ID:** `combat_readiness_and_failure_diagnosis.wrong_ai_profile`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A defeat diagnosis where casting priorities mismatch fight length or threat pattern.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A defeat diagnosis where casting priorities mismatch fight length or threat pattern.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** AI Profile, Survivor AI, Burst AI

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 130. Sustain Failure

**Entry ID:** `combat_readiness_and_failure_diagnosis.sustain_failure`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A defeat diagnosis where damage taken outpaces healing and survival layers.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A defeat diagnosis where damage taken outpaces healing and survival layers.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Healing, Defense, Medicine Pouch

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 131. Damage Failure

**Entry ID:** `combat_readiness_and_failure_diagnosis.damage_failure`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A defeat diagnosis where the player cannot end the fight fast enough or timed pressure overwhelms them.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A defeat diagnosis where the player cannot end the fight fast enough or timed pressure overwhelms them.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Attack, Technique Rank, Burst AI

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 132. Combat Log

**Entry ID:** `combat_readiness_and_failure_diagnosis.combat_log`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** A readable record of important events, medicine uses, technique casts, damage spikes, and defeat causes.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** A readable record of important events, medicine uses, technique casts, damage spikes, and defeat causes.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Failure Diagnosis, Boss Mechanics, Medicine Pouch

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 133. Boss Mechanics

**Entry ID:** `combat_readiness_and_failure_diagnosis.boss_mechanics`  

**Category:** Combat, Readiness, and Failure Diagnosis  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** combat, diagnosis  

**Jade Slip copy:** Special boss patterns or pressure points that shape preparation and AI recommendations.

**Sect Note:** Combat records are battle reports, not bragging scrolls.

**Plain Meaning:** Special boss patterns or pressure points that shape preparation and AI recommendations.

**Why It Matters:** Combat entries translate fights into preparation and build decisions.

**How to Get / Where to Act:** Open from combat screens, defeat summaries, loadout cards, or bestiary records.

**Used For:** Readiness, post-loss routing, loadout decisions, and enemy prep.

**Common Mistakes:**
- Retrying without changing the diagnosed failure.
- Using combat stats without reading context.

**Route Buttons:** Route to Techniques, Route to Apothecary, Route to Forge

**Related Records:** Boss, Counter Prep, Top Fixes

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Manuals, Techniques, and Buildcraft
### 134. Manual

**Entry ID:** `manuals_techniques_and_buildcraft.manual`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A knowledge object acquired from the Manual Pavilion, drops, fragments, or future sources. Studying it unlocks or improves techniques.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A knowledge object acquired from the Manual Pavilion, drops, fragments, or future sources. Studying it unlocks or improves techniques.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Study, Technique, Manual Pavilion

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 135. Study

**Entry ID:** `manuals_techniques_and_buildcraft.study`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** The action that turns a manual into usable technique knowledge or progress.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** The action that turns a manual into usable technique knowledge or progress.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Manual, Technique, Manual Grade

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 136. Manual Grade

**Entry ID:** `manuals_techniques_and_buildcraft.manual_grade`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** The quality tier of a manual, affecting study value, rank caps, rune sockets, or progression depth depending on live data.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** The quality tier of a manual, affecting study value, rank caps, rune sockets, or progression depth depending on live data.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Manual, Rank Upgrade, Rune Socket

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 137. Manual Offer

**Entry ID:** `manuals_techniques_and_buildcraft.manual_offer`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A visible Manual Pavilion offer that should explain fit, path alignment, technique output, and current milestone value.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A visible Manual Pavilion offer that should explain fit, path alignment, technique output, and current milestone value.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Manual Pavilion, Path Resonance, Loadout

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 138. Duplicate Conversion

**Entry ID:** `manuals_techniques_and_buildcraft.duplicate_conversion`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** The rule that turns duplicate manuals or techniques into fragments, scraps, mastery value, or other compensation.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** The rule that turns duplicate manuals or techniques into fragments, scraps, mastery value, or other compensation.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Fragments, Manual Scraps, Technique Fragments

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 139. Manual Scraps

**Entry ID:** `manuals_techniques_and_buildcraft.manual_scraps`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A resource used to support manual acquisition, conversion, pity, or targeted knowledge routes.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A resource used to support manual acquisition, conversion, pity, or targeted knowledge routes.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Manual Pavilion, Duplicate Conversion, Bounty

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 140. Technique

**Entry ID:** `manuals_techniques_and_buildcraft.technique`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A usable combat or support expression unlocked from manuals and equipped in loadouts.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A usable combat or support expression unlocked from manuals and equipped in loadouts.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Manual, Loadout, Mastery XP

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 141. Technique Rarity

**Entry ID:** `manuals_techniques_and_buildcraft.technique_rarity`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** The rarity or grade of a technique, used to communicate power, investment ceiling, and acquisition difficulty.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** The rarity or grade of a technique, used to communicate power, investment ceiling, and acquisition difficulty.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Technique, Manual Grade, Rank Upgrade

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 142. Technique Fragments

**Entry ID:** `manuals_techniques_and_buildcraft.technique_fragments`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A resource used to unlock, upgrade, or compensate technique acquisition depending on the live system.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A resource used to unlock, upgrade, or compensate technique acquisition depending on the live system.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Technique, Duplicate Conversion, Rank Upgrade

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 143. Active Slot

**Entry ID:** `manuals_techniques_and_buildcraft.active_slot`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A loadout slot for techniques that are cast or used actively by the combat AI.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A loadout slot for techniques that are cast or used actively by the combat AI.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Technique, AI Profile, Loadout

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 144. Passive Slot

**Entry ID:** `manuals_techniques_and_buildcraft.passive_slot`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A loadout slot for techniques that provide ongoing support, stat shaping, or conditional benefits.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A loadout slot for techniques that provide ongoing support, stat shaping, or conditional benefits.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Technique, Loadout, Path Resonance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 145. Ultimate Slot

**Entry ID:** `manuals_techniques_and_buildcraft.ultimate_slot`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A late slot for major techniques or decisive powers, unlocked by higher realm progression.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A late slot for major techniques or decisive powers, unlocked by higher realm progression.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Technique, Realm, Loadout

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 146. Loadout

**Entry ID:** `manuals_techniques_and_buildcraft.loadout`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A saved build configuration of active/passive/ultimate slots and AI behavior.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A saved build configuration of active/passive/ultimate slots and AI behavior.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Active Slot, Passive Slot, AI Profile

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 147. Loadout Template

**Entry ID:** `manuals_techniques_and_buildcraft.loadout_template`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A recommended or classified build pattern that helps players understand what their loadout is trying to do.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A recommended or classified build pattern that helps players understand what their loadout is trying to do.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Starter Templates, Path-Aligned Builds, AI Profile

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 148. Mastery XP

**Entry ID:** `manuals_techniques_and_buildcraft.mastery_xp`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** Progress gained by using or studying techniques, leading to milestone bonuses and build identity.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** Progress gained by using or studying techniques, leading to milestone bonuses and build identity.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Mastery Milestones, Technique, Rank Upgrade

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 149. Mastery Milestones

**Entry ID:** `manuals_techniques_and_buildcraft.mastery_milestones`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** Threshold rewards for meaningful technique use, such as 25/50/75/100 mastery bands if supported.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** Threshold rewards for meaningful technique use, such as 25/50/75/100 mastery bands if supported.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Mastery XP, Trait, Prior Life Ledger

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 150. Rank Upgrade

**Entry ID:** `manuals_techniques_and_buildcraft.rank_upgrade`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A technique investment path that increases power, scaling, or role effectiveness.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A technique investment path that increases power, scaling, or role effectiveness.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Technique Fragments, Mastery XP, Manual Grade

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 151. Trait

**Entry ID:** `manuals_techniques_and_buildcraft.trait`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A special modifier, identity mark, or conditional effect attached to a technique.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A special modifier, identity mark, or conditional effect attached to a technique.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Technique, Rune Socket, Build Archetype

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 152. Rune Socket

**Entry ID:** `manuals_techniques_and_buildcraft.rune_socket`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A socket or attachment point for runes that tune a technique, item, or build role.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A socket or attachment point for runes that tune a technique, item, or build role.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Rune, Technique, Forge

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 153. Path-Aligned Builds

**Entry ID:** `manuals_techniques_and_buildcraft.path_aligned_builds`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** Builds whose techniques, Heart Law, and AI support the current path identity.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** Builds whose techniques, Heart Law, and AI support the current path identity.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Path Resonance, Loadout Template, Starter Templates

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 154. Starter Templates

**Entry ID:** `manuals_techniques_and_buildcraft.starter_templates`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** Suggested early archetypes that give new players direction without enforcing one meta answer.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** Suggested early archetypes that give new players direction without enforcing one meta answer.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Loadout Template, Path-Aligned Builds, First Hour

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 155. Scripture Flow

**Entry ID:** `manuals_techniques_and_buildcraft.scripture_flow`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A Heaven-aligned template focused on stable cultivation-backed offense and readable gate prep.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A Heaven-aligned template focused on stable cultivation-backed offense and readable gate prep.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Heaven Path, Balanced AI, Heart Law

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 156. Insight Burst

**Entry ID:** `manuals_techniques_and_buildcraft.insight_burst`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A Heaven-aligned template focused on comprehension timing, decisive casts, and safer burst windows.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A Heaven-aligned template focused on comprehension timing, decisive casts, and safer burst windows.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Heaven Path, Burst AI, Insight

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 157. Iron Bastion

**Entry ID:** `manuals_techniques_and_buildcraft.iron_bastion`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** An Earth-aligned template focused on HP, defense, medicine, and durable gate attempts.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** An Earth-aligned template focused on HP, defense, medicine, and durable gate attempts.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Earth Path, Survivor AI, Armor Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 158. Tempered Counter

**Entry ID:** `manuals_techniques_and_buildcraft.tempered_counter`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** An Earth-aligned template that survives pressure and answers with steady counter-damage.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** An Earth-aligned template that survives pressure and answers with steady counter-damage.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Earth Path, Forge, Defense

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 159. Pressure Duelist

**Entry ID:** `manuals_techniques_and_buildcraft.pressure_duelist`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A Martial-aligned template focused on weapon floor, accuracy, crit, and single-target pressure.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A Martial-aligned template focused on weapon floor, accuracy, crit, and single-target pressure.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Martial Path, Burst AI, Weapon Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 160. Sweeping Reaper

**Entry ID:** `manuals_techniques_and_buildcraft.sweeping_reaper`  

**Category:** Manuals, Techniques, and Buildcraft  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** manuals, techniques, build  

**Jade Slip copy:** A Martial-aligned template focused on farming efficiency and rapid encounter clearing once safety is solved.

**Sect Note:** Manuals are knowledge; techniques are what the hand remembers after study.

**Plain Meaning:** A Martial-aligned template focused on farming efficiency and rapid encounter clearing once safety is solved.

**Why It Matters:** Buildcraft entries connect acquisition, study, mastery, loadout, and AI into one spine.

**How to Get / Where to Act:** Open from Manual Pavilion, Technique screen, loadout slots, or build recommendations.

**Used For:** Build guidance, manual choice, path alignment, and combat readiness.

**Common Mistakes:**
- Buying manuals without checking slot needs.
- Ignoring duplicate conversion value.
- Treating AI profile as cosmetic.

**Route Buttons:** Route to Manual Pavilion, Route to Techniques

**Related Records:** Martial Path, Farmer AI, Outskirts

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Crafting and Preparation
### 161. Pill

**Entry ID:** `crafting_and_preparation.pill`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A crafted or purchased consumable used for healing, buffs, breakthrough prep, or gate survival depending on type.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A crafted or purchased consumable used for healing, buffs, breakthrough prep, or gate survival depending on type.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Apothecary, Medicine Pouch, Healing Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 162. Elixir

**Entry ID:** `crafting_and_preparation.elixir`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A stronger or longer-form consumable used for preparation, cultivation support, or advanced effects.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A stronger or longer-form consumable used for preparation, cultivation support, or advanced effects.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Alchemy, Pill, Recipe

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 163. Herb

**Entry ID:** `crafting_and_preparation.herb`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A plant material used in Apothecary or Alchemy recipes.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A plant material used in Apothecary or Alchemy recipes.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Apothecary Recipe, Material Provenance, Expedition Route

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 164. Ore

**Entry ID:** `crafting_and_preparation.ore`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A forge material used for equipment, refine, temper, or blueprint crafting.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A forge material used for equipment, refine, temper, or blueprint crafting.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Forge Blueprint, Weapon Floor, Expedition Route

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 165. Recipe

**Entry ID:** `crafting_and_preparation.recipe`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A content-defined craft rule that turns inputs into output at a station.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A content-defined craft rule that turns inputs into output at a station.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Alchemy, Apothecary Recipe, Craft Queue

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 166. Blueprint

**Entry ID:** `crafting_and_preparation.blueprint`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A forge-defined craft plan for equipment, upgrade, or tool output.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A forge-defined craft plan for equipment, upgrade, or tool output.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Forge, Forge Blueprint, Weapon Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 167. Apothecary Recipe

**Entry ID:** `crafting_and_preparation.apothecary_recipe`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A recipe used to create pills, elixirs, medicine support, or healing floor resources.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A recipe used to create pills, elixirs, medicine support, or healing floor resources.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Apothecary, Pill, Herb

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 168. Forge Blueprint

**Entry ID:** `crafting_and_preparation.forge_blueprint`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A blueprint used to create or improve weapons, armor, accessories, or forge tools.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A blueprint used to create or improve weapons, armor, accessories, or forge tools.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Forge, Ore, Weapon Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 169. Refine

**Entry ID:** `crafting_and_preparation.refine`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A forge improvement path that raises equipment floor and improves power consistency.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A forge improvement path that raises equipment floor and improves power consistency.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Forge, Weapon Floor, Armor Floor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 170. Temper

**Entry ID:** `crafting_and_preparation.temper`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A forge improvement path that adds resilience, affixes, or conditional power depending on live design.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A forge improvement path that adds resilience, affixes, or conditional power depending on live design.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Forge, Refine, Blueprint

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 171. Weapon Floor

**Entry ID:** `crafting_and_preparation.weapon_floor`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** The minimum offensive equipment standard expected for a gate or boss.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** The minimum offensive equipment standard expected for a gate or boss.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Forge, Attack, Gate Trial

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 172. Armor Floor

**Entry ID:** `crafting_and_preparation.armor_floor`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** The minimum defensive equipment standard expected for a gate or boss.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** The minimum defensive equipment standard expected for a gate or boss.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Forge, Defense, Gate Trial

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 173. Healing Floor

**Entry ID:** `crafting_and_preparation.healing_floor`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** The minimum medicine and healing support expected for a gate or boss.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** The minimum medicine and healing support expected for a gate or boss.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Medicine Pouch, Pill, Apothecary

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 174. Craft Queue

**Entry ID:** `crafting_and_preparation.craft_queue`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A background crafting lane that converts materials into preparation without constant babysitting.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A background crafting lane that converts materials into preparation without constant babysitting.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Alchemy Queue, Forge Queue, Offline Efficiency

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 175. Material Provenance

**Entry ID:** `crafting_and_preparation.material_provenance`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** The record of where a material comes from and what it feeds.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** The record of where a material comes from and what it feeds.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Source/Use Ledger, Best Source, Fallback Source

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 176. Spirit Dew

**Entry ID:** `crafting_and_preparation.spirit_dew`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A named example of a key craft or cultivation support material. Its exact source and use should be generated from content data.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A named example of a key craft or cultivation support material. Its exact source and use should be generated from content data.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Material Provenance, Apothecary, Recipe

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 177. Quenching Oil

**Entry ID:** `crafting_and_preparation.quenching_oil`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A named example of a forge support material. Its exact source and use should be generated from content data.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A named example of a forge support material. Its exact source and use should be generated from content data.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Forge, Temper, Blueprint

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 178. Artifact Shards

**Entry ID:** `crafting_and_preparation.artifact_shards`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A named example of a scarce forge or relic material. Its exact source and use should be generated from content data.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A named example of a scarce forge or relic material. Its exact source and use should be generated from content data.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Forge, Rare Materials, Material Provenance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 179. Rune

**Entry ID:** `crafting_and_preparation.rune`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A socketed modifier used to tune gear, techniques, or build identity.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A socketed modifier used to tune gear, techniques, or build identity.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Rune Socket, Technique, Forge

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 180. Talisman

**Entry ID:** `crafting_and_preparation.talisman`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A spiritual utility object that can provide situational support, protection, or preparation effects.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A spiritual utility object that can provide situational support, protection, or preparation effects.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Talisman Recipe, Talisman Studio, Craft Queue

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 181. Talisman Recipe

**Entry ID:** `crafting_and_preparation.talisman_recipe`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** The craft rule used to produce talismans.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** The craft rule used to produce talismans.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Talisman, Recipe, Craft Queue

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 182. Alchemy Queue

**Entry ID:** `crafting_and_preparation.alchemy_queue`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** The background queue for alchemy and pill-related production.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** The background queue for alchemy and pill-related production.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Craft Queue, Alchemy, Pill

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 183. Forge Queue

**Entry ID:** `crafting_and_preparation.forge_queue`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** The background queue for forge-related production if supported.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** The background queue for forge-related production if supported.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Craft Queue, Forge, Blueprint

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 184. Craft Speed

**Entry ID:** `crafting_and_preparation.craft_speed`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** The rate at which queued crafting completes; can be affected by upgrades or prestige if live.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** The rate at which queued crafting completes; can be affected by upgrades or prestige if live.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Craft Queue, Prestige Upgrade, Offline Efficiency

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 185. Missing Materials

**Entry ID:** `crafting_and_preparation.missing_materials`  

**Category:** Crafting and Preparation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** crafting, preparation  

**Jade Slip copy:** A state where a recipe or blueprint is known but lacks inputs; the record should show best and fallback sources.

**Sect Note:** Preparation is cultivation made material.

**Plain Meaning:** A state where a recipe or blueprint is known but lacks inputs; the record should show best and fallback sources.

**Why It Matters:** Crafting records show how resources become readiness instead of clutter.

**How to Get / Where to Act:** Open from Apothecary, Forge, recipe cards, missing-material links, or source/use search.

**Used For:** Gate prep, combat survival, gear floors, and anti-drought routing.

**Common Mistakes:**
- Crafting without knowing what milestone it supports.
- Owning pills but not configuring the pouch.
- Showing ingredients without source routes.

**Route Buttons:** Route to Apothecary, Route to Forge, Route to Expeditions

**Related Records:** Material Provenance, Best Source, Expedition Route

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Items, Resources, and Economy
### 186. Gold

**Entry ID:** `items_resources_and_economy.gold`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** The baseline currency used for shops, repairs, crafting, manual support, fail-safe costs, and general city economy.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** The baseline currency used for shops, repairs, crafting, manual support, fail-safe costs, and general city economy.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Outskirts, Shops, Purchase Cost

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 187. Merit

**Entry ID:** `items_resources_and_economy.merit`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** A support currency earned from bounties, eligible failures, or directed tasks and spent on safety nets or progression support.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** A support currency earned from bounties, eligible failures, or directed tasks and spent on safety nets or progression support.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Bounty, Safety Net, Fail-Safe

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 188. Spirit Stones

**Entry ID:** `items_resources_and_economy.spirit_stones`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** A higher spiritual currency or valuable material used for advanced systems, purchases, or progression depending on live content.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** A higher spiritual currency or valuable material used for advanced systems, purchases, or progression depending on live content.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Shops, Rare Materials, Prestige Upgrade

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 189. Common Materials

**Entry ID:** `items_resources_and_economy.common_materials`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** Baseline materials from Outskirts and support loops, used in early crafting and general preparation.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** Baseline materials from Outskirts and support loops, used in early crafting and general preparation.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Outskirts, Recipe, Forge

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 190. Rare Materials

**Entry ID:** `items_resources_and_economy.rare_materials`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** Scarcer materials from bosses, ruins, expeditions, or city-specific sources.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** Scarcer materials from bosses, ruins, expeditions, or city-specific sources.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Ruins, Boss, Material Provenance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 191. Gate Items

**Entry ID:** `items_resources_and_economy.gate_items`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** The class of gate rewards used for major breakthrough handoff.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** The class of gate rewards used for major breakthrough handoff.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Gate Catalyst, Breakthrough, Gate Trial

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 192. Consumables

**Entry ID:** `items_resources_and_economy.consumables`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** Items that are spent for healing, buffs, breakthrough support, or situational preparation.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** Items that are spent for healing, buffs, breakthrough support, or situational preparation.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Pill, Medicine Pouch, Apothecary

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 193. Weapons

**Entry ID:** `items_resources_and_economy.weapons`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** Equipment that raises offensive floor and supports damage readiness.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** Equipment that raises offensive floor and supports damage readiness.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Weapon Floor, Forge, Attack

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 194. Armor

**Entry ID:** `items_resources_and_economy.armor`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** Equipment that raises defensive floor and supports survival readiness.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** Equipment that raises defensive floor and supports survival readiness.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Armor Floor, Forge, Defense

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 195. Accessories

**Entry ID:** `items_resources_and_economy.accessories`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** Equipment with flexible support stats, resistances, utility, or build shaping.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** Equipment with flexible support stats, resistances, utility, or build shaping.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Forge, Loadout, Path Resonance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 196. Safe To Sell

**Entry ID:** `items_resources_and_economy.safe_to_sell`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** A relevance label for items with no upcoming use or safe surplus according to runtime data.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** A relevance label for items with no upcoming use or safe surplus according to runtime data.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Inventory Relevance, Used For, Needed Soon

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 197. Needed Soon

**Entry ID:** `items_resources_and_economy.needed_soon`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** A relevance label for items required by current or near-future milestones, recipes, gates, or recommended prep.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** A relevance label for items required by current or near-future milestones, recipes, gates, or recommended prep.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Current Milestone, Inventory Relevance, Do Not Sell

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 198. Do Not Sell

**Entry ID:** `items_resources_and_economy.do_not_sell`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** A warning label for items required by current milestone, gate transition, rare recipe, or irreversible progression.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** A warning label for items required by current milestone, gate transition, rare recipe, or irreversible progression.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Gate Items, Needed Soon, Inventory Relevance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 199. Best Source

**Entry ID:** `items_resources_and_economy.best_source`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** The most efficient or reliable source for a needed item, based on current reachability and role.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** The most efficient or reliable source for a needed item, based on current reachability and role.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Source/Use Ledger, World Activities, Expedition Route

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 200. Fallback Source

**Entry ID:** `items_resources_and_economy.fallback_source`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** A secondary source when the best route is locked, dry, too risky, or not currently reachable.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** A secondary source when the best route is locked, dry, too risky, or not currently reachable.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Best Source, Safety Net, Bounty

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 201. Source/Use Ledger

**Entry ID:** `items_resources_and_economy.source_use_ledger`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** The bidirectional item record showing how an object is obtained and what consumes it.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** The bidirectional item record showing how an object is obtained and what consumes it.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Best Source, Used For, Factorio Pattern

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 202. Inventory Relevance

**Entry ID:** `items_resources_and_economy.inventory_relevance`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** The current importance of an item: needed now, needed soon, future, optional, safe to sell, or do not sell.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** The current importance of an item: needed now, needed soon, future, optional, safe to sell, or do not sell.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Needed Soon, Safe To Sell, Current Milestone

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 203. Sell Value

**Entry ID:** `items_resources_and_economy.sell_value`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** The currency return for selling an item, shown only after future/current use risk is clear.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** The currency return for selling an item, shown only after future/current use risk is clear.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Safe To Sell, Gold, Inventory Relevance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 204. Purchase Cost

**Entry ID:** `items_resources_and_economy.purchase_cost`  

**Category:** Items, Resources, and Economy  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** items, economy  

**Jade Slip copy:** The cost to buy an item, service, manual, fail-safe, or upgrade.

**Sect Note:** The spirit clerk records not only what is held, but why it matters.

**Plain Meaning:** The cost to buy an item, service, manual, fail-safe, or upgrade.

**Why It Matters:** Economy records prevent inventory clutter from becoming confusion.

**How to Get / Where to Act:** Open from Inventory, shops, recipes, rewards, missing materials, or search.

**Used For:** Source/sink clarity, sell safety, crafting plans, and milestone routing.

**Common Mistakes:**
- Selling items without checking Needed Soon.
- Showing source without used-for.
- Showing used-for without source.

**Route Buttons:** Open Inventory, Route to Best Source

**Related Records:** Gold, Merit, Shops

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Bestiary and Encounters
### 205. Bestiary

**Entry ID:** `bestiary_and_encounters.bestiary`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** The archive of enemies, bosses, guardians, ruins encounters, drops, threats, and counter-prep notes.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** The archive of enemies, bosses, guardians, ruins encounters, drops, threats, and counter-prep notes.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Enemy Record, Boss Record, Drop Table

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 206. Enemy Record

**Entry ID:** `bestiary_and_encounters.enemy_record`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** A record for a specific enemy, generated from content and expanded through first seen, defeated, and mastered states.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** A record for a specific enemy, generated from content and expanded through first seen, defeated, and mastered states.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Common Enemy, Threat Trait, Drop Table

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 207. Boss Record

**Entry ID:** `bestiary_and_encounters.boss_record`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** A record for a stronger encounter that should show risk, reward, mechanics, and preparation advice.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** A record for a stronger encounter that should show risk, reward, mechanics, and preparation advice.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Boss, Boss Mechanics, Counter Prep

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 208. Trial Guardian

**Entry ID:** `bestiary_and_encounters.trial_guardian`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** A boss-class record attached to a Gate Trial and breakthrough threshold.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** A boss-class record attached to a Gate Trial and breakthrough threshold.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Gate Guardian, Gate Trial, Failure Diagnosis

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 209. Ruins Encounter

**Entry ID:** `bestiary_and_encounters.ruins_encounter`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** An encounter record inside ruins, usually tied to deterministic rewards or support-route logic.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** An encounter record inside ruins, usually tied to deterministic rewards or support-route logic.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Ruins, Drop Table, Material Provenance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 210. Drop Table

**Entry ID:** `bestiary_and_encounters.drop_table`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** The known or rumored reward list for enemies, bosses, ruins, or activities.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** The known or rumored reward list for enemies, bosses, ruins, or activities.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Best Source, Material Provenance, Enemy Record

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 211. Threat Trait

**Entry ID:** `bestiary_and_encounters.threat_trait`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** A tag describing what makes an enemy dangerous: burst, sustain pressure, armor, evasion, poison, control, or other.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** A tag describing what makes an enemy dangerous: burst, sustain pressure, armor, evasion, poison, control, or other.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Counter Prep, Failure Diagnosis, Boss Mechanics

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 212. Counter Prep

**Entry ID:** `bestiary_and_encounters.counter_prep`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** Recommended preparation for a known threat.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** Recommended preparation for a known threat.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Threat Trait, Medicine Pouch, AI Profile

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 213. First Seen

**Entry ID:** `bestiary_and_encounters.first_seen`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** The discovery state after an enemy or boss has appeared but may not be defeated.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** The discovery state after an enemy or boss has appeared but may not be defeated.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Recorded, Enemy Record, Rumored

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 214. Defeated

**Entry ID:** `bestiary_and_encounters.defeated`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** The state after the enemy has been beaten at least once, opening fuller drop and counter information.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** The state after the enemy has been beaten at least once, opening fuller drop and counter information.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Studied, Drop Table, Boss Record

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 215. Mastered Encounter

**Entry ID:** `bestiary_and_encounters.mastered_encounter`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** The state after repeat clears, mastery conditions, or city completion prove the player understands the fight.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** The state after repeat clears, mastery conditions, or city completion prove the player understands the fight.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Mastered, City Completion, Prior Life Ledger

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 216. Boss Weakness

**Entry ID:** `bestiary_and_encounters.boss_weakness`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** A concise counter note derived from mechanics, loss patterns, or authored content.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** A concise counter note derived from mechanics, loss patterns, or authored content.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Boss Mechanics, Top Fixes, Counter Prep

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 217. Enemy Drop Provenance

**Entry ID:** `bestiary_and_encounters.enemy_drop_provenance`  

**Category:** Bestiary and Encounters  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bestiary, combat  

**Jade Slip copy:** The source/use relationship for materials that come from enemies or bosses.

**Sect Note:** A scout report is mercy written before the wound.

**Plain Meaning:** The source/use relationship for materials that come from enemies or bosses.

**Why It Matters:** Bestiary records turn encounters into actionable preparation and source knowledge.

**How to Get / Where to Act:** Open from combat, enemy cards, drop sources, or bestiary shelf.

**Used For:** Drop hunting, risk explanation, boss prep, and current blocker resolution.

**Common Mistakes:**
- Hiding needed drop sources until too late.
- Showing enemy lore without threat or source information.

**Route Buttons:** Open Bestiary, Route to Counter Prep

**Related Records:** Drop Table, Material Provenance, Best Source

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Bounties, Expeditions, and Offline Cultivation
### 218. Bounty

**Entry ID:** `bounties_expeditions_and_offline_cultivation.bounty`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** A directed task that gives the player a useful route, not just an extra reward.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** A directed task that gives the player a useful route, not just an extra reward.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Tracked Bounty, Merit Reward, Bounty Difficulty

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 219. Tracked Bounty

**Entry ID:** `bounties_expeditions_and_offline_cultivation.tracked_bounty`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** The currently selected bounty whose progress should appear in world, combat, and records surfaces.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** The currently selected bounty whose progress should appear in world, combat, and records surfaces.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Bounty, Current Milestone, Merit

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 220. Merit Reward

**Entry ID:** `bounties_expeditions_and_offline_cultivation.merit_reward`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** The Merit gained from bounties, eligible failures, or support actions.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** The Merit gained from bounties, eligible failures, or support actions.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Merit, Bounty, Safety Net

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 221. Bounty Difficulty

**Entry ID:** `bounties_expeditions_and_offline_cultivation.bounty_difficulty`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** The risk/reward tier of a bounty. It should match the player’s current readiness and route purpose.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** The risk/reward tier of a bounty. It should match the player’s current readiness and route purpose.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Bounty, Readiness Score, World Inspector

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 222. Bounty Reroll

**Entry ID:** `bounties_expeditions_and_offline_cultivation.bounty_reroll`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** A way to change bounty options if the current board does not support the player’s route.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** A way to change bounty options if the current board does not support the player’s route.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Bounty Board, Merit, Current Milestone

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 223. Bounty Completion

**Entry ID:** `bounties_expeditions_and_offline_cultivation.bounty_completion`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** The moment a tracked bounty pays rewards and possibly updates city or archive state.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** The moment a tracked bounty pays rewards and possibly updates city or archive state.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Tracked Bounty, Merit Reward, Run Summary

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 224. Expedition Route

**Entry ID:** `bounties_expeditions_and_offline_cultivation.expedition_route`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** A background route that produces expected materials, herbs, ore, gold, or other support resources over time.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** A background route that produces expected materials, herbs, ore, gold, or other support resources over time.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Expected Yield, Expedition Slots, Material Provenance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 225. Expected Yield

**Entry ID:** `bounties_expeditions_and_offline_cultivation.expected_yield`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** The preview of what an expedition or activity is likely to return.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** The preview of what an expedition or activity is likely to return.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Expedition Route, Best Source, Offline Efficiency

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 226. Expedition Slots

**Entry ID:** `bounties_expeditions_and_offline_cultivation.expedition_slots`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** The number of simultaneous expedition lanes available.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** The number of simultaneous expedition lanes available.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Expedition Board, Prestige Upgrade, Background Queue

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 227. Expedition Duration

**Entry ID:** `bounties_expeditions_and_offline_cultivation.expedition_duration`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** The time required for a background route to return results.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** The time required for a background route to return results.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Expected Yield, Offline Efficiency, Craft Queue

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 228. Expedition Idle

**Entry ID:** `bounties_expeditions_and_offline_cultivation.expedition_idle`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** A state showing unused expedition capacity that could help a shortage.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** A state showing unused expedition capacity that could help a shortage.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Expedition Slots, Current Milestone, Elder Note

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 229. Offline Cultivation

**Entry ID:** `bounties_expeditions_and_offline_cultivation.offline_cultivation`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** Progress awarded while away, according to the single authoritative offline rule set.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** Progress awarded while away, according to the single authoritative offline rule set.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Offline Cap, Offline Efficiency, Cultivation

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 230. Offline Cap

**Entry ID:** `bounties_expeditions_and_offline_cultivation.offline_cap`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** The maximum away-time or offline progress window honored by the game.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** The maximum away-time or offline progress window honored by the game.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Offline Cultivation, Offline Efficiency, Settings

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 231. Offline Efficiency

**Entry ID:** `bounties_expeditions_and_offline_cultivation.offline_efficiency`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** The multiplier or rule determining how much offline activity is converted into progress.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** The multiplier or rule determining how much offline activity is converted into progress.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Offline Cultivation, Prestige Upgrade, Background Queue

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 232. Background Queue

**Entry ID:** `bounties_expeditions_and_offline_cultivation.background_queue`  

**Category:** Bounties, Expeditions, and Offline Cultivation  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** bounties, expeditions, offline  

**Jade Slip copy:** Any queue that continues without moment-to-moment input: expeditions, crafting, and future support loops.

**Sect Note:** A good support loop works while the disciple walks elsewhere.

**Plain Meaning:** Any queue that continues without moment-to-moment input: expeditions, crafting, and future support loops.

**Why It Matters:** These entries keep background systems useful without turning them into chores.

**How to Get / Where to Act:** Open from Bounty Board, Expedition Board, offline summary, current milestone, or resource source links.

**Used For:** Directed routing, drought relief, background support, and Merit economy.

**Common Mistakes:**
- Making background systems feel like a second full game.
- Not tying routes to current shortages.

**Route Buttons:** Route to Bounty Board, Route to Expedition Board

**Related Records:** Craft Queue, Expedition Route, One Foreground Activity Rule

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Reincarnation and Prior Lives
### 233. Reincarnation

**Entry ID:** `reincarnation_and_prior_lives.reincarnation`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The formal end of one life and beginning of the next, converting current progress into permanent or hybrid advantage.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The formal end of one life and beginning of the next, converting current progress into permanent or hybrid advantage.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Prestige AP, What Resets, What Persists

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 234. Prestige AP

**Entry ID:** `reincarnation_and_prior_lives.prestige_ap`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The primary meta currency gained from reincarnation and spent on prestige upgrades.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The primary meta currency gained from reincarnation and spent on prestige upgrades.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Prestige Upgrade, Lifetime AP, Prestige Advisor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 235. Lifetime AP

**Entry ID:** `reincarnation_and_prior_lives.lifetime_ap`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The total accumulated AP across lives, used for history and possibly unlock thresholds.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The total accumulated AP across lives, used for history and possibly unlock thresholds.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Prestige AP, Prior Life Ledger, Run Summary

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 236. Prestige Upgrade

**Entry ID:** `reincarnation_and_prior_lives.prestige_upgrade`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** A permanent or hybrid meta improvement purchased with AP. It must clearly say whether its effect is live.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** A permanent or hybrid meta improvement purchased with AP. It must clearly say whether its effect is live.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Prestige Tree, What Persists, Meta Upgrade

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 237. Prestige Tree

**Entry ID:** `reincarnation_and_prior_lives.prestige_tree`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The organized set of purchasable meta upgrades. It must not overpromise runtime-inactive effects.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The organized set of purchasable meta upgrades. It must not overpromise runtime-inactive effects.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Prestige Upgrade, Meta Upgrade, Prestige Advisor

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 238. What Resets

**Entry ID:** `reincarnation_and_prior_lives.what_resets`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The explicit list of per-life state that is wiped on reincarnation.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The explicit list of per-life state that is wiped on reincarnation.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Reincarnation, New Life Contract, Run Summary

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 239. What Persists

**Entry ID:** `reincarnation_and_prior_lives.what_persists`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The explicit list of account/meta state that survives reincarnation.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The explicit list of account/meta state that survives reincarnation.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Prestige AP, Permanent Unlock, Prior Life Ledger

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 240. Hybrid Retention

**Entry ID:** `reincarnation_and_prior_lives.hybrid_retention`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** State that resets but is partially restored or re-derived from prestige upgrades.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** State that resets but is partially restored or re-derived from prestige upgrades.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Mastery Retention, Prestige Upgrade, New Life Contract

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 241. Prior Life Ledger

**Entry ID:** `reincarnation_and_prior_lives.prior_life_ledger`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The history of previous lives: path, Heart Law, highest realm, gates, cities, manuals, failures, AP, and retained gains.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The history of previous lives: path, Heart Law, highest realm, gates, cities, manuals, failures, AP, and retained gains.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Run Summary, Life Profile, Mastered

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 242. Run Summary

**Entry ID:** `reincarnation_and_prior_lives.run_summary`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The end-of-life report explaining what was achieved, what was learned, and why the next life is stronger.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The end-of-life report explaining what was achieved, what was learned, and why the next life is stronger.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Prior Life Ledger, Prestige Advisor, Reclaim Speed

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 243. Prestige Advisor

**Entry ID:** `reincarnation_and_prior_lives.prestige_advisor`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** A conservative recommendation surface explaining whether reincarnation is inefficient, optional, efficient, or content-cap recommended.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** A conservative recommendation surface explaining whether reincarnation is inefficient, optional, efficient, or content-cap recommended.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Soft Wall, Current Content Cap, Prestige AP

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 244. Reclaim Speed

**Entry ID:** `reincarnation_and_prior_lives.reclaim_speed`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The expected ability of the next life to regain previous ground faster than the current life did.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The expected ability of the next life to regain previous ground faster than the current life did.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Prestige Upgrade, Second Life, Run Summary

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 245. Content Cap Prestige

**Entry ID:** `reincarnation_and_prior_lives.content_cap_prestige`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The state where the player reached the current live endpoint and should be guided to reincarnate or pursue mastery goals.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The state where the player reached the current live endpoint and should be guided to reincarnate or pursue mastery goals.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Current Content Cap, Prestige Advisor, Soft Wall

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 246. Second Life

**Entry ID:** `reincarnation_and_prior_lives.second_life`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The first reincarnated run, which should clearly demonstrate faster progress or stronger options.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The first reincarnated run, which should clearly demonstrate faster progress or stronger options.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Reclaim Speed, What Persists, Hybrid Retention

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 247. Meta Upgrade

**Entry ID:** `reincarnation_and_prior_lives.meta_upgrade`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** Any upgrade whose value exists outside the current life.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** Any upgrade whose value exists outside the current life.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Prestige Upgrade, Permanent Unlock, Hybrid Retention

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 248. Mastery Retention

**Entry ID:** `reincarnation_and_prior_lives.mastery_retention`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The portion of manual/technique mastery kept across lives if explicitly supported by prestige.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The portion of manual/technique mastery kept across lives if explicitly supported by prestige.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** Hybrid Retention, Technique, Prestige Upgrade

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 249. Permanent Unlock

**Entry ID:** `reincarnation_and_prior_lives.permanent_unlock`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** A feature, slot, tier, or capability that stays unlocked across lives.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** A feature, slot, tier, or capability that stays unlocked across lives.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** What Persists, Prestige Upgrade, Lifetime AP

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 250. New Life Contract

**Entry ID:** `reincarnation_and_prior_lives.new_life_contract`  

**Category:** Reincarnation and Prior Lives  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** prestige, reincarnation  

**Jade Slip copy:** The exact agreement of what resets, what persists, and what is re-derived when reincarnating.

**Sect Note:** A life ends. The record remains.

**Plain Meaning:** The exact agreement of what resets, what persists, and what is re-derived when reincarnating.

**Why It Matters:** Reincarnation entries protect player trust in the outer loop.

**How to Get / Where to Act:** Open from Prestige, soft-wall guidance, run summary, or prior-life records.

**Used For:** Prestige decisions, reset clarity, long-term motivation, and content-cap handoff.

**Common Mistakes:**
- Calling accidental persistence a design feature.
- Showing inactive prestige effects as live.
- Hiding what will be lost.

**Route Buttons:** Route to Prestige, View Prior Lives

**Related Records:** What Resets, What Persists, Hybrid Retention

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Systems, UI, and Controls
### 251. Search

**Entry ID:** `systems_ui_and_controls.search`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The text search across names, aliases, tags, sources, uses, categories, and milestone labels.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The text search across names, aliases, tags, sources, uses, categories, and milestone labels.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Filters, Recent Records, Search the Records

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 252. Filters

**Entry ID:** `systems_ui_and_controls.filters`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The chips and controls used to narrow records by category, state, relevance, path, city, rarity, source, or missing status.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The chips and controls used to narrow records by category, state, relevance, path, city, rarity, source, or missing status.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Search, Needed Now, Sealed

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 253. Pins

**Entry ID:** `systems_ui_and_controls.pins`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** Player or milestone-selected pinned records kept in a quick shelf.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** Player or milestone-selected pinned records kept in a quick shelf.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Current Milestone, Recent Records, Related Records

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 254. Related Records

**Entry ID:** `systems_ui_and_controls.related_records`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The linked records shown through Threads of Karma.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The linked records shown through Threads of Karma.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Threads of Karma, Source/Use Ledger, Follow Thread

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 255. Threads of Karma

**Entry ID:** `systems_ui_and_controls.threads_of_karma`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The right rail that connects an entry to sources, uses, milestones, prior lives, and route buttons.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The right rail that connects an entry to sources, uses, milestones, prior lives, and route buttons.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Related Records, Best Source, Used For

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 256. Jade Slip

**Entry ID:** `systems_ui_and_controls.jade_slip`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The compact contextual drawer opened from a label, item, currency, building, enemy, or requirement row.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The compact contextual drawer opened from a label, item, currency, building, enemy, or requirement row.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Open Full Record, Related Records, Tooltips

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 257. Elder Note

**Entry ID:** `systems_ui_and_controls.elder_note`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The current-run guidance card showing objective, missing requirements, best action, and related records.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The current-run guidance card showing objective, missing requirements, best action, and related records.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Ask the Records, Current Milestone, Top Fixes

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 258. Breadcrumbs

**Entry ID:** `systems_ui_and_controls.breadcrumbs`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The shelf-location trail showing category, subcategory, and current entry.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The shelf-location trail showing category, subcategory, and current entry.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Search, Recent Records, Back to Shelf

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 259. Recent Records

**Entry ID:** `systems_ui_and_controls.recent_records`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The small history of records opened in the current session.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The small history of records opened in the current session.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Search, Pins, Breadcrumbs

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 260. Archive Discovery

**Entry ID:** `systems_ui_and_controls.archive_discovery`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The act of moving records from sealed or rumored into recorded, studied, or mastered states.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The act of moving records from sealed or rumored into recorded, studied, or mastered states.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Record State, Sealed, Mastered

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 261. Record State

**Entry ID:** `systems_ui_and_controls.record_state`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The discovery status of a record: Sealed, Rumored, Recorded, Studied, or Mastered.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The discovery status of a record: Sealed, Rumored, Recorded, Studied, or Mastered.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Sealed, Rumored, Recorded

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 262. Sealed

**Entry ID:** `systems_ui_and_controls.sealed`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A hidden or future record state that prevents spoilers without hiding critical requirements.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A hidden or future record state that prevents spoilers without hiding critical requirements.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Record State, Sealed City Records, Future

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 263. Rumored

**Entry ID:** `systems_ui_and_controls.rumored`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A partial record state where the archive knows a subject exists but not all details.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A partial record state where the archive knows a subject exists but not all details.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Record State, Sealed, Recorded

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 264. Recorded

**Entry ID:** `systems_ui_and_controls.recorded`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A full practical state after the player encounters or unlocks a subject.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A full practical state after the player encounters or unlocks a subject.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Record State, Studied, Archive Discovery

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 265. Studied

**Entry ID:** `systems_ui_and_controls.studied`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A deeper state after meaningful use, clear, craft, purchase, configuration, or defeat.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A deeper state after meaningful use, clear, craft, purchase, configuration, or defeat.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Recorded, Mastered, Archive Discovery

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 266. Mastered

**Entry ID:** `systems_ui_and_controls.mastered`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A completion state marked by a red seal, prior-life notation, or advanced notes.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A completion state marked by a red seal, prior-life notation, or advanced notes.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Studied, Prior Life Ledger, Completion Seal

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 267. Reduced Motion

**Entry ID:** `systems_ui_and_controls.reduced_motion`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A setting that disables continuous particles and converts motion to simple fades.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A setting that disables continuous particles and converts motion to simple fades.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Settings, Low FX, Accessibility

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 268. Low FX

**Entry ID:** `systems_ui_and_controls.low_fx`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A setting that reduces atmospheric effects while preserving readability and state labels.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A setting that reduces atmospheric effects while preserving readability and state labels.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Settings, Reduced Motion, Accessibility

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 269. Keyboard Navigation

**Entry ID:** `systems_ui_and_controls.keyboard_navigation`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** The ability to navigate search, category rail, entry body, related links, and route buttons by keyboard.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** The ability to navigate search, category rail, entry body, related links, and route buttons by keyboard.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Accessibility, Focus State, Search

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 270. Tooltips

**Entry ID:** `systems_ui_and_controls.tooltips`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** Short contextual explanations that supplement but do not replace full records.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** Short contextual explanations that supplement but do not replace full records.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Jade Slip, Open Full Record, Accessibility

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 271. Route Button

**Entry ID:** `systems_ui_and_controls.route_button`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A button that moves the player from information to the screen that solves the problem.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A button that moves the player from information to the screen that solves the problem.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Best Source, Elder Note, World Inspector

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 272. Compare View

**Entry ID:** `systems_ui_and_controls.compare_view`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A view for comparing techniques, gear, pills, manual offers, recipes, or routes when the player has a choice.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A view for comparing techniques, gear, pills, manual offers, recipes, or routes when the player has a choice.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Manual Offer, Technique, Recipe

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 273. Missing Relation

**Entry ID:** `systems_ui_and_controls.missing_relation`  

**Category:** Systems, UI, and Controls  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** systems, ui  

**Jade Slip copy:** A developer-facing or safe player-facing state when a source/use link cannot be resolved from content data.

**Sect Note:** The archive must be usable before it can be wise.

**Plain Meaning:** A developer-facing or safe player-facing state when a source/use link cannot be resolved from content data.

**Why It Matters:** System entries teach how to operate the Pavilion itself.

**How to Get / Where to Act:** Open from Records help, hover/focus states, search help, or UI labels.

**Used For:** Usability, accessibility, route clarity, and implementation consistency.

**Common Mistakes:**
- Making the Pavilion itself hard to learn.
- Hiding controls behind theme language only.

**Route Buttons:** Open Records

**Related Records:** Developer Diagnostics, Source/Use Ledger, Runtime Truth

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

## Xianxia Glossary
### 274. Qi

**Entry ID:** `xianxia_glossary.qi`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** Vital/spiritual energy cultivated, refined, and circulated through the body.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** Vital/spiritual energy cultivated, refined, and circulated through the body.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Qi, Dantian, Meridians

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 275. Dantian

**Entry ID:** `xianxia_glossary.dantian`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** The inner field or reservoir where refined Qi is gathered and stabilized.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** The inner field or reservoir where refined Qi is gathered and stabilized.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Dantian, Qi, Cultivation Base

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 276. Meridian

**Entry ID:** `xianxia_glossary.meridian`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A channel through which Qi circulates; in-game, a language for focus, stability, and inner flow.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A channel through which Qi circulates; in-game, a language for focus, stability, and inner flow.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Meridians, Qi Circulation, Dantian

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 277. Dao Heart

**Entry ID:** `xianxia_glossary.dao_heart`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** The inner resolve and orientation toward the Dao.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** The inner resolve and orientation toward the Dao.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Dao Heart, Heart Law, Verse State

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 278. Heart Law

**Entry ID:** `xianxia_glossary.heart_law`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A core doctrine or scripture that governs inner cultivation.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A core doctrine or scripture that governs inner cultivation.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Heart Law, Comprehension, Path Resonance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 279. Spirit Root

**Entry ID:** `xianxia_glossary.spirit_root`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** Innate cultivation affinity or root quality.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** Innate cultivation affinity or root quality.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Spirit Root, Path Resonance, Heart Law

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 280. Cultivation Base

**Entry ID:** `xianxia_glossary.cultivation_base`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A cultivator’s accumulated realm strength and refined Qi capacity.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A cultivator’s accumulated realm strength and refined Qi capacity.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Cultivation Base, Realm, Qi

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 281. Foundation Establishment

**Entry ID:** `xianxia_glossary.foundation_establishment`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A classic early xianxia threshold and the first major target beyond Qi Condensation in this game.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A classic early xianxia threshold and the first major target beyond Qi Condensation in this game.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Foundation Establishment, Foundation Gate, Gate Foundation Pill

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 282. Tribulation

**Entry ID:** `xianxia_glossary.tribulation`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A high-stakes ordeal imposed by Heaven, fate, or realm transition; not every gate is a tribulation, but the language belongs to later thresholds.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A high-stakes ordeal imposed by Heaven, fate, or realm transition; not every gate is a tribulation, but the language belongs to later thresholds.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Gate Trial, Spirit Severing, Soft Wall

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 283. Pill Refining

**Entry ID:** `xianxia_glossary.pill_refining`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** The art of preparing pills and elixirs from herbs and materials.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** The art of preparing pills and elixirs from herbs and materials.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Apothecary, Pill, Alchemy

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 284. Talisman

**Entry ID:** `xianxia_glossary.talisman`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A spiritual inscription or object carrying a prepared effect.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A spiritual inscription or object carrying a prepared effect.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Talisman, Talisman Studio, Craft Queue

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 285. Jade Slip

**Entry ID:** `xianxia_glossary.jade_slip`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A compact knowledge record; in-game, the contextual mini-entry opened from terms or items.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A compact knowledge record; in-game, the contextual mini-entry opened from terms or items.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Jade Slip, Pavilion, Records

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 286. Sect

**Entry ID:** `xianxia_glossary.sect`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A cultivation institution; in-game, the Pavilion and city services can borrow sect language for authority.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A cultivation institution; in-game, the Pavilion and city services can borrow sect language for authority.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Elder, Manual Pavilion, Pavilion

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 287. Inner Disciple

**Entry ID:** `xianxia_glossary.inner_disciple`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A cultivator with deeper access to teachings; useful flavor for progression status and manual tiers.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A cultivator with deeper access to teachings; useful flavor for progression status and manual tiers.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Manual, Sect, Path Resonance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 288. Elder

**Entry ID:** `xianxia_glossary.elder`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A senior figure whose notes frame guidance without becoming a modern tutorial voice.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A senior figure whose notes frame guidance without becoming a modern tutorial voice.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Elder Note, Sect, Pavilion

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 289. Manual

**Entry ID:** `xianxia_glossary.manual`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A scripture or book of method; in-game, the acquisition object for techniques.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A scripture or book of method; in-game, the acquisition object for techniques.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Manual, Study, Technique

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 290. Dao

**Entry ID:** `xianxia_glossary.dao`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** The way, law, or underlying order; used sparingly for doctrine and high-level cultivation flavor.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** The way, law, or underlying order; used sparingly for doctrine and high-level cultivation flavor.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Dao Heart, Heart Law, Path Resonance

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 291. Karma

**Entry ID:** `xianxia_glossary.karma`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** Threads of consequence and relation; in-game, used for related records and prior-life connections.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** Threads of consequence and relation; in-game, used for related records and prior-life connections.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Threads of Karma, Prior Life Ledger, Reincarnation

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 292. Reincarnation

**Entry ID:** `xianxia_glossary.reincarnation`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** The cycling of lives; in-game, the prestige loop.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** The cycling of lives; in-game, the prestige loop.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Reincarnation, Prior Life Ledger, Prestige AP

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 293. Spirit Stone

**Entry ID:** `xianxia_glossary.spirit_stone`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A spiritual currency or material often used in xianxia economies; in-game, a higher spiritual resource.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A spiritual currency or material often used in xianxia economies; in-game, a higher spiritual resource.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Spirit Stones, Economy, Shops

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 294. Demon Beast

**Entry ID:** `xianxia_glossary.demon_beast`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A cultivation-genre enemy archetype; use for bestiary tone when appropriate.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A cultivation-genre enemy archetype; use for bestiary tone when appropriate.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Bestiary, Enemy Record, Drop Table

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 295. Core

**Entry ID:** `xianxia_glossary.core`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A condensed inner power state; useful around Core Formation and later realm language.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A condensed inner power state; useful around Core Formation and later realm language.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Core Formation, Gate Core Catalyst, Dantian

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 296. Nascent Soul

**Entry ID:** `xianxia_glossary.nascent_soul`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A high cultivation state where the spiritual self becomes more independent.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A high cultivation state where the spiritual self becomes more independent.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Nascent Soul, Nascent Soul Gate, Spirit Focus

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 297. Immortal Ascension

**Entry ID:** `xianxia_glossary.immortal_ascension`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** A distant fantasy endpoint; use as sealed/long-term myth rather than current practical-slice promise.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** A distant fantasy endpoint; use as sealed/long-term myth rather than current practical-slice promise.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Sealed, Current Content Cap, Future

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 298. Tu Na Breathing

**Entry ID:** `xianxia_glossary.tu_na_breathing`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** Breathing practice that expels stale Qi and draws in natural Qi; flavor basis for Breath Focus.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** Breathing practice that expels stale Qi and draws in natural Qi; flavor basis for Breath Focus.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Breath Focus, Qi, Cultivation

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 299. Qi Circulation

**Entry ID:** `xianxia_glossary.qi_circulation`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** The practice of moving Qi through dantian and meridians; flavor basis for cultivation flow.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** The practice of moving Qi through dantian and meridians; flavor basis for cultivation flow.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Qi, Meridians, Dantian

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 300. Inner Alchemy

**Entry ID:** `xianxia_glossary.inner_alchemy`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** The transformation of the self through internal refinement; flavor basis for Heart Law and Dantian records.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** The transformation of the self through internal refinement; flavor basis for Heart Law and Dantian records.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Heart Law, Dantian, Dao Heart

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 301. Dantian Vessel

**Entry ID:** `xianxia_glossary.dantian_vessel`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** The metaphorical capacity of the inner field to hold refined Qi.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** The metaphorical capacity of the inner field to hold refined Qi.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Dantian, Qi Cap, Stability

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.
### 302. Martial Intent

**Entry ID:** `xianxia_glossary.martial_intent`  

**Category:** Xianxia Glossary  

**Default state:** Recorded  

**Implementation source:** Hand-authored  

**Unlock rule:** Always visible or becomes Recorded when first encountered.  

**Tags:** glossary, xianxia  

**Jade Slip copy:** The focused will behind combat expression; flavor basis for Martial Path and offensive techniques.

**Sect Note:** The word is old; the record makes it playable.

**Plain Meaning:** The focused will behind combat expression; flavor basis for Martial Path and offensive techniques.

**Why It Matters:** Glossary entries preserve xianxia texture while mapping terms to game systems.

**How to Get / Where to Act:** Open from search, term hover, Jade Slip, or glossary shelf.

**Used For:** Flavor clarity, mechanical mapping, and translation of genre terms into player action.

**Common Mistakes:**
- Using genre words without game meaning.
- Overloading common terms with contradictory mechanics.

**Route Buttons:** Search Related Records

**Related Records:** Martial Path, Technique, Pressure Duelist

**Required UI Labels / Chips:**
- Uses the standard entry labels: Sect Note, Plain Meaning, Current Relevance, How to Get / Where to Act, Used For, Requirements, Common Mistakes, Related Records.

# Data-Generated Record Families
The following records must exist as Pavilion entries even though their final names, values, costs, stats, drop rates, and status are generated from source content and runtime state. These are not optional. They are how the Pavilion covers every concrete piece of content without handcoding stale text.

| Record ID Pattern | Coverage | Required Content |
|---|---|---|
| `item.{itemId}` | All current and future item records | Generated from items.json and live source/sink resolvers. Must show name, type, rarity, source, used-for, current relevance, safe-to-sell, needed-soon, route buttons, and warnings. |
| `recipe.alchemy.{recipeId}` | All 21 alchemy recipe records | Generated from alchemy recipe content. Must show station, inputs, output, unlock, craft time, best source for missing inputs, and used-for. |
| `recipe.forge.{blueprintId}` | All 24 forge blueprint records | Generated from forge blueprint content. Must show required materials, output gear/tool, floor impact, missing sources, and gate relevance. |
| `technique.{techniqueId}` | All 60 technique records | Generated from technique content. Must show path alignment, active/passive/ultimate slot, role, source manual, mastery/rank, traits, rune sockets, AI fit, and current milestone value. |
| `manual.{manualId}` | All manual records | Generated from manual content and Manual Pavilion pools. Must show grade, path/family, technique output, duplicate conversion, study time, and current build gap relevance. |
| `heartLaw.{heartLawId}` | All 18 Heart Law records | Generated from Heart Law content plus authored doctrine intro. Must show doctrine, chapters, bonuses, resonance, breath mode fit, and live/inactive effect status. |
| `city.{cityId}` | All 5 city records | Generated from cities.json plus authored summaries. Must show unlockMajorRealm, modules, refs, gate, ruin, manual pools, role, reachability, and content-cap state. |
| `trial.{trialId}` | All 5 trial records | Generated from trials.json, trial lifecycle, gate resolver, and fail-safe normalization. Must show eligibility, gate reward, fail-safe, readiness, clear/bypass/defeat state. |
| `ruin.{ruinId}` | All 5 ruin records | Generated from ruins content. Must show route identity, encounters, deterministic rewards, drought solved, recommended prep, and city relation. |
| `enemy.{enemyId}` | All 35 enemy records | Generated from enemies content and encounter history. Must show first-seen/defeated/mastered, threat tags, drops, counters, and best source connections. |
| `rune.{runeId}` | All 10 rune records | Generated from rune content. Must show socket type, effect, source, compatible techniques/items, and build fit. |
| `talisman.{talismanId}` | All 7 talisman recipe/output records | Generated from talisman content. Must show craft inputs, output, effect, duration/trigger, source, and situational use. |
| `bounty.{bountyTemplateId}` | All 15 bounty template records | Generated from bounty templates. Must show target, difficulty, reward, Merit value, route, and current relevance. |
| `prestige.{upgradeId}` | All 27 prestige upgrade records | Generated from prestige_store.json and runtime-applied effects. Must show cost, prerequisites, live/inactive status, effect, reset/retain impact, and advisor relevance. |

## Known Named Data Records Requiring Exact Handling

| Entry ID | Display Title | Required Handling |
|---|---|---|
| `item.gate_foundation_pill` | Gate Foundation Pill | Gate item used for Foundation breakthrough handoff. Source should be the Foundation Gate clear reward or Safety Net bypass according to gate resolver. |
| `item.gate_core_catalyst` | Gate Core Catalyst | Gate item used for Core Formation breakthrough handoff. Should be generated from trial content and not legacy core_catalyst hardcode. |
| `item.gate_core_stabilizer` | Gate Core Stabilizer | Gate item used for Nascent Soul breakthrough handoff. Should be generated from trial content and not legacy core_stabilizer hardcode. |
| `item.gate_soul_condensate` | Gate Soul Condensate | Gate item used for Soul Formation breakthrough handoff. Should be generated from trial content and not legacy soul_condensate hardcode. |
| `item.gate_severing_seal` | Gate Severing Seal | Gate item used for Spirit Severing breakthrough handoff if live content exposes that transition. |
| `heartLaw.quiet_breath_method` | Quiet Breath Method | Known Heart Law example. Should show cultivation-rate, offline/stability/comprehension, and any live combatDamageMult effect honestly rather than treating it as future tuning. |
| `technique.iron_palm` | Iron Palm | Known technique/example top-fix target from Gate Trial mockup. Should show role, source manual, path fit, mastery/rank, AI fit, and current gate value once content confirms details. |

## Generated Item Entry Template
**Title:** {item.name}  
**Entry ID:** item.{item.id}  
**Jade Slip copy:** {item.shortDescription or generated one-line purpose}.  
**Sect Note:** The spirit clerk records this item by source, use, and danger of waste.  
**Plain Meaning:** {item.type + practical purpose}.  
**Current Relevance:** {Needed Now / Needed Soon / Future / Optional / Safe to Sell / Do Not Sell / Already Consumed}.  
**How to Get / Where to Act:** Best Source first; fallback sources second. Route button must use current reachability.  
**Used For:** Recipes, blueprints, breakthrough handoff, medicine pouch, shop purchase, fail-safe, prestige, or no current use.  
**Warnings:** Consumed on use; scarce; required soon; content future; not currently live; do not sell.  
**Threads of Karma:** Source activity, consuming recipe, consuming milestone, related city, related enemy, related route.

## Generated Technique Entry Template
**Title:** {technique.name}  
**Entry ID:** technique.{technique.id}  
**Jade Slip copy:** {role + slot + path fit}.  
**Sect Note:** A technique is doctrine expressed under pressure.  
**Plain Meaning:** {what this technique does in combat or support terms}.  
**Current Relevance:** {core to current loadout / fills empty slot / improves gate pressure / future / off-path but usable / mastered}.  
**How to Get / Where to Act:** Source manual, fragments, Pavilion offer, drop, or other content source.  
**Used For:** Loadout slot, AI profile, build archetype, mastery/rank growth, current milestone.  
**Mechanic Details:** Active/passive/ultimate, cooldown, scaling, rank cap, mastery, traits, rune sockets, AI fit.  
**Common Mistake:** Equipping by rarity only instead of role, path alignment, slot need, and AI behavior.  
**Threads of Karma:** Source manual, build archetype, path, AI profile, current gate, mastery record.

## Generated Heart Law Entry Template
**Title:** {heartLaw.name}  
**Entry ID:** heartLaw.{heartLaw.id}  
**Jade Slip copy:** {doctrine in one sentence}.  
**Sect Note:** A Heart Law changes how a life breathes.  
**Plain Meaning:** {practical summary of effects and identity}.  
**Current Relevance:** {active law / unlocked / sealed / mismatched / resonant / recommended}.  
**How to Get / Where to Act:** Life start, unlock condition, prestige tier, city, or content source.  
**Used For:** Cultivation rate, stability, comprehension, insight timing, offline support, cross-domain effects if live.  
**Mechanic Details:** Chapters, chapter costs, breath mode fit, Spirit Root affinity, path resonance, live/inactive effect status.  
**Common Mistake:** Treating a poetic doctrine as flavor only, or hiding a live combat-support effect as future tuning.  
**Threads of Karma:** Path, Spirit Root, focus mode, doctrine template, current life, prior life.

## Generated City Entry Template
**Title:** {city.name}  
**Entry ID:** city.{city.id}  
**Jade Slip copy:** {city role in one line}.  
**Sect Note:** Each city is a chapter of the climb.  
**Plain Meaning:** {what this city teaches and unlocks}.  
**Current Relevance:** Current / reachable / sealed / future / content cap / completed.  
**How to Get / Where to Act:** unlockMajorRealm and runtime unlock truth.  
**Used For:** Local modules, gate, ruin, manual pools, enemies, recipes, bounties, expeditions.  
**Mechanic Details:** Modules, refs, unlock requirements, current reachability, known content gaps.  
**Common Mistake:** Presenting a city as live when runtime does not unlock it.  
**Threads of Karma:** Gate, ruin, modules, realm, next city, current content cap.

## Generated Prestige Upgrade Entry Template
**Title:** {upgrade.name}  
**Entry ID:** prestige.{upgrade.id}  
**Jade Slip copy:** {effect and whether it is live}.  
**Sect Note:** A prior life pays for the next life's first breath.  
**Plain Meaning:** {what the upgrade changes}.  
**Current Relevance:** Purchasable / purchased / locked / inactive content promise / recommended / optional.  
**How to Get / Where to Act:** AP cost, prerequisites, category, prestige screen route.  
**Used For:** Permanent, reset, or hybrid retention effects.  
**Mechanic Details:** Live runtime effect, inactive content effect, cost, prerequisites, unlock tier, advisor value.  
**Common Mistake:** Showing content-defined effects as active when runtime does not apply them.  
**Threads of Karma:** Reincarnation, What Persists, Hybrid Retention, Prior Life Ledger, Prestige Advisor.

# Current Milestone and Elder Note Copy

| Milestone ID | Title | Elder Note Body | Best Next Action | Related Records |
|---|---|---|---|---|
| `first_life_choose_path` | Choose Path and Heart Law | Select a path, Heart Law, and starting focus so the life has one doctrine. | Open Life Profile after selection. | Path, Heart Law, Spirit Root, Life Profile |
| `first_cultivation_begin` | Begin Cultivation | Start gathering Qi and learn what the next substage requires. | Route to Cultivation. | Qi, Realm, Substage, Breakthrough |
| `first_world_visit` | Visit the City Package | Use Pinewind services to solve resource, manual, medicine, and gear needs. | Route to World. | Pinewind Hamlet, Outskirts, Manual Pavilion, Apothecary, Forge |
| `prepare_foundation_gate` | Prepare Foundation Gate | You are near the threshold. Check Qi, final substage, loadout, medicine, weapon floor, and support routes. | Stock medicine, improve weapon floor, and close build gaps. | Foundation Gate, Medicine Pouch, Weapon Floor, Manual Pavilion, Ruins |
| `foundation_gate_attempt` | Attempt Foundation Gate | Attempt the gate only when minimum checklist is satisfied and recommended prep is acceptable. | Route to Gate Trial. | Gate Trial, Safety Net, Top Fixes |
| `foundation_breakthrough_ready` | Break Through to Foundation | The gate reward is secured. Return to Cultivation to perform the realm transition. | Route to Cultivation. | Gate Foundation Pill, Breakthrough Handoff, Foundation Establishment |
| `city_handoff_after_foundation` | Open Next City | Entering Foundation should unlock or reveal the next city package if runtime progression supports it. | Route to World. | City Unlocks, Stonecrag Town, Current City |
| `first_prestige_advice` | Consider Reincarnation | If progress slows or content cap is reached, compare current AP gain and next-life reclaim speed. | Route to Prestige. | Prestige Advisor, Run Summary, What Resets, What Persists |

# Content QA Checklist
- Every hand-authored entry has a stable entry ID.
- Every generated record family has a template and source-data rule.
- Every item record must answer both How to Get and Used For.
- Every current blocker must have a Best Source and at least one route button.
- Every gate record must use live trial lifecycle and gate resolver data, not obsolete hardcoded gate item maps.
- Every future or unreachable city must be Sealed or Rumored rather than presented as live.
- Every prestige upgrade must say whether its effect is live, inactive, locked, or future.
- Every defeat diagnosis must route to at least one actionable system.
- Every Jade Slip must be shorter than the full record and include Open Full Record.
- No critical-path requirement may be hidden purely for spoiler flavor.
- No entry may use flavor text as a substitute for plain mechanical meaning.

# Reference URLs
- Factorio Factoriopedia: https://www.factorio.com/blog/post/fff-397
- Warframe Quest Guide: https://www.warframe.com/en/guides/quests
- Hades Codex reference: https://hades.fandom.com/wiki/Codex
- Melvor Idle Google Play description: https://play.google.com/store/apps/details?id=com.malcs.melvoridle
- Melvor Idle Steam page: https://store.steampowered.com/app/1267910/Melvor_Idle/
- Magic Research 2 Steam page: https://store.steampowered.com/app/2864890/Magic_Research_2/
- Immortal Mountain Xianxia Glossary: https://immortalmountain.wordpress.com/glossary/wuxia-xianxia-xuanhuan-terms/
- Mortal’s Journey Dantian Glossary: https://mortalsjourney.com/en/glossary/dantian/