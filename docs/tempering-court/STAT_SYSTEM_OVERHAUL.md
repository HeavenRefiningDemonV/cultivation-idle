# THE THREE TREASURES ENGINE
## Cultivation Idle — Stat System Overhaul (Design Specification & Research Dossier)

> **Status:** Design proposal — pre-implementation. Not yet a Claude Code packet.
> **Scope:** Replaces the Training Hall's *simultaneous primary / secondary / foundation* stat model with a **drip-unlocked, one-meridian-at-a-time** system in which each path's stats are unique, are revealed one per breakthrough, are each trained by a dedicated exercise, and also accrue slowly through themed combat actions.
> **Companion docs:** `TRAINING_HALL_VISUAL_DESIGN_BIBLE.md` (the Tempering Court UI), `TRAINING_HALL_CODEX_AND_REDESIGN.md` (mechanical teardown), the Living State Observatory canon (status screen + Spirit Root Astrolabe).
> **A warning, stated once and up front:** this overhaul **deliberately breaks** several mechanics the current 506 contract tests assert (the tri-stat XP split, the fixed 18-stat roster, the simultaneous-training surface shape). Part 14 enumerates exactly what breaks and how to migrate preserve-first. Read it before touching code.

---

## 0. TL;DR — the overhaul in one screen

1. **Three tiers of stats, one new idea at a time.**
   - **Tier 0 — Mortal Foundation** (5 shared attributes: Physique, Vitality, Agility, Perception, Willpower; plus the fixed talent **Luck**). The body you were born with.
   - **Tier 1 — Cultivation Axes** (7 shared axes: Cultivation Base, Qi Pool, Qi Purity, Meridian Openness, Spiritual Sense, Soul Strength, Dao Comprehension). The cultivator you are becoming. These are the multi-axis power model the genre actually uses.
   - **Tier 2 — Path Meridians** (the unique, build-defining stats — **7 per path**, revealed **one per breakthrough**). The treasure of your chosen path.
   - **Tier 3 — Derived Stats** (attack, defense, HP, qi regen, speed, crit, soul attack/defense, control, suppression, tribulation resist…). *Computed*, never trained directly — combat reads these.

