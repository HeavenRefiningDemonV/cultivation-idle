# Fresh-save QA issue severity rubric (packet 7.1)

Use this rubric for `normal`, `cautious`, and `aggressive` worksheet findings.

## Severity levels

### Blocker
A truth/progression issue that prevents honest first-life completion of the live semester slice.

Examples:
- Fresh save cannot progress honestly (hard stall / softlock).
- Gate cannot be entered when lifecycle conditions are clearly met.
- City chain strands player before Spirit Severing.
- Current-cap flow contradicts live slice truth (implies live city 6 / post-Severing chain).

### Major
A materially misleading issue that can lead players to wrong progression decisions even if they can eventually recover.

Examples:
- Misleading gate/city/checkpoint text conflicts with actual progression state.
- Prestige advisor / life summary / current chapter exhausted surfaces materially misrepresent current cap truth.
- Route requires hidden knowledge not surfaced by runtime UI guidance.

### Minor
A confusing but recoverable issue with no hard progression break.

Examples:
- Copy ambiguity around gate readiness that can be resolved by retrying/reading nearby UI.
- Worksheet expectation drift against current surface wording without progression failure.

### Cosmetic
Polish issue with no progression-truth impact.

Examples:
- Typos/layout issues in worksheet-adjacent UI.
- Non-blocking visual spacing inconsistencies.

## Explicit example tags

- **Softlock / blocker**: Player reaches final substage in a live realm, but gate never becomes actionable and no truthful path forward exists.
- **Contradictory truth**: UI says gate cleared while route/lifecycle state remains unresolved.
- **Stale future-content reference**: Surface says “next city unlocked” when no live city 6 exists.
- **Route drift**: Worksheet checkpoint order/expectation no longer matches observed runtime milestones.
- **Current-cap messaging issue**: Spirit Severing reached but cap messaging implies hidden continuation content.
- **Non-blocking polish issue**: Wording/style issue that does not change progression choices.
