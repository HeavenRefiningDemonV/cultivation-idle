# Cultivation Hero Capture README (Section D.10)

- **surface id:** `cultivation`
- **family:** `hero ritual screen`
- **packet:** `D.10R`
- **capture mechanism:** manual screenshots only (no approved automated capture pipeline found for Section D)
- **capture status (this pass):** `BLOCKED — EVIDENCE MISSING`
- **current on-disk inventory:** `README.md`, `before/README.md` (no root-slot PNG evidence yet)

## Required screenshot slots

1. `01-base.png`
2. `02-interaction.png`
3. `03-truth-states.png`
4. `04-high-fx.png`
5. `05-low-fx.png`
6. `06-reduced-motion.png`
7. optional `07-narrow.png`

## D.10 folder structure

- `before/`
- `after/high/`
- `after/low/`
- `after/reduced-motion/`
- `after/medium-width/`

Each folder contains a README for what must be captured. Add real PNGs only; do not add placeholders.

## Manual capture steps (required follow-up)

1. Launch the live app and navigate to Cultivation using real gameplay route.
2. Capture base, interaction, and truth-state shots.
3. Capture High FX, Low FX, and Reduced Motion variants.
4. Capture optional medium-width/narrow shot if available.
5. Save with exact slot filenames at this folder root.

## Integrity rules

- No synthetic/fabricated screenshots.
- If a state cannot be reached, write exact blocker in signoff docs instead of guessing.
- Keep current scenic owner (cultivator/dantian center + truth surfaces) intact through signoff.


## Filename convention note

This repo uses Section D checklist slots (`02-interaction.png`, `03-truth-states.png`, `04-high-fx.png`, `05-low-fx.png`, `06-reduced-motion.png`) rather than the alternate `02-high-fx / 03-low-fx / 04-hover / 05-warning-recommended` naming from external prompts.
