# Packet B.5 — Chip and Stamp Convergence

## 1) Purpose of B.5
Packet B.5 converges split chip/tag/stamp ownership into one canonical shared implementation (`ChromeChip`, `ChromeStamp`) while preserving compatibility wrappers and migrating representative live shared surfaces.

## 2) Dependency on B.1–B.4
B.5 assumes B.1–B.4 artifacts exist and remain authoritative:
- `src/ui/chrome/index.ts`
- `src/ui/chrome/FrameCard.tsx`
- B.2 token normalization (`uiChromeTokens`, `uiMotionTokens`, `uiLayerTokens`)
- B.4 plaque/ribbon ownership already established (not modified in B.5)

## 3) Current repo drift inventory
- `ui/ink/PaperChip`: legacy ink-family chip implementation + styling owner.
- `ui/paper/PaperChip`: duplicated paper-family chip implementation.
- `ui/paper/PaperStamp`: paper-only stamp owner with deterministic tilt and state classes.
- local `WorldRouteChip`: custom span-badge visual system with independent tone styling.

## 4) Why `ChromeChip` and `ChromeStamp` are now canonical owners
- Shared status/tag semantics need one stable owner across readiness, route hints, reward labels, and ritual states.
- Canonical ownership removes split drift between ink and paper families.
- Legacy wrappers remain for compatibility, but no new shared surface should depend on legacy implementations.

## 5) Canonical API for `ChromeChip`
- `variant?: 'pill' | 'tag' | 'microLabel'`
- `icon?: ReactNode`
- `text: string`
- `tone?: 'neutral' | 'ink' | 'success' | 'danger' | 'rare' | 'merit' | 'warning' | 'recommendation'`
- `onClick?: () => void`
- `className?: string`
- `title?: string`

Behavior:
- Button when clickable, span otherwise.
- Single-line text with truncation.
- Stable footprint across tones/states.

## 6) Canonical API for `ChromeStamp`
- `text: string`
- `size?: 'sm' | 'md'`
- `tone?: 'ink' | 'seal'`
- `state?: 'default' | 'difficulty' | 'ready' | 'complete' | 'claimed' | 'sent' | 'rare'`
- `tilt?: number | 'auto'`
- `className?: string`
- `title?: string`

Behavior:
- Deterministic auto-tilt retained.
- Tilt clamped to bounded range.
- State emphasis without footprint change.

## 7) Tone/state mapping table
| Semantic meaning | Canonical mapping |
| --- | --- |
| readiness: Ready | chip `tone='success'` |
| readiness: Risky/Preparing/low-stock/idle-slot | chip `tone='warning'` |
| recommendation: Recommended Now | chip `tone='recommendation'` |
| Merit currency/labels | chip `tone='merit'` |
| rare chance/rare item emphasis | chip `tone='rare'`, stamp `state='rare'` |
| difficulty marker | stamp `state='difficulty'` + `tone='ink'` |
| ready / claimed / complete / sent | stamp `state='ready'|'claimed'|'complete'|'sent'` |

## 8) Legacy wrapper mapping table
| legacy component | old API | canonical mapping | preserved legacy classes |
| --- | --- | --- | --- |
| `ui/ink/PaperChip` | variant, icon, text, tone, onClick, className | delegates to `ChromeChip` with same inputs | `inkPaperChip`, `inkPaperChip--tag`, `inkPaperChip--clickable`, `inkPaperChip--tone-*` |
| `ui/paper/PaperChip` | variant, icon, text, tone, onClick, className | delegates to `ChromeChip` with same inputs | `paperChip`, `paperChip--tag`, `paperChip--clickable`, `paperChip--tone-*` |
| `ui/paper/PaperStamp` | text, size, tone, tilt, className | delegates to `ChromeStamp` and infers legacy state classes when needed | `paperStamp`, `paperStamp--sm/md`, `paperStamp--tone-*`, `paperStamp--difficulty/ready/complete/claimed/sent` |

## 9) Direct adoption table
| target file | chip/stamp usage migrated | why this surface |
| --- | --- | --- |
| `src/ui/status/RunCompass.tsx` | milestone/readiness/missing/action chips -> `ChromeChip` | canonical cross-system status surface |
| `src/ui/status/RunCompassCompact.tsx` | compact readiness chip -> `ChromeChip` | compact companion status surface |
| `src/ui/ink/PurposeSourceCallout.tsx` | purpose/source chips -> `ChromeChip` | shared economy guidance surface |
| `src/ui/world/WorldRouteChip.tsx` | local span badge -> semantic `ChromeChip` wrapper | removes independent world-route chip visual system |
| `src/components/screens/BountyBoardPanel.tsx` | reward chips + difficulty/ready/claimed/tracked stamps -> canonical | high-density chip/stamp live screen |
| `src/components/screens/ExpeditionBoardPanel.tsx` | route/rare/slot/yield chips + ready/rare stamps -> canonical | second high-density live screen |

## 10) Styling ownership rules
- `ChromeChip.scss` owns chip visuals and includes compatibility selectors for `.paperChip` and `.inkPaperChip`.
- `ChromeStamp.scss` owns stamp visuals and includes compatibility selectors for `.paperStamp`.
- Legacy SCSS files are compatibility bridges only:
  - `src/ui/ink/PaperChip.scss` imports canonical chip styles.
  - `src/ui/paper/paper.scss` imports canonical chip/stamp styles and retains only paperCard aliases.

## 11) No-layout-shift and truncation rules
- Chip variants/tone changes do not change border width or interaction padding.
- Clickable hover uses tokenized transform/shadow only.
- Chip text truncates with ellipsis.
- Stamp state changes keep same border/padding footprint.
- Tilt remains bounded and deterministic.

## 12) Explicit non-goals
- No full screen redesign.
- No ribbon/plaque/header or scenic FX expansion.
- No asset-generation or new art files.
- No broad migration of every legacy chip use-site in one packet.

## 13) Manual QA and acceptance criteria
Manual QA focus:
- Run Compass + compact chips read correctly with no row jumps.
- PurposeSourceCallout chips remain compact and legible.
- World route chips represent all route kinds through canonical tones.
- Bounty/Expedition chip+stamp-heavy states (ready/claimed/complete/rare/merit) remain stable.
- Legacy wrapper-only surfaces (LifeStartWizard, MedicinePouch, Forge, Apothecary) still render.

Acceptance criteria:
- canonical chip/stamp implementations are real owners,
- wrappers delegate,
- direct adoption targets migrated,
- local world-route chip drift removed,
- no new art dependency,
- no layout-shift regression.
