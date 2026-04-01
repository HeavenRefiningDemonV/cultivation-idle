# Section D.10 — Art Trigger Memo (Proof-Gated)

## 1) Header and purpose

- **packet id:** `D.10`
- **date:** `2026-04-01`
- **purpose:** decide whether additional hero-screen support art is justified by real Section D screenshot evidence, and prevent speculative or redesign-grade requests.

## 2) Rule summary

1. Art requests are legal only after additive proof exists on the exact target surface.
2. Screenshots are the trigger; preference/opinion is not sufficient.
3. Requests must be reusable support roles, not one-off paintovers.
4. Cleanup and art escalation both remain blocked when screenshot evidence is missing.

## 3) Evidence reviewed

- Section D touchpoint and retained-layer doctrine docs.
- Section D screenshot checklist and packet map.
- Existing `docs/release/qa/ui-cutover/cultivation/` and `status/` folders.
- D.10 evidence inventory structure in:
  - `docs/release/qa/ui-cutover/cultivation/after/{high,low,reduced-motion,medium-width}/`
  - `docs/release/qa/ui-cutover/status/after/{high,low,reduced-motion,medium-width}/`

### Evidence status

- Required hero-screen PNG evidence is currently missing for both surfaces.
- Therefore all candidate art triggers remain proof-insufficient in this packet.

## 4) Candidate art-request matrix

| candidate request | decision | evidence screenshot paths | why sufficient/insufficient now | screen coherent without this? | smallest deliverable if approved later |
| --- | --- | --- | --- | --- | --- |
| A. Shared support chrome refinements | `DEFER` | Required: Cultivation + Status `01/04/05/06` (all currently missing) | Potentially valid class of request, but no cross-screen screenshot proof of shared weakness exists yet. | Unknown until evidence exists; cannot certify now. | Reusable plaque/ribbon/frame support set (tintable, layered, non-screen-specific). |
| B. Cultivation hero overlay kit | `NO` | Required: Cultivation `01/03/04/05/06` (missing) | Cannot justify while evidence is absent; request would otherwise risk speculative atmosphere escalation. | Not proven incoherent without it. | If later approved: minimal overlay role only (center framing accents, soft alpha FX layers), no scenic replacement. |
| C. Slightly richer Status center-orb overlay | `NO` | Required: Status `01/03/04/05/06` (missing) | Cannot justify while evidence is absent; readability/speed tradeoff cannot be judged without captures. | Not proven incoherent without it. | If later approved: small additive center-orb support layer, readability-safe, no diagnostic-grid replacement. |

## 5) Explicit rejects

The following requests are explicitly rejected in D.10 unless future approved screenshots overwhelmingly prove a specific missing reusable role:

1. Replacing cultivator/dantian scenic center.
2. Repainting Cultivation from scratch.
3. Replacing the icon family wholesale.
4. Turning Status into a giant poster/scenic replacement.

Current D.10 verdict for all four: **`NO`**.

## 6) Final recommendation

- **Section D art-trigger recommendation:** `BLOCKED / DEFERRED (proof missing)`
- Do not open production art tickets from D.10.
- First required follow-up is real screenshot capture + reviewer signoff for both hero screens.
- After evidence exists, re-run this memo with proof-based YES/NO decisions only.

## v3 discipline note for any future YES

If a future packet upgrades any row to `YES`, the request must stay:

- reusable support part(s),
- transparent PNG/SVG where appropriate,
- tint-friendly/grayscale-friendly when useful,
- layered for additive integration,
- soft alpha FX components for sprite atlas use where needed,
- explicitly not a full-screen repaint or scenic-owner replacement.