2. **You begin with everything in Tiers 0–1 and exactly one Tier-2 meridian** (your path's innate meridian). **Every breakthrough unlocks the next path meridian and its training method.** By Immortal Ascension you hold all seven.

3. **Training trains exactly one meridian at a time.** The Tempering Court runs **one exercise = one meridian**. Picking a different meridian means switching exercises. The Room you already designed visualizes this perfectly: the active meridian burns bright; unlocked-but-idle meridians sit dim in the Foundation column; **not-yet-unlocked meridians render sealed** (the cinnabar 封 wax-seal rows the artifact already draws).

4. **Combat trains those same meridians passively** — themed actions feed the matching meridian a *fraction* of the dedicated rate. It is the "neat passive thing," not a replacement for the Court.

5. **Aptitude (spiritual roots) set at Life Start** gates each meridian's cap and training speed; **realm caps** gate the ceiling; overflow past a cap feeds **mastery** (the 滿 → mastery arrow already in the Room).

6. **Everything else you built stays:** the four intensities, the forge-heat/fatigue throttle, the no-resource-cost rule, offline training with the 12h cap, the render-only surface contract, and every `data-testid`. The engine underneath changes; the discipline stays.

---

## 1. What changes, at a glance (old → new)

| Dimension | **Current model** | **Three Treasures model** |
|---|---|---|
| Stats per path | 18 total (6 per path), all present from the start | Tiers 0–1 shared + **7 path meridians revealed one per breakthrough** |
| Training target | **3 stats at once** (primary ×1.0 / secondary ×0.45 / foundation ×0.12 weighting) | **1 meridian at a time** (one exercise = one meridian) |
| Why you switch | Pick a regimen that weights three stats | Pick *which meridian* to temper; the exercise follows the meridian |
| New power source | All stats grindable immediately | A **new meridian + its exercise unlocks at every breakthrough** — always a next goal |
| Combat ↔ stats | Combat blocks training; no stat feedback | Combat **passively feeds** the matching meridian (slow); still blocks the Court |
| Stat → combat | Loosely defined | **Explicit derived-stat layer** with formula shapes; each meridian states its combat effects |
| Identity | Three paths share a stat *shape* | Each path's meridians are **mechanically and thematically distinct** (Martial = offense/speed/killing; Earth = body/defense/endurance; Heaven = perception/soul/control) |
| Caps | Realm caps `[40,60,80,100,125,150]`, overflow→mastery | **Preserved**, now per-meridian and modulated by per-meridian **aptitude** |
| Pacing | Front-loaded (everything available) | **One variable at a time**, staggered across all seven realms (anti content-desert) |

The visual language you already built does not need to be thrown away — it needs to be *re-pointed*. The Room already renders one bright primary channel, dim secondary/foundation channels, sealed future meridians, and an overflow→mastery arrow. That is, almost exactly, the new model's status display. Part 13 details the mapping.

---

## 2. Why the current model needs reworking

The current Training Hall is mechanically sound but has four design problems that this overhaul targets:

1. **Paths feel like palette-swaps.** Three stats weighted 1.0/0.45/0.12 give the same *shape* of decision on every path. The genre's whole appeal is that a body cultivator and a spirit cultivator are *different kinds of being*, not the same character with different stat names.

2. **Everything is available immediately, so nothing is a milestone.** When all six stats exist from minute one, a breakthrough is a number going up, not a *revelation*. Idle-game retention research is blunt about the cost of this: front-loaded systems with no staggered unlocks produce a mid-game "content desert" that drives the majority of churn. Staggering a new meridian + exercise onto every breakthrough turns each realm into a content beat.

3. **Combat and the Hall are strangers.** Right now combat only *interrupts* training. The genre (and Melvor, and Tale of Immortal) treats fighting as a legitimate, if slower, way to hone an ability. Wiring combat to feed the meridians makes the two halves of the game talk to each other.

4. **"Train three at once" muddies the fantasy of focused tempering.** A cultivator in seclusion is refining *one thing*. One exercise = one meridian is both clearer to reason about and truer to the source material — and it makes the Room's single bright channel *mean* something.

---

## 3. Research & analysis

> Sourcing note: specific game mechanics below are attributed to their source by name; full URLs are in Part 17. This section is the evidence base; the design choices it license are tagged **→ Adopt**.

### 3.1 Xianxia combat power is multi-axis, and realm gates capability

Across the genre, a cultivator's power is **not a single number**. The most-foregrounded axis is **realm** (Qi Condensation → Foundation Establishment → Core Formation → Nascent Soul → … → Ascension), and realm does two hard things: it sets the absolute ceiling and **gates access to techniques and phenomena** (a Qi Condensation cultivator simply cannot run Core-Formation sword arts), and it creates a **suppression** effect — a higher-realm cultivator's sheer qi density pressures a lower-realm body that "is not designed to handle" it (immortalcultivationhub; Xianxia RPG Wiki; TV Tropes' Spirit Cultivation Genre entry). But *alongside* realm run the other axes the stories obsess over: **body cultivation** (flesh, bone, marrow), **qi quantity and quality**, **soul / spiritual sense**, and **Dao / technique comprehension**. Sub-realms (Initial / Middle / Late / Peak) give small step-ups within a realm (Xianxia RPG Wiki).

**→ Adopt.** A two-layer model: **realm** is the gate and the cap-setter (it gates which meridians and techniques you can unlock and how high they cap), and a set of **trainable axes** (Tier 1) plus **path meridians** (Tier 2) are the things you actually grow. Realm difference becomes a **suppression** term in the Tier-3 combat math.

### 3.2 Aptitude / potential is set early and gates everything after

Amazing Cultivation Simulator makes innate talent decisive: a cultivator's **maximum qi capacity is fixed by an innate Potential** computed from their age and five attributes (PER/CON/CHA/INT/LUK) *at the moment of promotion*, and post-natal bonuses don't enlarge it; worse, the reservoir **fills more and more slowly as it fills** (ACS Inner Cauldron wiki). The community guidance is to roll for a high **Qi sense** and attributes that **match your chosen cultivation Law** before committing (ACS Beginner's Guide). Tale of Immortal echoes this: **luck and insight are effectively creation-only** — hard or impossible to raise later — while roots, arts, and most combat stats *can* be grown (Tale of Immortal community guides).

**→ Adopt.** A per-meridian and per-path **aptitude** (spiritual root grade) is rolled at **Life Start**, only re-rolled by reincarnation/prestige, and it multiplies both a meridian's **cap** and its **training rate**. This is the project's existing "Spirit Root Astrolabe" given teeth. It also gives reincarnation a point.

### 3.3 Proficiencies level by use in combat — slower than focused investment

Tale of Immortal cleanly separates **what you train deliberately** (eat spirit fruits / spend resources to raise roots and arts) from **what hones itself through use**: a martial art's **passives level as you fight, and actives level by being used**; you can *additionally* cultivate an art with specific resources to push it faster (Tale of Immortal community guides). Melvor Idle formalizes the same idea for an idle context with an elegant trick: **the attack *style* you choose routes XP to a single skill** — Stab feeds Attack, Slash feeds Strength, Block feeds Defence — and **XP is proportional to damage dealt**, with each skill gating gear (Melvor wiki; community threads).

**→ Adopt.** This is the spine of the whole request. Each meridian has (a) a **dedicated exercise** in the Court (the fast, idle-friendly route) and (b) **combat triggers** — themed actions that feed the *same* meridian a fraction of the rate (the slow, opportunistic route). "One exercise = one meridian" and "combat trains stats passively" are **the same mechanism at two rates**, exactly like Melvor's style-routing vs. Tale of Immortal's level-by-use.

### 3.4 A condition meter throttles training — manage it or stall

ACS players must babysit **mental state / mood**: training and balance modes **drain mood**, and below a threshold the disciple takes a nasty debuff, so play becomes a loop of *train → recover → train* (ACS community threads). It is, structurally, a fatigue economy.

**→ Adopt (already built).** The Tempering Court's **forge-heat / fatigue** throttle *is* this system: intensities trade XP for fatigue, fatigue dampens output, and Limit auto-eases when the forge runs hot. Keep the existing dampening curve `max(0.4, min(1, 1 − max(0, F−40)·0.009))` and the four intensities. The overhaul changes *what* you temper, not *how hot* you run.

### 3.5 Stats should be build-defining and flavorful, not interchangeable

Disco Elysium is the gold standard for stats-as-identity: **24 skills under four attributes**, where *which* skills you raise changes how you perceive and interact with the world; you pick a **signature skill** at the start; skills both unlock active options and **chime in passively**; and over-investing can make a skill a **"burden"** with its own failure mode (Disco Elysium wikis & design write-ups). Path of Exile's passive tree is the same lesson at scale: a handful of **keystones** define an entire build by *changing rules*, not just adding numbers.

**→ Adopt.** Path meridians are **named, characterful, rule-changing** — each states a fantasy, a combat effect, a path/utility effect, and (where fun) a high-investment quirk. The innate meridian you start with is your **signature**. This is what makes Heaven ≠ Earth ≠ Martial at a mechanical level, not just a skin.

### 3.6 Idle pacing: one variable at a time, always a next unlock, ~60/40 idle/active, prestige with diminishing returns

The incremental-design literature is consistent: **introduce one new system at a time** (a new currency, automation, or prestige layer) to avoid overwhelm; keep **visible progress** (bars filling, things unlocking); structure the loop as **Hook (0–30 min) → Habit (1–7 days) → Hobby (weeks–months)**; aim for roughly **60% idle / 40% active** contribution so the game is accessible but rewards attention; and use a **prestige currency = (lifetime)^exponent × multiplier with exponent ≈ 0.5–0.8** so multiple resets stay worthwhile. Layered resets (Realm Grinder's abdicate/reincarnate/ascend) extend the curve, and front-loaded games without staggered unlocks hit a **mid-game content desert** that causes churn (apptrove; GridInc; missionszanx; Medium/clicker-architecture; Wikipedia "Incremental game").

**→ Adopt.** "One **meridian** per breakthrough" *is* "one variable at a time," and it guarantees a next unlock at every realm — the direct antidote to the content desert. The **Court is the idle route, combat is the active route** (≈60/40). Reincarnation is the prestige layer; the **Form Memory floor** (already a "Tempering Wind" in the Room) is where the `^0.5–0.8` carry-over lives.

### 3.7 Synthesis — principle → mechanic

| Research finding | Source(s) | Mechanic we adopt |
|---|---|---|
| Power is multi-axis; realm gates & suppresses | immortalcultivationhub, Xianxia RPG Wiki, TV Tropes | Tiers 0–2 are the axes; realm gates unlocks/caps and adds a suppression term in Tier 3 |
| Innate potential caps & slows growth; talent set early | ACS Inner Cauldron, ToI | Per-meridian **aptitude** (roots) rolled at Life Start; multiplies cap & rate; re-roll only via prestige |
| Arts level by use in combat; resources push faster | ToI, Melvor (style routes XP) | Each meridian: dedicated **exercise** (fast) + combat **triggers** (slow). Same mechanism, two rates |
| A condition meter throttles training | ACS mood | Keep the **forge-heat/fatigue** system as-is |
| Stats define the build & are characterful | Disco Elysium, PoE keystones | Named, rule-changing **path meridians**; innate one = signature |
| One variable at a time; next unlock always dangling; 60/40; prestige `^0.5–0.8` | apptrove, GridInc, missionszanx, Medium | **One meridian per breakthrough**; Court (idle) + combat (active); **Form Memory** prestige floor |


---

## 4. Design pillars

These are the rules every later decision answers to.

1. **One thing at a time, revealed over a lifetime.** You temper one meridian; you unlock one meridian per breakthrough. Focus is the fantasy and the pacing tool at once.
2. **Three paths, three kinds of being.** Heaven, Earth, and Martial must diverge *mechanically*, not just visually. A meridian that exists on one path should rarely exist on another.
3. **Every stat earns its place in combat.** No vanity stats. Each meridian states what it does to the Tier-3 derived stats and to path/utility systems. If we can't say what a stat *does*, it doesn't ship.
4. **The Court is the discipline; combat is the dividend.** Dedicated training is the efficient, idle-friendly path. Combat sprinkles the same growth as a reward for playing actively — never enough to make the Court pointless.
5. **Talent is real and mostly fixed.** Aptitude rolled at Life Start meaningfully shapes a run; reincarnation is how you re-roll your fate. This is what gives prestige a soul.
6. **Preserve-first.** The forge-heat economy, intensities, offline rules, no-cost rule, surface contract, and every testid survive. We extend the engine; we don't rebuild the building.
7. **Legibility over cleverness.** A player should always be able to read, in the Room and the Observatory, *what I'm tempering, what it will do, what's next, and what's still sealed.*

---

## 5. Architecture overview

### 5.1 The four tiers (and the talent layer)

```
                          ┌─────────────────────────────────────────────┐
   LIFE START (fixed)     │  APTITUDE / SPIRIT ROOTS  (per-path & per-   │
   re-rolled only by      │  meridian grade)  → caps × , training rate × │
   reincarnation          └─────────────────────────────────────────────┘
                                          │ modulates
                                          ▼
  ┌────────────────┐   ┌────────────────────┐   ┌──────────────────────────┐
  │ TIER 0         │   │ TIER 1             │   │ TIER 2  PATH MERIDIANS    │
  │ Mortal         │   │ Cultivation Axes   │   │ (unique per path,         │
  │ Foundation     │   │ (shared)           │   │  1 revealed/breakthrough) │
  │ Physique       │   │ Cultivation Base   │   │  Martial: Weapon Intent,  │
  │ Vitality       │   │ Qi Pool            │   │   Flowing Step, Battle    │
  │ Agility        │   │ Qi Purity          │   │   Rhythm, Killing Intent, │
  │ Perception     │   │ Meridian Openness  │   │   Sword Heart, Unbroken   │
  │ Willpower      │   │ Spiritual Sense    │   │   Momentum, Martial Dao   │
  │ (Luck: talent) │   │ Soul Strength      │   │  Earth / Heaven: see §8   │
  └───────┬────────┘   │ Dao Comprehension  │   └─────────────┬────────────┘
          │            └─────────┬──────────┘                 │
          └──────────────────────┴───────────────────────────-┘
                                 │  feed (additive base + multiplicative path)
                                 ▼
                  ┌────────────────────────────────────────┐
                  │ TIER 3  DERIVED STATS (computed, never  │
                  │ trained):  Max HP · Phys/Qi/Soul Attack │
                  │ · Phys/Qi/Soul Defense · Qi Pool/Regen  │
                  │ · Speed/Initiative · Accuracy/Evasion   │
                  │ · Crit% / Crit Dmg · Control · Tribu-   │
                  │ lation Resist · Suppression · DR        │
                  └────────────────────┬───────────────────┘
                                       ▼
                                 COMBAT SIM
```

### 5.2 Two ways to grow a meridian

```
   DEDICATED TRAINING (idle, fast)            PASSIVE COMBAT (active, slow)
   Tempering Court · 1 exercise = 1 meridian   themed combat actions feed the
   intensity × forge-heat × aptitude × cap     SAME meridian at ~10–25% rate,
   → meridian XP  (offline-capable, 12h)       capped per fight  (online only)
                         \                     /
                          ▼                   ▼
                        MERIDIAN  rating  (0 → realm cap → overflow = mastery)
```

### 5.3 What lives where (separation of concerns — preserves the render-only contract)

- **Gameplay store** owns the *truth*: meridian ratings, aptitudes, unlock state, mastery, fatigue, realm. It computes Tier-3 derived stats. It never lives in the UI.
- **`TrainingHallSurfaceV1` (extended, render-only)** carries a *snapshot* for the Tempering Court: the active meridian, the unlocked roster, the sealed roster, the passive sources, the derived-stat preview. The UI recomputes nothing (Part 14.3).
- **Combat system** reads Tier-3 derived stats and emits **meridian-XP events** on themed actions; the gameplay store applies them with passive-rate and per-fight caps.

---

## 6. Tier 0 — Mortal Foundation (shared; the body you were born with)

Five attributes every cultivator has from birth, plus the fixed talent **Luck**. They are deliberately few and broad — the *spices* of the build, not its main course (that's Tier 2). They grow slowly via early-game activity and certain cultivation milestones, and they underlie the Tier-3 math so that even a spirit cultivator has a body.

| Attribute | 字 | Fantasy | Feeds (Tier 3) | How it grows |
|---|---|---|---|---|
| **Physique** | 体 | Raw bodily hardiness | Max HP, Physical Defense, carry/anchor | Body activity; Earth meridians spill into it |
| **Vitality** | 元 | Life-force & stamina | HP regen, stamina pool, **lifespan**, fatigue ceiling | Rest/recovery, pills, breakthroughs |
| **Agility** | 敏 | Reflex & quickness | Initiative, Evasion, Attack Speed | Movement activity; Martial meridians spill into it |
| **Perception** | 悟 | Comprehension & insight | **Training/learn rate**, Crit% (reading openings), technique comprehension | Study, insights, breakthroughs |
| **Willpower** | 志 | Mental fortitude | Soul Defense, qi control, resist fear/charm | Meditation; Heaven meridians spill into it |
| **Luck** *(talent)* | 运 | Fortune's favor | Event/drop quality, crit-of-fate, tribulation rolls | **Fixed at Life Start**; re-roll only via reincarnation |

**Design notes.**
- **Perception is the master learning stat** (modeled on ToI's insight reducing learning attempts and ACS's comprehension): it multiplies *all* meridian training XP and how fast a freshly unlocked exercise becomes efficient. It is the single most run-shaping Tier-0 stat.
- **Luck is creation-only** (ToI's luck/insight precedent) — the deliberate "you can't grind this" stat that makes a roll feel fated and gives reincarnation stakes.
- Tier-0 attributes are **not** the per-breakthrough drip — they exist from the first minute. Only **Tier 2** drips. (Open decision D11 revisits whether any Tier-0/1 growth should also be milestone-gated.)

---

## 7. Tier 1 — Cultivation Axes (shared; the cultivator you are becoming)

This is the genre's **multi-axis power** made explicit (immortalcultivationhub; Xianxia RPG Wiki). All seven exist from Qi Condensation; they grow primarily through the **main cultivation loop** (the realm bar) and breakthroughs, with some also nudged by the Court and by pills. They are the *connective tissue* between your mortal body, your path meridians, and combat.

| Axis | 字 | What it represents | Primary combat/utility role | Notes |
|---|---|---|---|---|
| **Cultivation Base** | 修为 | Overall realm progress; stored qi quantity | Global power scalar; gates breakthroughs | The main bar; the spine of progression |
| **Qi Pool** | 灵力 | Usable spiritual-energy reservoir | Technique fuel; qi-attack/shield magnitude | ToI 灵力. Capacity shaped by Meridian Openness + (Earth) Marrow |
| **Qi Purity** | 气纯 | Quality/density of qi | **Multiplies** qi effects; feeds suppression | The "quality vs quantity" axis the genre loves |
| **Meridian Openness** | 经脉 | Channel throughput | Qi regen, technique cast speed, **how forcefully meridians charge** | Higher openness = faster Court charging & regen |
| **Spiritual Sense** | 神识 | Divine sense; soul reach & perception | Accuracy, detection, **soul-attack base**, control range | Shared base that Heaven meridians amplify hard |
| **Soul Strength** | 魂 | Soul integrity | Soul Defense base; survive body-death; Nascent Soul | Gates late realms; Heaven amplifies |
| **Dao Comprehension** | 道 | Insight into law/Dao | Unlocks higher techniques; **Tribulation Resist**; 道力 | The capstone axis; pairs with Perception |

**Design notes.**
- Tier 1 is where **realm** expresses itself numerically: a breakthrough raises the **caps** on these axes and bumps Cultivation Base, mirroring ToI (breakthroughs significantly raise vitality/energy).
- **Qi Purity × Qi Pool** is the deliberate quantity-vs-quality knob: two cultivators with the same realm can differ sharply if one pursued pool and the other purity. This is the genre's "his qi was thin but impossibly pure" trope as a stat interaction.
- These axes are **mostly not** what the Tempering Court tempers — the Court is for **path meridians**. (Open decision D12: whether a few Tier-1 axes also get Court exercises, or remain main-loop-only. Recommendation: keep the Court path-meridian-focused; let pills/main-loop handle Tier 1, so the two systems stay legible.)

---

## 8. Tier 2 — Path Meridians (the unique, drip-unlocked stats)

This is the overhaul's core and the answer to the request: **per-path unique stats, one revealed per breakthrough, each with its own training method, each shaping combat and path systems, each also honed passively by themed combat.**

### 8.1 The unlock cadence (one meridian per breakthrough)

Seven realms, seven meridians per path. You are **granted your path's signature meridian at Life Start** (Qi Condensation), then **each breakthrough reveals the next** meridian *and its exercise*. Caps follow the existing realm ladder.

| Realm | # | Unlock event | Meridian cap (this realm) | Notes |
|---|---|---|---|---|
| Qi Condensation | 1 | **Signature meridian** granted at Life Start | 40 | You begin with exactly one path meridian + all Tier 0–1 |
| Foundation Establishment | 2 | Breakthrough → meridian #2 + exercise | 60 | The Tempering Court's "early" beat |
| Core Formation | 3 | Breakthrough → meridian #3 + exercise | 80 | First "rule-changing" meridian per path |
| Nascent Soul | 4 | Breakthrough → meridian #4 + exercise | 100 | Soul-tier capabilities come online |
| Spirit Severing | 5 | Breakthrough → meridian #5 + exercise | 125 | Path identity sharpens |
| Tribulation | 6 | Breakthrough → meridian #6 + exercise | 150 | Pre-ascension power |
| Immortal Ascension | 7 | Ascension → **capstone Dao meridian** | 150+ (prestige-scaled) | The path's Dao; ties into prestige |

> **Reconciliation with the existing artifact.** The Tempering Court prototype currently shows ~4 unlocked + 2 sealed meridians at Foundation. Under this cadence, at Foundation you hold **exactly 2** (signature + first breakthrough), with the remaining five **sealed**. The artifact's mock data simply needs re-pointing to this table — its *rendering* (bright active channel, dim unlocked, sealed 封 rows) is already correct. See Part 13.4.

> **Caps are per-meridian and aptitude-scaled.** The realm cap is the *base* ceiling; a meridian's **aptitude grade** (Part 12) multiplies it. A Heaven-aligned cultivator with a superb Spirit-Sense root caps that meridian higher and trains it faster than a poor-rooted one — the ACS/ToI talent lesson.

### 8.2 Martial Path (武 · Qi-in-motion) — *offense, speed, technique, killing intent*

**Identity:** the cultivator as a weapon. Martial meridians convert qi into **motion and edge** — the highest ceilings on attack, speed, crit, and execution in the game, paid for with the thinnest defenses. Signature: **Weapon Intent**. Capstone: **Martial Dao (Asura)**.

| # / Realm | Meridian (字) | Dedicated exercise (Room) | Combat passive trigger | Derived-stat contributions | Path / utility effect |
|---|---|---|---|---|---|
| 1 · Qi Cond. | **Weapon Intent** 兵意 | *Shadow Ring* form drills | Dealing **weapon-skill** damage | **Physical Attack ↑↑**, weapon technique power | Unlocks/empowers weapon arts |
| 2 · Foundation | **Flowing Step** 流步 | Footwork laps on the ring | **Dodging / repositioning** | Speed, Evasion, Initiative, gap-close | Travel speed; escape chance |
| 3 · Core | **Battle Rhythm** 战律 | Drum-rhythm sparring | Landing **consecutive** hits | Attack Speed, **combo scaling**, qi/stamina efficiency | Combo windows widen |
| 4 · Nascent | **Killing Intent** 杀意 | Killing-intent meditation (post) | **Opening strikes / executing** low-HP foes | **Crit% ↑↑**, first-strike dmg, **Suppression** | Intimidation; flee chance on weaker foes |
| 5 · Spirit Sev. | **Sword Heart** 剑心 | Sword-heart sitting | **Counters / parries** | **Crit Dmg ↑↑**, armor penetration, counter dmg | Technique fidelity; rule: crits ignore % of DR |
| 6 · Tribulation | **Unbroken Momentum** 不破势 | Thousand-Cuts endurance | **Sustained offense** (no idle turns) | Snowball dmg per action, **stagger immunity** | Rule: each consecutive offensive turn stacks dmg |
| 7 · Ascension | **Martial Dao / Asura** 修罗道 | War-banner Dao comprehension | **High-realm kills** | Global offense scalar; unique ultimate technique | Path tribulation = a duel; prestige synergy |

**Rule-changers worth calling out.** *Sword Heart* makes crits **partially ignore defense** — turning the Martial path's crit stacking into a true armor-shred build. *Unbroken Momentum* rewards never stopping: each consecutive attacking action stacks damage and grants stagger immunity, so the fantasy is a cultivator who, once swinging, cannot be stopped — but who is punished for going on the defensive (a Disco-Elysium-style "burden": defensive play actively sheds your stacks).

### 8.3 Earth Path (地 · Jing) — *body, marrow, defense, endurance, root*

**Identity:** the cultivator as a mountain. Earth meridians temper **flesh, bone, and marrow** into something that does not break — the highest HP, defense, and sustain in the game, the slowest to act. Signature: **Body Temper**. Capstone: **Earth Dao (Unmoving Sovereign)**.

| # / Realm | Meridian (字) | Dedicated exercise (Room) | Combat passive trigger | Derived-stat contributions | Path / utility effect |
|---|---|---|---|---|---|
| 1 · Qi Cond. | **Body Temper** 体锻 | *Marrow Furnace* tempering | **Taking & dealing physical** blows | **Max HP ↑↑**, Physical Attack (body cult.), Phys Def | Body-cultivation attack scaling |
| 2 · Foundation | **Bone Forging** 锻骨 | Stone-press stand | **Blocking / being hit** | **Physical Defense ↑↑**, knockback resist | Weapon-block; structure |
| 3 · Core | **Marrow Essence** 髓元 | Marrow-cleansing furnace | Enduring **damage-over-time** | **HP regen ↑↑**, Vitality, qi capacity, poison/illness resist | Body stores qi; longevity |
| 4 · Nascent | **Root Depth** 根深 | Deep-root meditation | **Holding ground** (not moving) | **Anti-CC / stability ↑↑**, grounded qi-gather rate | Cannot be displaced while rooted |
| 5 · Spirit Sev. | **Iron Skin** 金身 | Blade-rain tempering | **Absorbing hits** | **Flat Damage Reduction**, reflect, immunity thresholds | Rule: small hits below a threshold deal 0 |
| 6 · Tribulation | **Mountain Stance** 山岳 | Bear-the-Mountain stand | **Tanking big hits / taunting** | Massive Def; **convert Def→counter** | Rule: anchor allies; reflect a % of Def as dmg |
| 7 · Ascension | **Earth Dao / Unmoving Sovereign** 后土道 | Earth-Dao comprehension | **Surviving lethal blows** | Global defense/HP scalar; unique ultimate | Body becomes a treasure; body-tribulation |

**Rule-changers worth calling out.** *Iron Skin* introduces a **damage threshold** — chip damage below a value is fully negated, so swarms of weak hits do nothing to a high-Earth body (the genre's "their attacks couldn't even leave a mark"). *Mountain Stance* lets you **convert defense into counter-damage** and **anchor** (taunt) — the Earth fantasy is a wall that hurts to hit. The path's "burden": Earth's offense and speed ceilings are the lowest, so an under-invested Earth cultivator can become unkillable *and* unable to kill — a deliberate, characterful failure mode.

### 8.4 Heaven Path (天 · Shen) — *perception, soul, Dao, law, control*

**Identity:** the cultivator as a mind that touches law. Heaven meridians refine **spiritual sense and soul** into perception, soul-attack, and **control** — the only path that fights the *soul* directly and bends the battlefield's rules, paid for with fragile flesh. Signature: **Spirit Sense**. Capstone: **Heaven Dao (Mandate of the Firmament)**.

| # / Realm | Meridian (字) | Dedicated exercise (Room) | Combat passive trigger | Derived-stat contributions | Path / utility effect |
|---|---|---|---|---|---|
| 1 · Qi Cond. | **Spirit Sense** 神识 | *Star-Listening* | Landing **precise / ranged** hits | **Accuracy ↑↑**, detection, **Soul-Attack base** | See hidden; range; soul-strike unlock |
| 2 · Foundation | **Mind Eye** 心眼 | Empty-Mind sitting | **Dodging / perceiving** | **Evasion (foresight) ↑↑**, Crit% (find weakness) | Reveal weaknesses; anti-ambush |
| 3 · Core | **Soul Clarity** 魂明 | Soul-cleansing | **Resisting soul/mental** attacks | **Soul Defense ↑↑**, qi control, technique stability | Cleanse debuffs; steady cast |
| 4 · Nascent | **Dao Heart** 道心 | Heart-of-Dao meditation | **Composure under pressure** | **Tribulation Resist ↑↑**, qi efficiency, immune fear/charm | Unshakeable; cheaper techniques |
| 5 · Spirit Sev. | **Void Gaze** 虚瞳 | Void-gazing | Landing **soul / curse** effects | **Soul Attack ↑↑**, armor-pen via weakness, debuff power | See through stealth/illusion |
| 6 · Tribulation | **Heavenly Mandate** 天命 | Mandate meditation | **Controlling / suppressing** foes | **Control Power ↑↑** (bind/seal), **Suppression aura** | Rule: domain that weakens enemies in range |
| 7 · Ascension | **Heaven Dao / Mandate of the Firmament** 天道 | Heaven-Dao comprehension | **High-realm soul kills** | Global control/soul scalar; unique ultimate | Law-based devastation; heart-tribulation |

**Rule-changers worth calling out.** *Void Gaze* converts **perceived weakness into armor penetration** and powers curses/debuffs — Heaven's way of bypassing the defenses it can't out-muscle. *Heavenly Mandate* projects a **suppression domain**: enemies inside it fight at reduced stats, codifying the genre's realm-suppression as an active Heaven tool. The path's "burden": Heaven's flesh is the weakest, and its power leans on **soul attack** that does little to soulless or soul-fortified foes — a build that hard-counters some enemies and bounces off others.

### 8.5 Cross-path contrast (why they're not palette-swaps)

| | **Martial 武** | **Earth 地** | **Heaven 天** |
|---|---|---|---|
| Wins by | killing fastest | never dying | controlling & soul-killing |
| Top ceilings | Attack, Speed, Crit, Execution | HP, Defense, Sustain, Stability | Accuracy, Soul-Atk, Control, Tribu-resist |
| Worst at | Defense, sustain | Offense, speed | Physical bulk; soulless foes |
| Signature rule | crits shred armor; momentum can't be stopped | damage thresholds; def→counter | weakness→armor-pen; suppression domains |
| Combat verb that trains it | strike, dodge, combo, execute | block, endure, root, tank | perceive, resist, curse, control |

No meridian on this chart is shared across two paths. That is the point: **what you train, how you train it, and what it does are all path-specific.**

---

## 9. Tier 3 — Derived stats & combat formulas

Derived stats are **computed from Tiers 0–2 plus realm**; nothing here is trained directly. Combat reads only this layer. Coefficients are written as named tunables (`k_*`); **all numbers are illustrative shapes, not final balance** (Part 13 covers tuning, and a dedicated balancing wave owns the real values).

### 9.1 The general form

Every derived stat follows the same readable pattern:

```
Derived = ( Σ sourceStat · k_source  +  base )      ← additive core (Tier 0/1/2 contributions)
          × realmScalar(realm)                       ← realm step-up (gates & suppresses)
          × (1 + Σ multiplierMeridian)               ← rule-changing path multipliers
          × gearAndBuffs                             ← equipment, pills, temporary
```

Additive sources give the *shape*; path multipliers (the rule-changing meridians) give the *spikes*; realm gives the *tier*.

### 9.2 The derived-stat table (illustrative source weights)

| Derived stat | Primary sources (Tier) | Shape (illustrative) |
|---|---|---|
| **Max HP** | Physique(0), Vitality(0), Body Temper(2E), Marrow Essence(2E) | `(Phys·k + Vit·k + BodyTemper·k + Marrow·k + base) × realmScalar × (1 + EarthDao)` |
| **HP Regen** | Vitality(0), Marrow Essence(2E), Meridian Openness(1) | `(Vit·k + Marrow·k + Openness·k) × realmScalar` |
| **Physical Attack** | Physique(0), Weapon Intent(2M), Body Temper(2E) | `(Phys·k + WeaponIntent·k + BodyTemper·k) × realmScalar × (1 + QiPurity·k) × weapon` |
| **Physical Defense** | Bone Forging(2E), Iron Skin(2E), Mountain Stance(2E), Physique(0) | `(BoneForging·k + Phys·k + base) × realmScalar × (1 + IronSkin + MountainStance) + armor` |
| **Flat Damage Reduction** | Iron Skin(2E), Mountain Stance(2E) | threshold + `min(cap, IronSkin·k + MountainStance·k)` |
| **Qi Pool (灵力)** | Cultivation Base(1), Meridian Openness(1), Marrow Essence(2E) | `(CultBase·k + Openness·k + Marrow·k) × realmScalar` |
| **Qi Regen / cast eff.** | Meridian Openness(1), Root Depth(2E), Dao Heart(2H) | `(Openness·k + RootDepth·k) × realmScalar × (1 + DaoHeart·k_eff)` |
| **Speed / Initiative** | Agility(0), Flowing Step(2M), Battle Rhythm(2M) | `(Agi·k + FlowingStep·k + BattleRhythm·k) × realmScalar` |
| **Evasion** | Agility(0), Flowing Step(2M), Mind Eye(2H) | `(Agi·k + FlowingStep·k + MindEye·k) × realmScalar` |
| **Accuracy** | Perception(0), Spiritual Sense(1), Spirit Sense(2H), Battle Rhythm(2M) | `(Perc·k + SpiritualSense·k + SpiritSense·k) × realmScalar` |
| **Attack Speed** | Agility(0), Battle Rhythm(2M) | `(Agi·k + BattleRhythm·k) × realmScalar` |
| **Crit Chance** | Perception(0), Killing Intent(2M), Mind Eye(2H) | `min(cap, Perc·k + KillingIntent·k + MindEye·k)` |
| **Crit Damage** | Sword Heart(2M), Killing Intent(2M) | `base + SwordHeart·k + KillingIntent·k` |
| **Armor Penetration** | Sword Heart(2M, via crit), Void Gaze(2H, via weakness) | `SwordHeart·k_onCrit + VoidGaze·k_onWeakness` |
| **Soul Attack** | Spiritual Sense(1), Spirit Sense(2H), Void Gaze(2H), Soul Strength(1) | `(SpiritualSense·k + SpiritSense·k + VoidGaze·k) × realmScalar × (1 + HeavenDao)` |
| **Soul Defense** | Willpower(0), Soul Clarity(2H), Soul Strength(1) | `(Will·k + SoulClarity·k + SoulStrength·k) × realmScalar` |
| **Control Power** | Heavenly Mandate(2H), Spiritual Sense(1) | `(HeavenlyMandate·k + SpiritualSense·k) × realmScalar` |
| **Tribulation Resist** | Dao Heart(2H), Dao Comprehension(1), Soul Strength(1) | `(DaoHeart·k + DaoComp·k + SoulStrength·k) × realmScalar` |
| **Suppression (applied)** | realm gap, Qi Purity(1), Killing Intent(2M) / Heavenly Mandate(2H) | `f(realmGap) × (1 + QiPurity·k + pathPressure)` |
| **Stagger / CC resist** | Root Depth(2E), Unbroken Momentum(2M), Willpower(0) | `RootDepth·k + UnbrokenMomentum·k + Will·k` |

Notice the path columns: **2M** sources cluster in offense/speed/crit, **2E** in HP/defense/sustain/stability, **2H** in accuracy/soul/control/tribulation. The derived layer is *where the three identities become numbers*.

### 9.3 Suppression — encoding the genre's realm gap

When attacker and defender differ in realm, apply a **suppression multiplier** to the lower-realm combatant's effective stats (immortalcultivationhub's "qi density creates pressure"). Illustrative:

```
realmGap = attackerRealm − defenderRealm
suppression(defender) = clamp( 1 − k_supp · max(0, gap) · (1 + attackerQiPurity·k) , floor, 1 )
```

So a Foundation cultivator swinging at a Core-Formation cultivator does reduced effective damage and takes amplified hits — and **Qi Purity sharpens your suppression**, making the "thin but pure qi" cultivator punch above their realm. Martial's *Killing Intent* and Heaven's *Heavenly Mandate* add **path pressure** on top, letting those paths suppress even within-realm.

### 9.4 Optional orthogonal layers (flagged decisions, not required for v1)

- **Style triangle (D4).** A light Body ▸ Qi ▸ Spirit ▸ Body advantage cycle (≈ Earth ▸ Martial ▸ Heaven ▸ Earth) à la Melvor's combat triangle, giving matchup texture. *Recommendation: ship without it first; it's easy to add and easy to get wrong.*
- **Elemental affinity (D5).** Spirit roots already imply elements (fire/water/wood/metal/earth/wind, per ToI). An affinity layer could color techniques and resistances orthogonally to path. *Recommendation: defer; fold "element" into aptitude flavor for v1, expand later.*

### 9.5 Worked micro-example (illustrative)

A Foundation-Establishment **Martial** cultivator, Weapon Intent 55 / Flowing Step 30, Physique 22, vs. a same-realm foe:

```
PhysAttack ≈ (Phys·k + WeaponIntent·k) × realmScalar(2) × (1 + QiPurity·k) × weapon
           ≈ (22·0.8 + 55·1.2) × 1.0 × (1 + 0.1) × 1.0  ≈ 92  (units illustrative)
Speed      ≈ (Agi·k + FlowingStep·k) × realmScalar(2)  ≈ high → acts first, dodges more
CritChance ≈ low yet (Killing Intent not unlocked until Nascent)  → spiky payoff comes later
```

The example shows the intended texture: early Martial is fast and hits hard but **can't crit-shred yet** — the build *comes online* as later meridians unlock, which is exactly the staggered-power fantasy.

---

## 10. Training rework — the Tempering Court v2 (one exercise = one meridian)

### 10.1 The core change

The Court trains **exactly one meridian at a time**. Each meridian owns a **dedicated exercise** (its regimen). Choosing what to temper *is* choosing the exercise; there is no longer a tri-stat weighting. This is the Melvor lesson (one attack style → one skill) brought to seclusion.

- **Active meridian** charges at the full Court rate.
- **Unlocked-but-idle** meridians do not charge in the Court (they may still drip from combat — Part 11).
- **Sealed** meridians cannot be trained until their breakthrough reveals them.

### 10.2 The training-rate formula (reuses everything you built)

```
meridianXP_per_tick =
      baseRate
    × intensityMult        // Quiet 0.70 / Steady 1.00 / Harsh 1.35 / Limit 1.75   (unchanged)
    × fatigueDamp          // max(0.4, min(1, 1 − max(0, F−40)·0.009))             (unchanged)
    × perceptionMult       // Tier-0 Perception: global learn-rate
    × aptitudeRate         // this meridian's spirit-root grade (Part 12)
    × regimenMastery       // mastery of THIS exercise (Part 10.4)
    × capFalloff           // diminishing as rating → realm cap (Part 12.2)
clamped so the total tick multiplier never exceeds the existing 2.25 ceiling.
```

Every term except `perceptionMult`, `aptitudeRate`, and `capFalloff` already exists in the current engine; the new terms slot into the same clamp. The **forge-heat/fatigue throttle, the four intensities, the no-resource-cost rule, and offline training (12h cap, auto-downgrade ≥80) are unchanged.**

### 10.3 Switching meridians

Switching the active meridian swaps the exercise. Two options:

- **Frictionless (recommended for v1):** instant swap, no penalty. Cleanest, most idle-friendly.
- **Re-attunement (D7):** a short warm-up where the new exercise ramps from a reduced rate to full over N seconds/ticks, modeling "settling into a new form." Adds light tactical texture (don't thrash between meridians) at the cost of some smoothness.

### 10.4 Per-exercise mastery (Melvor mastery analogue — already drawn in the Room)

Each exercise has its own **mastery ladder** (the notch ladder + "trait ◆ at 7" the artifact already renders). Mastery rises as you train that exercise and grants **that exercise** permanent perks: faster charge, reduced fatigue accrual, a higher overflow→mastery conversion, and a **trait at a milestone rank**. Mastery is **not** capped by realm (Melvor's mastery-vs-combat-level independence), so an old exercise keeps deepening even after its meridian nears cap — a reason to revisit early meridians.

### 10.5 Overflow → mastery (already drawn: the 滿 → mastery arrow)

When a meridian hits its realm cap, continued training **converts to mastery / Form Memory** instead of being wasted (the artifact's `滿 → mastery` cap-ring). This keeps a capped meridian a *valid* training target while you wait for the next breakthrough to raise its ceiling — smoothing the pre-breakthrough lull.

---

## 11. Passive combat training (the "neat passive thing")

### 11.1 The mechanism

Every meridian lists **combat triggers** (the right-hand columns of the §8 trees). Performing a trigger feeds **that meridian** XP at a fraction of the dedicated rate — the Melvor/ToI "level by use," tuned to be a *bonus*, never the main engine.

```
passiveMeridianXP = matchedAction.weight        // damage-scaled, à la Melvor's 0.4 XP / damage
                  × passiveRate                  // global ~0.10–0.25 of dedicated equivalent (tunable, D6)
                  × aptitudeRate                 // same spirit-root grade as dedicated
                  × perFightFalloff              // diminishing within a single fight (anti-grind)
                  × capFalloff                   // same near-cap diminishing as the Court
```

### 11.2 Rules that keep it honest

- **Online only.** Passive gain accrues only during *actual* combat. Offline progress remains the Court's job (12h cap).
- **Damage/impact-scaled, not spam-scaled.** Weight follows meaningful action (damage dealt/taken, control landed), so flailing at a training dummy isn't a shortcut.
- **Per-fight falloff.** XP from a given trigger diminishes within one fight, so value comes from *many varied fights*, not one farmed encounter.
- **Capped by realm like the Court.** Passive gain obeys the same realm cap and near-cap falloff; it can keep an idle meridian *warm*, but it can't outrun your realm.
- **Can't fully replace the Court.** At ~10–25% effective rate, combat is the dividend; the Court is the discipline — preserving the ~60/40 idle/active split the research recommends. (D6 owns the exact %.)

### 11.3 Why this is good design, not just flavor

It closes the loop between the game's two halves: the way you *fight* gradually shapes which meridians grow, so a player who leans into dodging quietly raises Flowing Step / Mind Eye, while a blocker raises Bone Forging — your *playstyle leaves a fingerprint on your stats*, exactly the Disco-Elysium "skills reflect how you engage" effect, and the Melvor "your attack style is your training" loop.

---

## 12. Aptitude, spirit roots & caps

### 12.1 Aptitude (rolled at Life Start; re-rolled only by reincarnation)

Each cultivator rolls **spirit-root aptitude**: a per-path grade and, beneath it, per-meridian grades. Aptitude does two things (the ACS/ToI talent lesson):

```
aptitudeCapMult   ∈ ~[0.8 … 1.6]   // multiplies a meridian's realm cap
aptitudeRate      ∈ ~[0.7 … 1.8]   // multiplies its training & passive XP
```

Grades can be themed (Mortal / True / Heavenly / Chaos root, etc.). A "Heavenly Spirit-Sense root" caps that meridian high and trains it fast; a "Mortal" one lags. This is the project's **Spirit Root Astrolabe** given mechanical weight, and the reason two players on the same path play differently. **Luck (Tier-0 talent)** nudges the roll's variance.

### 12.2 Caps & near-cap falloff

```
hardCap(meridian) = realmCap[realm] × aptitudeCapMult        // realmCap = [40,60,80,100,125,150,150+]
capFalloff(rating) = smoothstep down as rating → hardCap      // last ~10–15% trains slowly (ACS "fills slower")
overflow(beyond cap) → mastery / Form Memory                 // never wasted (§10.5)
```

The near-cap slowdown reproduces ACS's "the cauldron fills ever more slowly," giving the pre-breakthrough stretch its characteristic patience without a hard wall.

### 12.3 Learning a freshly unlocked exercise (comprehension warm-up)

When a breakthrough reveals a new meridian, its exercise starts **partially comprehended**: a `comprehension` value (driven by **Perception**, ToI's insight) ramps the exercise from reduced efficiency to full over its first stretch of use. High Perception = you "get" the new form almost immediately; low Perception = a learning curve. (This is distinct from per-exercise *mastery*, which deepens an already-learned form.)

---

## 13. Progression pacing & numbers

### 13.1 The drip is the pacing

"One meridian per breakthrough" is literally the research's "introduce one variable at a time." It also guarantees the thing that prevents mid-game churn: **there is always a next unlock dangling** — a new meridian *and* a new exercise *and* new combat effects at every realm. The content desert closes because the content is *staggered across the whole climb*.

### 13.2 Loop phases mapped to realms

| Phase (research) | Realms | What's live | The hook |
|---|---|---|---|
| **Hook** (0–30 min) | Qi Condensation | Signature meridian + its exercise; fast first ratings | "I can see it filling" |
| **Habit** (1–7 days) | Foundation → Core | 2–3 meridians; first rule-changer; combat starts feeding | "Each breakthrough hands me a new toy" |
| **Hobby** (weeks–months) | Nascent → Ascension + prestige | Full kit; aptitude optimization; reincarnation | "Re-roll fate, push the Dao meridian" |

### 13.3 Illustrative numbers (shapes, not balance)

Using the existing intensity multipliers and fatigue dampening, a single meridian at Foundation (cap 60), mid-fatigue:

```
effectiveRate ≈ baseRate × 1.35 (Harsh) × ~0.73 (F≈70) × Perc × aptitude × mastery × capFalloff
"minutes to next rating" early (rating ≪ cap)   : short  (the artifact's trade-preview "~X min")
"minutes to next rating" near cap (rating → 60) : long   (capFalloff bites; overflow→mastery instead)
```

The artifact's **THIS PRACTICE** panel already previews per-meridian "+xp/min" and "minutes to next rating"; under v2 it previews **the one active meridian** plus its mastery and forge-heat — a cleaner readout than the old tri-stat split.

### 13.4 Re-pointing the existing Tempering Court artifact

The prototype already renders the v2 model's *shape*; it needs data and copy changes only:

- **Foundation column:** show **all 7** path meridians — unlocked ones as live rows, the rest as **sealed 封 rows** with "Sealed · opens at <realm>" (already implemented). At Foundation, that's 2 live + 5 sealed.
- **The Room:** the single bright primary channel = the **active meridian**; render the other *unlocked* meridians as dim secondary channels (informational), and drop the old "secondary/foundation weighting" copy.
- **Regimen shelf:** one selectable exercise **per unlocked meridian** (not three-stat regimens); sealed exercises shown as the 封 slips already drawn.
- **THIS PRACTICE / tempo lens:** report the **active meridian's** rate, mastery, and forge-heat (drop the tri-stat preview).
- **Foundation "Tempering Winds":** keep Path Affinity, Root Support (now literally **aptitude**), Offline Eff., and **Form Memory** (now literally the **prestige floor**).

### 13.5 Prestige (reincarnation) & the Form Memory floor

Reincarnation resets realm and meridian ratings but is worth doing because it:

- **Re-rolls aptitude** (a better-rooted life), and optionally allows **re-choosing the path** (D8);
- Grants a **Form Memory floor** — a permanent fraction of prior progress, using the genre-standard diminishing curve:

```
formMemory = floor( (Σ lifetimeMeridianLevels) ^ e ) × m      // e ≈ 0.5–0.8, m tunable (research-standard)
```

The floor manifests as the Room's **Form Memory** wind (a starting-rating floor and/or a flat rate bonus on re-trained meridians), so each life starts a little ahead — the prestige loop the incremental literature is built on.


---

## 14. Integration & engineering impact (preserve-first)

### 14.1 Integration with existing systems

- **Realms & breakthroughs.** Breakthrough is the unlock hook: it reveals the next meridian + exercise, raises Tier-1 caps and the meridian cap ladder, and bumps Cultivation Base (ToI's "breakthroughs raise vitality/energy"). The breakthrough screen should *introduce* the new meridian (a small reveal moment — the anti-content-desert payoff).
- **Combat.** Reads Tier-3 derived stats; emits meridian-XP events on themed actions (Part 11). Combat still **blocks** the Court (existing rule); it does **not** block passive gain (that's the point).
- **Items / pills (ToI "spirit fruit" analogue).** Pills can grant flat meridian XP, temporarily raise a meridian's cap, or boost `aptitudeRate` for a window — a resource sink that respects the cap/aptitude framework without breaking the Court's no-cost rule (the Court stays free; *pills* are the optional paid accelerant).
- **Living State Observatory (status).** The **Spirit Root Astrolabe / stat-meridian constellation** becomes the canonical roster view: unlocked meridians lit, sealed ones 封, the active-training one marked, aptitude grades shown. The Observatory reads the *same* derived-stat layer for its combat-readiness panels. (The Astrolabe SVG geometry is protected per its canon; this is a data binding, not a redraw.)
- **Tempering Court (Training Hall).** Becomes the v2 single-meridian trainer per Part 13.4.
- **Offline & fatigue.** Unchanged contracts: 12h offline cap, fatigue auto-downgrade ≥80, the dampening curve.

### 14.2 What this overhaul BREAKS (read before coding)

This is a **deliberate mechanical change**, and several of the **506 contract tests** assert the old model. Expect to revise (not silently delete) these categories:

1. **Tri-stat XP-distribution tests** — anything asserting the primary ×1.0 / secondary ×0.45 / foundation ×0.12 split. *Replaced by single-active-meridian XP.*
2. **"Trains three stats simultaneously" assertions** — replaced by "trains exactly one meridian; others may receive passive XP only."
3. **Fixed 18-stat roster enumeration** — replaced by per-path 7-meridian rosters with **unlock-gated availability** (a meridian not yet revealed must not be trainable).
4. **Regimen→three-stat mapping tests** — regimens are now **one-meridian exercises**.
5. **Surface-shape tests** asserting `primary/secondary/foundation` fields on `TrainingHallSurfaceV1` — see 14.3 for the extension and the back-compat shim.

**Preserved (tests should still pass unchanged):** intensity multipliers (0.70/1.00/1.35/1.75) and fatigue/min; the fatigue dampening formula and the **2.25 max-tick clamp**; offline 12h cap + auto-downgrade ≥80; the **no-resource-cost** rule for the Court; the foreground `path_training` ActivityStore behavior and **combat-blocks-training**; all `data-testid` anchors (`training-hall-page`, regimen ids, `training-hall-vfx-motes`/`-mote`, etc.).

> **Net:** the *building*, its testids, its fatigue economy, and its offline rules survive. The *what-you-train engine* and the *stat roster* change, and their tests must be rewritten to the new contract. Flag this to the test owner as a known, intended breakage with a migration checklist — do not try to keep the old tri-stat tests green.

### 14.3 Surface contract extension (render-only, additive)

Extend `TrainingHallSurfaceV1` additively (the UI still recomputes nothing). New fields:

```
activeMeridianId   : string | null
unlockedMeridians  : { id, name, glyph, rating, cap, capState, aptitudeGrade,
                       masteryRank, traitRank, isActive, ratePerMin }[]
sealedMeridians    : { id, name, unlockRealm, promise }[]
passiveSources     : { meridianId, triggerLabel, ratePct }[]
aptitudes          : { meridianId, grade, capMult, rateMult }[]
formMemoryFloor    : number
derivedPreview?    : { key, label, value, fromMeridian }[]   // optional "what this meridian does"
```

**Back-compat shim for the transition (flag-gated, like the Observatory S8 cutover):** while the old UI exists, keep populating legacy `primary/secondary/foundation` by mapping `primary ← activeMeridian`, `secondary/foundation ← the next two unlocked meridians` (purely so the old view renders). Remove the shim only after the v2 Court is screenshot-accepted across all states — the same flag-gated, preserve-the-old-build policy used elsewhere in the project.

### 14.4 Suggested implementation waves (Section-A style; preserve-first, per-edit approval, gated)

| Wave | Goal | Gate |
|---|---|---|
| **W0** | Recon: map current stat code, the 506 tests by category, surface fields, ActivityStore hooks | Decision surfacing (D1–D14) |
| **W1** | Data model: meridian definitions (×21), aptitude/roots, unlock table, caps, mastery | Unit tests for unlock-gating & caps |
| **W2** | Training engine: one-active-meridian XP (reuse intensities/fatigue/clamp), per-exercise mastery, comprehension warm-up | Contract tests rewritten for single-meridian |
| **W3** | Derived-stat layer + combat read hooks (Tier-3 compute) | Golden-value tests on derived formulas |
| **W4** | Passive combat training (event emit + apply, per-fight & cap falloff) | Anti-grind & cap tests |
| **W5** | Surface extension + Tempering Court v2 UI + Observatory roster binding | Playwright screenshot matrix (all states) |
| **W6** | Prestige: aptitude re-roll + Form Memory floor | Prestige math tests (`^0.5–0.8`) |
| **W7** | Balancing pass: real coefficients, curves, passive % | Sim/playtest sign-off |
| **W8** | Flag-gated cutover; remove tri-stat shim & dead code | Full regression; old build still selectable until accepted |

---

## 15. Open decisions (need sign-off before W1)

- **D1 — Meridians per path: 7 (one per realm incl. Ascension) vs 6 (Ascension = prestige only).** *Rec: 7, capstone = Dao meridian.*
- **D2 — Stage-level minor unlocks?** Grant minor meridian *upgrades* at sub-stages (Initial/Middle/Late/Peak), or keep unlocks to major breakthroughs only. *Rec: major-only for v1; sub-stages give small cap bumps.*
- **D3 — Do Tier-0/1 stats also drip, or all exist from start?** *Rec: all exist from start; only Tier-2 drips (keeps the "one new thing per breakthrough" crisp).*
- **D4 — Ship the Body▸Qi▸Spirit style triangle?** *Rec: no for v1; add later.*
- **D5 — Elemental affinity layer now or later?** *Rec: later; fold into aptitude flavor for v1.*
- **D6 — Passive-combat rate (% of dedicated) and per-fight cap.** *Rec: start ~15%, per-fight falloff, tune in W7.*
- **D7 — Frictionless meridian-switch vs re-attunement warm-up.** *Rec: frictionless for v1.*
- **D8 — Reincarnation re-rolls path, or path is fixed forever?** *Rec: allow re-choice at reincarnation (a new incarnation, new fate).*
- **D9 — Aptitude grade distribution & re-roll variance** (how swingy should roots be?).
- **D10 — Pills/items: how much they may exceed Court rate / raise caps** (resource-sink power budget).
- **D11 — Are any Tier-0/1 growths milestone-gated** rather than continuous?
- **D12 — Does the Court ever train Tier-1 axes,** or are those main-loop/pill-only? *Rec: path-meridian-only Court.*
- **D13 — Exact derived-stat coefficients** (owned by W7, but flag any that gate other systems early).
- **D14 — Naming pass** for all 21 meridians + aptitude grades (the §8 names are strong drafts; lock with the loc/lore owner).

---

## 16. Appendix A — full stat dictionary

### Tier 0 — Mortal Foundation
Physique (体), Vitality (元), Agility (敏), Perception (悟 — master learn-rate), Willpower (志), Luck (运 — fixed talent).

### Tier 1 — Cultivation Axes
Cultivation Base (修为), Qi Pool (灵力), Qi Purity (气纯), Meridian Openness (经脉), Spiritual Sense (神识), Soul Strength (魂), Dao Comprehension (道).

### Tier 2 — Path Meridians (21 total)
- **Martial 武:** Weapon Intent (兵意), Flowing Step (流步), Battle Rhythm (战律), Killing Intent (杀意), Sword Heart (剑心), Unbroken Momentum (不破势), Martial Dao/Asura (修罗道).
- **Earth 地:** Body Temper (体锻), Bone Forging (锻骨), Marrow Essence (髓元), Root Depth (根深), Iron Skin (金身), Mountain Stance (山岳), Earth Dao/Unmoving Sovereign (后土道).
- **Heaven 天:** Spirit Sense (神识·path), Mind Eye (心眼), Soul Clarity (魂明), Dao Heart (道心), Void Gaze (虚瞳), Heavenly Mandate (天命), Heaven Dao/Mandate of the Firmament (天道).

### Tier 3 — Derived (computed)
Max HP, HP Regen, Physical/Qi/Soul Attack, Physical/Qi/Soul Defense, Flat DR, Qi Pool, Qi Regen, Speed/Initiative, Attack Speed, Accuracy, Evasion, Crit Chance, Crit Damage, Armor Penetration, Control Power, Tribulation Resist, Suppression, Stagger/CC resist.

---

## 17. Appendix B — glossary & sources

**Glossary.** *Meridian* = a Tier-2 path stat (a trainable channel). *Exercise/Regimen* = the Court activity that trains one meridian. *Aptitude / Spirit Root* = innate, Life-Start grade scaling a meridian's cap & rate. *Mastery* = per-exercise depth, realm-uncapped. *Comprehension* = how learned a freshly unlocked exercise is. *Form Memory* = the prestige floor carried across reincarnations. *Suppression* = realm-gap combat penalty.

**Sources consulted (research dossier, Part 3).**
- Xianxia power scaling is multi-axis; realm gates & suppresses — immortalcultivationhub.com/cultivation-novels-power-scaling/; Xianxia RPG Wiki, *Cultivation Realms* (xianxia-rpg.fandom.com); TV Tropes, *Spirit Cultivation Genre*; lightnovelsai.com; cvmsekai.com.
- Innate potential caps & slows growth; talent set early — Amazing Cultivation Simulator Wiki, *Inner Cauldron* & *Beginner's Guide* (amazing-cultivation-simulator.fandom.com); ACS Steam community threads (mental-state/mood throttle).
- Arts level by use; resources push faster; creation-only stats — *Tale of Immortal* (鬼谷八荒) Steam community guides & discussions (steamcommunity.com/app/1468810).
- One action → one stat; XP per damage; combat triangle; mastery independent of level — Melvor Idle Wiki, *Attack / Combat / Combat Triangle* (wiki.melvoridle.com) & Steam threads.
- Build-defining, characterful, passively-checked stats; signature skill; over-investment "burden" — Disco Elysium Wiki (discoelysium.wiki.gg) & design write-ups.
- Idle pacing (one variable at a time, visible progress, Hook/Habit/Hobby), ~60/40 idle/active, prestige `^0.5–0.8`, layered resets, mid-game content desert — apptrove.com/how-to-make-an-idle-game/; gridinc.co.za/blog/idle-games-best-practices; missionszanx.com idle-design guides; Medium (clicker-architecture); Wikipedia, *Incremental game*.

*All numeric coefficients in this document are illustrative shapes for communication; real balance values are owned by the balancing wave (W7).*
