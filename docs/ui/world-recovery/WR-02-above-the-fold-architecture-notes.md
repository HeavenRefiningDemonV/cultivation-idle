# WR-02 — above-the-fold architecture rebuild notes

## Structural corrections landed

- Reordered World flow to: quiet top ribbon → command band → map + inspector shell → subdued support slot → bottom dock.
- Anchored full `RunCompass` in a dedicated command band above the map for both wide and narrow layouts.
- Moved current-city summary ownership into the command band so it is no longer inspector-only.
- Kept map as hero plane by preserving de-boxed map framing and removing competing header ownership.
- Re-scoped inspector to contextual selected-building support.
- Preserved grouped module/support routing truth behind a subordinate disclosure slot.

## Truth preserved

- City selector and travel-lock semantics.
- Tracked bounty and expedition idle/ready signal exposure.
- Same-city and cross-city routing behavior.
- No deferred-module leakage in world surface routing.
- Bottom ritual dock remains the only low-page navigation owner.

## Deferred packets

- WR-03: final diegetic map labels.
- WR-04: final inspector anatomy/content hierarchy.
- WR-05: final support-routing lane redesign.
- WR-06: selector/current-city emphasis polish.
- WR-07/08/09: support-art, atmosphere polish, and signoff cleanup.
