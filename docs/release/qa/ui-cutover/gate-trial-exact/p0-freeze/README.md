# Gate Trial Exact P0 Freeze

Purpose:
Freeze the Gate Trial Exact screenshot/audit contract before legacy cleanup.

Commands:
- npm run release:gate-trial-exact-p0:capture
- npm run release:gate-trial-exact-p0:audit
- npm run release:gate-trial-exact-p0:report
- npm run typecheck
- npm run check:icons

Canonical target:
2048×1152 Gate Trial mockup.

Status:
This audit can verify region ownership, DOM anchors, old-shell leakage, geometry, and capture coverage.
It cannot certify final visual parity if the approved scenic plate is deferred.
