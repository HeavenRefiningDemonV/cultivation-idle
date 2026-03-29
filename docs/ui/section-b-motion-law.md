# Section B.11 — Motion law adoption and no-layout-shift utilities

## 1) Purpose of B.11
B.11 turns the project’s motion/no-layout-shift constitution into shared enforcement utilities and applies them across shared chrome plus the highest-value local motion hotspots.

## 2) Dependency on B.1–B.10
This packet assumes canonical chrome ownership, B.2 token infrastructure, motion helper foundation, and B.10 selection overlay family are already in place.

## 3) Current repo motion-safety truth
Current canonical motion stack is:
- `useMotionSafety`
- `motionSafetyContract`
- `MotionSafeSelectionSurface`
- `MotionSafePresence`
- `src/ui/fx/motion/README.md`

B.11 keeps this stack and strengthens it instead of introducing a second framework.

## 4) Canonical motion law
- No bounce.
- No spring overshoot.
- Hover = subtle tint/glow/lift only.
- Selection = subtle opacity emphasis and safe scale only.
- Press = tiny down-shift only.
- Reduced motion disables lift/scale and collapses durations.

## 5) Canonical no-layout-shift law
- No selected-state border-width growth.
- Use inset outline / overlay emphasis instead.
- Reserve badge/icon/action slots.
- Clamp long text.
- Keep halos/swashes zero-footprint.

## 6) Shared utility ownership decision
Motion authority:
- `src/ui/fx/motion/motionSafetyContract.ts`
- `src/ui/fx/motion/useMotionSafety.ts`
- `src/ui/fx/motion/MotionSafeSelectionSurface.tsx`
- `src/ui/fx/motion/MotionSafePresence.tsx`

No-shift authority:
- `src/ui/chrome/useNoLayoutShiftState.ts`
- `src/ui/chrome/layoutStabilityGuards.scss`

## 7) Adoption table
| target file | old motion/no-shift problem | new shared utility mapping |
|---|---|---|
| `FrameCard.tsx/.scss` | local interaction styling not centrally enforced | `MotionSafeSelectionSurface` + `useNoLayoutShiftState` + token-backed transitions |
| `ChromeChip.tsx/.scss` | ad hoc icon-space behavior and clickable motion drift | `useNoLayoutShiftState` + guard utilities + token-backed hover/press |
| `TechniqueLibraryScreen.tsx/.scss` | repeated local transition literals on selectable rows/loadouts | tokenized timings + no-shift class/data attrs on loadouts |
| `ManualPavilionPanel.tsx/.scss` | local spine selection/hover timing and slot drift risk | no-shift hook attrs on spine buttons + tokenized motion timings |
| `CityMapHub.tsx/.scss` | local hover timing and map hotspot motion drift | no-shift hook attrs + tokenized hotspot timing |
| `WorldModuleCard.tsx/.scss` | state overlays/chips/cta could drift without reserved space | no-shift hook attrs + reserved chip/cta minimum lanes |
| `LifeStartWizardModal.tsx/.scss` | localized selection hosts without explicit no-shift utility layering | no-shift utility host classes on path/card selection surfaces |
| `ChangeHeartLawModal.tsx` + `HeartLawPanel.scss` | local active/hover handling only | no-shift hook attrs + tokenized hover transitions |

## 8) Shared chrome enforcement summary
- Motion tokens are now explicit and expanded in `uiMotionTokens.scss`.
- Shared chrome surfaces route interactive state through tokenized durations/easing.
- `FrameCard` uses `MotionSafeSelectionSurface` when interactive.
- `SelectionHalo` and `OverlaySwash` remain zero-footprint and reduced-motion-safe.

## 9) Local hotspot enforcement summary
Normalized hotspots:
- Technique loadouts and major selectable row families.
- Manual Pavilion spines.
- City hotspots and module cards.
- Life Start path/cards.
- Change Heart Law options.

## 10) Explicit non-goals
- No scenic/FX redesign.
- No modal IA redesign.
- No broad gameplay/balance changes.
- No new asset generation.

## 11) Manual QA and acceptance criteria
QA should verify:
- no bounce/overshoot in touched surfaces,
- hover lift is subtle,
- reduced motion clamps lift/scale,
- selected/recommended states do not change width/height,
- chips/icons/action lanes stay stable,
- no new art dependency.
